export interface Environment {
    environment: string;
    production: boolean;
    release?: string;
    sentry: {
        dsn: string;
        enabled: true;
    } | {
        dsn?: string;
        enabled: false;
    };
    serviceWorkerEnabled: boolean;
    websocketUrl: string;
}
