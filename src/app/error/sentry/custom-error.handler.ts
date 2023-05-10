import {HttpErrorResponse} from '@angular/common/http';
import type {ErrorHandler} from '@angular/core';
import {Injectable} from '@angular/core';

import {Logger} from '../../utils/logger.util';

@Injectable()
export class CustomErrorHandler implements ErrorHandler {

    extractError(error: any) {
        // Try to unwrap zone.js error.
        // https://github.com/angular/angular/blob/master/packages/core/src/util/errors.ts
        if (error?.ngOriginalError != null) {
            error = error.ngOriginalError;
        }

        // We can handle messages and Error objects directly.
        if (typeof error === 'string') {
            return error;
        }

        // If it's http module error, extract as much information from it as we can.
        if (error instanceof HttpErrorResponse) {
            // The `error` property of http exception can be either an `Error` object, which we can
            // use directly...
            if (error.error instanceof Error) {
                return error.error;
            }

            // ... or an`ErrorEvent`, which can provide us with the message but no stack...
            if (error.error instanceof ErrorEvent) {
                return error.error.message;
            }

            // ...or the request body itself, which we can use as a message instead.
            if (typeof error.error === 'string') {
                return `Server returned code ${error.status} with body "${error.error}"`;
            }

            // If we don't have any detailed information, fallback to the request message itself.
            return error.message;
        }

        if (error instanceof Error) {
            return error;
        }

        // Skip if there's no error, and let user decide what to do with it.
        return null;
    }

    handleError(error: any) {
        const extractedError = this.extractError(error);

        if (extractedError === null) {
            return;
        }

        if ((extractedError as any).isUnexpected === false) {
            return;
        }

        Logger.error(typeof extractedError === 'string'
            ? extractedError
            : {
                error: extractedError,
                message: error.message,
            });
    }
}
