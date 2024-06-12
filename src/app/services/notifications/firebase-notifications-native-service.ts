import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

import { Subscription } from 'rxjs';

import { Firebase } from '@awesome-cordova-plugins/firebase/ngx';

// Services
import { FirebaseNotificationsTokenService } from './firebase-notifications-token-service';

@Injectable({
    providedIn: 'root'
})
export class FirebaseNotificationsNativeService {

    private refreshSubscription: Subscription;

    constructor(private platform: Platform,
        private firebase: Firebase,
        private firebaseNotificationsTokenService: FirebaseNotificationsTokenService) {
    }


    init(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            try {
                const hasPermission: boolean = await this.hasPermission();

                if (!hasPermission) {
                    resolve();
                    return;
                }

                const token: string = await this.firebase.getToken();

                this.firebaseNotificationsTokenService.next(token);

                this.destroy();

                this.refreshSubscription = this.firebase.onTokenRefresh().subscribe((refreshedToken: string) => {
                    this.firebaseNotificationsTokenService.next(refreshedToken);
                });
            } catch (err) {
                // Do nothing, no notifications
            }

            resolve();
        });
    }

    destroy() {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
        }
    }

    requestPermission(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            try {
                const hasPermission: boolean = await this.hasPermission();

                if (this.platform.is('ios') && !hasPermission) {
                    await this.firebase.grantPermission();
                }

                // We start the init again to save the token if needed.
                // On iOS the subscription to the token is not registered on cold start if no permission.
                // On Android the token is already fetched on a cold start before the user is even created.
                await this.init();

                this.firebaseNotificationsTokenService.enablePush(true);
            } catch (err) {
                // On error or if user don't want to receive push, we update the state in the DB
                this.firebaseNotificationsTokenService.enablePush(false);
            }

            resolve();
        });
    }

    private hasPermission(): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            if (!this.platform.is('ios')) {
                resolve(true);
                return;
            }

            const permission: any = await this.firebase.hasPermission();

            // https://github.com/ionic-team/ionic-native/issues/3170
            resolve(permission as boolean);
        });
    }
}
