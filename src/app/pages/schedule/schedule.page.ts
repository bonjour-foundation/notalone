import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonDatetime, IonRouterOutlet, LoadingController } from '@ionic/angular';

import { Subscription } from 'rxjs';

import { addMinutes, addYears, differenceInMinutes, endOfYear, startOfToday } from 'date-fns';

import * as firebase from 'firebase/compat/app';
import '@firebase/firestore';

import { Circle } from '../../model/circle';

import { Converter } from '../../services/utils/utils';

import { Resources } from '../../services/utils/resources';

import { CircleService } from '../../services/circle/circle.service';
import { ErrorService } from '../../services/error/error.service';
import { GoogleAnalyticsService } from '../../services/analytics/google-analytics-service';

@Component({
    selector: 'app-schedule',
    templateUrl: './schedule.page.html',
    styleUrls: ['./schedule.page.scss'],
})
export class SchedulePage implements OnInit, OnDestroy {

    @ViewChild('day') private dayInput: IonDatetime;
    @ViewChild('time') private timeInput: IonDatetime;

    private circleSubscription: Subscription;

    private circle: Circle;

    nextReminder: Date;
    range: number;

    canGoBack = false;
    canGoBackLoaded = false;

    minDate: Date;
    maxDate: Date;
    dateExample = new Date().toISOString();

    constructor(private routerOutlet: IonRouterOutlet,
        private loadingController: LoadingController,
        private circleService: CircleService,
        private errorService: ErrorService,
        private googleAnalyticsService: GoogleAnalyticsService) {

    }

    async ngOnInit() {
        await this.googleAnalyticsService.trackView(Resources.Constants.GOOGLE.ANALYTICS.TRACKER.VIEW.SCHEDULE);

        this.circleSubscription = this.circleService.watchCircle().subscribe(async (circle: Circle) => {
            this.circle = circle;

            await this.init();
        });

        this.minDate = startOfToday();
        this.maxDate = endOfYear(addYears(new Date(), 1));
    }

    ionViewWillEnter() {
        this.canGoBack = this.routerOutlet && this.routerOutlet.canGoBack();
        this.canGoBackLoaded = true;
    }

    ngOnDestroy() {
        if (this.circleSubscription) {
            this.circleSubscription.unsubscribe();
        }
    }

    private init(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.circle || !this.circle.data || !this.circle.data.reminder) {
                resolve();
                return;
            }

            this.nextReminder = Converter.getDateObj(this.circle.data.reminder.next);

            const reminderAlarmAt: Date = Converter.getDateObj(this.circle.data.reminder.alarm_at);
            this.range = differenceInMinutes(reminderAlarmAt, this.nextReminder);

            resolve();
        });
    }

    async onChangeReminderAt($event: CustomEvent) {
        if (!$event || !$event.detail || !$event.detail.value) {
            return;
        }

        await this.updateNextReminder($event.detail.value);
    }

    private updateNextReminder(picked: string | Date): Promise<void> {
        return new Promise<void>(async (resolve) => {
            if (!this.circle || !this.circle.data || !this.circle.data.reminder) {
                resolve();
                return;
            }

            this.nextReminder = Converter.getDateObj(picked);

            this.circle.data.reminder.next = firebase.default.firestore.Timestamp.fromDate(this.nextReminder);

            await this.updateRange('' + this.range);

            resolve();
        });
    }

    private updateRange(range: string): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!range || isNaN(parseInt(range, 0))) {
                resolve();
                return;
            }

            if (!this.circle || !this.circle.data || !this.circle.data.reminder) {
                resolve();
                return;
            }

            this.range = parseInt(range, 0);

            const reminderAlarmAt: Date = addMinutes(this.nextReminder, this.range);

            this.circle.data.reminder.alarm_at = firebase.default.firestore.Timestamp.fromDate(reminderAlarmAt);

            resolve();
        });
    }

    async save() {
        const loading: HTMLIonLoadingElement = await this.loadingController.create({});

        await loading.present();

        try {
            await this.circleService.updateCircle(this.circle);

            await loading.dismiss();
        } catch (err) {
            this.errorService.error('ERROR.REMINDER');
            await loading.dismiss();
        }
    }

    async openDay() {
        // TODO Fabian remove unneeded
        // await this.dayInput.open();
    }

    async openTime() {
        // TODO Fabian remove unneeded
        // await this.timeInput.open();
    }
}
