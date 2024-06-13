import { Injectable } from '@angular/core';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';

import { User as FirebaseUser } from 'firebase/auth';

import { Observable, ReplaySubject, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import * as firebase from 'firebase/compat/app';
import '@firebase/firestore';

import { Storage } from '@ionic/storage';

// Model
import { User, UserData } from '../../model/user';

// Utils
import { Comparator } from '../utils/utils';

// Services
import { FirebaseNotificationsTokenService } from '../notifications/firebase-notifications-token-service';

@Injectable({
    providedIn: 'root'
})
export class SessionService {

    private fcmTokenSubscription: Subscription;
    private fcmPushEnableSubscription: Subscription;

    private userSubscription: Subscription;

    private collection: AngularFirestoreCollection<UserData>;

    private userSubject: ReplaySubject<User> = new ReplaySubject(1);

    constructor(private storage: Storage,
        private fireStore: AngularFirestore,
        private firebaseNotificationsTokenService: FirebaseNotificationsTokenService) {
        this.collection = this.fireStore.collection<UserData>('users');
    }

    destroy(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.userSubscription) {
                this.userSubscription.unsubscribe();
            }

            if (this.fcmTokenSubscription) {
                this.fcmTokenSubscription.unsubscribe();
            }

            if (this.fcmPushEnableSubscription) {
                this.fcmPushEnableSubscription.unsubscribe();
            }

            resolve();
        });
    }

    init(user: FirebaseUser): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this.destroy();

                this.fcmTokenSubscription = this.firebaseNotificationsTokenService.watchToken().subscribe(async (token: string) => {
                    await this.updateUserFcmToken(token);
                });

                this.fcmPushEnableSubscription = this.firebaseNotificationsTokenService.watchEnablePush().subscribe(async (enable: boolean) => {
                    await this.enableUserPushNotifications(enable);
                });

                if (!user || Comparator.isStringEmpty(user.uid)) {
                    this.userSubject.next(null);
                    resolve();
                    return;
                }

                await this.initWatch(user.uid);

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    save(user: User): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this.initWatch(user.id);

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    initWatch(userId: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (Comparator.isStringEmpty(userId)) {
                reject('User is empty');
                return;
            }

            const doc: AngularFirestoreDocument<UserData> = this.collection.doc<UserData>(userId);

            this.userSubscription = doc.valueChanges().subscribe((data: UserData) => {
                if (!data || data === undefined) {
                    this.userSubject.next(null);
                    resolve();
                    return;
                }

                const fetchedUser: User = {
                    id: userId,
                    ref: doc.ref,
                    data: data
                };

                this.userSubject.next(fetchedUser);

                resolve();
            }, (err) => {
                reject(err);
            });
        });
    }

    watchUser(): Observable<User> {
        return this.userSubject.asObservable();
    }

    private updateUserFcmToken(token: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.watchUser().pipe(take(1)).subscribe((user: User) => {
                if (!user || !user.id || !user.data || !token) {
                    resolve();
                    return;
                }

                if (user.data.push && user.data.push.fcm_token === token) {
                    resolve();
                    return;
                }

                const doc: AngularFirestoreDocument<UserData> = this.collection.doc<UserData>(user.id);

                doc.set({
                    push: {
                        fcm_token: token
                    },
                    updated_at: firebase.default.firestore.Timestamp.now()
                }, { merge: true }).then(() => {
                    resolve();
                }, (err) => {
                    reject(err);
                });
            });
        });
    }

    enableUserPushNotifications(enable: boolean): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.watchUser().pipe(take(1)).subscribe((user: User) => {
                if (!user || !user.id || !user.data) {
                    resolve();
                    return;
                }

                if (user.data.push && user.data.push.enabled === enable) {
                    resolve();
                    return;
                }

                const doc: AngularFirestoreDocument<UserData> = this.collection.doc<UserData>(user.id);

                doc.set({
                    push: {
                        enabled: enable
                    },
                    updated_at: firebase.default.firestore.Timestamp.now()
                }, { merge: true }).then(() => {
                    resolve();
                }, (err) => {
                    reject(err);
                });
            });
        });
    }

    reset() {
        this.userSubject.next(null);
    }
}
