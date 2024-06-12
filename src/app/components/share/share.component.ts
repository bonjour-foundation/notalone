import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Platform, ToastController } from '@ionic/angular';

import { TranslateService } from '@ngx-translate/core';

import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';

import { environment } from '../../../environments/environment';

import { Subscription } from 'rxjs';

import { ShareService } from '../../services/share/share.service';

import { Resources } from '../../services/utils/resources';

import { GoogleAnalyticsService } from '../../services/analytics/google-analytics-service';
import { ErrorService } from '../../services/error/error.service';

@Component({
    selector: 'app-share',
    templateUrl: './share.component.html',
    styleUrls: ['./share.component.scss'],
})
export class ShareComponent implements OnInit, OnDestroy {

    @Output()
    private createShare: EventEmitter<void> = new EventEmitter();

    private presentShareSubscription: Subscription;

    pwaShareShow = false;
    pwaShareOptions: any;

    constructor(private platform: Platform,
        private toastController: ToastController,
        private translateService: TranslateService,
        private socialSharing: SocialSharing,
        private shareService: ShareService,
        private googleAnalyticsService: GoogleAnalyticsService,
        private errorService: ErrorService) {

    }

    ngOnInit() {
        this.presentShareSubscription = this.shareService.watchPresentShare().subscribe(async (shareId: string) => {
            await this.presentShare(shareId);
        });
    }

    ngOnDestroy() {
        if (this.presentShareSubscription) {
            this.presentShareSubscription.unsubscribe();
        }
    }

    async share() {
        await this.googleAnalyticsService.trackEvent(Resources.Constants.GOOGLE.ANALYTICS.TRACKER.EVENT.CATEGORY.SHARE, Resources.Constants.GOOGLE.ANALYTICS.TRACKER.EVENT.ACTION.SHARE_LINK);

        this.createShare.emit();
    }

    private async presentShare(shareId: string) {
        try {
            if (environment.cordova) {
                await this.presentCordovaShare(shareId);
            } else {
                await this.presentPWAShare(shareId);
            }

            // await this.openMail(shareId);
        } catch (err) {
            this.errorService.error('ERROR.SHARE');
        }
    }

    private openMail(shareId: string): Promise<void> {
        return new Promise<void>((resolve) => {
            const shareUrl = `${Resources.Constants.BRANCH.URL}${shareId}`;

            const text: string = this.translateService.instant('SHARE_CIRCLE.CONTENT.TEXT_WITH_URL', { url: shareUrl });
            const title: string = this.translateService.instant('SHARE_CIRCLE.CONTENT.TITLE');

            window.location.href = `mailto:?subject=${title}&body=${text}`;

            resolve();
        });
    }

    private presentCordovaShare(shareId: string): Promise<void> {
        const shareUrl = `${Resources.Constants.BRANCH.URL}${shareId}`;

        const text: string = this.translateService.instant('SHARE_CIRCLE.CONTENT.TEXT_WITH_URL', { url: shareUrl });
        const title: string = this.translateService.instant('SHARE_CIRCLE.CONTENT.TITLE');

        return this.socialSharing.share(text, title);
    }

    private presentPWAShare(shareId: string): Promise<void> {
        // @ts-ignore
        if (this.platform.is('mobile') && navigator.share) {
            return this.presentPWAMobileShare(shareId);
        } else {
            return this.presentPWADesktopShare(shareId);
        }
    }

    private presentPWAMobileShare(shareId: string): Promise<void> {
        const body: string = this.translateService.instant('SHARE_CIRCLE.CONTENT.TEXT_WITHOUT_URL');

        // @ts-ignore
        return navigator.share({
            title: this.translateService.instant('SHARE_CIRCLE.CONTENT.TITLE'),
            text: body,
            url: `${Resources.Constants.BRANCH.URL}${shareId}`,
        });
    }

    private presentPWADesktopShare(shareId: string): Promise<void> {
        return new Promise<void>((resolve) => {
            const shareUrl = `${Resources.Constants.BRANCH.URL}${shareId}`;
            const body: string = this.translateService.instant('SHARE_CIRCLE.CONTENT.TEXT_WITH_URL', { url: shareUrl });

            this.pwaShareOptions = {
                displayNames: true,
                config: [{
                    email: {
                        socialShareBody: body,
                        socialShareSubject: this.translateService.instant('SHARE_CIRCLE.CONTENT.TITLE')
                    }
                }, {
                    whatsapp: {
                        socialShareUrl: body
                    }
                }, {
                    copy: {
                        socialShareUrl: body,
                        brandName: this.translateService.instant('SHARE_CIRCLE.COPY')
                    }
                }]
            };

            this.pwaShareShow = true;

            resolve();
        });
    }

    pwaShareClose() {
        this.pwaShareShow = false;
    }

}
