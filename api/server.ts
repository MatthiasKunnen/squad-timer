import 'reflect-metadata';

import {WebsocketHandler} from './handler';
import {onShutdown} from './utils/process.util';

(async () => {
    const wsHandler = new WebsocketHandler();

    const port = 5050;
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
