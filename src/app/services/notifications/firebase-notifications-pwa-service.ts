import { Platform } from '@ionic/angular';
import { Injectable } from '@angular/core';

import * as firebase from 'firebase/compat/app';
import '@firebase/messaging';

import { environment } from '../../../environments/environment';

// Services
import { FirebaseNotificationsTokenService } from './firebase-notifications-token-service';

@Injectable({
    providedIn: 'root'
})
export class FirebaseNotificationsPwaService {

    constructor(private platform: Platform,
        private firebaseNotificationsTokenService: FirebaseNotificationsTokenService) {

    }

    init(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!environment.production || environment.cordova) {
                resolve();
                return;
            }

            navigator.serviceWorker.ready.then((registration) => {
                if (!firebase.default.messaging.isSupported()) {
                    resolve();
                    return;
                }

                const messaging = firebase.default.messaging();

                // TODO Fabian uncomment

                // messaging.useServiceWorker(registration);

                // messaging.usePublicVapidKey(environment.firebase.vapidKey);

                // messaging.onMessage((_payload) => {
                //     // If we want to display a msg when the app is in foreground
                // });

                // messaging.onTokenRefresh(() => {
                //     messaging.getToken().then((refreshedToken: string) => {
                //         this.firebaseNotificationsTokenService.next(refreshedToken);
                //     }).catch((err) => {
                //         // We ignore the error, no notifications then
                //     });
                // });

                resolve();
            }, (err) => {
                reject(err);
            });
        });
    }

    requestPermission(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            if (environment.cordova) {
                resolve();
                return;
            }

            if (this.platform.is('ios')) {
                resolve();
                return;
            }

            if (!Notification) {
                resolve();
                return;
            }

            // TODO Fabian uncomment
            // if (!firebase.messaging.isSupported()) {
            //     resolve();
            //     return;
            // }

            // try {
            //     const messaging = firebase.messaging();

            //     if (Notification.permission !== 'denied') {
            //         await Notification.requestPermission();
            //     }

            //     const token: string = await messaging.getToken();

            //     this.firebaseNotificationsTokenService.next(token);
            //     this.firebaseNotificationsTokenService.enablePush(true);
            // } catch (err) {
            //     // No notifications granted
            // }

            resolve();
        });
    }
}
