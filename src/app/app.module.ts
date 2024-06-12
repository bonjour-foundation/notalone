import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';

import { IonicStorageModule } from '@ionic/storage';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { StatusBar } from '@awesome-cordova-plugins/status-bar/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { Firebase } from '@awesome-cordova-plugins/firebase/ngx';
import { GooglePlus } from '@awesome-cordova-plugins/google-plus/ngx';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule, FirestoreSettingsToken } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireAnalyticsModule, APP_NAME, APP_VERSION, CONFIG } from '@angular/fire/analytics';

import { environment } from '../environments/environment';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ServiceWorkerModule } from '@angular/service-worker';

import { CircleMenuModule } from './components/circle-menu/circle-menu.module';
import { CircleMenuFooterModule } from './components/circle-menu-footer/circle-menu-footer.module';
import { RootLanguageTagModule } from './directives/lang/root-language-tag.module';

import { SentryHandler } from './services/error/sentry.handler';

export function exportTranslateStaticLoader(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [AppComponent],
    entryComponents: [],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        IonicStorageModule.forRoot(),
        AppRoutingModule,
        CircleMenuModule,
        CircleMenuFooterModule,
        HttpClientModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: exportTranslateStaticLoader,
                deps: [HttpClient]
            }
        }
        ),
        AngularFireModule.initializeApp(environment.firebase),
        // TODO: https://stackoverflow.com/q/56496296/110915
        // AngularFirestoreModule.enablePersistence({synchronizeTabs: true}),
        AngularFirestoreModule,
        AngularFireAuthModule,
        AngularFireAnalyticsModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        RootLanguageTagModule
    ],
    providers: [
        StatusBar,
        SocialSharing,
        Firebase,
        GooglePlus,
        InAppBrowser,

        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: FirestoreSettingsToken, useValue: {} },
        { provide: ErrorHandler, useClass: SentryHandler },
        {
            provide: CONFIG,
            useValue: {
                allow_ad_personalization_signals: false,
                anonymize_ip: true
            }
        },
        { provide: APP_NAME, useValue: environment.name },
        { provide: APP_VERSION, useValue: environment.version }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
