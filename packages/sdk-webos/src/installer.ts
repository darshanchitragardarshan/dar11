import path from 'path';
import {
    WEBOS,
    isSystemWin,
    getRealPath,
    writeFileSync,
    fsExistsSync,
    chalk,
    logTask,
    logWarning,
    logSuccess,
    logError,
    logInfo,
    generateBuildConfig,
    RnvContext,
    inquirerPrompt,
} from '@rnv/core';

import {
    CLI_WEBOS_ARES,
    CLI_WEBOS_ARES_PACKAGE,
    CLI_WEBOS_ARES_INSTALL,
    CLI_WEBOS_ARES_LAUNCH,
    CLI_WEBOS_ARES_NOVACOM,
    CLI_WEBOS_ARES_SETUP_DEVICE,
    CLI_WEBOS_ARES_DEVICE_INFO,
} from './constants';

const SDK_LOCATIONS = [path.join('/opt/webOS_TV_SDK'), path.join('C:\\webOS_TV_SDK')];

const _logSdkWarning = (c: RnvContext) => {
    logWarning(`Your ${c.paths.workspace.config} is missing SDK configuration object`);
};

export const checkAndConfigureWebosSdks = async (c: RnvContext) => {
    logTask(`checkAndConfigureWebosSdks:${c.platform}`);
    const sdk = c.buildConfig?.sdks?.WEBOS_SDK;
    if (sdk) {
        c.cli[CLI_WEBOS_ARES] = getRealPath(c, path.join(sdk, `CLI/bin/ares${isSystemWin ? '.cmd' : ''}`));
        c.cli[CLI_WEBOS_ARES_PACKAGE] = getRealPath(
            c,
            path.join(sdk, `CLI/bin/ares-package${isSystemWin ? '.cmd' : ''}`)
        );
        c.cli[CLI_WEBOS_ARES_INSTALL] = getRealPath(
            c,
            path.join(sdk, `CLI/bin/ares-install${isSystemWin ? '.cmd' : ''}`)
        );
        c.cli[CLI_WEBOS_ARES_LAUNCH] = getRealPath(
            c,
            path.join(sdk, `CLI/bin/ares-launch${isSystemWin ? '.cmd' : ''}`)
        );
        c.cli[CLI_WEBOS_ARES_SETUP_DEVICE] = getRealPath(
            c,
            path.join(sdk, `CLI/bin/ares-setup-device${isSystemWin ? '.cmd' : ''}`)
        );
        c.cli[CLI_WEBOS_ARES_DEVICE_INFO] = getRealPath(
            c,
            path.join(sdk, `CLI/bin/ares-device-info${isSystemWin ? '.cmd' : ''}`)
        );
        c.cli[CLI_WEBOS_ARES_NOVACOM] = getRealPath(
            c,
            path.join(sdk, `CLI/bin/ares-novacom${isSystemWin ? '.cmd' : ''}`)
        );
    } else {
        _logSdkWarning(c);
    }
};

const _getCurrentSdkPath = (c: RnvContext) => (c.platform ? c.buildConfig?.sdks?.WEBOS_SDK : undefined);

const _isSdkInstalled = (c: RnvContext) => {
    logTask('_isSdkInstalled');

    if (!c.platform) return;

    const sdkPath = _getCurrentSdkPath(c);

    return fsExistsSync(getRealPath(c, sdkPath));
};

const _attemptAutoFix = async (c: RnvContext) => {
    logTask('_attemptAutoFix');

    if (c.program.hosted) {
        logInfo('HOSTED Mode. Skipping SDK checks');
        return true;
    }

    const result = SDK_LOCATIONS.find((v) => fsExistsSync(v));

    if (result) {
        logSuccess(`Found existing ${c.platform} SDK location at ${chalk().white(result)}`);
        let confirmSdk = true;
        if (!c.program.ci) {
            const { confirm } = await inquirerPrompt({
                type: 'confirm',
                name: 'confirm',
                message: 'Do you want to use it?',
            });
            confirmSdk = confirm;
        }

        if (confirmSdk) {
            const cnf = c.files.workspace.config;
            if (!cnf) return false;
            try {
                if (!cnf.sdks) cnf.sdks = {};
                cnf.sdks.WEBOS_SDK = result;
                writeFileSync(c.paths.workspace.config, cnf);
                generateBuildConfig(c);
                await checkAndConfigureWebosSdks(c);
            } catch (e) {
                logError(e);
            }

            return true;
        }
    }

    logTask(`_attemptAutoFix: no sdks found. searched at: ${SDK_LOCATIONS.join(', ')}`);

    // const setupInstance = PlatformSetup(c);
    // await setupInstance.askToInstallSDK(sdkPlatform);
    generateBuildConfig(c);
    return true;
};

export const checkWebosSdk = async (c: RnvContext) => {
    logTask('checkWebosSdk');
    if (!_isSdkInstalled(c)) {
        logWarning(
            `${c.platform} requires SDK to be installed. Your SDK path in ${chalk().white(
                c.paths.workspace.config
            )} does not exist: ${chalk().white(_getCurrentSdkPath(c))}`
        );

        switch (c.platform) {
            case WEBOS:
                return _attemptAutoFix(c);
            default:
                return true;
        }
    }
    return true;
};
