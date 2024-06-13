import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

import { User as FirebaseUser } from 'firebase/auth';

import { filter, take } from 'rxjs/operators';

import { Resources } from '../../../services/utils/resources';

import { GoogleAnalyticsService } from '../../../services/analytics/google-analytics-service';

import { AuthenticationService } from '../../../services/auth/authentication.service';

@Component({
    selector: 'app-create-user-page',
    templateUrl: './create-user.page.html',
    styleUrls: ['./create-user.page.scss'],
})
export class CreateUserPage implements OnInit {

    centerUser = true;

    loaded = false;

    firstName: string;
    lastName: string;
    email: string;

    constructor(private navController: NavController,
        private activatedRoute: ActivatedRoute,
        private googleAnalyticsService: GoogleAnalyticsService,
        private authenticationService: AuthenticationService) {

    }

    async ngOnInit() {
        await this.googleAnalyticsService.trackView(Resources.Constants.GOOGLE.ANALYTICS.TRACKER.VIEW.CREATE_USER);

        // Default true
        if (this.activatedRoute.snapshot.paramMap.get('centerUser') === 'false') {
            this.centerUser = false;
        }

        this.authenticationService.watch().pipe(
            filter((firebaseUser: FirebaseUser) => firebaseUser !== null && firebaseUser !== undefined),
            take(1)).subscribe(async (firebaseUser: FirebaseUser) => {

                if (firebaseUser.displayName && firebaseUser.displayName !== undefined && firebaseUser.displayName !== '') {
                    if (firebaseUser.displayName.indexOf(' ') > -1) {
                        this.firstName = firebaseUser.displayName.split(' ').slice(0, -1).join(' ');
                        this.lastName = firebaseUser.displayName.split(' ').slice(-1).join(' ');
                    } else {
                        this.lastName = firebaseUser.displayName;
                    }
                }

                this.email = firebaseUser.email;

                this.loaded = true;
            });
    }

    async navigate() {
        if (this.centerUser) {
            await this.navController.navigateRoot('/share-circle', { animated: true });
        } else {
            await this.navController.navigateRoot(['/done', false], { animated: true });
        }
    }

}
