import type {OnDestroy, OnInit} from '@angular/core';
import {Component} from '@angular/core';
import type {MatTooltip} from '@angular/material/tooltip';
import {ActivatedRoute, Router} from '@angular/router';
import {addHours, addMinutes, addSeconds, isAfter, isFuture} from 'date-fns';
import {Decoverto} from 'decoverto';
import type {Observer, Subscription} from 'rxjs';
import {
    EMPTY,
    fromEvent,
    merge,
    Observable,
    ReplaySubject,
    retry,
    Subject,
    timer,
} from 'rxjs';
import {
    debounceTime,
    map,
    shareReplay,
    startWith,
    switchMap,
    takeUntil,
    tap,
} from 'rxjs/operators';
import type {WebSocketSubject} from 'rxjs/webSocket';
import {webSocket} from 'rxjs/webSocket';

import {
    assignStrict,
    CreateRoomRequest,
    CreateRoomResponse,
    JoinRoomRequest,
    JoinRoomResponse,
    ListTimersRequest,
    ListTimersResponse,
    Timer,
    Unit,
    UpdateRoomTimersRequest,
    UpdateRoomTimersResponse,
    WsRequest,
    WsResponse,
} from '../../../../shared';
import {environment} from '../../environments/environment';
import {Logger} from '../utils/logger.util';

type WebSocketData = WsRequest | WsResponse | null;
type WebSocketHandler = WebSocketSubject<WebSocketData>;

@Component({
    selector: 'app-timers',
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
    roomUrlTooltipHiddenSubscription: Subscription | undefined;
    socket: WebSocketHandler | null = null;
    socketStatus: 'connected' | 'connecting' | 'disconnected' = 'connecting';
    timers: Array<Timer> = [];
    units: Array<Unit>;
    websocketUrl: string;

    /**
     * When this observable emits, the time updates. It emits every second while the tab is visible.
     * This allows us to not waste the user's resources when the tab is invisible and resume when
     * the tab becomes visible again.
     */
    updateObservable: Observable<void>;

    private readonly destroyed = new ReplaySubject<void>(1);
    private readonly storageKey = 'timers';

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly decoverto: Decoverto,
    ) {
        const websocketUrl = new URL(window.location.href);
        websocketUrl.protocol = websocketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        websocketUrl.pathname = environment.websocketPath;
        this.websocketUrl = websocketUrl.toString();
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

        this.route.params.pipe(
            takeUntil(this.destroyed),
        ).subscribe(params => {
            /*
            Triggered on:
            - First time component is loaded
            - User creates/joins room and is redirected to /join/:roomName
            - User disconnects from room
            - User disconnects from room and presses back button -> reconnect user.
            - User creates/joins room and presses back button -> disconnect user.
             */
            const roomName: string | undefined = params.roomName;

            if (roomName === undefined) {
                this.disconnect();
            } else if (roomName !== this.roomName) {
                this.setRoomName(roomName);
                this.connectToSocket();
            }
        });
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

    /**
     * Makes an existing tooltip read "Url copied" on successful copy to clipboard and reinstates
     * text when the tooltip is hidden.
     *
     * The difficulty here lies in the method used by `cdkCopyToClipboard` causing the tooltip to be
     * hidden. We need to immediately reshow the tooltip with the correct text. Then, after the
     * tooltip is hidden, we need the original text to be reinstated.
     * @param success Whether the copy operation was a success.
     * @param tooltip The tooltip that should be shown and edited.
     */
    roomUrlCopyResult(success: boolean, tooltip: MatTooltip): void {
        // Unsubscribe from previous afterHidden. This addresses the following problem:
        // 1. user hovers over button -> this displays the tooltip
        // 2. user clicks button -> text is changed to say 'URL copied' and registers an observable
        //    to change the text back when the tooltip is hidden.
        // 3. user clicks button again (note the tooltip never got hidden because the user never
        //    stopped hovering). Clicking the button executes cdkCopyToClipboard and hides the
        //    tooltip. The text is changed to "URL copied" by this function. At the same time, the
        //    previously registered afterHidden subscription will complete and change the text back.
        //    This will result in the text continuing to read "Copy URL".
        this.roomUrlTooltipHiddenSubscription?.unsubscribe();

        if (!success) {
            return;
        }

        tooltip.message = 'URL copied';

        setTimeout(() => {
            // The copy action causes the tooltip to hide. Show it again in the next change
            // detection cycle.
            tooltip.show();
            this.roomUrlTooltipHiddenSubscription = tooltip._tooltipInstance?.afterHidden()
                .subscribe({
                    complete: () => {
                        // Change the text of the tooltip back when the tooltip is hidden
                        tooltip.message = 'Copy URL';
                    },
                });
        });
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

        this.connectToSocket();
    }

    private loadTimers(): void {
        const storedTimers = localStorage.getItem('timers');

        if (storedTimers !== null) {
            this.timers = this.decoverto.type(Timer).rawToInstanceArray(storedTimers);
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
                map(() => document.visibilityState),
                switchMap(visibilityState => {
                    if (visibilityState === 'hidden') {
                        // Stop emitting when tab is not visible
                        return EMPTY;
                    }

                    return timer(0, 1000);
                }),
            ),
            this.manualUpdateSubject,
        ).pipe(
            map(() => undefined),
            tap(() => {
                // Remove old timers
                const trimmedTimers = this.timers.filter(t => {
                    return isFuture(addSeconds(addHours(t.spawnsOn, 2), 1));
                });

                if (trimmedTimers.length !== this.timers.length) {
                    this.timers = trimmedTimers;
                    this.storeTimers();
                }
            }),
            shareReplay(1),
        );
    }

    private connectToSocket(): void {
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
                } catch (error: any) {
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

                    if (this.roomName === null) {
                        socket.next(new CreateRoomRequest());
                    } else {
                        socket.next(assignStrict(new JoinRoomRequest(), {
                            name: this.roomName,
                        }));
                    }
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
            url: this.websocketUrl,
        });

        socket.pipe(
            retry({
                delay: () => {
                    this.socketStatus = 'disconnected';

                    return timer(2000).pipe(
                        tap(() => {
                            this.socketStatus = 'connecting';
                        }),
                    );
                },
            }),
            takeUntil(this.destroyed),
        ).subscribe(message => {
            if (message instanceof ListTimersResponse) {
                socket.next(assignStrict(new ListTimersRequest(), {
                    timers: this.timers,
                }));
            } else if (message instanceof CreateRoomResponse) {
                this.setRoomName(message.name);
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

    private setRoomName(roomName: string): void {
        if (this.roomName === roomName) {
            return;
        }

        const roomUrl = new URL(window.location.href);
        roomUrl.pathname = `/join/${roomName}`;
        this.roomName = roomName;
        this.roomUrl = roomUrl.href;
    }
}
