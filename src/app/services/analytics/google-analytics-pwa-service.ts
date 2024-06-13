import { Injectable } from '@angular/core';

import { AngularFireAnalytics } from '@angular/fire/compat/analytics';

import { Resources } from '../utils/resources';

@Injectable({
    providedIn: 'root'
})
export class GoogleAnalyticsPWAService {

    constructor(private analytics: AngularFireAnalytics) {

    }

    async trackView(viewName: string): Promise<void> {
        return this.analytics.setCurrentScreen(viewName);
    }

    async trackEvent(category: string, action: string): Promise<void> {
        return this.analytics.logEvent(category, { action });
    }

}
