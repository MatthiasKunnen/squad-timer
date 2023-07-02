import type {IncomingMessage} from 'node:http';
import type {Duplex} from 'node:stream';

import * as WebSocket from 'ws';

import {
    assignStrict,
    CreateRoomResponse,
    JoinRoomResponse,
    ListTimersRequest,
    ListTimersResponse,
    UpdateRoomTimersResponse,
    WsRequest,
    WsResponse,
} from '../../shared';
import type {
    CreateRoomRequest,
    JoinRoomRequest,
    UpdateRoomTimersRequest,
} from '../../shared';
import type {ActionInfo, Room} from './handler.interface';
import {decoverto} from './instances/decoverto.instance';
import {getRandomMnemonic} from './mnemonic-words';

type ActionHandler = (info: ActionInfo<any>) => WsResponse | undefined;

export class WebsocketHandler {

    private readonly requestTypeHandler = decoverto.type(WsRequest);
    private readonly responseTypeHandler = decoverto.type(WsResponse);
    private readonly rooms = new Map<string, Room>();
    private readonly wss: WebSocket.Server;

    constructor() {
        this.wss = new WebSocket.Server({
            noServer: true,
        });

        const actionMap = new Map<string, ActionHandler>([
            ['CreateRoom', this.createRoom.bind(this)],
            ['JoinRoom', this.joinRoom.bind(this)],
            ['UpdateRoomTimers', this.updateRoomTimers.bind(this)],
        ]);

        this.wss.on('connection', ws => {
            ws.on('message', this.createMessageListener(message => {
                const action = actionMap.get(message.type);
                if (action === undefined) {
                    return;
                }

                const response = action({
                    ws,
                    message,
                });

                this.sendResponse(ws, response);
            }));

            ws.on('error', (error) => {
                console.error(error);
            });

            ws.on('close', () => {
                this.rooms.forEach((room, name) => {
                    room.clients.delete(ws);

                    if (room.clients.size === 0) {
                        this.rooms.delete(name);
                    }
                });
            });
        });

        setInterval(() => {
            this.wss.clients.forEach(ws => {
                ws.ping();
            });
        }, 50000);
    }

    close() {
        this.wss.close(); // Stop accepting new connections
        this.wss.clients.forEach(client => {
            // Close existing connections
            client.close();
        });
    }

    /**
     * Handle a HTTP upgrade request to upgrade the request to a Websocket connection.
     */
    handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer) {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
            this.wss.emit('connection', ws, request);
        });
    }

    createRoom(info: ActionInfo<CreateRoomRequest>): CreateRoomResponse {
        let roomName: string;
        do {
            roomName = getRandomMnemonic(3);
        } while (this.rooms.has(roomName));

        this.rooms.set(roomName, {
            clients: new Set([info.ws]),
        });

        return assignStrict(new CreateRoomResponse(), {
            name: roomName,
        });
    }

    joinRoom(info: ActionInfo<JoinRoomRequest>): JoinRoomResponse | undefined {
        const room = this.rooms.get(info.message.name);

        if (room === undefined) {
            // Server might have restarted
            this.rooms.set(info.message.name, {
                clients: new Set([info.ws]),
            });

            return new JoinRoomResponse();
        }

        const firstClient: WebSocket = room.clients.values().next().value;
        const waitForTimersListener = this.createMessageListener(message => {
            if (!(message instanceof ListTimersRequest)) {
                return;
            }

            const payload = assignStrict(new JoinRoomResponse(), {
                timers: message.timers,
            });
            this.sendResponse(info.ws, payload);
            firstClient.removeListener('message', waitForTimersListener);
        });

        firstClient.on('message', waitForTimersListener);
        room.clients.add(info.ws);
        this.sendResponse(firstClient, new ListTimersResponse());
    }

    updateRoomTimers(info: ActionInfo<UpdateRoomTimersRequest>): undefined {
        const room = this.rooms.get(info.message.name);
        if (room === undefined) {
            return;
        }

        if (!room.clients.has(info.ws)) {
            // @todo What should be done when receiving an UpdateRoomTimers request from a socket
            //   that is not a member of the room? Refuse? Add them to the room? This should only
            //   occur in case of a programming oversight or malicious action.
            console.warn(
                `Received UpdateRoomTimers request from user that is not a member of room '${
                    info.message.name}'.`,
            );
        }

        room.clients.forEach(client => {
            if (client !== info.ws) {
                this.sendResponse(client, assignStrict(new UpdateRoomTimersResponse(), {
                    timers: info.message.timers,
                }));
            }
        });
    }

    private createMessageListener(
        listener: (message: WsRequest) => void,
    ): (data: WebSocket.Data, isBinary: boolean) => void {
        return (messageData, isBinary) => {
            if (isBinary) {
                return;
            }

            let message: string;

            try {
                message = JSON.parse(messageData.toString());
            } catch (error) {
                console.error({
                    message: 'Failed to parse incoming message as JSON',
                    error,
                    info: {
                        messageData,
                    },
                });
                return;
            }

            try {
                const request = this.requestTypeHandler.plainToInstance(message);
                listener(request);
            } catch (error) {
                console.error({
                    message: 'An error occurred processing a message',
                    error,
                    info: {
                        message,
                    },
                });
            }
        };
    }

    private sendResponse(ws: WebSocket, response: WsResponse | undefined): void {
        if (response === undefined) {
            return;
        }

        const payload = this.responseTypeHandler.instanceToRaw(response);
        ws.send(payload);
    }
}
