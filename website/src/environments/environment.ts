import type {Environment} from './environment.interface';

// Recommendation: run git update-index --skip-worktree src/environments/environment.ts to prevent
// git from tracking changes to this file (experimental)

export const environment: Environment = {
    environment: 'production',
    production: false,
    release: 'local',
    sentry: {
        enabled: false,
    },
    serviceWorkerEnabled: false,
    websocketUrl: 'ws://localhost:4250/api/websocket',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
