export {};

declare global {
    interface Window {
        env?: {
            environment: string;
            release?: string;
        };
    }
}
