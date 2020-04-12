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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs_1 = __importDefault(require("fs"));
var jsonfile_1 = __importDefault(require("jsonfile"));
var path_1 = __importDefault(require("path"));
var pti = __importStar(require("../pti"));
var utils_1 = require("../utils");
var report_generator_1 = require("./report-generator");
var axios_1 = __importDefault(require("axios"));
var binarySearch = function (target, array) {
    var firstIndex = 0;
    var lastIndex = array.length - 1;
    var middleIndex = Math.floor((lastIndex + firstIndex) / 2);
    while (firstIndex <= lastIndex) {
        // console.log(firstIndex, middleIndex, lastIndex);
        var item = array[middleIndex];
        if (item.start === target.start && item.end === target.end) {
            return middleIndex;
        }
        else if (target.start > item.end) {
            firstIndex = middleIndex + 1;
        }
        else if (target.end < item.start) {
            lastIndex = middleIndex - 1;
        }
        else {
            break;
        }
        middleIndex = Math.floor((lastIndex + firstIndex) / 2);
    }
    return 0 - middleIndex;
};
var buildBody = function (used, reports, env) {
    if (env.getAdminTestPlanId()) {
        return {
            spent: used,
            summary: reports,
            testPlan: {
                id: env.getAdminTestPlanId(),
            },
        };
    }
    else {
        return {
            spent: used,
            summary: reports,
            workspace: {
                id: env.getAdminWorkspaceId(),
            },
        };
    }
};
exports.print = function (env) { return __awaiter(void 0, void 0, void 0, function () {
    var reports, coverageMap, allCoverageData, workspace, resultTempFolder, adminUrl, used, response, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                reports = [];
                coverageMap = {};
                allCoverageData = [];
                workspace = env.getWorkspace();
                resultTempFolder = path_1.default.join(workspace, ".result-temp");
                (fs_1.default.readdirSync(resultTempFolder) || []).forEach(function (threadFolder) {
                    var summaryFilename = path_1.default.join(path_1.default.join(resultTempFolder, threadFolder, "summary.json"));
                    var report = jsonfile_1.default.readFileSync(summaryFilename);
                    (report || []).forEach(function (item) { return reports.push(item); });
                    var coverageFilename = path_1.default.join(path_1.default.join(resultTempFolder, threadFolder, "coverages.json"));
                    if (fs_1.default.existsSync(coverageFilename)) {
                        var coverageData = jsonfile_1.default.readFileSync(coverageFilename);
                        coverageData.reduce(function (map, item) {
                            var ranges = item.ranges, text = item.text;
                            var url = utils_1.shorternUrl(item.url);
                            var data = map[url];
                            if (!data) {
                                data = { url: url, ranges: ranges, text: text };
                                allCoverageData.push(data);
                                map[url] = data;
                            }
                            else {
                                (ranges || []).forEach(function (range) {
                                    var index = binarySearch(range, data);
                                    if (index < 0) {
                                        data.splice(index * -1 + 1, 0, range);
                                    }
                                });
                            }
                            return map;
                        }, coverageMap);
                    }
                });
                adminUrl = env.getAdminUrl();
                console.log("adminUrl", { adminUrl: adminUrl });
                if (!adminUrl) return [3 /*break*/, 4];
                used = utils_1.endTime("all-used");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, axios_1.default.post(adminUrl, buildBody(used, reports, env), {
                        headers: {
                            authorization: env.getAdminToken(),
                        },
                    })];
            case 2:
                response = _a.sent();
                console.log(response.status);
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                console.error("failed to push summary to admin server");
                console.error(e_1);
                return [3 /*break*/, 4];
            case 4:
                report_generator_1.generateReport({ filename: "report.html", results: reports });
                pti.write(allCoverageData);
                child_process_1.spawnSync("nyc", ["report", "--reporter=html"], { stdio: "inherit" });
                console.table(reports.map(function (item) {
                    return {
                        Story: item.storyName,
                        Flow: item.flowName,
                        Steps: item.numberOfStep,
                        "UI Behavior": item.numberOfUIBehavior,
                        Passed: item.numberOfSuccess,
                        Failed: item.numberOfFailed,
                        "Ignored Errors": (item.ignoreErrorList || []).length,
                        "Ajax calls": item.numberOfAjax,
                        "Slow ajax calls": (item.slowAjaxRequest || []).length,
                        "Spent (ms)": Math.round((item.spent || "").split(" ")[1].split("ms")[0]),
                        "Pass Rate(%)": ((item.numberOfSuccess / item.numberOfStep) * 100).toFixed(2).toString(),
                    };
                }), [
                    "Story",
                    "Flow",
                    "Steps",
                    "UI Behavior",
                    "Passed",
                    "Failed",
                    "Ignored Errors",
                    "Ajax calls",
                    "Slow ajax calls",
                    "Spent (ms)",
                    "Pass Rate(%)",
                ]);
                return [2 /*return*/];
        }
    });
}); };

//# sourceMappingURL=print.js.map
