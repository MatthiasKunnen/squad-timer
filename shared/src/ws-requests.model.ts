import {array, inherits, model, property} from 'decoverto';

import {Timer} from './timer.model';

@model({
    inheritance: {
        discriminatorKey: 'type',
        strategy: 'discriminator',
    },
})
export class WsRequest {

    @property()
    type: string;
}

@inherits({
    discriminator: 'CreateRoom',
})
@model()
export class CreateRoomRequest extends WsRequest {
}

@inherits({
    discriminator: 'JoinRoom',
})
@model()
export class JoinRoomRequest extends WsRequest {

    @property()
    name: string;
}

@inherits({
    discriminator: 'ListTimers',
})
@model()
export class ListTimersRequest extends WsRequest {

    @property(array(() => Timer))
    timers: Array<Timer>;
}

@inherits({
    discriminator: 'UpdateRoomTimers',
})
@model()
export class UpdateRoomTimersRequest extends WsRequest {

    @property()
    name: string;

    @property(array(() => Timer))
    timers: Array<Timer>;
}
