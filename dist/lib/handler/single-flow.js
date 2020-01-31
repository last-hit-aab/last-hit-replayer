"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var jsonfile_1 = __importDefault(require("jsonfile"));
var path_1 = __importDefault(require("path"));
var stream_1 = __importDefault(require("stream"));
var replayer_1 = require("../replayer");
var utils_1 = require("../utils");
var processId = utils_1.getProcessId();
exports.mergeFlowInput = function (source, target) {
    if (source.params && source.params.length !== 0) {
        target.params = target.params || [];
        var existsParamNames_1 = target.params.reduce(function (names, param) {
            names[param.name] = true;
            return names;
        }, {});
        source.params
            .filter(function (param) { return param.type !== 'out'; })
            .filter(function (param) { return existsParamNames_1[param.name] !== true; })
            .forEach(function (param) { return target.params.push(param); });
    }
};
/**
 * find all force dependencies, and merge steps to one flow
 */
var findAndMergeForceDependencyFlows = function (flow, env) {
    var forceDependencyFlow = {
        name: flow.name,
        description: "Merged force dependency flows",
        steps: [],
        params: []
    };
    var currentFlow = flow;
    var _loop_1 = function () {
        var _a;
        var _b = currentFlow.settings.forceDepends, storyName = _b.story, flowName = _b.flow;
        if (!env.isFlowExists(storyName, flowName)) {
            throw new Error("Dependency flow[" + flowName + "@" + storyName + "] not found.");
        }
        var dependsFlow = env.readFlowFile(storyName, flowName);
        var steps = dependsFlow.steps || [];
        (_a = forceDependencyFlow.steps).splice.apply(_a, __spreadArrays([0,
            0], steps.map(function (step) {
            return (__assign(__assign({}, step), { origin: {
                    story: storyName,
                    flow: dependsFlow.name,
                    stepIndex: step.stepIndex
                } }));
        })));
        exports.mergeFlowInput(dependsFlow, forceDependencyFlow);
        currentFlow = dependsFlow;
    };
    while (currentFlow.settings && currentFlow.settings.forceDepends) {
        _loop_1();
    }
    forceDependencyFlow.steps = forceDependencyFlow.steps.filter(function (step, index) {
        return index === 0 || (step.type !== 'start' && step.type !== 'end');
    });
    forceDependencyFlow.steps.push({ type: 'end' });
    forceDependencyFlow.steps.forEach(function (step, index) { return (step.stepIndex = index); });
    return forceDependencyFlow;
};
var findInDependencyChain = function (story, flow, dependsChain) {
    return dependsChain.some(function (node) { return node.story === story && node.flow === flow; });
};
var doForceLoopCheck = function (depends, dependsChain, env) {
    var dependsStoryName = depends.story, dependsFlowName = depends.flow;
    if (findInDependencyChain(dependsStoryName, dependsFlowName, dependsChain)) {
        dependsChain.push({ story: dependsStoryName, flow: dependsFlowName });
        var chain = dependsChain.map(function (_a) {
            var story = _a.story, flow = _a.flow;
            return flow + "@" + story;
        }).join(' -> ');
        throw new Error("Loop dependency[" + chain + "] found.");
    }
    if (!env.isStoryExists(dependsStoryName)) {
        throw new Error("Dependency story[" + dependsStoryName + "] not found.");
    }
    if (!env.isFlowExists(dependsStoryName, dependsFlowName)) {
        throw new Error("Dependency flow[" + dependsFlowName + "@" + dependsStoryName + "] not found.");
    }
    var dependsFlow = env.readFlowFile(dependsStoryName, dependsFlowName);
    var _a = (dependsFlow.settings || {}).forceDepends, forceDepends = _a === void 0 ? null : _a;
    if (forceDepends) {
        if (findInDependencyChain(forceDepends.story, forceDepends.flow, dependsChain)) {
            dependsChain.push({ story: dependsStoryName, flow: dependsFlowName });
            var chain = dependsChain.map(function (_a) {
                var story = _a.story, flow = _a.flow;
                return flow + "@" + story;
            }).join(' -> ');
            throw new Error("Loop dependency[" + chain + "] found.");
        }
        else {
            // push dependency to chain
            dependsChain.push({ story: dependsStoryName, flow: dependsFlowName });
            return doForceLoopCheck(forceDepends, dependsChain, env);
        }
    }
    return true;
};
/**
 * only check loop. return true even dependency flow not found.
 */
