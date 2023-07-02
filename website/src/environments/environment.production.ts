import type {Environment} from './environment.interface';
import {applyGeneratedEnvironment} from './environment.utils';

export const environment: Environment = {
    environment: 'production',
    production: true,
    sentry: {
        enabled: false,
    },
    serviceWorkerEnabled: true,
    websocketPath: '/api/websocket',
};

applyGeneratedEnvironment(environment);
