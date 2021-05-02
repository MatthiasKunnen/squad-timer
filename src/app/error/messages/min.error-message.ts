import {ErrorMessage} from 'angular-error-repository';

export const minError: ErrorMessage<{
    actual: number;
    min: number;
}> = (info) => {
    return `Minimum ${info.error.min}`;
};
