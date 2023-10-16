import { generateEngineExtensions, generateEngineTasks, RnvEngine } from '@rnv/core';
//@ts-ignore
import CNF from '../renative.engine.json';
import taskRnvRun from './tasks/task.rnv.run';
import taskRnvPackage from './tasks/task.rnv.package';
import taskRnvBuild from './tasks/task.rnv.build';
import taskRnvConfigure from './tasks/task.rnv.configure';
import taskRnvStart from './tasks/task.rnv.start';
import taskRnvExport from './tasks/task.rnv.export';
import taskRnvDeploy from './tasks/task.rnv.deploy';
import taskRnvDebug from './tasks/task.rnv.debug';

const Engine: RnvEngine = {
    // initializeRuntimeConfig: (c) => Context.initializeConfig(c),
    tasks: generateEngineTasks([
        taskRnvRun,
        taskRnvPackage,
        taskRnvBuild,
        taskRnvConfigure,
        taskRnvStart,
        taskRnvExport,
        taskRnvDeploy,
        taskRnvDebug,
    ]),
    config: CNF,
    projectDirName: '',
    serverDirName: '',
    runtimeExtraProps: {},
    platforms: {
        web: {
            defaultPort: 8080,
            isWebHosted: true,
            extensions: generateEngineExtensions(['web.browser', 'browser', 'browser.web', 'web'], CNF),
        },
        chromecast: {
            defaultPort: 8095,
            isWebHosted: true,
            extensions: generateEngineExtensions(['chromecast.tv', 'web.tv', 'tv', 'chromecast', 'tv.web', 'web'], CNF),
        },
        tizen: {
            defaultPort: 8087,
            isWebHosted: true,
            extensions: generateEngineExtensions(['tizen.tv', 'web.tv', 'tv', 'tizen', 'tv.web', 'web'], CNF),
        },
        webtv: {
            defaultPort: 8096,
            isWebHosted: true,
            extensions: generateEngineExtensions(['webtv.tv', 'web.tv', 'tv', 'webtv', 'tv.web', 'web'], CNF),
        },
        tizenmobile: {
            defaultPort: 8091,
            isWebHosted: true,
            extensions: generateEngineExtensions(
                ['tizenmobile.mobile', 'mobile', 'tizenmobile', 'mobile.web', 'native'],
                CNF
            ),
        },
        tizenwatch: {
            defaultPort: 8090,
            isWebHosted: true,
            extensions: generateEngineExtensions(
                ['tizenwatch.watch', 'web.watch', 'watch', 'tizenwatch', 'watch.web', 'web'],
                CNF
            ),
        },
        webos: {
            defaultPort: 8088,
            isWebHosted: true,
            extensions: generateEngineExtensions(['webos.tv', 'web.tv', 'tv', 'webos', 'tv.web', 'web'], CNF),
        },
        kaios: {
            defaultPort: 8093,
            isWebHosted: true,
            extensions: generateEngineExtensions(['kaios.mobile', 'mobile', 'kaios', 'mobile.web', 'native'], CNF),
        },
    },
};

export default Engine;
