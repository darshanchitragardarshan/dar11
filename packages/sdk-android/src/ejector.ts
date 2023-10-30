import path from 'path';
import { Common, FileUtils, PluginManager, ProjectManager, Resolver } from 'rnv';
// import { logWarning } from 'rnv/dist/core/systemManager/logger';

const {
  fsExistsSync,
  copyFileSync,
  fsWriteFileSync,
  fsReadFileSync,
  copyFolderContentsRecursiveSync,
  // cleanEmptyFoldersRecursively,
  fsMkdirSync
} = FileUtils;
const {
  getAppFolder,
  getConfigProp,
  getAppVersionCode,
  getAppVersion
} = Common;
const { doResolvePath } = Resolver;

const {
  parseFonts
} = ProjectManager;

const {
  parsePlugins,
  // sanitizePluginPath, includesPluginPath
} = PluginManager;

export const ejectGradleProject = async (c: any) => {
  const isMonorepo = getConfigProp(c, c.platform, 'isMonorepo');
  const monoRoot = getConfigProp(c, c.platform, 'monoRoot');

  const rootMonoProjectPath = isMonorepo
    ? path.join(c.paths.project.dir, monoRoot || '../..')
    : c.paths.project.dir;
  const rootProjectPath = c.paths.project.dir;

  const appFolder = path.join(getAppFolder(c), '..');

  //= ==========
  // settings.gradle
  //= ==========
  const settingsGradlePath = path.join(appFolder, 'android', 'settings.gradle');

  if (fsExistsSync(settingsGradlePath)) {
    const setGradleAsString = fsReadFileSync(settingsGradlePath).toString();

    const pathRnMatch = `${path.join(
      rootMonoProjectPath,
      'node_modules',
      'react-native'
    )}/`;
    // eslint-disable-next-line no-template-curly-in-string
    const pathRnReplace = '../node_modules/react-native/';

    const pathNmMatch = `${path.join(rootMonoProjectPath, 'node_modules')}/`;
    // eslint-disable-next-line no-template-curly-in-string
    const pathNmReplace = '../node_modules/';

    const packagesPathMatch = new RegExp(
      `${path
        .join(rootMonoProjectPath, "packages")
        .replace(/[\/\\^$*+?.()|[\]{}]/g, "\\$&")}\/.+?\/node_modules\/`,
      "g"
    );

    const sanitised = setGradleAsString
      .replaceAll(pathRnMatch, pathRnReplace)
      .replaceAll(pathNmMatch, pathNmReplace)
      .replaceAll(packagesPathMatch, pathNmReplace);

    fsWriteFileSync(settingsGradlePath, sanitised);
  }

  //= ==========
  // keystore.properties
  //= ==========
  const keystorePropPath = path.join(
    appFolder,
    'android',
    'keystore.properties'
  );

  if (fsExistsSync(keystorePropPath)) {
    const objAsString = fsReadFileSync(keystorePropPath).toString();

    let sanitised = '';
    const objAsArr = objAsString.split('\n');

    objAsArr.forEach((v: string) => {
      if (v.includes('storeFile=')) {
        sanitised += '\nstoreFile=release.keystore';
      } else {
        sanitised += `\n${v}`;
      }
    });

    fsWriteFileSync(keystorePropPath, sanitised);
  }

  //= ==========
  // build.gradle
  //= ==========
  const buildGradlePath = path.join(appFolder, 'android', 'build.gradle');

  if (fsExistsSync(buildGradlePath)) {
    const buildGradleAsString = fsReadFileSync(buildGradlePath).toString();

    const pathRnMatch = `${path.join(
      rootMonoProjectPath,
      'node_modules',
      'react-native'
    )}/`;
    // eslint-disable-next-line no-template-curly-in-string
    const pathRnReplace = '../node_modules/react-native/';

    const pathNmMatch = `${path.join(rootMonoProjectPath, 'node_modules')}/`;
    // eslint-disable-next-line no-template-curly-in-string
    const pathNmReplace = '../node_modules/';

    const match1 =
      '"${project.rootDir}/../../../../node_modules/react-native-v8/dist"';
    const replace1 =
      '= uri("${project.getRootDir()}/../node_modules/react-native-v8/dist")';

    const match2 = `url("${rootMonoProjectPath}/node_modules/react-native-v8/dist")`;
    const replace2 = 'url = uri("${project.getRootDir()}/../node_modules/react-native-v8/dist")';

    const match3 = `url("${rootMonoProjectPath}/node_modules/v8-android/dist")`;
    const replace3 = 'url = uri("${project.getRootDir()}/../node_modules/v8-android/dist")';


    const sanitised = buildGradleAsString
      .replaceAll(match2, replace2)
      .replaceAll(match3, replace3)
      .replaceAll(pathRnMatch, pathRnReplace)
      .replaceAll(pathNmMatch, pathNmReplace)
      .replaceAll(match1, replace1);

    fsWriteFileSync(buildGradlePath, sanitised);
  }


  //= ==========
  // gradle.properties
  //= ==========
  const gradlePropertiesPath = path.join(appFolder, 'android', 'gradle.properties');

  if (fsExistsSync(gradlePropertiesPath)) {
    let gradlePropertiesAsString = fsReadFileSync(gradlePropertiesPath).toString();

    gradlePropertiesAsString += `versionCode=${getAppVersionCode(c, c.platform)} \nversionName=${getAppVersion(c, c.platform)}`

    fsWriteFileSync(gradlePropertiesPath, gradlePropertiesAsString);
  }

  //= ==========
  // Plugins
  //= ==========

  const afterEvaluateFix: Array<{ match: string; replace: string }> = [];

  parsePlugins(c, c.platform, (_plugin: any, pluginPlat: any, key: string) => {
    const pluginPath = doResolvePath(key);
    const extensionsFilter = [
      '.java',
      '.gradle',
      'gradle.properties',
      '.xml',
      '.png',
      'eventtusicons',
      'emojioneandroid',
      '.jar',
      '.kt',
    ];
    // const excludeFolders = ['node_modules', 'android'];

    if (pluginPlat.afterEvaluate) {
      pluginPlat.afterEvaluate.forEach((v: any) => {
        afterEvaluateFix.push({
          match: v.replace('{{PLUGIN_ROOT}}', pluginPath),
          replace: v.replace('{{PLUGIN_ROOT}}', `../../node_modules/${key}`),
        });
      });
      // {{PLUGIN_ROOT}}
      // afterEvaluateFix = afterEvaluateFix.concat()
    }

    const destPath = path.join(appFolder, 'node_modules', key);
    copyFolderContentsRecursiveSync(
      pluginPath,
      destPath,
      false,
      null,
      false,
      null,
      null,
      c,
      extensionsFilter
    );
    copyFileSync(
      path.join(pluginPath, 'package.json'),
      path.join(destPath, 'package.json')
    );
  });

  //= ==========
  // app/build.gradle
  //= ==========
  const appBuildGradlePath = path.join(
    appFolder,
    'android/app',
    'build.gradle'
  );

  if (fsExistsSync(settingsGradlePath)) {
    const setGradleAsString = fsReadFileSync(appBuildGradlePath).toString();

    const pathRnMatch = `${path.join(
      rootMonoProjectPath,
      'node_modules',
      'react-native'
    )}/`;
    // eslint-disable-next-line no-template-curly-in-string
    const pathRnReplace = '../../node_modules/react-native/';

    const pathNmMatch = `${path.join(rootMonoProjectPath, 'node_modules')}/`;
    // eslint-disable-next-line no-template-curly-in-string
    const pathNmReplace = '../../node_modules/';

    const match1 = 'root: "../../../"';
    const replace1 = 'root: "../.."';

    const match2 = 'cliPath: "node_modules/react-native/cli.js",';
    const replace2 = '';

    const packagesPathMatch = new RegExp(
      `${path
        .join(rootMonoProjectPath, "packages")
        .replace(/[\/\\^$*+?.()|[\]{}]/g, "\\$&")}\/.+?\/node_modules\/`,
      "g"
    );

    const sanitised = setGradleAsString
      .replaceAll(pathRnMatch, pathRnReplace)
      .replaceAll(pathNmMatch, pathNmReplace)
      .replaceAll(match1, replace1)
      .replaceAll(match2, replace2)
      .replaceAll(packagesPathMatch, pathNmReplace);

    fsWriteFileSync(appBuildGradlePath, sanitised);
  }

  // console.log('EJECTOR', rootMonoProjectPath, rootProjectPath, appFolder);
};
