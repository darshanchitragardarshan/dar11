import type { _RootAppSchemaType } from './configRootApp';
import { _ConfigRootEngineType } from './configRootEngine';
import { _ConfigRootPlugin } from './configRootPlugin';
import type { _RootProjectSchemaType } from './configRootProject';
// import { _ConfigRootTemplates } from './configRootTemplates';

export type ConfigRootProject = _RootProjectSchemaType;
export type ConfigRootApp = _RootAppSchemaType;
export type ConfigRootEngine = _ConfigRootEngineType;
export type ConfigRootPlugin = _ConfigRootPlugin;
// export type ConfigRootTemplates = _ConfigRootTemplates;