import {Component, Input, OnInit} from '@angular/core';
import {
    differenceInDays,
    differenceInMinutes,
    differenceInSeconds,
    isPast,
    subDays,
    subMinutes,
    subSeconds,
} from 'date-fns';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
    selector: 'app-countdown',
    templateUrl: './countdown.component.html',
    styleUrls: ['./countdown.component.scss'],
})
export class CountdownComponent implements OnInit {

    @Input() date: Date;
    /**
     * Every time this observable emits, the countdown will be updated.
     */
    @Input() updateObservable: Observable<void>;

    dateObservable: Observable<string>;
    hasPassedObservable: Observable<boolean>;

    ngOnInit(): void {
        this.dateObservable = this.updateObservable.pipe(
            map(() => this.humanizeDifference(new Date())),
        );
        this.hasPassedObservable = this.updateObservable.pipe(
            map(() => isPast(this.date)),
        );
    }

    humanizeDifference(diffWith: Date) {
        let date = this.date;
        const modifier = isPast(this.date) ? -1 : 1;
        const parts: Array<[typeof differenceInDays, typeof subDays]> = [
            [differenceInMinutes, subMinutes],
            [differenceInSeconds, subSeconds],
        ];

        const result = parts
            .map(([diff, sub]) => {
                const difference = Math.abs(diff(date, diffWith));
                date = sub(date, difference * modifier);

                return difference.toString().padStart(2, '0');
            })
            .join(':');

        return `${modifier < 0 ? '-' : ''}${result}`;
    }

}
