import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import shell from 'shelljs';
import child_process from 'child_process';
import { executeAsync, execShellAsync, execCLI } from '../exec';
import { createPlatformBuild } from '../cli/platform';
import {
    isPlatformSupported, getConfig, logTask, logComplete, logError,
    getAppFolder, isPlatformActive, configureIfRequired,
    CLI_ANDROID_EMULATOR, CLI_ANDROID_ADB, CLI_TIZEN_EMULATOR, CLI_TIZEN, CLI_WEBOS_ARES,
    CLI_WEBOS_ARES_PACKAGE, CLI_WEBBOS_ARES_INSTALL, CLI_WEBBOS_ARES_LAUNCH,
    getAppVersion, getAppTitle, getAppVersionCode, writeCleanFile, getAppId, getAppTemplateFolder,
    getEntryFile, logWarning, logDebug,
} from '../common';
import { cleanFolder, copyFolderContentsRecursiveSync, copyFolderRecursiveSync, copyFileSync, mkdirSync } from '../fileutils';


function launchAndroidSimulator(c, name) {
    logTask('launchAndroidSimulator');

    if (name) {
        return execCLI(c, CLI_ANDROID_EMULATOR, `-avd "${name}"`);
    }
    return Promise.reject('No simulator -t target name specified!');
}

const EMU_KEYS = ['emulator-', 'product:', 'model:', 'device:'];
const listAndroidTargets = c => new Promise((resolve, reject) => {
    logTask('listAndroidTargets');

    const ch = child_process.spawn('adb', ['devices', '-l'], { stdio: 'pipe', detached: true });
    ch.stdout.on('data', (data) => {
        const d = data.toString().match(/[^\r?\n]+/g);
        d.shift();
        const output = [];
        d.forEach((v) => {
            const obj = {
                status: 'active',
            };
            const vArr = v.split(' ');
            vArr.forEach((i) => {
                EMU_KEYS.forEach((ek) => {
                    if (i.startsWith(ek)) {
                        const key = ek.replace(/-/g, '').replace(/:/g, '');
                        obj[key] = i.split(ek)[1];
                    }
                });
            });
            output.push(obj);
        });
        resolve(output);
    });
    ch.stderr.on('data', (data) => {
        log(`stderr: ${data}`);
        reject(data);
    });
});

const copyAndroidAssets = (c, platform) => new Promise((resolve, reject) => {
    logTask('copyAndroidAssets');
    if (!isPlatformActive(c, platform, resolve)) return;

    const destPath = path.join(getAppFolder(c, platform), 'app/src/main/res');
    const sourcePath = path.join(c.appConfigFolder, `assets/${platform}/res`);
    copyFolderContentsRecursiveSync(sourcePath, destPath);
    resolve();
});

const packageAndroid = (c, platform) => new Promise((resolve, reject) => {
    logTask('packageAndroid');

    const appFolder = getAppFolder(c, platform);
    executeAsync('react-native', [
        'bundle',
        '--platform',
        'android',
        '--dev',
        'false',
        '--assets-dest',
        `${appFolder}/app/src/main/res`,
        '--entry-file',
        `${c.appConfigFile.platforms[platform].entryFile}.js`,
        '--bundle-output',
        `${appFolder}/app/src/main/assets/index.android.bundle`,
    ]).then(() => resolve()).catch(e => reject(e));
});

const runAndroid = (c, platform, target) => new Promise((resolve, reject) => {
    logTask(`runAndroid:${platform}:${target}`);


    const appFolder = getAppFolder(c, platform);

    shell.cd(`${appFolder}`);
    shell.exec('./gradlew appStart', resolve, (e) => {
        logError(e);
    });
});

const buildAndroid = (c, platform) => new Promise((resolve, reject) => {
    logTask(`buildAndroid:${platform}`);


    const appFolder = getAppFolder(c, platform);

    shell.cd(`${appFolder}`);
    shell.exec('./gradlew assembleRelease -x bundleReleaseJsAndAssets', resolve, (e) => {
        logError(e);
    });
});

