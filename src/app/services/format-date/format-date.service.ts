import { Injectable } from '@angular/core';

import * as firebase from 'firebase/compat/app';

import { formatRelative } from 'date-fns';
import { de, enUS, fr } from 'date-fns/locale';

import { TranslateService } from '@ngx-translate/core';

import { Converter } from '../utils/utils';


@Injectable({
    providedIn: 'root'
})
export class FormatDateService {

    private locales = {
        en: enUS,
        fr: fr,
        de: de
    };

    constructor(private translateService: TranslateService) {

    }

    transform(input: Date | firebase.default.firestore.Timestamp): string {
        const userLang: string = this.translateService.currentLang;

        const myDate: Date = Converter.getDateObj(input);

        return formatRelative(myDate, new Date(), { locale: this.locales[userLang] });
    }

}
