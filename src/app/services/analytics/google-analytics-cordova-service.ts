import { Injectable } from '@angular/core';

import { Platform } from '@ionic/angular';

import { Firebase } from '@awesome-cordova-plugins/firebase/ngx';

@Injectable({
    providedIn: 'root'
})
export class GoogleAnalyticsCordovaService {

    constructor(private platform: Platform,
        private firebase: Firebase) {

    }

    async trackView(viewName: string): Promise<void> {
        return new Promise<void>((resolve) => {
            this.platform.ready().then(async () => {
                await this.firebase.setScreenName(viewName);

                resolve();
            });
        });
    }

    async trackEvent(category: string, action: string): Promise<void> {
        return new Promise<void>((resolve) => {
            this.platform.ready().then(async () => {
                await this.firebase.logEvent(category, { action });

                resolve();
            });
        });
    }

}
