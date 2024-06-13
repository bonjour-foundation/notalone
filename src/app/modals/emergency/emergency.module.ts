import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { EmergencyModal } from './emergency.modal';

@NgModule({
    declarations: [
        EmergencyModal
    ],
    imports: [
        IonicModule,
        CommonModule,
        TranslateModule.forChild()
    ]
})
export class EmergencyModalModule {
}

