import { Injectable } from '@angular/core';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, DocumentReference } from '@angular/fire/compat/firestore';

import Hashids from 'hashids';

import * as firebase from 'firebase/compat/app';
import '@firebase/firestore';

import { Storage } from '@ionic/storage';

import { addMinutes, isAfter } from 'date-fns';

import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';

// Model
import { User } from '../../model/user';
import { Circle } from '../../model/circle';
import { Share, ShareData } from '../../model/share';

// Utils
import { Resources } from '../utils/resources';
import { Comparator, Converter } from '../utils/utils';

@Injectable({
    providedIn: 'root'
})
export class ShareService {

    private collection: AngularFirestoreCollection<ShareData>;

    private shareSubscription: Subscription;

    private shareSubject: BehaviorSubject<Share> = new BehaviorSubject(null);

    private pendingShareSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);

    private presentShowShareSubject: Subject<string> = new Subject();

    constructor(private fireStore: AngularFirestore,
        private storage: Storage) {
        this.collection = this.fireStore.collection<ShareData>('shares');
    }

    create(userFrom: User, circle: Circle): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            try {
                const share: Share = await this.createShare(userFrom, circle);
                const shareId: string = await this.updateHashId(share);

                resolve(shareId);
            } catch (err) {
                reject(err);
            }
        });
    }

    private createShare(userFrom: User, circle: Circle): Promise<Share> {
        return new Promise<Share>((resolve, reject) => {
            if (!userFrom || !userFrom.ref) {
                reject('User (from) is empty');
                return;
            }

            if (!circle || !circle.ref) {
                reject('Circle is empty');
                return;
            }

            const expireAt = addMinutes(new Date(), Resources.Constants.SHARE.VALIDITY);
            const expireAtTimestamp: firebase.default.firestore.Timestamp = firebase.default.firestore.Timestamp.fromDate(expireAt);

            const now: firebase.default.firestore.Timestamp = firebase.default.firestore.Timestamp.now();

            const shareData: ShareData = {
                expire_at: expireAtTimestamp,
                user_from: userFrom.ref,
                circle: circle.ref,
                created_at: now,
                updated_at: now
            };

            this.collection.add(shareData).then(async (doc: DocumentReference) => {
                resolve({
                    id: doc.id,
                    ref: doc,
                    data: shareData
                });
            }, (err) => {
                reject(err);
            });
        });
    }

    private updateHashId(share: Share): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            if (!share || !share.ref || !share.data) {
                reject('Share is empty');
                return;
            }

            const doc: AngularFirestoreDocument<ShareData> = this.fireStore.doc<ShareData>(share.ref);

            const dbHashId: number = await this.hash(share.id);

            const hashIds: Hashids = new Hashids(Resources.Constants.SHARE.HASH.SALT, Resources.Constants.SHARE.HASH.LENGTH, Resources.Constants.SHARE.HASH.ALPHABET);
            const hashId: string = hashIds.encode(dbHashId);

            share.data.hash_id = hashId;
            share.data.updated_at = firebase.default.firestore.Timestamp.now();

            doc.set(share.data, { merge: true }).then(() => {
                resolve(hashId);
            }, (err) => {
                reject(err);
            });

        });
    }

    private hash(str: string): Promise<number> {
        return new Promise<number>((resolve) => {
            let hash = 5381;
            let i: number = str.length;

            while (i) {
                hash = (hash * 33) ^ str.charCodeAt(--i);
            }

            resolve(hash >>> 0);
        });
    }

    init(hashId: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                if (Comparator.isStringEmpty(hashId)) {
                    resolve();
                    return;
                }

                if (this.shareSubscription) {
                    this.shareSubscription.unsubscribe();
                }

                this.shareSubscription = this.findPendingShareWithHashId(hashId).subscribe(async (shares: Share[]) => {
                    if (Comparator.hasElements(shares)) {
                        const share: Share = shares[0];

                        this.shareSubject.next(share);
                        this.emitHasPendingShare(share);
                    } else {
                        this.shareSubject.next(null);
                        this.pendingShareSubject.next(false);
                    }

                    resolve();
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    watch(): Observable<Share> {
        return this.shareSubject.asObservable();
    }

    watchPending(): Observable<boolean> {
        return this.pendingShareSubject.asObservable();
    }

    destroy() {
        if (this.shareSubscription) {
            this.shareSubscription.unsubscribe();
        }
    }

    findPendingShareWithHashId(hashId: string): Observable<Share[]> {
        const collectionShare: AngularFirestoreCollection<ShareData> = this.fireStore.collection<ShareData>('/shares', ref =>
            ref.where('hash_id', '==', hashId)
                .limit(1));

        return this.snapshotCollection(collectionShare);
    }

    private snapshotCollection(collectionShare: AngularFirestoreCollection<ShareData>): Observable<Share[]> {
        return collectionShare.snapshotChanges().pipe(
            map(actions => {
                return actions.map(a => {
                    const data: ShareData = a.payload.doc.data() as ShareData;
                    const id = a.payload.doc.id;
                    const ref = a.payload.doc.ref;
                    return {
                        id: id,
                        ref: ref,
                        data: data
                    };
                });
            })
        );
    }

    findPendingCircleShare(circleReference: DocumentReference): Observable<Share[]> {
        const now: firebase.default.firestore.Timestamp = firebase.default.firestore.Timestamp.now();

        const collectionShare: AngularFirestoreCollection<ShareData> = this.fireStore.collection<ShareData>('/shares', ref =>
            ref
                .where('circle', '==', circleReference)
                .where('expire_at', '>', now)
                .limit(1));

        return this.snapshotCollection(collectionShare);
    }

    private emitHasPendingShare(share: Share) {
        this.pendingShareSubject.next(share && share.data && isAfter(Converter.getDateObj(share.data.expire_at), new Date()));
    }

    presentShare(shareId: string) {
        this.presentShowShareSubject.next(shareId);
    }

    watchPresentShare(): Observable<string> {
        return this.presentShowShareSubject.asObservable();
    }

    saveShareHashId(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            this.watch().pipe(take(1)).subscribe(async (share: Share) => {
                await this.storage.set('bonjour_circle_share_id', share && share.data ? share.data.hash_id : null);

                resolve();
            });
        });
    }

    async retrieveShareHashId() {
        const shareHashId: string = await this.storage.get('bonjour_circle_share_id');

        await this.init(shareHashId);

        await this.storage.remove('bonjour_circle_share_id');
    }
}
