import { DocumentReference } from '@angular/fire/compat/firestore';

import * as firebase from 'firebase/compat/app';

export interface CircleEmergency {
    name: string;
    phone_number: string;
}

export interface CircleReminder {
    next: firebase.default.firestore.Timestamp;
    alarm_at: firebase.default.firestore.Timestamp;
}

export interface CircleCenter {
    user: DocumentReference;

    first_name?: string;
    last_name?: string;
    phone_number?: string;

    language?: string;
}

export interface CircleData {
    center: CircleCenter;

    connections?: DocumentReference[];

    emergency?: CircleEmergency;

    reminder?: CircleReminder;

    created_at?: firebase.default.firestore.Timestamp;
    updated_at?: firebase.default.firestore.Timestamp;
}

export interface Circle {
    id: string;
    ref: DocumentReference;

    data: CircleData;
}
