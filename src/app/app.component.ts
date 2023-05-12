import {BreakpointObserver} from '@angular/cdk/layout';
import type {OnDestroy, OnInit} from '@angular/core';
import {Component, HostBinding} from '@angular/core';
import {DateAdapter} from '@angular/material/core';
import {NavigationEnd, NavigationSkipped, Router} from '@angular/router';
import dateLocaleEn from 'date-fns/locale/en-GB';
import {ReplaySubject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

import {initErrorMessages} from './error/messages/message-init';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnDestroy, OnInit {

    @HostBinding('style.top') top: string;

    isTimerPageActive = false;

    private readonly destroyed = new ReplaySubject<void>(1);

    constructor(
        private readonly dateAdapter: DateAdapter<any>,
        private readonly breakpointObserver: BreakpointObserver,
        private readonly router: Router,
    ) {
    }

    ngOnDestroy(): void {
        this.destroyed.next();
        this.destroyed.complete();
    }

    ngOnInit(): void {
        this.breakpointObserver.observe('(max-width: 599px)').pipe(
            map(value => value.matches ? 56 : 64),
            map(value => `${value}px`),
            takeUntil(this.destroyed),
        ).subscribe(top => {
            this.top = top;
        });

        this.dateAdapter.setLocale(dateLocaleEn);
        initErrorMessages();

        this.router.events.pipe(
            takeUntil(this.destroyed),
        ).subscribe(event => {
            if (event instanceof NavigationEnd || event instanceof NavigationSkipped) {
                this.isTimerPageActive = event.url === '/' || event.url.startsWith('/join/');
            }
        });
    }
}
