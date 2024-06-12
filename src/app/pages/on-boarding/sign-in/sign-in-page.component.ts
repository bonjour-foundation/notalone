import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, Platform } from '@ionic/angular';

import { TranslateService } from '@ngx-translate/core';

import { GooglePlus } from '@awesome-cordova-plugins/google-plus/ngx';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';

import { Subscription } from 'rxjs';

import * as firebase from 'firebase/app';
import '@firebase/auth';
import { User as FirebaseUser } from 'firebase';

import { AngularFireAuth } from '@angular/fire/auth';

import { filter, take } from 'rxjs/operators';

// Utils
import { Resources } from '../../../services/utils/resources';
import { environment } from '../../../../environments/environment';

// Model
import { User } from '../../../model/user';

// Services
import { GoogleAnalyticsService } from '../../../services/analytics/google-analytics-service';
import { ErrorService } from '../../../services/error/error.service';
import { AuthenticationService } from '../../../services/auth/authentication.service';
import { SessionService } from '../../../services/session/session.service';
import { TipsService } from '../../../services/tips/tips.service';
import { CircleStateService } from '../../../services/circle/circle-state.service';
import { ShareService } from '../../../services/share/share.service';

interface GooglePlusUser {
    idToken: string;
}

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in-page.component.html',
    styleUrls: ['./sign-in-page.component.scss'],
})
export class SignInPage implements OnInit, OnDestroy {

    centerUser = true;

    private authSubscription: Subscription;

    private signInProcessingSubscription: Subscription;
    signInProcessing = true;

    constructor(private platform: Platform,
        private navController: NavController,
        private activatedRoute: ActivatedRoute,
        private inAppBrowser: InAppBrowser,
        private translateService: TranslateService,
        private googleAnalyticsService: GoogleAnalyticsService,
        private angularFireAuth: AngularFireAuth,
        private googlePlus: GooglePlus,
        private errorService: ErrorService,
        private authenticationService: AuthenticationService,
        private sessionService: SessionService,
        private tipsService: TipsService,
        private circleStateService: CircleStateService,
        private shareService: ShareService) {

    }

    async ngOnInit() {
        await this.googleAnalyticsService.trackView(Resources.Constants.GOOGLE.ANALYTICS.TRACKER.VIEW.SIGN_IN);

        // Default true
        if (this.activatedRoute.snapshot.paramMap.get('centerUser') === 'false') {
            this.centerUser = false;
        }

        // If we reach that point we assume we don't have to display the smiley question "How are you today" again
        this.tipsService.smileyQuestionDisplayedOnce = true;

        this.initRedirectGoogleLogin();

        this.signInProcessingSubscription = this.authenticationService.watch().subscribe((firebaseUser: FirebaseUser) => {
            this.signInProcessing = firebaseUser !== null;
        });
    }

    ngOnDestroy() {
        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
        }

        if (this.signInProcessingSubscription) {
            this.signInProcessingSubscription.unsubscribe();
        }
    }

    private initRedirectGoogleLogin() {
        // User is now logged in
        this.authSubscription = this.authenticationService.watch().pipe(
            filter((firebaseUser: FirebaseUser) => firebaseUser !== null && firebaseUser !== undefined),
            take(1)
        ).subscribe(async (_firebaseUser: FirebaseUser) => {
            // Does user is new or existing
            this.sessionService.watchUser().pipe(take(1)).subscribe(async (user: User) => {
                await this.circleStateService.retrieveTodayState();
                await this.shareService.retrieveShareHashId();

                if (user) {
                    await this.navController.navigateRoot('/home', { animated: true });
                } else {
                    await this.navController.navigateForward(['/create-user', this.centerUser], { animated: true });
                }
            });
        });
    }

    async googleLogin() {
        // On desktop the view is destroyed we need to store and reload the state to create the circle later
        await this.circleStateService.saveTodayState();
        await this.shareService.saveShareHashId();

        if (this.platform.is('cordova')) {
            await this.googleLoginNative();
        } else {
            await this.googleLoginWeb();
        }
    }

    async emailLogin() {
        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
        }

        await this.navController.navigateForward(['/create-email', this.centerUser], { animated: true });
    }

    private async googleLoginNative() {
        this.googlePlus.login({
            webClientId: environment.firebase.webClientId
        })
            .then(async (googlePlusUser: GooglePlusUser) => {
                if (googlePlusUser) {
                    this.signInProcessing = true;

                    await this.angularFireAuth.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(googlePlusUser.idToken));
                } else {
                    this.errorService.error('ERROR.AUTH.ERROR');
                }
            })
            .catch((err: any) => {
                this.errorService.error('ERROR.AUTH.ERROR');
            });
    }

    private async googleLoginWeb() {
        try {
            const provider: firebase.auth.GoogleAuthProvider = new firebase.auth.GoogleAuthProvider();
            await this.angularFireAuth.auth.signInWithRedirect(provider);
        } catch (err) {
            this.errorService.error('ERROR.AUTH.ERROR');
        }
    }

    async navigateTerms() {
        const text: string = this.translateService.instant('CORE.BACK');
        this.inAppBrowser.create('https://bonjour.help/notalone-agb.html', '_blank', `location=no,shouldPauseOnSuspend=yes,footer=yes,hardwareback=yes,usewkwebview=yes,closebuttoncaption=${text},footercolor=#F0F0ED,closebuttoncolor=#000000`);
    }

}