const configureAndroidProperties = c => new Promise((resolve, reject) => {
    logTask('configureAndroidProperties');

    const localProperties = path.join(c.globalConfigFolder, 'local.properties');
    if (fs.existsSync(localProperties)) {
        console.log('local.properties file exists!');
    } else {
        console.log('local.properties file missing! Creating one for you...');
    }

    fs.writeFileSync(localProperties, `#Generated by RNV
ndk.dir=${c.globalConfig.sdks.ANDROID_NDK}
sdk.dir=${c.globalConfig.sdks.ANDROID_SDK}`);

    resolve();
});

const configureGradleProject = (c, platform) => new Promise((resolve, reject) => {
    logTask(`configureGradleProject:${platform}`);

    if (!isPlatformActive(c, platform, resolve)) return;

    // configureIfRequired(c, platform)
    //     .then(() => configureAndroidProperties(c, platform))
    configureAndroidProperties(c, platform)
        .then(() => copyAndroidAssets(c, platform))
        .then(() => configureProject(c, platform))
        .then(() => resolve())
        .catch(e => reject(e));
});

const _injectPlugin = (c, plugin, key, pkg, pluginConfig) => {
    const className = pkg ? pkg.split('.').pop() : null;
    let packageParams = '';
    if (plugin.packageParams) {
        packageParams = plugin.packageParams.join(',');
    }
    const pathFixed = plugin.path ? `${plugin.path}` : `node_modules/${key}/android`;
    const modulePath = `../../${pathFixed}`;
    if (plugin.projectName) {
        pluginConfig.pluginIncludes += `, ':${plugin.projectName}'`;
        pluginConfig.pluginPaths += `project(':${plugin.projectName}').projectDir = new File(rootProject.projectDir, '${modulePath}')\n`;
        if (!plugin.skipImplementation) {
            if (plugin.implementation) {
                pluginConfig.pluginImplementations += `${plugin.implementation}`;
            } else {
                pluginConfig.pluginImplementations += `    implementation project(':${plugin.projectName}')\n`;
            }
        }
    } else {
        pluginConfig.pluginIncludes += `, ':${key}'`;
        pluginConfig.pluginPaths += `project(':${key}').projectDir = new File(rootProject.projectDir, '${modulePath}')\n`;
        if (!plugin.skipImplementation) {
            if (plugin.implementation) {
                pluginConfig.pluginImplementations += `${plugin.implementation}`;
            } else {
                pluginConfig.pluginImplementations += `    implementation project(':${key}')\n`;
            }
        }
    }
    if (pkg) pluginConfig.pluginImports += `import ${pkg}\n`;
    if (className) pluginConfig.pluginPackages += `${className}(${packageParams}),\n`;

    if (plugin.implementations) {
        plugin.implementations.forEach((v) => {
            pluginConfig.pluginImplementations += `    implementation '${v}'\n`;
        });
    }

    if (plugin.afterEvaluate) {
        plugin.afterEvaluate.forEach((v) => {
            pluginConfig.pluginAfterEvaluate += ` ${v}\n`;
        });
    }
    _fixAndroidLegacy(c, pathFixed);
};

const _fixAndroidLegacy = (c, modulePath) => {
    const buildGradle = path.join(c.projectRootFolder, modulePath, 'build.gradle');

    if (fs.existsSync(buildGradle)) {
        logDebug('FIX:', buildGradle);
        writeCleanFile(buildGradle, buildGradle,
            [
                { pattern: ' compile \'', override: '  implementation \'' },
                { pattern: ' compile "', override: '  implementation "' },
                { pattern: ' testCompile "', override: '  testImplementation "' },
                { pattern: ' provided \'', override: '  compileOnly \'' },
                { pattern: ' provided "', override: '  compileOnly "' },
                { pattern: ' compile fileTree', override: '  implementation fileTree' },
            ]);
    }
};

