import { MenuController, NavController, Platform, ToastController } from '@ionic/angular';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { Storage } from '@ionic/storage';

import { StatusBar } from '@awesome-cordova-plugins/status-bar/ngx';

import { TranslateService } from '@ngx-translate/core';

// Services
import { Comparator } from './services/utils/utils';
import { ShareService } from './services/share/share.service';
import { IntroService } from './services/intro/intro.service';
import { SessionService } from './services/session/session.service';
import { AuthenticationService } from './services/auth/authentication.service';
import { UserCircleService } from './services/user-circle/user-circle.service';
import { ErrorService } from './services/error/error.service';
import { FirebaseNotificationsService } from './services/notifications/firebase-notifications-service';

import { environment } from '../environments/environment';

interface DeeplinkMatch {
    $invite: string;
}

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {

    private errorSubscription: Subscription;

    constructor(
        private router: Router,
        private platform: Platform,
        private statusBar: StatusBar,
        private navController: NavController,
        private toastController: ToastController,
        private menuController: MenuController,
        private storage: Storage,
        private translateService: TranslateService,
        private sessionService: SessionService,
        private shareService: ShareService,
        private introService: IntroService,
        private authenticationService: AuthenticationService,
        private userCircleService: UserCircleService,
        private errorService: ErrorService,
        private firebaseNotificationsService: FirebaseNotificationsService) {
    }

    ngOnInit() {
        this.initializeTranslateServiceConfig();

        // TODO Fabian: check ionic-storage init: https://github.com/ionic-team/ionic-storage/blob/main/README.md#with-angular
        this.storage.create();

        this.platform.ready().then(async () => {
            await this.firebaseNotificationsService.init();

            const promises = [];
            promises.push(this.navigateRoot());
            promises.push(this.initializeApp());

            await Promise.all(promises);
        });
    }

    ngAfterViewInit() {
        this.platform.ready().then(async () => {
            await this.init();

            await this.initializeDeepLinking();

            this.initErrorWatcher();
        });
    }

    async ngOnDestroy() {
        await this.sessionService.destroy();
        await this.userCircleService.destroy();
        this.shareService.destroy();

        if (this.errorSubscription) {
            this.errorSubscription.unsubscribe();
        }
    }

    private initializeApp(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.platform.is('cordova')) {
                const isAndroid: boolean = this.platform.is('android');
                if (isAndroid) {
                    this.statusBar.backgroundColorByHexString('#F0F0ED');
                }

                this.statusBar.styleDefault();
            }

            resolve();
        });
    }

    private navigateRoot(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            const introShown: boolean = await this.introService.introShown();

            if (this.router.url && this.router.url.startsWith('/signin')) {
                // We are coming back from signin with Google
                resolve();
                return;
            }

            if (introShown) {
                await this.menuController.enable(true);
            }

            await this.navController.navigateRoot(introShown ? 'home' : 'intro');

            resolve();
        });
    }

    private initializeTranslateServiceConfig() {
        let userLang: string = this.translateService.getBrowserLang();
        userLang = /(de)/gi.test(userLang) ? userLang : 'de';

        this.translateService.addLangs(['de']);
        this.translateService.setDefaultLang('de');
        this.translateService.use(userLang);
    }

    private async init() {
        try {
            await this.authenticationService.init();
        } catch (e) {
            this.errorService.error('ERROR.INIT');
        }
    }

    private initializeDeepLinking(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            if (environment.cordova && this.platform.is('cordova')) {
                await this.initializeDeepLinkingBranchio();
            } else {
                // The redirect is also provided by branch.io on desktop, on mobile we still go to the store
                const inviteId: string = this.platform.getQueryParam('$invite') || this.platform.getQueryParam('invite') || this.platform.getQueryParam('%24invite');
                await this.shareService.init(inviteId);
            }

            resolve();
        });
    }

    private initializeDeepLinkingBranchio(): Promise<void> {
        return new Promise<void>(async (resolve) => {
            try {
                const branchIo = window['Branch'];

                if (branchIo) {
                    // Deep link thru universal links
                    branchIo.initSession().then(async (data: DeeplinkMatch) => {
                        if (!Comparator.isStringEmpty(data.$invite)) {
                            await this.shareService.init(data.$invite);
                        }

                        resolve();
                    });
                } else {
                    resolve();
                }
            } catch (err) {
                resolve();
            }
        });
    }

    private initErrorWatcher() {
        this.errorSubscription = this.errorService.watchError().subscribe(async (errorKey: string) => {
            const toast = await this.toastController.create({
                message: this.translateService.instant(errorKey),
                duration: 5000
            });

            await toast.present();
        });
    }
}
