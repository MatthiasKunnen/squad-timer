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
    /**
     * The path for the websocket connection. The protocol should be chosen based on the protocol of
     * the current Document's Location.
     */
    websocketPath: string;
}
