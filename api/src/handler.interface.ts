import type * as WebSocket from 'ws';

import type {WsRequest} from '../../shared';

export interface Room {
    clients: Set<WebSocket>;
}

export interface ActionInfo<Request extends WsRequest> {
    ws: WebSocket;
    message: Request;
}
