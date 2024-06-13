import { DocumentReference } from '@angular/fire/compat/firestore';

import * as firebase from 'firebase/compat/app';

export enum CircleStateType {
    SUPER = 'super',
    WELL = 'well',
    OKAY = 'okay',
    NOT_WELL = 'not_well',
    BAD = 'bad'
}

export enum CircleRequestType {
    SHOP = 'shop',
    HAND = 'hand',
    PHONE = 'phone',
    GOOD = 'good'
}

export interface CircleStateDealWith {
    user: DocumentReference;
    first_name: string;
}

export interface CircleRequest {
    type: CircleRequestType;
    deal_with?: CircleStateDealWith;
    created_at: firebase.default.firestore.Timestamp;
}

export interface CircleEmergency {
    deal_with?: CircleStateDealWith;
    created_at: firebase.default.firestore.Timestamp;
}

export interface CircleStateData {
    state?: CircleStateType;

    request?: CircleRequest;

    emergency?: CircleEmergency;

    created_at: firebase.default.firestore.Timestamp;
    updated_at: firebase.default.firestore.Timestamp;
}

export interface CircleState {
    id: string;
    ref: DocumentReference;

    data: CircleStateData;
}
