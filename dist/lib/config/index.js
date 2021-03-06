"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var jsonfile_1 = __importDefault(require("jsonfile"));
var path_1 = __importDefault(require("path"));
var yargs_1 = require("yargs");
var types_1 = require("../types");
var utils_1 = require("../utils");
var env_1 = __importDefault(require("./env"));
var processId = utils_1.getProcessId();
var assertWorkspace = function () { return __awaiter(void 0, void 0, void 0, function () {
    var workspace;
    return __generator(this, function (_a) {
        workspace = yargs_1.argv.workspace;
        if (!workspace) {
            // workspace must be appointed
            console.error(("Process[" + processId + "] Please specify workspace folder via [--workspace=folder].")
                .bold.red);
            return [2 /*return*/, Promise.reject()];
        }
        return [2 /*return*/, workspace];
    });
}); };
var readConfigFile = function (workspace) {
    var config;
    var configFile = yargs_1.argv['config-file'];
    delete yargs_1.argv['config-file'];
    if (configFile) {
        config = jsonfile_1.default.readFileSync(path_1.default.isAbsolute(configFile) ? configFile : path_1.default.join(workspace, configFile));
    }
    else {
        config = {};
    }
    var configJson = yargs_1.argv['config-json'];
    delete yargs_1.argv['config-json'];
    if (configJson) {
        try {
            var json = JSON.parse(configJson);
            config = Object.assign(config, json);
        }
        catch (e) {
            console.error('failed to parse config json from cli');
        }
    }
    config.workspace = workspace;
    // story or flow is appointed via cli, has highest priority
    var storyName = yargs_1.argv.story;
    var flowName = yargs_1.argv.flow;
    if (storyName) {
        config.includes = [{ story: storyName, flow: flowName }];
    }
    // env name are appointed via cli, has highest priority
    var envName = yargs_1.argv.env;
    if (envName) {
        config.env = envName;
    }
    Object.keys(yargs_1.argv).filter(function (name) { return name.startsWith('settings-'); }).forEach(function (name) { return config[name] = yargs_1.argv[name]; });
    return config;
};
var readWorkspaceFile = function (workspace) { return __awaiter(void 0, void 0, void 0, function () {
    var workspaceSettingsFile;
    return __generator(this, function (_a) {
        workspaceSettingsFile = fs_1.default.readdirSync(workspace).find(function (name) { return name.endsWith('.lhw'); });
        if (workspaceSettingsFile) {
            return [2 /*return*/, jsonfile_1.default.readFileSync(path_1.default.join(workspace, workspaceSettingsFile))];
        }
        else {
            // workspace file not found
            return [2 /*return*/, { envs: [] }];
        }
        return [2 /*return*/];
    });
}); };
var buildEnvironment = function (config, workspaceConfig) { return __awaiter(void 0, void 0, void 0, function () {
    var env, envName, settings;
    return __generator(this, function (_a) {
        envName = config.env;
        if (envName) {
            env = (workspaceConfig.envs || []).find(function (env) { return env.name === envName; });
            if (env == null) {
                console.error(("Process[" + processId + "] Given environment[" + envName + "] not found.").bold.red);
                return [2 /*return*/, Promise.reject()];
            }
        }
        else {
            env = env_1.default.exposeNoop();
            types_1.ConfigForRuntimeKey.forEach(function (prop) {
                if (config[prop] != null) {
                    env[prop] = config[prop];
                }
            });
        }
        env.workspace = config.workspace;
        env.includes = config.includes;
        env.child = config.child;
        env.parallel = (yargs_1.argv.parallel || config.parallel);
        types_1.ConfigForAdminKeys.forEach(function (prop) {
            if (config[prop] != null) {
                env[prop] = config[prop];
            }
        });
        settings = Object.keys(config)
            .filter(function (key) { return key.startsWith('settings-'); })
            .reduce(function (all, key) {
            all[key.replace('settings-', '')] = config[key];
            return all;
        }, {});
        // mix settings to environment
        env = Object.assign(env, settings);
        return [2 /*return*/, new env_1.default(env)];
    });
}); };
exports.loadConfig = function () { return __awaiter(void 0, void 0, void 0, function () {
    var workspace, config, workspaceConfig, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, assertWorkspace()];
            case 1:
                workspace = _a.sent();
                config = readConfigFile(workspace);
                return [4 /*yield*/, readWorkspaceFile(workspace)];
            case 2:
                workspaceConfig = _a.sent();
                return [2 /*return*/, buildEnvironment(config, workspaceConfig)];
            case 3:
                e_1 = _a.sent();
                return [2 /*return*/, Promise.reject(e_1)];
            case 4: return [2 /*return*/];
        }
    });
}); };

//# sourceMappingURL=index.js.map
