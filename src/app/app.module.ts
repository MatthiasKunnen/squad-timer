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
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ServiceWorkerModule} from '@angular/service-worker';
import {ToastrModule} from 'ngx-toastr';

import {environment} from '../environments/environment';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {CountdownComponent} from './countdown/countdown.component';
import {NotFoundComponent} from './error/not-found/not-found.component';
import {CustomErrorHandler} from './error/sentry/custom-error.handler';
import {HomeComponent} from './home/home.component';
import {DateFnsDateAdapter} from './shared/utils/date-fns-date-adapter';
import {UpdateService} from './update/update.service';

registerLocaleData(locale);

const matFormFieldDefaultOptions: MatFormFieldDefaultOptions = {
    appearance: 'outline',
};

@NgModule({
    declarations: [
        AppComponent,
        CountdownComponent,
        HomeComponent,
        NotFoundComponent,
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
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
