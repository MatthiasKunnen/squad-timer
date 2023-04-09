import 'reflect-metadata';

import {WebsocketHandler} from './handler';

(async () => {
    const wsHandler = new WebsocketHandler();

    const port = 5050;
    wsHandler.server.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });
})().catch(console.error);
