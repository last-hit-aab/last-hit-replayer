"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
exports.inElectron = !!process.versions.electron;
exports.getTempFolder = function (fallbackFolder) {
    if (exports.inElectron) {
        // IMPORTANT donot move to import block, electron might not exists
        var app = require('electron').app;
        return app.getPath('logs');
    }
    else {
        return fallbackFolder;
    }
};
/**
 * get process id
 */
exports.getProcessId = function () { return "" + process.pid; };
/**
 * rewrite log files, note only be called in CI
 */
var logger;
exports.getLogger = function () {
    if (!logger) {
        var output = fs_1.default.createWriteStream(path_1.default.join(process.cwd(), 'stdout.log'));
        var errorOutput = fs_1.default.createWriteStream(path_1.default.join(process.cwd(), 'stderr.log'));
        logger = new console.Console({ stdout: output, stderr: errorOutput });
    }
    return logger;
};
exports.shorternUrl = function (url) {
    try {
        var parsed = new URL(url);
        parsed.search = '';
        parsed.hash = '';
        return parsed.href;
    }
    catch (_a) {
        // parse fail, not a valid url, return directly
        return url;
    }
};
/**
 * generate flow key
 */
exports.generateKeyByObject = function (story, flow) {
    return "[" + flow.name + "@" + story.name + "]";
};
exports.generateKeyByString = function (storyName, flowName) {
    return "[" + flowName + "@" + storyName + "]";
};
/**
 * build flows array of given workspace
 */
exports.findFlows = function (env) {
    var workspace = env.getWorkspace();
    var flows = fs_1.default
        .readdirSync(workspace)
        .filter(function (dir) { return fs_1.default.statSync(path_1.default.join(workspace, dir)).isDirectory(); })
        .filter(function (dir) { return !['.scripts'].includes(dir); })
        .map(function (storyName) {
        return fs_1.default
            .readdirSync(path_1.default.join(workspace, storyName))
            .filter(function (flowFilename) {
            return fs_1.default.statSync(path_1.default.join(workspace, storyName, flowFilename)).isFile();
        })
            .filter(function (flowFilename) { return flowFilename.endsWith('.flow.json'); })
            .map(function (flowFilename) { return flowFilename.replace(/^(.*)\.flow\.json$/, '$1'); })
            .filter(function (flowName) {
            return env.isIncluded(storyName, flowName) && !env.isExcluded(storyName, flowName);
        })
            .map(function (flowName) { return ({ story: storyName, flow: flowName }); });
    })
        .reduce(function (flows, array) {
        flows.push.apply(flows, array);
        return flows;
    }, []);
    var flowMap = {};
    var necessaryFlows = flows.map(function (flowFile) {
        flowMap[exports.generateKeyByString(flowFile.story, flowFile.flow)] = flowFile;
        return flowFile;
    }).reduce(function (necessary, flowFile) {
        var _a = env.readFlowFile(flowFile.story, flowFile.flow).settings, _b = _a === void 0 ? {
            forceDepends: undefined,
            dataDepends: undefined
        } : _a, forceDepends = _b.forceDepends, _c = _b.dataDepends, dataDepends = _c === void 0 ? [] : _c;
        if (forceDepends) {
            var story = forceDepends.story, flow = forceDepends.flow;
            var key = exports.generateKeyByString(story, flow);
            if (!flowMap[key]) {
                // not include, includes it
                var add = { story: story, flow: flow };
                necessary.push(add);
                flowMap[key] = add;
            }
        }
        dataDepends.forEach(function (_a) {
            var story = _a.story, flow = _a.flow;
            var key = exports.generateKeyByString(story, flow);
            if (!flowMap[key]) {
                // not include, includes it
                var add = { story: story, flow: flow };
                necessary.push(add);
                flowMap[key] = add;
            }
        });
        return necessary;
    }, []);
    return __spreadArrays(necessaryFlows, flows);
};
var defaultName = 'last-hit';
var starts = {};
exports.startTime = function (name) {
    if (name === void 0) { name = defaultName; }
    starts[name] = new Date().getTime();
};
exports.endTime = function (name) {
    if (name === void 0) { name = defaultName; }
    var now = new Date().getTime();
    var start = starts[name];
    if (start) {
        delete starts[name];
        return now - start;
    }
    else {
        return 0;
    }
};

//# sourceMappingURL=index.js.map
