import {Environment} from './environment.interface';
import {applyGeneratedEnvironment} from './environment.utils';

export const environment: Environment = {
    environment: 'production',
    production: true,
    sentry: {
        enabled: false,
    },
    serviceWorkerEnabled: true,
    websocketUrl: 'wss://squadtimer.herokuapp.com/websocket',
};

applyGeneratedEnvironment(environment);
