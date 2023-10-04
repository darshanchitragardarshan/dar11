import path from 'path';
import { copyFileSync, fixPackageObject, fsExistsSync, readObjectSync, writeFileSync } from '@rnv/core';
import fs from 'fs';
// import { setPackageVersions } from '@flexn/build-hooks-version';

const merge = require('deepmerge');

const VERSIONED_PACKAGES = [
    'rnv',
    'core',
    'build-hooks-git',
    'cli',
    'template-starter',
    'engine-core',
    'engine-rn',
    'engine-rn-tvos',
    'engine-rn-macos',
    'engine-rn-next',
    'engine-rn-web',
    'engine-lightning',
    'engine-rn-electron',
    'engine-rn-windows',
    'sdk-apple',
    'sdk-android',
    'sdk-webpack',
    'sdk-react-native',
    'sdk-kaios',
    'sdk-tizen',
    'sdk-webos',
    'renative',
];

const setPackageVersions = (c, version, versionedPackages) => {
    var v = {
        version: version,
    };
    const pkgFolder = path.join(c.paths.project.dir, 'packages');
    _updateJson(c.paths.project.package, v);
    versionedPackages.forEach(function (pkgName) {
        _updateJson(path.join(pkgFolder, pkgName, 'package.json'), v);
    });
};

const updateDeps = (pkgConfig, depKey, packageNamesAll, packageConfigs, semVer = '') => {
    const { pkgFile, rnvFile } = pkgConfig;

    packageNamesAll.forEach((v) => {
        if (pkgFile) {
            let hasChanges = false;
            const currVer = pkgFile?.[depKey]?.[v];
            if (currVer) {
                const newVer = `${semVer}${packageConfigs[v].pkgFile?.version}`;

                if (currVer !== newVer) {
                    console.log('Found linked dependency to update:', v, currVer, newVer);
                    hasChanges = true;
                    pkgFile[depKey][v] = newVer;
                }
            }
            if (hasChanges) {
                const output = fixPackageObject(pkgFile);
                writeFileSync(pkgConfig.pkgPath, output, 4, true);
            }
        }
        if (rnvFile) {
            let hasRnvChanges = false;
            const templateVer = rnvFile?.templates?.[v]?.version;
            if (templateVer) {
                const newVer = `${semVer}${packageConfigs[v].pkgFile?.version}`;
                if (templateVer !== newVer) {
                    console.log('Found linked plugin dependency to update:', v, templateVer, newVer);
                    hasRnvChanges = true;
                    rnvFile.templates[v].version = newVer;
                }
            }
            if (hasRnvChanges) {
                const output = fixPackageObject(rnvFile);
                writeFileSync(pkgConfig.rnvPath, output, 4, true);
            }
        }
    });
};

export const prePublish = async (c) => {
    const v = {
        version: c.files.project.package.version,
    };
    await setPackageVersions(c, v.version, VERSIONED_PACKAGES);

    const pkgDirPath = path.join(c.paths.project.dir, 'packages');

    _updateJson(path.join(pkgDirPath, 'rnv/pluginTemplates/renative.plugins.json'), {
        pluginTemplates: {
            '@rnv/renative': v,
        },
    });

    _updateJson(path.join(pkgDirPath, 'rnv/coreTemplateFiles/renative.templates.json'), {
        engineTemplates: {
            '@rnv/engine-rn': v,
            '@rnv/engine-rn-tvos': v,
            '@rnv/engine-rn-web': v,
            '@rnv/engine-rn-next': v,
            '@rnv/engine-rn-electron': v,
            '@rnv/engine-lightning': v,
            '@rnv/engine-rn-macos': v,
            '@rnv/engine-rn-windows': v,
        },
    });

    const dirs = fs.readdirSync(pkgDirPath);

    const packageNamesAll = [];
    const packageConfigs = {};

    const parsePackages = (dirPath) => {
        let pkgName;
        let rnvPath;
        let _pkgPath;
        let rnvFile;
        let pkgFile;

        if (fs.statSync(dirPath).isDirectory()) {
            _pkgPath = path.join(dirPath, 'package.json');
            if (fsExistsSync(_pkgPath)) {
                pkgFile = readObjectSync(_pkgPath);
                pkgName = pkgFile.name;
            }
            const _rnvPath = path.join(dirPath, 'renative.json');
            if (fsExistsSync(_rnvPath)) {
                rnvPath = _rnvPath;
                rnvFile = readObjectSync(rnvPath);
            }
        }
        packageConfigs[pkgName] = {
            pkgName,
            rnvPath,
            pkgPath: _pkgPath,
            pkgFile,
            rnvFile,
        };
        packageNamesAll.push(pkgName);
    };

    parsePackages(c.paths.project.dir);

    dirs.forEach((dir) => {
        parsePackages(path.join(pkgDirPath, dir));
    });

    packageNamesAll.forEach((pkgName) => {
        const pkgConfig = packageConfigs[pkgName];
        updateDeps(pkgConfig, 'dependencies', packageNamesAll, packageConfigs);
        updateDeps(pkgConfig, 'devDependencies', packageNamesAll, packageConfigs);
        updateDeps(pkgConfig, 'optionalDependencies', packageNamesAll, packageConfigs);
        updateDeps(pkgConfig, 'peerDependencies', packageNamesAll, packageConfigs, '^');
    });

    copyFileSync(path.join(c.paths.project.dir, 'README.md'), path.join(pkgDirPath, 'renative/README.md'));
    copyFileSync(path.join(c.paths.project.dir, 'README.md'), path.join(pkgDirPath, 'renative/README.md'));
    copyFileSync(path.join(c.paths.project.dir, 'README.md'), path.join(pkgDirPath, 'rnv/README.md'));

    return true;
};

const _updateJson = (pPath, updateObj) => {
    const pObj = readObjectSync(pPath);

    if (!pObj) {
        throw new Error(`_updateJson called with unresolveable package.json path '${pPath}'`);
    }

    let obj;
    if (pObj) {
        obj = merge(pObj, updateObj);
    }
    const output = fixPackageObject(obj);
    writeFileSync(pPath, output, 4, true);
};
