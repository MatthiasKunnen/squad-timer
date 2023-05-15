import {array, inherits, model, property} from 'decoverto';

import {Timer} from './timer.model';

@model({
    inheritance: {
        discriminatorKey: 'type',
        strategy: 'discriminator',
    },
})
export class WsResponse {
}

@inherits({
    discriminator: 'RoomCreated',
})
@model()
export class CreateRoomResponse extends WsResponse {

    @property()
    name: string;
}

@inherits({
    discriminator: 'RoomJoined',
})
@model()
export class JoinRoomResponse extends WsResponse {

    /**
     * If the timers property is undefined, the client should keep their current timers.
     */
    @property(array(() => Timer))
    timers?: Array<Timer>;
}

@inherits({
    discriminator: 'ListTimers',
})
@model()
export class ListTimersResponse extends WsResponse {
}

@inherits({
    discriminator: 'UpdateRoomTimers',
})
@model()
export class UpdateRoomTimersResponse extends WsResponse {

    @property(array(() => Timer))
    timers: Array<Timer>;
}
