import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import * as firebase from 'firebase/compat/app';
import '@firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

import { Storage } from '@ionic/storage';

import { TranslateService } from '@ngx-translate/core';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';

// Model
import { User, UserData } from '../../model/user';

// Utils
import { Comparator } from '../utils/utils';

// Services
import { AuthenticationService } from '../auth/authentication.service';
import { take } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private centerUserSubscription: Subscription;
    private connectionUsersSubscription: Subscription[] = [];

    private centerUserSubject: BehaviorSubject<User> = new BehaviorSubject(null);

    private collection: AngularFirestoreCollection<UserData>;

    constructor(private platform: Platform,
        private storage: Storage,
        private fireStore: AngularFirestore,
        private translateService: TranslateService,
        private authenticationService: AuthenticationService) {
        this.collection = this.fireStore.collection<UserData>('users');
    }

    destroy(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.centerUserSubscription) {
                this.centerUserSubscription.unsubscribe();
            }

            if (Comparator.hasElements(this.connectionUsersSubscription)) {
                this.connectionUsersSubscription.forEach((subscription: Subscription) => {
                    subscription.unsubscribe();
                });
            }

            resolve();
        });
    }

    createUser(user: User): Promise<User> {
        return new Promise<User>(async (resolve, reject) => {
            if (!user) {
                reject('User is empty');
                return;
            }

            if (Comparator.isStringNotEmpty(user.id)) {
                reject('User already exists');
                return;
            }

            this.authenticationService.watch().pipe(take(1)).subscribe(async (firebaseUser: FirebaseUser) => {
                const userId: string = firebaseUser.uid;

                if (Comparator.isStringEmpty(userId)) {
                    reject('User not logged in');
                    return;
                }

                const now: firebase.default.firestore.Timestamp = firebase.default.firestore.Timestamp.now();

                const platforms: string[] = this.platform.platforms();

                const userData: UserData = {
                    ...user.data, ...{
                        language: this.translateService.getBrowserCultureLang(),
                        platforms: platforms,
                        created_at: now,
                        updated_at: now
                    }
                };

                const doc: AngularFirestoreDocument<UserData> = this.collection.doc<UserData>(userId);

                try {
                    await doc.set(userData);

                    resolve({
                        id: userId,
                        ref: doc.ref,
                        data: userData
                    });
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    updateUser(user: User): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!user || !user.id || !user.data) {
                reject('User is empty');
                return;
            }

            const doc: AngularFirestoreDocument<UserData> = this.fireStore.doc<UserData>('users/' + user.id);

            user.data.updated_at = firebase.default.firestore.Timestamp.now();

            doc.set(user.data, { merge: true }).then(() => {
                resolve();
            }, (err) => {
                reject(err);
            });
        });
    }

    initWatchCircleCenterUser(userId: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (Comparator.isStringEmpty(userId)) {
                reject('User is empty');
                return;
            }

            const doc: AngularFirestoreDocument<UserData> = this.collection.doc<UserData>(userId);

            this.centerUserSubscription = doc.valueChanges().subscribe((data: UserData) => {
                const fetchedUser: User = {
                    id: userId,
                    ref: doc.ref,
                    data: data
                };

                this.centerUserSubject.next(fetchedUser);

                resolve();
            }, (err) => {
                reject(err);
            });
        });
    }

    initWatchConnectionUserSubject(userId: string): Promise<Observable<User>> {
        return new Promise<Observable<User>>((resolve, reject) => {
            if (Comparator.isStringEmpty(userId)) {
                reject('User is empty');
                return;
            }

            const connectionUserSubject: BehaviorSubject<User> = new BehaviorSubject(null);

            const doc: AngularFirestoreDocument<UserData> = this.collection.doc<UserData>(userId);

            this.connectionUsersSubscription.push(doc.valueChanges().subscribe((data: UserData) => {
                const user: User = {
                    id: userId,
                    ref: doc.ref,
                    data: data
                };

                connectionUserSubject.next(user);

                resolve(connectionUserSubject.asObservable());
            }, (err) => {
                reject(err);
            }));
        });
    }

    initWatchCircleConnectedUser(userId: string): Promise<Observable<User>> {
        return new Promise<Observable<User>>(async (resolve, reject) => {
            try {
                const watchUser: Observable<User> = await this.initWatchConnectionUserSubject(userId);

                resolve(watchUser);
            } catch (err) {
                reject(err);
            }
        });
    }

    watchCenterUser(): Observable<User> {
        return this.centerUserSubject.asObservable();
    }

    getUser(userId: string): Observable<UserData> {
        const doc: AngularFirestoreDocument<UserData> = this.collection.doc<UserData>(userId);

        return doc.valueChanges();
    }

    reset() {
        this.centerUserSubject.next(null);
    }
}
