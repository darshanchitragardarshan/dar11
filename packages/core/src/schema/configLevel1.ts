import { z } from 'zod';
import {
    AssetSources,
    Author,
    BackgroundColor,
    BundleId,
    Description,
    Engine,
    ExcludedPlugins,
    FontSources,
    IncludedFonts,
    IncludedPermissions,
    IncludedPlugins,
    Platform,
    PortOffset,
    Ports,
    Schemes,
    SplashScreen,
    SupportedPlatforms,
    Targets,
    Template,
    Title,
} from './configLevel2';
import { Ext, PlatformsKeys, Runtime } from './common/configCommon';
import { Plugin } from './configPlugin';
import { PlatformCommon } from './common/configPlatformCommon';

export const CommonBuildSchemes = z.record(z.string(), PlatformCommon);

//LEVEl 1

export const Common = z
    .object({
        buildSchemes: z.optional(CommonBuildSchemes),
        includedPermissions: z.optional(IncludedPermissions),
        id: z.optional(BundleId),
        title: z.optional(Title),
        description: z.optional(Description),
        author: z.optional(Author),
        includedFonts: z.optional(IncludedFonts),
        backgroundColor: z.optional(BackgroundColor),
        splashScreen: z.optional(SplashScreen),
        fontSources: z.optional(FontSources),
        assetSources: z.optional(AssetSources),
        includedPlugins: z.optional(IncludedPlugins),
        excludedPlugins: z.optional(ExcludedPlugins),
        runtime: z.optional(Runtime),
        ext: z.optional(Ext),
    })
    .describe('Common config props used as default props for all available buildSchemes');

export const Defaults = z
    .object({
        ports: Ports,
        supportedPlatforms: SupportedPlatforms,
        portOffset: z.optional(PortOffset),
        schemes: z.optional(Schemes),
        targets: z.optional(Targets),
    })
    .describe('Default system config for this project');

export const Pipes = z
    .array(z.string())
    .describe(
        'To avoid rnv building `buildHooks/src` every time you can specify which specific pipes should trigger recompile of buildHooks'
    );

export const WorkspaceID = z
    .string() //TODO: no spaces
    .describe(
        'Workspace ID your project belongs to. This will mach same folder name in the root of your user directory. ie `~/` on macOS'
    );

export const Version = z.string().describe('Semver style version of your app');

export const VersionCode = z.string().describe('Manual verride of generated version code');

export const VersionFormat = z.string()
    .describe(`Allows you to fine-tune app version defined in package.json or renative.json.

If you do not define versionFormat, no formatting will apply to version.

"versionFormat" : "0.0.0"

IN: 1.2.3-rc.4+build.56 OUT: 1.2.3

IN: 1.2.3 OUT: 1.2.3



"versionFormat" : "0.0.0.0.0"

IN: 1.2.3-rc.4+build.56 OUT: 1.2.3.4.56

IN: 1.2.3 OUT: 1.2.3

"versionFormat" : "0.0.0.x.x.x.x"

IN: 1.2.3-rc.4+build.56 OUT: 1.2.3.rc.4.build.56

IN: 1.2.3 OUT: 1.2.3

`);

export const VersionCodeFormat = z.string().describe(`Allows you to fine-tune auto generated version codes.

Version code is autogenerated from app version defined in package.json or renative.json.

NOTE: If you define versionCode manually this formatting will not apply.

EXAMPLE 1:

default value: 00.00.00

IN: 1.2.3-rc.4+build.56 OUT: 102030456

IN: 1.2.3 OUT: 10203

EXAMPLE 2:

"versionCodeFormat" : "00.00.00.00.00"

IN: 1.2.3-rc.4+build.56 OUT: 102030456

IN: 1.2.3 OUT: 102030000

EXAMPLE 3:

"versionCodeFormat" : "00.00.00.0000"

IN: 1.0.23-rc.15 OUT: 100230015

IN: 1.0.23 OUT: 100230000

`);

export const Id = z
    .string()
    .describe('ID of the app in `./appConfigs/[APP_ID]/renative.json`. MUST match APP_ID name of the folder');

export const IsMonoRepo = z.boolean().describe('Mark if your project is part of monorepo');

export const Templates = z
    .record(z.string(), Template)
    .describe(
        'Stores installed templates info in your project.\n\nNOTE: This prop will be updated by rnv if you run `rnv template install`'
    );

