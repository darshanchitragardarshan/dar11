import { logErrorPlatform } from '../core/platformManager';
import { logTask } from '../core/systemManager/logger';
import {
    WEB,
    CHROMECAST,
    TASK_RUN, TASK_CONFIGURE
} from '../core/constants';
import { runWebNext } from '../sdk-webpack/webNext';
import { executeTask } from '../core/engineManager';

export const taskRnvRun = async (c, parentTask, originTask) => {
    const { platform } = c;
    const { port } = c.runtime;
    const { target } = c.runtime;
    const { hosted } = c.program;
    logTask('taskRnvRun', `parent:${parentTask} port:${port} target:${target} hosted:${hosted}`);

    await executeTask(c, TASK_CONFIGURE, TASK_RUN, originTask);

    switch (platform) {
        case WEB:
        case CHROMECAST:
            c.runtime.shouldOpenBrowser = true;
            return runWebNext(c, platform, port, true);
        default:
            return logErrorPlatform(c);
    }
};

export default {
    description: 'Run your app in browser',
    fn: taskRnvRun,
    task: 'run',
    params: [],
    platforms: [
        WEB,
        CHROMECAST,
    ],
};