var forceLoopCheck = function (dependency, myself, env) {
    return doForceLoopCheck(dependency, [myself], env);
};
var dataLoopCheck = function (depends, node, env) {
    return depends.every(function (depend) {
        var story = depend.story, flow = depend.flow;
        if (story === node.story && flow === node.flow) {
            throw new Error("Loop dependency[" + node.flow + "@" + node.story + " -> " + flow + "@" + story + "] found.");
        }
        var chain = [node];
        var parent = node.parent;
        while (parent != null) {
            chain.push(parent);
            if (story === parent.story && flow === parent.flow) {
                var chained = chain.map(function (_a) {
                    var story = _a.story, flow = _a.flow;
                    return flow + "@" + story;
                }).join(' -> ');
                throw new Error("Loop dependency[" + chained + "] found.");
            }
            parent = parent.parent;
        }
        if (!env.isStoryExists(story)) {
            throw new Error("Dependency story[" + story + "] not found.");
        }
        if (!env.isFlowExists(story, flow)) {
            throw new Error("Dependency flow[" + flow + "@" + story + "] not found.");
        }
        var dependsFlow = env.readFlowFile(story, flow);
        var _a = (dependsFlow.settings || {}).dataDepends, dataDepends = _a === void 0 ? [] : _a;
        var myself = { children: [], parent: node, story: story, flow: flow };
        node.children.push(myself);
        return dataLoopCheck(dataDepends, myself, env);
    });
};
var replayNextStep = function (emitter, story, flow, index, resolve) {
    handleReplayStepEnd(emitter, story, flow, resolve);
    emitter.send("continue-replay-step-" + utils_1.generateKeyByObject(story, flow), {
        storyName: story.name,
        flow: flow,
        index: index + 1
    });
};
var handleReplayStepEnd = function (emitter, story, flow, resolve) {
    var key = utils_1.generateKeyByObject(story, flow);
    emitter.once("replay-step-end-" + key, function (event, arg) {
        // index: index of the finished step, starts from 0
        var error = arg.error, index = arg.index;
        if (error) {
            (function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.error(("Process[" + processId + "] Replay flow " + key + " failed on step " + (index + 1) + ".")
                        .bold.red.bold, error);
                    emitter.once("replay-browser-abolish-" + key, function () { return resolve(); });
                    // abolish anyway
                    emitter.send("continue-replay-step-" + key, { command: 'abolish' });
                    return [2 /*return*/];
                });
            }); })();
        }
        else if (flow.steps[index].type === 'end' || index >= flow.steps.length - 1) {
            // the end or last step is finished
            (function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.info(("Process[" + processId + "] Replay flow " + key + " finished.").bold.green);
                    emitter.once("replay-browser-abolish-" + key, function () { return resolve(); });
                    emitter.send("continue-replay-step-" + key, { command: 'abolish' });
                    return [2 /*return*/];
                });
            }); })();
        }
        else {
            // go on
            replayNextStep(emitter, story, flow, index, resolve);
        }
    });
};
exports.handleFlow = function (flowFile, env) {
    var logger = utils_1.getLogger();
    var storyName = flowFile.story, flowName = flowFile.flow;
    var flowKey = flowName + "@" + storyName;
    var workspace = env.getWorkspace();
    var timeLoggerStream = new stream_1.default.Transform();
    var timeSpent;
    timeLoggerStream._transform = function (chunk, encoding, done) {
        this.push(chunk);
        timeSpent = typeof chunk === 'string' ? chunk : chunk.toString();
        done();
    };
    var timeLogger = new console.Console({ stdout: timeLoggerStream });
    timeLogger.time(flowKey);
    console.info(("Process[" + processId + "] Start to replay [" + flowKey + "].").italic.blue.underline);
    var flow;
    try {
        flow = env.readFlowFile(storyName, flowName);
    }
    catch (e) {
        logger.error(e);
        return Promise.reject();
    }
    flow.name = flowName;
    if (flow.steps == null || flow.steps.length === 0) {
        console.info(("Process[" + processId + "] Flow " + flowKey + " has no steps, ignored.").red.bold);
        return Promise.reject();
    }
    if (flow.settings && flow.settings.forceDepends) {
        // has force dependency
        var _a = flow.settings.forceDepends, dependsStoryName = _a.story, dependsFlowName = _a.flow;
        try {
            forceLoopCheck({ story: dependsStoryName, flow: dependsFlowName }, { story: storyName, flow: flowName }, env);
        }
        catch (e) {
            logger.error(e);
            console.info(("Process[" + processId + "] Flow " + flowKey + " failed on force dependency loop check, ignored.")
                .red.bold);
            return Promise.reject();
        }
        var forceDependsFlow_1 = findAndMergeForceDependencyFlows(flow, env);
        // remove end step
        forceDependsFlow_1.steps.length = forceDependsFlow_1.steps.length - 1;
        flow.steps
            .filter(function (step, index) { return index !== 0; })
            .forEach(function (step) {
            return forceDependsFlow_1.steps.push(__assign(__assign({}, step), { origin: {
                    story: storyName,
                    flow: flow.name,
                    stepIndex: step.stepIndex
                } }));
        });
        exports.mergeFlowInput(flow, forceDependsFlow_1);
        flow = forceDependsFlow_1;
    }
    if (flow.settings && flow.settings.dataDepends) {
        // has data dependency
        var depends = flow.settings.dataDepends.filter(function (depend) { return depend.story && depend.flow; });
        var root = {
            children: [],
            parent: null,
            story: storyName,
            flow: flowName
        };
        try {
            dataLoopCheck(depends, root, env);
        }
        catch (e) {
            logger.error(e);
            console.info(("Process[" + processId + "] Flow " + flowKey + " failed on data dependency loop check, ignored.")
                .red.bold);
            return Promise.reject();
        }
        // to check all data dependencies are finished
        var score = root.children.reduce(function (score, depend) {
            switch (score) {
                case 1:
                    // dependency not finished yet
                    return 1;
                case 2:
                    // dependency failure
                    return 2;
                default:
                    // check dependency
                    var storyName_1 = depend.story, flowName_1 = depend.flow;
                    var resultFile = path_1.default.join(env.getWorkspace(), '.result-params-temp', storyName_1, flowName_1, 'params.json');
                    if (fs_1.default.existsSync(resultFile) && fs_1.default.statSync(resultFile).isFile()) {
                        var result = jsonfile_1.default.readFileSync(resultFile);
                        var _a = result || { success: false }, success = _a.success, _b = _a.params, params = _b === void 0 ? [] : _b;
                        if (!success) {
                            // dependency failed
                            return 2;
                        }
                        else {
                            params
                                .filter(function (param) {
                                return ['out', 'both'].includes(param.type);
                            })
                                .forEach(function (param) {
                                flow.params = flow.params || [];
                                var defined = flow.params.find(function (defined) {
                                    return ['in', 'both'].includes(defined.type) &&
                                        defined.name === param.name;
                                });
                                if (defined) {
                                    // pass value
                                    defined.value = param.value;
                                }
                                else {
                                    // create an input parameter
                                    flow.params.push({
                                        type: 'in',
                                        name: param.name,
                                        value: param.value
                                    });
                                }
                            });
                            return 0;
                        }
                    }
                    else {
                        return 1;
                    }
            }
        }, 0);
        switch (score) {
            case 1:
                console.info(("Process[" + processId + "] Flow " + flowKey + " pending on data dependency flow not ready.")
                    .yellow.underline);
                // dependency not finished yet
                return Promise.resolve({
                    code: 'pending'
                });
            case 2:
                // dependency failure
                console.info(("Process[" + processId + "] Flow " + flowKey + " failed on data dependency flow failure, ignored.")
                    .red.bold);
                return Promise.reject();
            default:
                // every is ready, let's go
                break;
        }
    }
    var startStep = flow.steps[0];
    if (startStep.type !== 'start') {
        console.info(("Process[" + processId + "] Flow " + flowKey + " has no start step, ignored.").red.bold);
        return Promise.reject();
    }
    if (!startStep.url) {
        console.info(("Process[" + processId + "] Flow " + flowKey + " has no start url, ignored.").red.bold);
        return Promise.reject();
    }
    var emitter = new replayer_1.ReplayEmitter();
    var replayer;
    try {
        replayer = replayer_1.createReplayer({ emitter: emitter, logger: logger, env: env }).initialize();
    }
    catch (e) {
        logger.error(e);
        return Promise.reject();
    }
    var promise = new Promise(function (resolve) {
        handleReplayStepEnd(emitter, { name: storyName }, flow, function () {
            var summary = replayer.current.getSummaryData();
            // write out parameters only
            var resultFolder = path_1.default.join(env.getWorkspace(), '.result-params-temp', storyName, flowName);
            fs_1.default.mkdirSync(resultFolder, { recursive: true });
            var result = {
                success: summary.numberOfStep === summary.numberOfSuccess,
                params: summary.flowParams
            };
            var resultFile = path_1.default.join(resultFolder, 'params.json');
            jsonfile_1.default.writeFileSync(resultFile, result, { encoding: 'UTF-8', spaces: '\t' });
            timeLogger.timeEnd(flowKey);
            resolve({
                report: __assign(__assign({}, summary), { spent: timeSpent }),
                coverages: replayer.current.getCoverageData(),
                code: 'success'
            });
        });
    });
    emitter.send('launch-replay', { flow: flow, index: 0, storyName: storyName });
    return promise;
};

//# sourceMappingURL=single-flow.js.map
