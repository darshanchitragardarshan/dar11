import {
    RnvTaskFn,
    logTask,
    PARAMS,
    WEB,
    TASK_EXPORT,
    executeOrSkipTask,
    initializeTask,
    findSuitableTask,
} from '@rnv/core';
import Docker from '../docker';

export const taskRnvDockerDeploy: RnvTaskFn = async (c, parentTask, originTask) => {
    logTask('taskRnvDockerDeploy', `parent:${parentTask}`);

    if (c.program.only) {
        // If run as standalone command skip all the export
        await executeOrSkipTask(c, TASK_EXPORT, 'docker export', originTask);
    } else {
        const taskInstance = await findSuitableTask(c, TASK_EXPORT);
        if (taskInstance) await initializeTask(c, taskInstance.task);
    }

    const docker = new Docker(c);
    await docker.doDeploy();
    return true;
};

export default {
    description: 'Deploys your project to docker image',
    fn: taskRnvDockerDeploy,
    task: 'docker deploy',
    params: PARAMS.withBase(),
    platforms: [WEB],
};
