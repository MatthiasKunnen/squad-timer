import 'reflect-metadata';

import * as http from 'node:http';
import * as process from 'node:process';

import {WebsocketHandler} from './handler';
import {onShutdown} from './utils/process.util';

// eslint-disable-next-line @typescript-eslint/require-await
(async () => {
    const httpServer = http.createServer((request, response) => {
        const url = new URL(request.url!, `http://${request.headers.host}`);

        switch (url.pathname) {
            case '/':
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end('Welcome to the Squad Timer API!\n');
                break;
            case '/websocket':
                response.writeHead(400, {'Content-Type': 'text/plain'});
                response.end('Websocket upgrade request expected\n');
                break;
            default:
                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.end('Not found\n');
        }
    });

    const wsHandler = new WebsocketHandler();

    httpServer.on('upgrade', (request, socket, head) => {
        const url = new URL(request.url!, `http://${request.headers.host}`);

        if (url.pathname === '/websocket') {
            wsHandler.handleUpgrade(request, socket, head);
        } else {
            socket.destroy();
        }
    });

    const port = Number(process.env.PORT ?? 5050);

    if (isNaN(port)) {
        throw new Error(`Environment variable PORT is not a number: '${process.env.PORT}'`);
    }

    httpServer.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });

    onShutdown(signal => {
        console.info(`${signal} signal received. Shutting down.`);
        try {
            wsHandler.close();
            httpServer.close();
            process.exit(0);
        } catch (error) {
            console.error({
                message: 'Failed to shut down cleanly',
                error,
            });
            process.exit(1);
        }
    });
})().catch(console.error);

process.on('unhandledRejection', (reason, promise) => {
    console.error('unhandledRejection', reason, promise);
    process.exit(1);
});

process.on('uncaughtException', error => {
    console.error('uncaughtException', error);
    process.exit(1);
});