const configureProject = (c, platform) => new Promise((resolve, reject) => {
    logTask(`configureProject:${platform}`);

    const appFolder = getAppFolder(c, platform);
    const appTemplateFolder = getAppTemplateFolder(c, platform);

    const gradlew = path.join(appFolder, 'gradlew');

    if (!fs.existsSync(gradlew)) {
        logWarning(`Looks like your ${chalk.white(platform)} platformBuild is misconfigured!. let's repair it.`);
        createPlatformBuild(c, platform)
            .then(() => configureGradleProject(c, platform))
            .then(() => resolve(c))
            .catch(e => reject(e));
        return;
    }

    copyFileSync(path.join(c.globalConfigFolder, 'local.properties'), path.join(appFolder, 'local.properties'));
    mkdirSync(path.join(appFolder, 'app/src/main/assets'));
    fs.writeFileSync(path.join(appFolder, 'app/src/main/assets/index.android.bundle'), '{}');
    fs.chmodSync(gradlew, '755');

    const pluginIncludes = 'include \':app\'';
    const pluginPaths = '';
    const pluginImports = '';
    const pluginPackages = 'MainReactPackage(),\n';
    const pluginImplementations = '';
    const pluginAfterEvaluate = '';
    const pluginConfig = {
        pluginIncludes, pluginPaths, pluginImports, pluginPackages, pluginImplementations, pluginAfterEvaluate,
    };
    // PLUGINS
    if (c.appConfigFile && c.pluginConfig) {
        const includedPlugins = c.appConfigFile.common.includedPlugins;
        const excludedPlugins = c.appConfigFile.common.excludedPlugins;
        if (includedPlugins) {
            const plugins = c.pluginConfig.plugins;
            for (const key in plugins) {
                if (includedPlugins.includes('*') || includedPlugins.includes(key)) {
                    const plugin = plugins[key][platform];
                    if (plugin) {
                        if (plugin['no-active'] !== true) {
                            if (plugin.packages) {
                                plugin.packages.forEach((ppkg) => {
                                    _injectPlugin(c, plugin, key, ppkg, pluginConfig);
                                });
                            } else {
                                _injectPlugin(c, plugin, key, plugin.package, pluginConfig);
                            }
                        }
                    }
                }
            }
        }
    }
    pluginConfig.pluginPackages = pluginConfig.pluginPackages.substring(0, pluginConfig.pluginPackages.length - 2);

    // FONTS
    if (c.appConfigFile) {
        if (fs.existsSync(c.fontsConfigFolder)) {
            fs.readdirSync(c.fontsConfigFolder).forEach((font) => {
                if (font.includes('.ttf') || font.includes('.otf')) {
                    const key = font.split('.')[0];
                    const includedFonts = c.appConfigFile.common.includedFonts;
                    if (includedFonts) {
                        if (includedFonts.includes('*') || includedFonts.includes(key)) {
                            if (font) {
                                const fontSource = path.join(c.projectConfigFolder, 'fonts', font);
                                if (fs.existsSync(fontSource)) {
                                    const fontFolder = path.join(appFolder, 'app/src/main/assets/fonts');
                                    mkdirSync(fontFolder);
                                    const fontDest = path.join(fontFolder, font);
                                    copyFileSync(fontSource, fontDest);
                                } else {
                                    logWarning(`Font ${chalk.white(fontSource)} doesn't exist! Skipping.`);
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    writeCleanFile(path.join(appTemplateFolder, 'settings.gradle'),
        path.join(appFolder, 'settings.gradle'),
        [
            { pattern: '{{PLUGIN_INCLUDES}}', override: pluginConfig.pluginIncludes },
            { pattern: '{{PLUGIN_PATHS}}', override: pluginConfig.pluginPaths },
        ]);

    writeCleanFile(path.join(appTemplateFolder, 'app/build.gradle'),
        path.join(appFolder, 'app/build.gradle'),
        [
            { pattern: '{{APPLICATION_ID}}', override: getAppId(c, platform) },
            { pattern: '{{VERSION_CODE}}', override: getAppVersionCode(c, platform) },
            { pattern: '{{VERSION_NAME}}', override: getAppVersion(c, platform) },
            { pattern: '{{PLUGIN_IMPLEMENTATIONS}}', override: pluginConfig.pluginImplementations },
            { pattern: '{{PLUGIN_AFTER_EVALUATE}}', override: pluginConfig.pluginAfterEvaluate },
        ]);

    const activityPath = 'app/src/main/java/rnv/MainActivity.kt';
    writeCleanFile(path.join(appTemplateFolder, activityPath),
        path.join(appFolder, activityPath),
        [
            { pattern: '{{APPLICATION_ID}}', override: getAppId(c, platform) },
        ]);

    const applicationPath = 'app/src/main/java/rnv/MainApplication.kt';
    writeCleanFile(path.join(appTemplateFolder, applicationPath),
        path.join(appFolder, applicationPath),
        [
            { pattern: '{{APPLICATION_ID}}', override: getAppId(c, platform) },
            { pattern: '{{ENTRY_FILE}}', override: getEntryFile(c, platform) },
            { pattern: '{{PLUGIN_IMPORTS}}', override: pluginConfig.pluginImports },
            { pattern: '{{PLUGIN_PACKAGES}}', override: pluginConfig.pluginPackages },
        ]);

    const splashPath = 'app/src/main/java/rnv/SplashActivity.kt';
    writeCleanFile(path.join(appTemplateFolder, splashPath),
        path.join(appFolder, splashPath),
        [
            { pattern: '{{APPLICATION_ID}}', override: getAppId(c, platform) },
        ]);

    const stringsPath = 'app/src/main/res/values/strings.xml';
    writeCleanFile(path.join(appTemplateFolder, stringsPath),
        path.join(appFolder, stringsPath),
        [
            { pattern: '{{APP_TITLE}}', override: getAppTitle(c, platform) },
        ]);

    let prms = '';
    const permissions = c.appConfigFile.platforms[platform].permissions;
    if (permissions) {
        permissions.forEach((v) => {
            if (c.permissionsConfig) {
                const plat = c.permissionsConfig.permissions[platform] ? platform : 'ios';
                const pc = c.permissionsConfig.permissions[plat];
                if (pc[v]) {
                    prms += `\n<uses-permission android:name="${pc[v].key}" />`;
                }
            }
        });
    }

    const manifestFile = 'app/src/main/AndroidManifest.xml';
    writeCleanFile(path.join(appTemplateFolder, manifestFile),
        path.join(appFolder, manifestFile),
        [
            { pattern: '{{APPLICATION_ID}}', override: getAppId(c, platform) },
            { pattern: '{{PERMISIONS}}', override: prms },
        ]);


    // RELEASE CONFIGS
    let releaseConfig = '';
    const globalAppConfigPath = path.join(c.globalConfigFolder, c.appConfigFile.id);
    if (fs.existsSync(globalAppConfigPath)) {
        const releaseConfigValue = fs.readFileSync(path.join(globalAppConfigPath, 'gradle.properties')).toString();
        releaseConfig = `ext {
  RELEASE_STORE_FILE="${path.join(globalAppConfigPath, 'release.keystore')}"
  ${releaseConfigValue}
  }`;
    } else {
        logWarning(`You're missing global keystore path for this app: ${chalk.white(globalAppConfigPath)}. You won't be able to make releases without it!`);
    }
    fs.writeFileSync(path.join(appFolder, 'app/release-configs.gradle'), releaseConfig);

    resolve();
});

export {
    copyAndroidAssets, configureGradleProject, launchAndroidSimulator, buildAndroid,
    listAndroidTargets, packageAndroid, runAndroid, configureAndroidProperties,
};
