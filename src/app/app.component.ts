import {Component, OnInit} from '@angular/core';
import {DateAdapter} from '@angular/material/core';
import dateLocaleEn from 'date-fns/locale/en-GB';

import {initErrorMessages} from './error/messages/message-init';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

    constructor(
        private readonly dateAdapter: DateAdapter<any>,
    ) {
    }

    ngOnInit(): void {
        this.dateAdapter.setLocale(dateLocaleEn);
        initErrorMessages();
    }
}
