import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, DocumentReference } from '@angular/fire/compat/firestore';

import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import * as firebase from 'firebase/compat/app';
import '@firebase/firestore';

import { addDays, addMinutes, setHours } from 'date-fns';

// Model
import { User } from '../../model/user';
import { Circle, CircleData, CircleReminder } from '../../model/circle';

// Utils and resources
import { Comparator, Converter } from '../utils/utils';
import { Resources } from '../utils/resources';

@Injectable({
    providedIn: 'root'
})
export class CircleService {

    private circleSubscription: Subscription;

    private circleSubject: BehaviorSubject<Circle> = new BehaviorSubject(null);

    private collection: AngularFirestoreCollection<CircleData>;

    constructor(private fireStore: AngularFirestore) {
        this.collection = this.fireStore.collection<CircleData>('circles');
    }

    destroy() {
        if (this.circleSubscription) {
            this.circleSubscription.unsubscribe();
        }
    }

    init(user: User): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {

                if (!user || !user.data) {
                    resolve();
                    return;
                }

                if (!Comparator.hasElements(user.data.circles_center) && !Comparator.hasElements(user.data.circles_connections)) {
                    resolve();
                    return;
                }

                const circleDocRef: DocumentReference = this.first(Comparator.hasElements(user.data.circles_center) ? user.data.circles_center : user.data.circles_connections);

                if (circleDocRef) {
                    await this.initWatch(circleDocRef.id);
                }

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    initWatch(circleId: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const doc: AngularFirestoreDocument<CircleData> = this.collection.doc<CircleData>(circleId);

            this.circleSubscription = doc.valueChanges().subscribe((data: CircleData) => {
                const circle: Circle = {
                    id: circleId,
                    ref: doc.ref,
                    data: data
                };

                this.circleSubject.next(circle);

                resolve();
            }, (err) => {
                reject(err);
            });
        });
    }

    // For a first version of the app we want to handle max. 1 circle pro user
    private first(circles?: DocumentReference[]): DocumentReference {
        return Comparator.hasElements(circles) ? circles[0] : null;
    }

    createCircle(user: User): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            const now: firebase.default.firestore.Timestamp = firebase.default.firestore.Timestamp.now();

            const circleData: CircleData = {
                center: {
                    user: user.ref
                },
                reminder: await this.getNextDefaultReminder(),
                created_at: now,
                updated_at: now
            };

            if (user.data) {
                circleData.center.first_name = user.data.first_name;
                circleData.center.last_name = user.data.last_name;
                circleData.center.phone_number = user.data.phone_number;

                if (user.data.language) {
                    circleData.center.language = user.data.language;
                }
            }

            this.collection.add(circleData).then(async (doc: DocumentReference) => {
                await this.initWatch(doc.id);

                resolve();
            }, (err) => {
                reject(err);
            });
        });
    }

    getNextDefaultReminder(): Promise<CircleReminder> {
        return new Promise<CircleReminder>((resolve) => {
            const today: Date = Converter.startOfDay(new Date());

            const reminderNext: Date = addDays(setHours(today, Resources.Constants.CIRCLE.REMINDER.DEFAULT_TIME), Resources.Constants.CIRCLE.REMINDER.DEFAULT_NEXT_DAY);
            const reminderAlarmAt: Date = addMinutes(reminderNext, Resources.Constants.CIRCLE.REMINDER.DEFAULT_ALARM_AT);

            resolve({
                next: firebase.default.firestore.Timestamp.fromDate(reminderNext),
                alarm_at: firebase.default.firestore.Timestamp.fromDate(reminderAlarmAt)
            });
        });
    }

    updateCircle(circle: Circle): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!circle || !circle.id || !circle.data) {
                reject('Circle is empty');
                return;
            }

            const doc: AngularFirestoreDocument<CircleData> = this.fireStore.doc<CircleData>('circles/' + circle.id);

            circle.data.updated_at = firebase.default.firestore.Timestamp.now();

            doc.set(circle.data, { merge: true }).then(() => {
                resolve();
            }, (err) => {
                reject(err);
            });
        });
    }

    watchCircle(): Observable<Circle> {
        return this.circleSubject.asObservable();
    }

    reset() {
        this.circleSubject.next(null);
    }
}
