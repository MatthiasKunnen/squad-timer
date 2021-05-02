export interface Environment {
    environment: string;
    production: boolean;
    release?: string;
    sentry: {
        dsn?: string;
        enabled: false;
    } | {
        dsn: string;
        enabled: true;
    };
    serviceWorkerEnabled: boolean;
}
