import * as fs from 'fs';
import * as path from 'path';

import type {Environment} from '../src/environments/environment.interface';
import {getHeadHash} from './env.util';

const gitHead = getHeadHash();

const generatedEnvironment: Partial<Environment> = {
    release: gitHead,
};

const generatedFile = `\
/* eslint-disable */
export const generatedEnvironment = ${JSON.stringify(generatedEnvironment, undefined, 4)};
`;

fs.writeFileSync(
    path.join(__dirname, '..', 'src', 'environments', 'environment.generated.ts'),
    generatedFile,
);
