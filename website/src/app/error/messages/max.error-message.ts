import type {ErrorMessage} from 'angular-error-repository';

export const maxError: ErrorMessage<{
    actual: number;
    max: number;
}> = (info) => {
    return `Maximum ${info.error.max}`;
};
