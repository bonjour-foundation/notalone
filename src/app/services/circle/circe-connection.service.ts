import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentReference } from '@angular/fire/compat/firestore';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import * as firebase from 'firebase/compat/app';
import '@firebase/firestore';

// Model
import { Circle } from '../../model/circle';
import { User } from '../../model/user';
import { CircleConnection, CircleConnectionData, CircleConnectionState } from '../../model/circle-connection';

@Injectable({
    providedIn: 'root'
})
export class CircleConnectionService {

    constructor(private fireStore: AngularFirestore) {
    }

    findConnections(circleId: string): Observable<CircleConnection[]> {
        const collection: AngularFirestoreCollection<CircleConnectionData> = this.fireStore.collection<CircleConnectionData>('/circles/' + circleId + '/connections', ref =>
            ref
                .orderBy('created_at', 'asc')
        );

        return this.snapshotCollection(collection);
    }

    private snapshotCollection(collectionShare: AngularFirestoreCollection<CircleConnectionData>): Observable<CircleConnection[]> {
        return collectionShare.snapshotChanges().pipe(
            map(actions => {
                return actions.map(a => {
                    const data: CircleConnectionData = a.payload.doc.data() as CircleConnectionData;
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

    createConnection(circle: Circle, createdUser: User): Promise<CircleConnection> {
        return new Promise<CircleConnection>((resolve, reject) => {
            if (!circle || !circle.id) {
                reject('Circle is empty');
                return;
            }

            if (!createdUser) {
                reject('User not defined');
                return;
            }

            const now: firebase.default.firestore.Timestamp = firebase.default.firestore.Timestamp.now();

            const data: CircleConnectionData = {
                user: createdUser.ref,
                state: CircleConnectionState.CONFIRMED,
                created_at: now,
                updated_at: now
            };

            if (createdUser.data && createdUser.data.first_name) {
                data.first_name = createdUser.data.first_name;
            }

            if (createdUser.data && createdUser.data.last_name) {
                data.last_name = createdUser.data.last_name;
            }

            if (createdUser.data && createdUser.data.phone_number) {
                data.phone_number = createdUser.data.phone_number;
            }

            if (createdUser.data && createdUser.data.language) {
                data.language = createdUser.data.language;
            }

            const collection: AngularFirestoreCollection<CircleConnectionData> = this.fireStore.collection<CircleConnectionData>('/circles/' + circle.id + '/connections');

            collection.add(data).then(async (doc: DocumentReference) => {
                resolve({
                    id: doc.id,
                    ref: doc,
                    data: data
                });
            }, (err) => {
                reject(err);
            });
        });
    }

}
