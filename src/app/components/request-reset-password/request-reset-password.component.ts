import { IonInput } from '@ionic/angular';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { AngularFireAuth } from '@angular/fire/compat/auth';

// Services
import { ErrorService } from '../../services/error/error.service';

@Component({
    selector: 'app-request-reset-password',
    templateUrl: './request-reset-password.component.html',
    styleUrls: ['./request-reset-password.component.scss'],
})
export class RequestResetPasswordComponent {

    @ViewChild('email') private emailInput: IonInput;

    userForm: FormGroup;

    @Input()
    centerUser = true;

    @Output()
    private resetEmailSent: EventEmitter<void> = new EventEmitter();

    constructor(private formBuilder: FormBuilder,
        private angularFireAuth: AngularFireAuth,
        private errorService: ErrorService) {
        this.userForm = this.formBuilder.group({
            email: new FormControl('', Validators.compose([Validators.required, Validators.email])),
        });
    }

    async focusEmail() {
        await this.emailInput.setFocus();
    }

    async reset() {
        try {
            // To spare the cost of implementing our own template to reset the password and also as it is complicated to implement it on devices, we are using Google templates to reset the password
            // await this.angularFireAuth.auth.sendPasswordResetEmail(this.userForm.value.email, {
            //     url: 'https://bonjour-circle-dev.web.app/?email=' + this.userForm.value.email,
            //     android: {
            //         packageName: 'help.bonjour.circle'
            //     },
            //     iOS: {
            //         bundleId: 'help.bonjour.circle'
            //     },
            //     handleCodeInApp: true
            // });

            await this.angularFireAuth.sendPasswordResetEmail(this.userForm.value.email);

            this.resetEmailSent.emit();
        } catch (err) {
            if (err && err.code === 'auth/user-not-found') {
                this.errorService.error('ERROR.AUTH.USER_NOT_FOUND');
                return;
            }

            this.errorService.error('ERROR.AUTH.RESET');
        }
    }
}
