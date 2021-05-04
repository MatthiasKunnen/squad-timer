import {Component, OnInit} from '@angular/core';
import {addMinutes, isAfter} from 'date-fns';
import {EMPTY, fromEvent, Observable, timer} from 'rxjs';
import {map, mapTo, shareReplay, startWith, switchMap} from 'rxjs/operators';

interface Unit {
    code: string;
    name: string;
    respawnTime: number;
}

interface Timer {
    endsOn: Date;
    side: 'enemy' | 'friendly';
    unit: Unit;
}

@Component({
    templateUrl: './timers.component.html',
    styleUrls: ['./timers.component.scss'],
})
export class TimersComponent implements OnInit {

    timers: Array<Timer> = [];

    units: Array<Unit> = [
        {code: 'jeep', name: 'Jeep', respawnTime: 5},
        {code: 'jeep-open-turret', name: 'Jeep', respawnTime: 5},
        {code: 'jeep-anti-tank', name: 'Jeep AT', respawnTime: 10},
        {code: 'transport-helo', name: 'Transport heli', respawnTime: 6},
        {code: 'wheeled-apc', name: 'Wheeled APC', respawnTime: 10},
        {code: 'wheeled-ifv', name: 'Wheeled IFV', respawnTime: 10},
        {code: 'tracked-apc-open-top', name: 'Tracked APC open top', respawnTime: 10},
        {code: 'tracked-apc-rws', name: 'Tracked APC RWS', respawnTime: 10},
        {code: 'tracked-ifv', name: 'Tracked IFV', respawnTime: 15},
        {code: 'tank', name: 'MBT', respawnTime: 20},
    ];

    updateObservable: Observable<void>;

    ngOnInit(): void {
        this.updateObservable = fromEvent(document, 'visibilitychange').pipe(
            startWith(null),
            map(() => document.hidden),
            switchMap(hidden => {
                if (hidden) {
                    return EMPTY;
                }

                return timer(0, 1000);
            }),
            mapTo(undefined),
            shareReplay(1),
        );
    }

    startTimer(unit: Unit, side: Timer['side']): void {
        const endsOn = addMinutes(new Date(), unit.respawnTime);
        const insertionIndex = this.timers.findIndex(item => isAfter(item.endsOn, endsOn));

        const newTimer: Timer = {
            endsOn,
            side,
            unit,
        };

        if (insertionIndex < 0) {
            this.timers.push(newTimer);
        } else {
            this.timers.splice(Math.max(0, insertionIndex), 0, newTimer);
        }
    }

    removeTimer(index: number): void {
        this.timers.splice(index, 1);
    }
}
