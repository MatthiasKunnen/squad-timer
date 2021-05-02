import {Environment} from './environment.interface';
import {applyGeneratedEnvironment} from './environment.utils';

export const environment: Environment = {
    environment: 'production',
    production: true,
    sentry: {
        enabled: false,
    },
    serviceWorkerEnabled: true,
};

applyGeneratedEnvironment(environment);
