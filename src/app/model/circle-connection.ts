import { DocumentReference } from '@angular/fire/compat/firestore';

export enum CircleConnectionState {
    REQUESTED = 'requested',
    CONFIRMED = 'confirmed',
    DECLINED = 'declined'
}

export interface CircleConnectionData {
    user: DocumentReference;
    state: CircleConnectionState;

    first_name?: string;
    last_name?: string;
    phone_number?: string;

    language?: string;

    created_at: firebase.default.firestore.Timestamp;
    updated_at: firebase.default.firestore.Timestamp;
}

export interface CircleConnection {
    id: string;
    ref: DocumentReference;

    data: CircleConnectionData;
}
