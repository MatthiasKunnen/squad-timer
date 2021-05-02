import {execSync} from 'child_process';

export function getHeadHash(): string {
    if (process.env.SOURCE_VERSION !== undefined) {
        return process.env.SOURCE_VERSION;
    }

    return execSync('git rev-parse --short=10 --verify HEAD').toString().trim();
}
