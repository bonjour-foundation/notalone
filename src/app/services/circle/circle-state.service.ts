import { Injectable } from '@angular/core';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, DocumentReference } from '@angular/fire/compat/firestore';

import { Storage } from '@ionic/storage';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import * as firebase from 'firebase/compat/app';
import '@firebase/firestore';

import { CircleRequestType, CircleState, CircleStateData, CircleStateDealWith, CircleStateType } from '../../model/circle-state';

import { Converter } from '../utils/utils';

interface TodayState {
    todayState: CircleStateType;
    todayRequestType: CircleRequestType;
}

@Injectable({
    providedIn: 'root'
})
export class CircleStateService {

    todayState: CircleStateType;
    todayRequestType: CircleRequestType;

    constructor(private fireStore: AngularFirestore,
        private storage: Storage) {
    }

    findTodayState(circleId: string): Observable<CircleState[]> {

        // TODO: Pas minuit-minuit mais 4h du mat à 4h du mat
        const start: Date = Converter.startOfDay(new Date());
        const end: Date = Converter.endOfDay(new Date());

        const startTimestamp: firebase.default.firestore.Timestamp = firebase.default.firestore.Timestamp.fromDate(start);
        const endTimestamp: firebase.default.firestore.Timestamp = firebase.default.firestore.Timestamp.fromDate(end);

        const collection: AngularFirestoreCollection<CircleStateData> = this.fireStore.collection<CircleStateData>('/circles/' + circleId + '/states', ref =>
            ref
                .where('created_at', '>=', startTimestamp)
                .where('created_at', '<', endTimestamp)
                .orderBy('created_at', 'desc')
                .limit(1));

        return this.snapshotCollection(collection);
    }

    findLastState(circleId: string): Observable<CircleState[]> {

        const collection: AngularFirestoreCollection<CircleStateData> = this.fireStore.collection<CircleStateData>('/circles/' + circleId + '/states', ref =>
            ref
                .orderBy('updated_at', 'desc')
                .limit(1));

        return this.snapshotCollection(collection);
    }

    private snapshotCollection(collectionShare: AngularFirestoreCollection<CircleStateData>): Observable<CircleState[]> {
        return collectionShare.snapshotChanges().pipe(
            map(actions => {
                return actions.map(a => {
                    const data: CircleStateData = a.payload.doc.data() as CircleStateData;
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

    createTodayState(circleId: string): Promise<CircleState> {
        return new Promise<CircleState>((resolve, reject) => {
            if (!this.todayState) {
                reject('State not defined');
                return;
            }

            if (!circleId) {
                reject('Circle is empty');
                return;
            }

            const now: firebase.default.firestore.Timestamp = firebase.default.firestore.Timestamp.now();

            const stateData: CircleStateData = {
                state: this.todayState,
                created_at: now,
                updated_at: now
            };

            if (this.todayRequestType) {
                stateData.request = {
                    type: this.todayRequestType,
                    created_at: firebase.default.firestore.Timestamp.now()
                };
            }

            const collection: AngularFirestoreCollection<CircleStateData> = this.fireStore.collection<CircleStateData>('/circles/' + circleId + '/states');

            collection.add(stateData).then(async (doc: DocumentReference) => {
                resolve({
                    id: doc.id,
                    ref: doc,
                    data: stateData
                });
            }, (err) => {
                reject(err);
            });
        });
    }

    updateTodayState(circleId: string, state: CircleState): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!state || !state.id || !state.data) {
                reject('State not defined');
                return;
            }

            if (!circleId) {
                reject('Circle is empty');
                return;
            }

            if (!this.todayState) {
                reject('State not defined');
                return;
            }

            const doc: AngularFirestoreDocument<CircleStateData> = this.fireStore.doc<CircleStateData>('/circles/' + circleId + '/states/' + state.id);

            state.data.state = this.todayState;
            state.data.updated_at = firebase.default.firestore.Timestamp.now();

            if (this.todayRequestType) {
                state.data.request = {
                    type: this.todayRequestType,
                    created_at: firebase.default.firestore.Timestamp.now()
                };
            }

            doc.set(state.data, { merge: true }).then(() => {
                resolve();
            }, (err) => {
                reject(err);
            });
        });
    }

    updateState(circleId: string, state: CircleState): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!state || !state.id || !state.data) {
                reject('State not defined');
                return;
            }

            if (!circleId) {
                reject('Circle is empty');
                return;
            }

            const doc: AngularFirestoreDocument<CircleStateData> = this.fireStore.doc<CircleStateData>('/circles/' + circleId + '/states/' + state.id);

            state.data.updated_at = firebase.default.firestore.Timestamp.now();

            doc.set(state.data, { merge: true }).then(() => {
                resolve();
            }, (err) => {
                reject(err);
            });
        });
    }

    createTodayEmergency(circleId: string, deal_with: CircleStateDealWith): Promise<CircleState> {
        return new Promise<CircleState>((resolve, reject) => {
            if (!circleId) {
                reject('Circle is empty');
                return;
            }

            const now: firebase.default.firestore.Timestamp = firebase.default.firestore.Timestamp.now();

            const stateData: CircleStateData = {
                emergency: {
                    deal_with: deal_with,
                    created_at: firebase.default.firestore.Timestamp.now()
                },
                created_at: now,
                updated_at: now
            };

            const collection: AngularFirestoreCollection<CircleStateData> = this.fireStore.collection<CircleStateData>('/circles/' + circleId + '/states');

            collection.add(stateData).then(async (doc: DocumentReference) => {
                resolve({
                    id: doc.id,
                    ref: doc,
                    data: stateData
                });
            }, (err) => {
                reject(err);
            });
        });
    }

    async saveTodayState() {
        await this.storage.set('bonjour_circle_today_state', {
            todayState: this.todayState,
            todayRequest: this.todayRequestType
        });
    }

    async retrieveTodayState() {
        const today: TodayState = await this.storage.get('bonjour_circle_today_state');
        if (today) {
            this.todayState = today.todayState;
            this.todayRequestType = today.todayRequestType;
        }

        await this.storage.remove('bonjour_circle_today_state');
    }

    reset() {
        this.todayState = null;
        this.todayRequestType = null;
    }

}
