import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatTooltip} from '@angular/material/tooltip';
import {ActivatedRoute, Router} from '@angular/router';
import {addMinutes, isAfter} from 'date-fns';
import {Decoverto} from 'decoverto';
import {
    EMPTY,
    fromEvent,
    merge,
    Observable,
    Observer,
    ReplaySubject,
    Subject,
    timer,
} from 'rxjs';
import {
    debounceTime,
    delay,
    map,
    mapTo,
    retryWhen,
    shareReplay,
    startWith,
    switchMap,
    takeUntil,
    tap,
} from 'rxjs/operators';
import {webSocket, WebSocketSubject} from 'rxjs/webSocket';

import {Timer, Unit} from '../../../shared/timer.model';
import {assignStrict} from '../../../shared/utils/object.util';
import {
    CreateRoomRequest,
    JoinRoomRequest,
    ListTimersRequest,
    UpdateRoomTimersRequest,
    WsRequest,
} from '../../../shared/ws-requests.model';
import {
    CreateRoomResponse,
    JoinRoomResponse,
    ListTimersResponse,
    UpdateRoomTimersResponse,
    WsResponse,
} from '../../../shared/ws-responses.model';
import {environment} from '../../environments/environment';
import {Logger} from '../utils/logger.util';

type WebSocketData = WsRequest | WsResponse | null;
type WebSocketHandler = WebSocketSubject<WebSocketData>;

@Component({
    templateUrl: './timers.component.html',
    styleUrls: ['./timers.component.scss'],
})
export class TimersComponent implements OnDestroy, OnInit {

    deferredSortObserver: Observer<void>;

    /**
     * This subject serves as a way to instantly update the time for immediate feedback.
     */
    manualUpdateSubject: Subject<void>;
    roomName: string | null = null;
    roomUrl: string | null = null;
    socket: WebSocketHandler | null = null;
    socketStatus: 'connecting' | 'disconnected' | 'connected' = 'connecting';
    timers: Array<Timer> = [];
    units: Array<Unit>;

    /**
     * When this observable emits, the time updates.
     */
    updateObservable: Observable<void>;

    private readonly destroyed = new ReplaySubject<void>(1);
    private readonly storageKey = 'timers';

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly decoverto: Decoverto,
    ) {
    }

    ngOnDestroy(): void {
        this.destroyed.next();
        this.destroyed.complete();
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

        new Observable(observer => {
            this.deferredSortObserver = observer;
        }).pipe(
            debounceTime(1500),
        ).subscribe(() => {
            this.sortTimers();
        });

        this.loadTimers();
        this.startTicking();
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

        this.storeTimers();
    }

    copyRoomUrl(roomUrl: MatTooltip): void {
        roomUrl.show();
        setTimeout(() => {
            roomUrl.hide();
        }, 2000);
    }

    disconnect(): void {
        this.socket?.complete();
        this.socket = null;
        this.roomUrl = null;
        this.roomName = null;
        this.router.navigate(['/']).catch(Logger.errorWrap);
    }

    sortTimers(): void {
        this.timers = this.timers.sort((a, b) => {
            return a.spawnsOn.getTime() - b.spawnsOn.getTime();
        });

        this.storeTimers();
    }

    startTimer(unit: Unit, side: Timer['side']): void {
        const spawnsOn = addMinutes(new Date(), unit.respawnTime);
        const insertionIndex = this.timers.findIndex(item => isAfter(item.spawnsOn, spawnsOn));

        const newTimer = assignStrict(new Timer(), {
            spawnsOn,
            side,
            unit,
        });

        if (insertionIndex < 0) {
            this.timers.push(newTimer);
        } else {
            this.timers.splice(Math.max(0, insertionIndex), 0, newTimer);
        }

        this.storeTimers();
    }

    removeTimer(index: number): void {
        this.timers.splice(index, 1);
        this.storeTimers();
    }

    share(): void {
        if (this.socket !== null) {
            return;
        }

        this.connectToSocket(socket => {
            socket.next(new CreateRoomRequest());
        });
    }

    private loadTimers(): void {
        const storedTimers = localStorage.getItem('timers');

        if (storedTimers !== null) {
            this.timers = this.decoverto.type(Timer).rawToInstanceArray(storedTimers);
        }

        const roomName = this.route.snapshot.paramMap.get('roomName');
        this.roomName = roomName;
        if (roomName !== null) {
            const roomUrl = new URL(window.location.href);
            roomUrl.pathname = `/join/${roomName}`;
            this.roomUrl = roomUrl.href;
            this.connectToSocket(socket => {
                socket.next(assignStrict(new JoinRoomRequest(), {
                    name: roomName,
                }));
            });
        }
    }

    private storeTimers(): void {
        localStorage.setItem(
            this.storageKey,
            this.decoverto.type(Timer).instanceArrayToRaw(this.timers),
        );

        if (this.socket !== null && this.roomName !== null) {
            this.socket.next(assignStrict(new UpdateRoomTimersRequest(), {
                name: this.roomName,
                timers: this.timers,
            }));
        }
    }

    private startTicking(): void {
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

    private connectToSocket(onOpen: (socket: WebSocketHandler) => void): void {
        const responseTypeHandler = this.decoverto.type(WsResponse);
        const requestTypeHandler = this.decoverto.type(WsRequest);
        const socket = webSocket<WebSocketData>({
            closeObserver: {
                next: () => {
                    this.socketStatus = 'disconnected';
                },
            },
            deserializer: event => {
                try {
                    return responseTypeHandler.rawToInstance(event.data);
                } catch (error) {
                    Logger.error({
                        error,
                        message: 'Could not deserialize websocket message',
                        info: {event},
                    });
                    return null;
                }
            },
            openObserver: {
                next: () => {
                    this.socketStatus = 'connected';
                    onOpen(socket);
                },
            },
            serializer: message => {
                if (message instanceof WsRequest) {
                    return requestTypeHandler.instanceToRaw(message);
                }

                Logger.error({
                    message: 'Could not send message, not an instance of WsRequest',
                    info: {
                        message,
                    },
                });

                return 'null';
            },
            url: environment.websocketUrl,
        });

        socket.pipe(
            retryWhen(errors => {
                this.socketStatus = 'disconnected';
                return errors.pipe(
                    delay(2000),
                    tap(() => {
                        this.socketStatus = 'connecting';
                    }),
                );
            }),
            takeUntil(this.destroyed),
        ).subscribe(message => {
            if (message instanceof ListTimersResponse) {
                socket.next(assignStrict(new ListTimersRequest(), {
                    timers: this.timers,
                }));
            } else if (message instanceof CreateRoomResponse) {
                this.router.navigate(['join', message.name]).catch(Logger.errorWrap);
            } else if (message instanceof UpdateRoomTimersResponse) {
                this.timers = message.timers;
            } else if (message instanceof JoinRoomResponse) {
                if (message.timers !== undefined) {
                    this.timers = message.timers;
                }
            }
        });

        this.socket = socket;
    }
}
