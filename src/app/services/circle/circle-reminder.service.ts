import { Injectable } from '@angular/core';

import * as firebase from 'firebase/compat/app';
import '@firebase/firestore';

import { addDays, addMinutes, differenceInMinutes, getDate, getMonth, getYear, isPast, setDate, setMonth, setYear } from 'date-fns';

// Model
import { Circle } from '../../model/circle';

// Utils
import { Converter } from '../utils/utils';

// Services
import { CircleService } from './circle.service';

@Injectable({
    providedIn: 'root'
})
export class CircleReminderService {

    constructor(private circleService: CircleService) {

    }

    async updateReminder(circle: Circle): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                if (!circle || !circle.data) {
                    resolve();
                    return;
                }

                if (!circle.data.reminder) {
                    circle.data['reminder'] = await this.circleService.getNextDefaultReminder();

                    await this.circleService.updateCircle(circle);

                    resolve();
                    return;
                }

                let currentNext: Date = Converter.getDateObj(circle.data.reminder.next);
                const range: number = differenceInMinutes(Converter.getDateObj(circle.data.reminder.alarm_at), currentNext);

                const now: Date = new Date();

                if (currentNext.getTime() > now.getTime()) {
                    // Next reminder is already in the future
                    resolve();
                    return;
                }

                if (isPast(currentNext)) {
                    // If we tricked and have reminder in the past, we are going to set the next one to tomorrow
                    // So first we move the current to today (we don't touch the time)
                    currentNext = setYear(setMonth(setDate(currentNext, getDate(now)), getMonth(now)), getYear(now));
                }

                const next: Date = addDays(currentNext, 1);
                const nextAlarmAt: Date = addMinutes(next, range);

                circle.data.reminder.next = firebase.default.firestore.Timestamp.fromDate(next);
                circle.data.reminder.alarm_at = firebase.default.firestore.Timestamp.fromDate(nextAlarmAt);

                await this.circleService.updateCircle(circle);

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

}
