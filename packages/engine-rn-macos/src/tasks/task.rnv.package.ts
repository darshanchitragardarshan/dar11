import {
    RnvTaskFn,
    logErrorPlatform,
    logTask,
    MACOS,
    TASK_PACKAGE,
    TASK_CONFIGURE,
    PARAMS,
    getConfigProp,
    executeOrSkipTask,
    shouldSkipTask,
} from '@rnv/core';
import { packageBundleForXcode } from '@rnv/sdk-apple';

export const taskRnvPackage: RnvTaskFn = async (c, parentTask, originTask) => {
    logTask('taskRnvPackage', `parent:${parentTask}`);
    const { platform } = c;

    await executeOrSkipTask(c, TASK_CONFIGURE, TASK_PACKAGE, originTask);

    const bundleAssets = getConfigProp(c, c.platform, 'bundleAssets');

    if (!bundleAssets) {
        return true;
    }

    if (shouldSkipTask(c, TASK_PACKAGE, originTask)) return true;

    switch (platform) {
        case MACOS:
            return packageBundleForXcode(c);
        default:
            logErrorPlatform(c);
            return false;
    }
};

export default {
    description: 'Package source files into bundle',
    fn: taskRnvPackage,
    task: 'package',
    params: PARAMS.withBase(PARAMS.withConfigure()),
    platforms: [MACOS],
};
