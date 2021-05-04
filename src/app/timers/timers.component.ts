import {Component, OnInit} from '@angular/core';
import {addMinutes, isAfter} from 'date-fns';
import {Decoverto} from 'decoverto';
import {EMPTY, fromEvent, merge, Observable, Observer, Subject, timer} from 'rxjs';
import {debounceTime, map, mapTo, shareReplay, startWith, switchMap} from 'rxjs/operators';

import {Timer, Unit} from './timer.model';

@Component({
    templateUrl: './timers.component.html',
    styleUrls: ['./timers.component.scss'],
})
export class TimersComponent implements OnInit {

    deferredSortObserver: Observer<void>;

    /**
     * This subject serves as a way to instantly update the time for immediate feedback.
     */
    manualUpdateSubject: Subject<void>;
    timers: Array<Timer> = [];
    units: Array<Unit>;

    /**
     * When this observable emits, the time updates.
     */
    updateObservable: Observable<void>;

    private readonly storageKey = 'timers';

    constructor(
        private readonly decoverto: Decoverto,
    ) {
    }

    ngOnInit(): void {
        this.units = this.decoverto.type(Unit).plainToInstanceArray([
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
        ]);

        const storedTimers = localStorage.getItem('timers');

        if (storedTimers !== null) {
            this.timers = this.decoverto.type(Timer).rawToInstanceArray(storedTimers);
        }

        new Observable(observer => {
            this.deferredSortObserver = observer;
        }).pipe(
            debounceTime(1500),
        ).subscribe(() => {
            this.sortTimers();
        });
        this.manualUpdateSubject = new Subject();
        this.updateObservable = merge(
            fromEvent(document, 'visibilitychange').pipe(
                startWith(null),
                map(() => document.hidden),
                switchMap(hidden => {
                    if (hidden) {
                        return EMPTY;
                    }

                    return timer(0, 1000);
                }),
            ),
            this.manualUpdateSubject,
        ).pipe(
            mapTo(undefined),
            shareReplay(1),
        );
    }

    addMinutesToTimer(index: number, minutes: number): void {
        const selectedTimer = this.timers[index];
        selectedTimer.spawnsOn = addMinutes(selectedTimer.spawnsOn, minutes);
        setTimeout(() => {
            // Immediately update the time. Needs to be run after change detection
            this.manualUpdateSubject.next();
        });
        this.deferredSortObserver.next();
    }

    changeSide(i: number): void {
        this.timers[i].side = this.timers[i].side === 'enemy' ? 'friendly' : 'enemy';

        this.store();
    }

    sortTimers(): void {
        this.timers = this.timers.sort((a, b) => {
            return a.spawnsOn.getTime() - b.spawnsOn.getTime();
        });

        this.store();
    }

    startTimer(unit: Unit, side: Timer['side']): void {
        const spawnsOn = addMinutes(new Date(), unit.respawnTime);
        const insertionIndex = this.timers.findIndex(item => isAfter(item.spawnsOn, spawnsOn));

        const newTimer = Object.assign(new Timer(), {
            spawnsOn,
            side,
            unit,
        });

        if (insertionIndex < 0) {
            this.timers.push(newTimer);
        } else {
            this.timers.splice(Math.max(0, insertionIndex), 0, newTimer);
        }

        this.store();
    }

    removeTimer(index: number): void {
        this.timers.splice(index, 1);
        this.store();
    }

    store(): void {
        localStorage.setItem(
            this.storageKey,
            this.decoverto.type(Timer).instanceArrayToRaw(this.timers),
        );
    }
}
