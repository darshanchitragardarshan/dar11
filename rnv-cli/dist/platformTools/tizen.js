var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports,"__esModule",{value:true});exports.launchTizenSimulator=launchTizenSimulator;exports.configureTizenGlobal=exports.runTizen=exports.addDevelopTizenCertificate=exports.createDevelopTizenCertificate=exports.configureTizenProject=exports.copyTizenAssets=void 0;var _path=_interopRequireDefault(require("path"));var _fs=_interopRequireDefault(require("fs"));var _chalk=_interopRequireDefault(require("chalk"));var _exec=require("../exec");var _common=require("../common");var _constants=require("../constants");var _fileutils=require("../fileutils");var _web=require("./web");var configureTizenGlobal=function configureTizenGlobal(c){return new Promise(function(resolve,reject){(0,_common.logTask)('configureTizenGlobal');var tizenAuthorCert=_path.default.join(c.globalConfigFolder,'tizen_author.p12');if(_fs.default.existsSync(tizenAuthorCert)){console.log('tizen_author.p12 file exists!');resolve();}else{console.log('tizen_author.p12 file missing! Creating one for you...');createDevelopTizenCertificate(c).then(function(){return resolve();}).catch(function(e){return reject(e);});}});};exports.configureTizenGlobal=configureTizenGlobal;function launchTizenSimulator(c,name){(0,_common.logTask)("launchTizenSimulator:"+name);if(name){return(0,_exec.execCLI)(c,_common.CLI_TIZEN_EMULATOR,"launch --name "+name);}return Promise.reject('No simulator -t target name specified!');}var copyTizenAssets=function copyTizenAssets(c,platform){return new Promise(function(resolve,reject){(0,_common.logTask)('copyTizenAssets');if(!(0,_common.isPlatformActive)(c,platform,resolve))return;var sourcePath=_path.default.join(c.appConfigFolder,'assets',platform);var destPath=_path.default.join((0,_common.getAppFolder)(c,platform));(0,_fileutils.copyFolderContentsRecursiveSync)(sourcePath,destPath);resolve();});};exports.copyTizenAssets=copyTizenAssets;var createDevelopTizenCertificate=function createDevelopTizenCertificate(c){return new Promise(function(resolve,reject){(0,_common.logTask)('createDevelopTizenCertificate');(0,_exec.execCLI)(c,_common.CLI_TIZEN,'certificate -- ~/.rnv -a rnv -f tizen_author -p 1234').then(function(){return addDevelopTizenCertificate(c);}).then(function(){return resolve();}).catch(function(e){(0,_common.logError)(e);resolve();});});};exports.createDevelopTizenCertificate=createDevelopTizenCertificate;var addDevelopTizenCertificate=function addDevelopTizenCertificate(c){return new Promise(function(resolve,reject){(0,_common.logTask)('addDevelopTizenCertificate');(0,_exec.execCLI)(c,_common.CLI_TIZEN,'security-profiles add -n RNVanillaCert -a ~/.rnv/tizen_author.p12 -p 1234').then(function(){return resolve();}).catch(function(e){(0,_common.logError)(e);resolve();});});};exports.addDevelopTizenCertificate=addDevelopTizenCertificate;var runTizen=function runTizen(c,platform,target){return new Promise(function(resolve,reject){(0,_common.logTask)("runTizen:"+platform+":"+target);var platformConfig=c.appConfigFile.platforms[platform];var tDir=(0,_common.getAppFolder)(c,platform);var tOut=_path.default.join(tDir,'output');var tBuild=_path.default.join(tDir,'build');var tId=platformConfig.id;var tSim=target;var gwt=platformConfig.appName+".wgt";var certProfile=platformConfig.certificateProfile;var TIZEN_UNINSTALL_APP="uninstall -p "+tId+" -t "+tSim;var TIZEN_INSTALL_APP="install -- "+tOut+" -n "+gwt+" -t "+tSim;var TIZEN_RUN_APP="run -p "+tId+" -t "+tSim;configureTizenProject(c,platform).then(function(){return(0,_web.buildWeb)(c,platform);}).then(function(){return(0,_exec.execCLI)(c,_common.CLI_TIZEN,"build-web -- "+tDir+" -out "+tBuild,_common.logTask);}).then(function(){return(0,_exec.execCLI)(c,_common.CLI_TIZEN,"package -- "+tBuild+" -s "+certProfile+" -t wgt -o "+tOut,_common.logTask);}).then(function(){return(0,_exec.execCLI)(c,_common.CLI_TIZEN,TIZEN_UNINSTALL_APP,_common.logTask);}).then(function(){return(0,_exec.execCLI)(c,_common.CLI_TIZEN,TIZEN_INSTALL_APP,_common.logTask);}).then(function(){return(0,_exec.execCLI)(c,_common.CLI_TIZEN,TIZEN_RUN_APP,_common.logTask);}).then(function(){return resolve();}).catch(function(e){if(e&&e.includes(TIZEN_UNINSTALL_APP)){(0,_exec.execCLI)(c,_common.CLI_TIZEN,TIZEN_INSTALL_APP,_common.logTask).then(function(){return(0,_exec.execCLI)(c,_common.CLI_TIZEN,TIZEN_RUN_APP,_common.logTask);}).then(function(){return resolve();}).catch(function(e){(0,_common.logError)(e);(0,_common.logWarning)("Looks like there is no emulator or device connected! Let's try to launch it. \""+_chalk.default.white.bold("rnv target launch -p "+platform+" -t "+target)+"\"");launchTizenSimulator(c,target).then(function(){(0,_common.logInfo)("Once simulator is ready run: \""+_chalk.default.white.bold("rnv run -p "+platform+" -t "+target)+"\" again");resolve();}).catch(function(e){return reject(e);});});}else{reject(e);}});});};exports.runTizen=runTizen;var configureTizenProject=function configureTizenProject(c,platform){return new Promise(function(resolve,reject){(0,_common.logTask)('configureTizenProject');if(!(0,_common.isPlatformActive)(c,platform,resolve))return;copyTizenAssets(c,platform).then(function(){return(0,_common.copyBuildsFolder)(c,platform);}).then(function(){return configureProject(c,platform);}).then(function(){return resolve();}).catch(function(e){return reject(e);});});};exports.configureTizenProject=configureTizenProject;var configureProject=function configureProject(c,platform,appFolderName){return new Promise(function(resolve,reject){(0,_common.logTask)("configureProject:"+platform);var appFolder=(0,_common.getAppFolder)(c,platform);var configFile='config.xml';var p=c.appConfigFile.platforms[platform];(0,_common.writeCleanFile)(_path.default.join((0,_common.getAppTemplateFolder)(c,platform),configFile),_path.default.join(appFolder,configFile),[{pattern:'{{PACKAGE}}',override:p.package},{pattern:'{{ID}}',override:p.id},{pattern:'{{APP_NAME}}',override:p.appName}]);resolve();});};