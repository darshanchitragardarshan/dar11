import {
    RnvTaskFn,
    logTask,
    TASK_EXPORT,
    TASK_DEPLOY,
    ANDROID_TV,
    FIRE_TV,
    TVOS,
    PARAMS,
    executeOrSkipTask,
    shouldSkipTask,
} from '@rnv/core';

export const taskRnvDeploy: RnvTaskFn = async (c, parentTask, originTask) => {
    logTask('taskRnvDeploy', `parent:${parentTask}`);

    await executeOrSkipTask(c, TASK_EXPORT, TASK_DEPLOY, originTask);

    if (shouldSkipTask(c, TASK_DEPLOY, originTask)) return true;

    // Deploy simply trggets hook
    return true;
};

export default {
    description: 'Deploy the binary via selected deployment intgeration or buld hook',
    fn: taskRnvDeploy,
    task: TASK_DEPLOY,
    params: PARAMS.withBase(PARAMS.withConfigure()),
    platforms: [TVOS, ANDROID_TV, FIRE_TV],
};
