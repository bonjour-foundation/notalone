import { MenuController, ModalController, NavController } from '@ionic/angular';
import { Component, OnDestroy, OnInit } from '@angular/core';

import * as firebase from 'firebase/compat/app';
import '@firebase/firestore';

import { Storage } from '@ionic/storage';

import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import { compareAsc, isSameDay } from 'date-fns';

// Modal
import { EmergencyModal } from '../../modals/emergency/emergency.modal';

// Model
import { User } from '../../model/user';
import { CircleRequestType, CircleState, CircleStateDealWith, CircleStateType } from '../../model/circle-state';
import { Circle } from '../../model/circle';

// Utils
import { Comparator, Converter } from '../../services/utils/utils';
import { Resources } from '../../services/utils/resources';

// Services
import { UserService } from '../../services/user/user.service';
import { CircleService } from '../../services/circle/circle.service';
import { UserCircleService } from '../../services/user-circle/user-circle.service';
import { SessionService } from '../../services/session/session.service';
import { CircleStateService } from '../../services/circle/circle-state.service';
import { GoogleAnalyticsService } from '../../services/analytics/google-analytics-service';
import { ErrorService } from '../../services/error/error.service';
import { TipsService } from '../../services/tips/tips.service';
import { CircleReminderService } from '../../services/circle/circle-reminder.service';
import { FirebaseNotificationsService } from '../../services/notifications/firebase-notifications-service';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

    private sessionSubscription: Subscription;
    sessionUser: User;

    private centerUserSubscription: Subscription;
    centerUser: User;

    sessionInitialized = false;
    private userCircleInitialized = false;

    showAction = false;
    tipsHideAction = false;

    private circleSubscription: Subscription;
    circle: Circle;

    private centerStateSubscription: Subscription;
    centerState: CircleState;

    circleLoaded = false;

    emergency = false;
    private emergencyEvaluated = false;

    displayCircleInformed = false;

    private tipsStateVisibleSubscription: Subscription;
    private tipsCreateCircleVisibleSubscription: Subscription;
    private tipsEditCircleVisibleSubscription: Subscription;

    constructor(private storage: Storage,
        private menuController: MenuController,
        private modalController: ModalController,
        private navController: NavController,
        private userService: UserService,
        private circleService: CircleService,
        private userCircleService: UserCircleService,
        private sessionService: SessionService,
        private circleStateService: CircleStateService,
        private googleAnalyticsService: GoogleAnalyticsService,
        private errorService: ErrorService,
        private tipsService: TipsService,
        private circleReminderService: CircleReminderService,
        private firebaseNotificationsService: FirebaseNotificationsService) {
    }

    async ngOnInit() {
        await this.googleAnalyticsService.trackView(Resources.Constants.GOOGLE.ANALYTICS.TRACKER.VIEW.HOME);

        await this.menuController.enable(true);

        this.centerUserSubscription = this.userService.watchCenterUser().subscribe(async (user: User) => {
            this.centerUser = user;

            await this.init();
        });

        this.circleSubscription = this.circleService.watchCircle().subscribe(async (circle: Circle) => {
            this.circle = circle;

            this.sessionService.watchUser().pipe(take(1)).subscribe(async (user: User) => {
                this.circleLoaded = this.circleLoaded || (!circle && !user);

                await this.init();
            });
        });

        await this.userCircleService.init();

        this.sessionSubscription = this.sessionService.watchUser().subscribe(async (user: User) => {
            this.sessionUser = user;
            this.sessionInitialized = true;

            if (user && !this.userCircleInitialized) {
                this.userCircleInitialized = true;
                await this.userCircleService.init();
            }

            await this.init();
        });

        this.tipsStateVisibleSubscription = this.tipsService.watchTipsStateVisible().subscribe((state: boolean) => {
            this.tipsHideAction = state;
        });

        this.tipsCreateCircleVisibleSubscription = this.tipsService.watchTipsCreateCircleVisible().subscribe((state: boolean) => {
            this.tipsHideAction = state;
        });

        this.tipsEditCircleVisibleSubscription = this.tipsService.watchTipsEditCircleVisible().subscribe((state: boolean) => {
            this.tipsHideAction = state;
        });
    }

    async ngOnDestroy() {
        if (this.sessionSubscription) {
            this.sessionSubscription.unsubscribe();
        }

        if (this.centerUserSubscription) {
            this.centerUserSubscription.unsubscribe();
        }

        if (this.circleSubscription) {
            this.circleSubscription.unsubscribe();
        }

        if (this.centerStateSubscription) {
            this.centerStateSubscription.unsubscribe();
        }

        if (this.tipsStateVisibleSubscription) {
            this.tipsStateVisibleSubscription.unsubscribe();
        }

        if (this.tipsCreateCircleVisibleSubscription) {
            this.tipsCreateCircleVisibleSubscription.unsubscribe();
        }

        if (this.tipsEditCircleVisibleSubscription) {
            this.tipsEditCircleVisibleSubscription.unsubscribe();
        }
    }

    ionViewDidEnter() {
        this.circleService.watchCircle().pipe(filter((circle: Circle) => circle !== null && circle !== undefined), take(1)).subscribe(async (circle: Circle) => {
            this.sessionService.watchUser().pipe(filter((sessionUser: User) => sessionUser !== null && sessionUser !== undefined), take(1)).subscribe(async (sessionUser: User) => {
                await this.firebaseNotificationsService.requestPermission();
            });
        });
    }

    private async init() {
        await this.watchState();

        await this.isEmergency();

        await this.displayTipsEditCircle();
    }

    onStateChange(state: CircleStateType) {
        this.showAction = true;
        this.circleStateService.todayState = state;
    }

    onRequestTypeChange(request: CircleRequestType) {
        this.circleStateService.todayRequestType = request;
    }

    isCenterUser(): boolean {
        // For loading purpose
        if (!this.sessionUser || !this.centerUser) {
            return true;
        }

        return this.sessionUser.id === this.centerUser.id;
    }

    private async watchState() {
        if (this.centerStateSubscription) {
            return;
        }

        if (!this.circle || !this.circle.id || !this.circle.data) {
            return;
        }

        if (!this.sessionUser || !this.centerUser) {
            return;
        }

        if (this.sessionUser.id !== this.centerUser.id) {
            await this.watchLastState();
        } else {
            await this.watchTodayState();
        }
    }

    private async displayTipsEditCircle() {
        if (!this.emergencyEvaluated || this.emergency) {
            return;
        }

        if (this.sessionUser && this.centerUser && this.sessionUser.id !== this.centerUser.id) {
            await this.tipsService.displayTipsEditCircle();
        }
    }

    private watchLastState(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.centerStateSubscription = this.circleStateService.findLastState(this.circle.id).subscribe(async (states: CircleState[]) => {
                this.centerState = states && states.length > 0 ? states[0] : null;

                if (this.centerState) {
                    this.showAction = true;
                }

                await this.isEmergency();

                this.circleLoaded = true;

                resolve();
            });
        });
    }

    private isEmergency(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.circle || !this.circle.id || !this.circle.data || !this.circle.data.reminder) {
                resolve();
                return;
            }

            if (!this.centerState || !this.centerState.data) {
                resolve();
                return;
            }

            if (!this.sessionUser || !this.centerUser) {
                resolve();
                return;
            }

            if (this.sessionUser.id === this.centerUser.id) {
                resolve();
                return;
            }

            const alarmAt: Date = Converter.getDateObj(this.circle.data.reminder.alarm_at);
            const nowForComparison: Date = new Date();
            const isAlarmAtPast: boolean = compareAsc(alarmAt, nowForComparison) === -1;

            this.emergency = (!this.isTodayState() && isAlarmAtPast) || Comparator.isStringEmpty(this.centerState.data.state);

            this.emergencyEvaluated = true;

            resolve();
        });
    }

    isTodayState(): boolean {
        return this.centerState && this.centerState.data && this.centerState.data.created_at && isSameDay(new Date(), Converter.getDateObj(this.centerState.data.created_at));
    }

    private watchTodayState(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.centerStateSubscription = this.circleStateService.findTodayState(this.circle.id).subscribe(async (states: CircleState[]) => {
                this.centerState = states && states.length > 0 ? states[0] : null;

                this.circleLoaded = true;

                resolve();
            });
        });
    }

    async createTodayState() {
        try {
            if (!this.circle) {
                return;
            }

            if (this.centerState && this.centerState.data && Comparator.isStringEmpty(this.centerState.data.state) && this.isTodayState()) {
                await this.circleStateService.updateTodayState(this.circle.id, this.centerState);
            } else {
                const promises = [];

                promises.push(this.circleStateService.createTodayState(this.circle.id));
                promises.push(this.circleReminderService.updateReminder(this.circle));

                await Promise.all(promises);
            }

            this.triggerDisplayCircleInformed();
        } catch (err) {
            this.errorService.error('ERROR.TODAY_STATE');
        }
    }

    private triggerDisplayCircleInformed() {
        this.displayCircleInformed = true;

        setTimeout(() => {
            this.displayCircleInformed = false;
        }, 4000);
    }

    async dealWithState() {
        try {
            if (!this.centerState || !this.centerState.data || !this.centerState.data.request || !this.circle) {
                return;
            }

            if (!this.sessionUser || !this.sessionUser.data || !this.sessionUser.data.first_name) {
                return;
            }

            this.centerState.data.request.deal_with = {
                user: this.sessionUser.ref,
                first_name: this.sessionUser.data.first_name
            };

            await this.circleStateService.updateState(this.circle.id, this.centerState);
        } catch (err) {
            this.errorService.error('ERROR.TODAY_STATE');
        }
    }

    async dealWithEmergency() {
        try {
            if (!this.centerState || !this.centerState.data || !this.circle) {
                return;
            }

            if (!this.sessionUser || !this.sessionUser.data || !this.sessionUser.data.first_name) {
                return;
            }

            if (this.isTodayState()) {
                await this.updateEmergencyState();
            } else {
                await this.createEmergencyState();
            }

            await this.openEmergencyModal();

        } catch (err) {
            this.errorService.error('ERROR.TODAY_STATE');
        }
    }

    private async updateEmergencyState() {
        this.centerState.data.emergency = {
            deal_with: {
                user: this.sessionUser.ref,
                first_name: this.sessionUser.data.first_name
            },
            created_at: firebase.default.firestore.Timestamp.now()
        };

        await this.circleStateService.updateState(this.circle.id, this.centerState);
    }

    private async createEmergencyState() {
        const dealWith: CircleStateDealWith = {
            user: this.sessionUser.ref,
            first_name: this.sessionUser.data.first_name
        };

        await this.circleStateService.createTodayEmergency(this.circle.id, dealWith);
    }

    private async openEmergencyModal() {
        const modal: HTMLIonModalElement = await this.modalController.create({
            component: EmergencyModal
        });

        await modal.present();
    }

    async displayOrNavigateCreateCircle() {
        const tipsToBeDisplayed: boolean = await this.tipsService.displayTipsCreateCircle();

        if (!tipsToBeDisplayed) {
            await this.navigateCreateCircle();
        }
    }

    async navigateCreateCircle() {
        if (this.sessionUser && this.centerUser && this.sessionUser.id !== this.centerUser.id) {
            const tipsToBeDisplayed: boolean = await this.tipsService.displayTipsCreateCircle();

            if (!tipsToBeDisplayed) {
                await this.navController.navigateForward('create-circle');
            }
        } else {
            await this.navController.navigateForward('create-circle');
        }
    }

    async navigateReminder() {
        await this.navController.navigateForward('schedule');
    }

    async navigateEditCircle() {
        if (this.sessionUser && this.centerUser && this.sessionUser.id !== this.centerUser.id) {
            this.tipsService.watchTipsEditCircleVisible().pipe(take(1)).subscribe(async (tipsEditCircleVisible: boolean) => {
                if (tipsEditCircleVisible) {
                    await this.tipsService.hideTipsEditCircle();
                } else {
                    await this.navController.navigateForward('edit-circle');
                }
            });
        } else {
            await this.navController.navigateForward('edit-circle');
        }
    }

    isRequestDealable(): boolean {
        return this.centerState && this.centerState.data && this.centerState.data.request &&
            this.centerState.data.request.type !== CircleRequestType.GOOD &&
            !this.centerState.data.request.deal_with;
    }

    hasCircleConnections(): boolean {
        return this.circle && this.circle.data && Comparator.hasElements(this.circle.data.connections);
    }
}
