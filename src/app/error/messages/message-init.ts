import {ErrorRepository} from 'angular-error-repository';

import {maxError} from './max.error-message';
import {minError} from './min.error-message';
import {requiredError} from './required.error-message';

let initialized = false;

export function initErrorMessages() {
    if (initialized) {
        return;
    }

    initialized = true;

    ErrorRepository.errorMessages['max'] = maxError;
    ErrorRepository.errorMessages['min'] = minError;
    ErrorRepository.errorMessages['required'] = requiredError;
}
