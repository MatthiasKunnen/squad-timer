import {registerLocaleData} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import locale from '@angular/common/locales/en-BE';
import {ErrorHandler, LOCALE_ID, NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {DateAdapter} from '@angular/material/core';
import {
    MAT_FORM_FIELD_DEFAULT_OPTIONS,
    MatFormFieldDefaultOptions,
} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatToolbarModule} from '@angular/material/toolbar';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ServiceWorkerModule} from '@angular/service-worker';
import {AngularSvgIconModule} from 'angular-svg-icon';
import {ToastrModule} from 'ngx-toastr';

import {environment} from '../environments/environment';
import {AboutComponent} from './about/about.component';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {CountdownComponent} from './countdown/countdown.component';
import {NotFoundComponent} from './error/not-found/not-found.component';
import {CustomErrorHandler} from './error/sentry/custom-error.handler';
import {HeaderComponent} from './layout/header/header.component';
import {SettingsComponent} from './settings/settings.component';
import {TimersComponent} from './timers/timers.component';
import {UpdateService} from './update/update.service';
import {DateFnsDateAdapter} from './utils/date-fns-date-adapter';

registerLocaleData(locale);

const matFormFieldDefaultOptions: MatFormFieldDefaultOptions = {
    appearance: 'outline',
};

@NgModule({
    declarations: [
        AboutComponent,
        AppComponent,
        CountdownComponent,
        HeaderComponent,
        NotFoundComponent,
        SettingsComponent,
        TimersComponent,
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        AngularSvgIconModule.forRoot(),
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatToolbarModule,
        ReactiveFormsModule,
        ServiceWorkerModule.register('ngsw-worker.js', {enabled: environment.serviceWorkerEnabled}),
        ToastrModule.forRoot(),
        AppRoutingModule,
    ],
    providers: [
        {provide: ErrorHandler, useClass: CustomErrorHandler},
        {provide: LOCALE_ID, useValue: 'en-BE'},
        {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: matFormFieldDefaultOptions},
        {
            provide: DateAdapter,
            useClass: DateFnsDateAdapter,
        },
        UpdateService,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
}