export const CurrentTemplate = z
    .string()
    .describe(
        'Currently active template used in this project. this allows you to re-bootstrap whole project by running `rnv template apply`'
    );

export const Crypto = z
    .object({
        encrypt: z.object({
            dest: z
                .string()
                .describe(
                    'Location of encrypted file in your project used as destination of encryption from your workspace'
                ),
        }),
        decrypt: z.object({
            source: z
                .string()
                .describe(
                    'Location of encrypted file in your project used as source of decryption into your workspace'
                ),
        }),
    })
    .describe('This prop enables automatic encrypt and decrypt of sensitive information in your project');

export const Paths = z
    .object({
        appConfigsDir: z.optional(z.string().describe('Custom path to appConfigs. defaults to `./appConfigs`')),
        platformAssetsDir: z.optional(
            z.string().describe('Custom path to platformAssets folder. defaults to `./platformAssets`')
        ),
        platformBuildsDir: z.optional(
            z.string().describe('Custom path to platformBuilds folder. defaults to `./platformBuilds`')
        ),
        pluginTemplates: z.optional(
            z.record(
                z.string(),
                z.object({
                    npm: z.optional(z.string()),
                    path: z.string(),
                })
            ).describe(`
        Allows you to define custom plugin template scopes. default scope for all plugins is \`rnv\`.
        this custom scope can then be used by plugin via \`"source:myCustomScope"\` value
        
        those will allow you to use direct pointer to preconfigured plugin:
        
        \`\`\`
        "plugin-name": "source:myCustomScope"
        \`\`\`
        
        NOTE: by default every plugin you define with scope will also merge any
        files defined in overrides automatically to your project.
        To skip file overrides coming from source plugin you need to detach it from the scope:
        
        \`\`\`
        {
            "plugins": {
                "plugin-name": {
                    "source": ""
                }
            }
        }
        \`\`\`
        `)
        ),
    })
    .describe('Define custom paths for RNV to look into');

export const Permissions = z
    .object({
        android: z.optional(
            z
                .record(
                    z.string(),
                    z.object({
                        key: z.string(), //TODO: type this
                        security: z.string(), //TODO: type this
                    })
                )
                .describe('Android SDK specific permissions')
        ),
        ios: z.optional(
            z
                .record(
                    z.string(), //TODO: type this
                    z.object({
                        desc: z.string(),
                    })
                )
                .describe('iOS SDK specific permissions')
        ),
    })
    .describe(
        'Permission definititions which can be used by app configs via `includedPermissions` and `excludedPermissions` to customize permissions for each app'
    );

export const Engines = z.record(z.string(), Engine).describe('List of engines available in this project');

export const Platforms = z.record(PlatformsKeys, Platform).describe('Object containing platform configurations');

export const EnableHookRebuild = z
    .boolean()
    .describe(
        'If set to true in `./renative.json` build hooks will be compiled at each rnv command run. If set to `false` (default) rebuild will be triggered only if `dist` folder is missing, `-r` has been passed or you run `rnv hooks run` directly making your rnv commands faster'
    );

export const EnableAnalytics = z.boolean().describe('Enable or disable sending analytics to improve ReNative');

export const ProjectName = z
    .string()
    .describe(
        'Name of the project which will be used in workspace as folder name. this will also be used as part of the KEY in crypto env var generator'
    );

export const Hidden = z
    .boolean()
    .describe(
        'If set to true in `./appConfigs/[APP_ID]/renative.json` the APP_ID will be hidden from list of appConfigs `-c`'
    );

export const MonoRoot = z
    .boolean()
    .describe('Define custom path to monorepo root where starting point is project directory');

export const Plugins = z
    .record(z.string(), Plugin)
    .describe(
        'Define all plugins available in your project. you can then use `includedPlugins` and `excludedPlugins` props to define active and inactive plugins per each app config'
    );

export const Tasks = z
    .object({
        install: z.optional(
            z.object({
                script: z.string(),
            })
        ),
    })
    .describe(
        'Allows to override specific task within renative toolchain. (currently only `install` supported). this is useful if you want to change specific behaviour of built-in task. ie install task triggers yarn/npm install by default. but that might not be desirable installation trigger'
    );

export const Integrations = z
    .record(z.string(), z.object({}))
    .describe('Object containing integration configurations where key represents package name');

export const Env = z.record(z.string(), z.any()).describe('Object containing injected env variables');
