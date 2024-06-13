import { DocumentReference } from '@angular/fire/compat/firestore';

import * as firebase from 'firebase/compat/app';

export interface ShareData {
    hash_id?: string;

    expire_at: firebase.default.firestore.Timestamp;

    circle: DocumentReference;

    user_from: DocumentReference;
    user_to?: DocumentReference;

    created_at: firebase.default.firestore.Timestamp;
    updated_at: firebase.default.firestore.Timestamp;
}

export interface Share {
    id: string;
    ref: DocumentReference;

    data: ShareData;
}
