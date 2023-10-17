import path from 'path';
import dotenv from 'dotenv';
import {
    RnvContext,
    fsExistsSync,
    fsWriteFileSync,
    fsReadFileSync,
    executeAsync,
    getAppFolder,
    getConfigProp,
    chalk,
    logInfo,
    logTask,
    PARAMS,
    WEB,
    inquirerPrompt,
} from '@rnv/core';

const _runDeploymentTask = (c: RnvContext, nowConfigPath: string) =>
    new Promise<void>((resolve, reject) => {
        dotenv.config();
        const defaultBuildFolder = path.join(getAppFolder(c), c.platform?.includes('next') ? 'out' : 'public');
        const params = [defaultBuildFolder, '-A', nowConfigPath];
        if (process.env.NOW_TOKEN) params.push('-t', process.env.NOW_TOKEN);
        const nowIsProduction = getConfigProp(c, c.platform, 'custom').nowIsProduction === true;

        if (nowIsProduction) params.push('--prod');

        executeAsync(c, `now ${params.join(' ')}`, { interactive: true })
            .then(() => resolve())
            .catch((error) => reject(error));
    });

const _createConfigFiles = async (
    configFilePath: string,
    envConfigPath: string,
    nowParamsExists = false,
    _envContent = ''
) => {
    let envContent = _envContent;
    if (!fsExistsSync(configFilePath)) {
        const content = { public: true, version: 2, name: '' };
        logInfo(`${chalk().white('now.json')} file does not exist. Creating one for you`);

        const { name } = await inquirerPrompt({
            type: 'input',
            name: 'name',
            message: 'What is your project name?',
            validate: (i) => !!i || 'Please enter a name',
        });

        content.name = name;

        if (!nowParamsExists) {
            const { token } = await inquirerPrompt({
                type: 'input',
                name: 'token',
                message: 'Do you have now token? If no leave empty and you will be asked to create one',
            });
            if (token) {
                envContent += `NOW_TOKEN=${token}\n`;
                fsWriteFileSync(envConfigPath, envContent);
            }
            return fsWriteFileSync(configFilePath, JSON.stringify(content, null, 2));
        }
        return fsWriteFileSync(configFilePath, JSON.stringify(content, null, 2));
    }
};

export const taskRnvVercelDeploy = async (c: RnvContext) => {
    logTask('taskRnvVercelDeploy');

    const nowConfigPath = path.resolve(c.paths.project.dir, 'configs', `now.${c.platform}.json`);
    const envConfigPath = path.resolve(c.paths.project.dir, '.env');

    let envContent;
    try {
        envContent = fsReadFileSync(envConfigPath).toString();
    } catch (err) {
        envContent = '';
    }

    let matched = false;
    envContent
        .split('\n')
        .map((line) => line.split('='))
        .forEach(([key]) => {
            if (['NOW_TOKEN'].indexOf(key) > -1) {
                matched = true;
            }
        });

    await _createConfigFiles(nowConfigPath, envConfigPath, matched, envContent);
    await _runDeploymentTask(c, nowConfigPath);
};

export default {
    description: 'Deploys your project to vcercel',
    fn: taskRnvVercelDeploy,
    task: 'vercel deploy',
    params: PARAMS.withBase(),
    platforms: [WEB],
};
