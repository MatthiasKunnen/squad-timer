export function onShutdown(callback: (signal: 'SIGINT' | 'SIGTERM') => void): void {
    process.on('SIGINT', () => {
        callback('SIGINT');
    });
    process.on('SIGTERM', () => {
        callback('SIGTERM');
    });
}
