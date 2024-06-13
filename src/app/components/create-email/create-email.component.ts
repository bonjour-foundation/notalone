import { IonInput } from '@ionic/angular';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { AngularFireAuth } from '@angular/fire/compat/auth';

import { filter, take } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';

// Model
import { User } from '../../model/user';

// Services
import { ErrorService } from '../../services/error/error.service';
import { SessionService } from '../../services/session/session.service';

const passwordErrorValidator: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
    const password = control.get('password');
    const repeatPassword = control.get('confirmPassword');

    if (repeatPassword.disabled) {
        return null;
    }

    return password.value !== repeatPassword.value ? { 'passwordError': true } : null;
};

@Component({
    selector: 'app-create-email',
    templateUrl: './create-email.component.html',
    styleUrls: ['./create-email.component.scss'],
})
export class CreateEmailComponent {

    @ViewChild('email') private emailInput: IonInput;
    @ViewChild('password') private passwordInput: IonInput;
    @ViewChild('confirmPassword') private confirmPasswordInput: IonInput;

    userForm: FormGroup;

    @Input()
    centerUser = true;

    @Output()
    private saved: EventEmitter<void> = new EventEmitter();

    newUser = true;

    @Output()
    private userCreated: EventEmitter<void> = new EventEmitter();

    @Output()
    private signedIn: EventEmitter<void> = new EventEmitter();

    @Output()
    private resetPassword: EventEmitter<void> = new EventEmitter();

    constructor(private formBuilder: FormBuilder,
        private angularFireAuth: AngularFireAuth,
        private errorService: ErrorService,
        private sessionService: SessionService,
        private translateService: TranslateService) {
        this.userForm = this.formBuilder.group({
            email: new FormControl('', Validators.compose([Validators.required, Validators.email])),
            password: new FormControl('', Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(64)])),
            confirmPassword: new FormControl('')
        }, { validators: passwordErrorValidator });
    }

    async focusEmail() {
        await this.emailInput.setFocus();
    }

    async focusPassword() {
        await this.passwordInput.setFocus();
    }

    async focusConfirmPassword() {
        await this.confirmPasswordInput.setFocus();
    }

    toggleForm() {
        this.newUser = !this.newUser;

        if (this.newUser) {
            this.userForm.controls['confirmPassword'].enable();
        } else {
            this.userForm.controls['confirmPassword'].disable();
        }
    }

    requestResetPassword() {
        this.resetPassword.emit();
    }

    async signup() {
        try {
            if (this.newUser) {
                await this.createUser();
                this.userCreated.emit();
            } else {
                await this.signIn();
            }
        } catch (err) {
            if (err && err.code === 'auth/email-already-in-use') {
                this.errorService.error('ERROR.AUTH.EMAIL_ALREADY_IN_USE');
                return;
            }

            if (err && err.code === 'auth/user-not-found') {
                this.errorService.error('ERROR.AUTH.USER_NOT_FOUND');
                return;
            }

            if (err && err.code === 'auth/wrong-password') {
                this.errorService.error('ERROR.AUTH.WRONG_PASSWORD');
                return;
            }

            this.errorService.error('ERROR.AUTH.ERROR');
        }
    }

    private async createUser(): Promise<firebase.default.auth.UserCredential> {
        return this.angularFireAuth.createUserWithEmailAndPassword(this.userForm.value.email, this.userForm.value.password);
    }

    private async signIn() {
        this.sessionService.watchUser().pipe(
            filter((sessionUser: User) => sessionUser !== null && sessionUser !== undefined),
            take(1)).subscribe(async (_sessionUser: User) => {
                this.signedIn.emit();
            });

        await this.angularFireAuth.signInWithEmailAndPassword(this.userForm.value.email, this.userForm.value.password);
    }
}
