import 'reflect-metadata';
import * as fs from 'fs';

import {WebsocketHandler} from './handler';

(async () => {
    const wsHandler = new WebsocketHandler();

    const port = 5050;
    wsHandler.server.listen(port, () => {
        if (process.env.ON_HEROKU !== undefined) {
            fs.closeSync(fs.openSync('/tmp/app-initialized', 'w'));
        }

        console.log(`Server is listening on port ${port}`);
    });
})().catch(console.error);
