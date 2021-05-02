import {Component, Input, OnInit} from '@angular/core';
import {
    differenceInDays,
    differenceInHours,
    differenceInMinutes,
    differenceInMonths,
    differenceInSeconds,
    differenceInYears,
    isPast,
    subDays,
    subHours,
    subMinutes,
    subMonths,
    subSeconds,
    subYears,
} from 'date-fns';
import {EMPTY, fromEvent, Observable, timer} from 'rxjs';
import {map, startWith, switchMap} from 'rxjs/operators';

import {isNotUndefined} from '../utils/guards.util';

@Component({
    selector: 'app-countdown',
    templateUrl: './countdown.component.html',
    styleUrls: ['./countdown.component.scss'],
})
export class CountdownComponent implements OnInit {

    @Input() date: Date;

    dateObservable: Observable<string>;

    ngOnInit(): void {
        this.dateObservable = fromEvent(document, 'visibilitychange').pipe(
            startWith(null),
            map(() => document.hidden),
            switchMap(hidden => {
                if (hidden) {
                    return EMPTY;
                }

                return timer(0, 1000);
            }),
            map(() => this.humanizeDifference(new Date())),
        );
    }

    humanizeDifference(diffWith: Date) {
        let date = this.date;
        const modifier = isPast(this.date) ? -1 : 1;
        const parts: Array<[string, typeof differenceInDays, typeof subDays]> = [
            ['year', differenceInYears, subYears],
            ['month', differenceInMonths, subMonths],
            ['day', differenceInDays, subDays],
            ['hour', differenceInHours, subHours],
            ['minute', differenceInMinutes, subMinutes],
            ['second', differenceInSeconds, subSeconds],
        ];

        const result = parts
            .map(([name, diff, sub], i) => {
                const difference = Math.abs(diff(date, diffWith));

                if (difference === 0) {
                    return;
                }

                date = sub(date, difference * modifier);

                return `${difference} ${name}${difference === 1 ? '' : 's'}`;
            })
            .filter(isNotUndefined)
            .join(', ');

        return `${modifier < 0 ? '-' : ''}${result}`;
    }

}
