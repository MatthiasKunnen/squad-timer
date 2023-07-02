import 'reflect-metadata';

import {WebsocketHandler} from './handler';
import {onShutdown} from './utils/process.util';

// eslint-disable-next-line @typescript-eslint/require-await
(async () => {
    const wsHandler = new WebsocketHandler();

    const port = Number(process.env.PORT ?? 5050);

    if (isNaN(port)) {
        throw new Error(`Environment variable PORT is not a number: '${process.env.PORT}'`);
    }

    wsHandler.server.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });

    onShutdown(signal => {
        console.info(`${signal} signal received. Shutting down.`);
        try {
            wsHandler.close();
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
