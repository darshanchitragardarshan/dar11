import { fsExistsSync, fsReadFileSync, fsReaddirSync, fsWriteFileSync } from '../system/fs';

import path from 'path';
import { RnvApi } from './types';
import { doResolve } from '../system/resolve';
import { getConfigProp } from '../common';

const spinner: any = () => ({
    start: () => {
        //NOOP
    },
    fail: () => {
        //NOOP
    },
    succeed: () => {
        //NOOP
    },
    text: '',
});

const logger: any = {};

export const generateApiDefaults = (): RnvApi => ({
    isDefault: true,
    doResolve,
    getConfigProp: getConfigProp,
    logger,
    analytics: {
        captureEvent: () => {
            //NOOP
        },
        captureException() {
            //NOOP
        },
        teardown: async () => {
            //NOOP
        },
    },
    prompt: {
        generateOptions() {
            //NOOP
            return {
                asString: '',
                keysAsArray: [],
                keysAsObject: {},
                optionsAsArray: [],
                valuesAsArray: [],
                valuesAsObject: {},
            };
        },
        inquirerPrompt: async () => {
            //NOOP
        },
        pressAnyKeyToContinue: async () => {
            //NOOP
        },
        inquirerSeparator() {
            //NOOP
        },
    },
    spinner: spinner,
    fsExistsSync,
    fsReadFileSync,
    fsReaddirSync,
    fsWriteFileSync,
    path,
});
