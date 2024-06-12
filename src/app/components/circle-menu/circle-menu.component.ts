import { Component, OnDestroy, OnInit } from '@angular/core';

import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';

import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

// User
import { User } from '../../model/user';

// Services
import { UserService } from '../../services/user/user.service';
import { SessionService } from '../../services/session/session.service';

@Component({
    selector: 'app-circle-menu',
    templateUrl: './circle-menu.component.html',
    styleUrls: ['./circle-menu.component.scss'],
})
export class CircleMenuComponent implements OnInit, OnDestroy {

    editHidden = true;

    accountHidden = true;

    userOptionsHidden = true;

    private centerUserSubscription: Subscription;
    private sessionSubscription: Subscription;

    private centerUser: User;
    private sessionUser: User;

    constructor(private userService: UserService,
        private sessionService: SessionService,
        private translateService: TranslateService,
        private inAppBrowser: InAppBrowser) {

    }

    async ngOnInit() {
        this.centerUserSubscription = this.userService.watchCenterUser().subscribe((user: User) => {
            this.centerUser = user;

            this.editHidden = !user;

            this.hideUserOptions();
        });

        this.sessionSubscription = this.sessionService.watchUser().subscribe(async (user: User) => {
            this.sessionUser = user;

            this.accountHidden = !user;

            this.hideUserOptions();
        });
    }

    private hideUserOptions() {
        this.userOptionsHidden = !this.sessionUser || !this.centerUser || this.sessionUser.id !== this.centerUser.id;
    }

    ngOnDestroy() {
        if (this.centerUserSubscription) {
            this.centerUserSubscription.unsubscribe();
        }

        if (this.sessionSubscription) {
            this.sessionSubscription.unsubscribe();
        }
    }

    openAbout() {
        this.openInAppBrowser('https://bonjour.help/notalone-hilfe.html');
    }

    openPrivacy() {
        this.openInAppBrowser('https://bonjour.help/notalone-datenschutz.html');
    }

    openAboutBonjour() {
        this.openInAppBrowser('https://bonjour.help');
    }

    private openInAppBrowser(url: string) {
        const text: string = this.translateService.instant('CORE.BACK');
        this.inAppBrowser.create(url, '_blank', `location=no,shouldPauseOnSuspend=yes,footer=yes,hardwareback=yes,usewkwebview=yes,closebuttoncaption=${text},footercolor=#F0F0ED,closebuttoncolor=#000000`);
    }
}
