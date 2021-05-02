import {HttpErrorResponse} from '@angular/common/http';
import {captureException, captureMessage, Severity} from '@sentry/browser';

import {environment} from '../../../environments/environment';

interface ErrorCodeDeterminator {
    code: string;
    log: boolean;
}

export class Logger {

    static error(input: {
        error: Error;
        info?: any;
        message: string;
    } | string): void {
        if (typeof input === 'string') {
            // eslint-disable-next-line no-console
            console.error(input);
        } else {
            // eslint-disable-next-line no-console
            console.error(input.error, input);
        }

        if (!environment.sentry.enabled) {
            return;
        }

        if (typeof input === 'string') {
            captureMessage(input);
        } else {
            captureException(input.error, {
                extra: {
                    message: input.message ?? input.error.message,
                    ...input.info,
                },
            });
        }
    }

    static errorWrap(error: Error): void;
    static errorWrap(message: string, info?: any): (err: Error) => void;
    static errorWrap(errorOrMessage: string | Error, info?: any): ((err: Error) => void) | void {
        if (errorOrMessage instanceof Error) {
            Logger.error({
                error: errorOrMessage,
                message: errorOrMessage.message,
            });
            return;
        }

        return error => {
            Logger.error({
                error,
                info,
                message: errorOrMessage ?? error.message,
            });
        };
    }

    static handleRequestError({defaultCode, error, info, message}: {
        defaultCode?: string;
        error: Error;
        info?: any;
        message: string;
    }): string {
        let result: string | null = null;
        let log = true;

        function assignResultAndLog(input?: ErrorCodeDeterminator | null): void {
            if (input == null) {
                return;
            }

            result = input.code;
            log = input.log;
        }

        if (error instanceof HttpErrorResponse) {
             assignResultAndLog(this.getErrorCodeFromHttpErrorResponse(error));
        }

        if (log) {
            Logger.error({
                error,
                info,
                message,
            });
        } else {
            // eslint-disable-next-line no-console
            console.error({
                error,
                info,
                message,
            });
        }

        return result ?? defaultCode ?? 'Error.Unknown';
    }

    static warn(message: string, info: {[k: string]: any}): void {
        // eslint-disable-next-line no-console
        console.warn(message);
        captureMessage(message, {
            extra: {
                ...info,
            },
            level: Severity.Warning,
        });
    }

    private static getErrorCodeFromHttpErrorResponse(
        error: HttpErrorResponse,
    ): ErrorCodeDeterminator | null {
        if (error.status === 0) {
            return {
                code: navigator.onLine ? 'Cannot reach server' : 'You appear to be offline',
                log: navigator.onLine,
            };
        }

        return null;
    }
}
