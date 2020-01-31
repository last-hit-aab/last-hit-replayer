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
Object.defineProperty(exports, "__esModule", { value: true });
var ReplaySummary = /** @class */ (function () {
    function ReplaySummary(options) {
        var storyName = options.storyName, flow = options.flow, env = options.env;
        this.storyName = storyName;
        this.flowName = flow.name;
        this.env = env;
        this.summary = {
            storyName: storyName,
            flowName: flow.name,
            numberOfStep: (flow.steps || []).length,
            numberOfUIBehavior: 0,
            numberOfSuccess: 0,
            numberOfFailed: 0,
            numberOfAssert: 0,
            ignoreErrorList: [],
            numberOfAjax: 0,
            slowAjaxRequest: [],
            screenCompareList: [],
            errorStack: '',
            testLogs: [],
            flowParams: []
        };
    }
    ReplaySummary.prototype.getEnvironment = function () {
        return this.env;
    };
    ReplaySummary.prototype.getSummary = function () {
        return this.summary;
    };
    ReplaySummary.prototype.compareScreenshot = function (step) {
        this.summary.screenCompareList.push({
            stepUuid: step.stepUuid,
            stepIndex: step.stepIndex,
            target: step.target,
            path: step.path,
            csspath: step.csspath,
            custompath: step.custompath,
            human: step.human,
            type: step.type
        });
    };
    ReplaySummary.prototype.handleError = function (step, error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (step.type == 'ajax') {
                    // ignore
                }
                else {
                    this.summary.numberOfFailed += 1;
                    this.summary.errorStack = error.stack;
                }
                return [2 /*return*/, Promise.resolve(true)];
            });
        });
    };
    ReplaySummary.prototype.handle = function (step) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (step.type == 'ajax') {
                    // ignore
                    this.summary.numberOfSuccess += 1;
                }
                else {
                    this.summary.numberOfUIBehavior += 1;
                    this.summary.numberOfSuccess += 1;
                }
                return [2 /*return*/, Promise.resolve(true)];
            });
        });
    };
    ReplaySummary.prototype.handleAjaxSuccess = function (url, usedTime) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.summary.numberOfAjax++;
                if (usedTime >= this.getEnvironment().getSlowAjaxTime()) {
                    this.summary.slowAjaxRequest.push({ url: url, time: usedTime });
                }
                return [2 /*return*/];
            });
        });
    };
    ReplaySummary.prototype.handleAjaxFail = function (url, usedTime) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.summary.numberOfAjax++;
                if (usedTime >= this.getEnvironment().getSlowAjaxTime()) {
                    this.summary.slowAjaxRequest.push({ url: url, time: usedTime });
                }
                return [2 /*return*/];
            });
        });
    };
    ReplaySummary.prototype.handleScriptTests = function (testLogs) {
        this.summary.testLogs = testLogs || [];
    };
    ReplaySummary.prototype.handleFlowParameters = function (input, output) {
        if (input === void 0) { input = {}; }
        if (output === void 0) { output = {}; }
        var params = [];
        Object.keys(input).forEach(function (name) {
            var value = input[name];
            params.push({ name: name, value: value, type: 'in' });
        });
        Object.keys(output).forEach(function (name) {
            var value = output[name];
            params.push({ name: name, value: value, type: 'out' });
        });
        this.summary.flowParams = params.sort(function (a, b) {
            if (a.type === b.type) {
                return a.name.localeCompare(b.name);
            }
            else if (a.type === 'in') {
                return -1;
            }
            else {
                return 1;
            }
        });
    };
    ReplaySummary.prototype.print = function () {
        console.table([this.summary], [
            'storyName',
            'flowName',
            'numberOfStep',
            'numberOfUIBehavior',
            'numberOfSuccess',
            'numberOfFailed',
            'ignoreErrorList',
            'numberOfAjax',
            'slowAjaxRequest'
        ]);
    };
    return ReplaySummary;
}());
exports.default = ReplaySummary;

//# sourceMappingURL=replay-summary.js.map
