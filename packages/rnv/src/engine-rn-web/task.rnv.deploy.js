import { logErrorPlatform } from '../core/platformManager';
import { logTask } from '../core/systemManager/logger';
import {
    WEB,
    TIZEN,
    WEBOS,
    TIZEN_MOBILE,
    TIZEN_WATCH,
    KAIOS,
    FIREFOX_OS,
    FIREFOX_TV,
    CHROMECAST,
    TASK_EXPORT,
    TASK_DEPLOY,
} from '../core/constants';
import { deployWeb } from '../sdk-webpack';
import { executeTask } from '../core/engineManager';

export const taskRnvDeploy = async (c, parentTask, originTask) => {
    logTask('taskRnvDeploy', `parent:${parentTask}`);

    const { platform } = c;

    await executeTask(c, TASK_EXPORT, TASK_DEPLOY, originTask);

    switch (platform) {
        case WEB:
            return deployWeb(c, platform);
        case CHROMECAST:
            return deployWeb(c, platform);
        default:
            logErrorPlatform(c);
    }
};

export default {
    description: '',
    fn: taskRnvDeploy,
    task: 'deploy',
    params: [],
    platforms: [
        WEB,
        TIZEN,
        WEBOS,
        TIZEN_MOBILE,
        TIZEN_WATCH,
        KAIOS,
        FIREFOX_OS,
        FIREFOX_TV,
        CHROMECAST,
    ],
};