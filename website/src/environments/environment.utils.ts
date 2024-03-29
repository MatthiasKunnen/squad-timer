import {generatedEnvironment} from './environment.generated';
import type {Environment} from './environment.interface';

export function applyGeneratedEnvironment(environment: Environment): void {
    Object.assign(environment, generatedEnvironment);
    window.env = {
        environment: environment.environment,
        release: environment.release,
    };
}
