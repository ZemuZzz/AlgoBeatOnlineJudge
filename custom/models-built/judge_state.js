"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
exports.__esModule = true;
var TypeORM = require("typeorm");
var common_1 = require("./common");
var user_1 = require("./user");
var problem_1 = require("./problem");
var contest_1 = require("./contest");
var Judger = syzoj.lib('judger');
var Status;
(function (Status) {
    Status["ACCEPTED"] = "Accepted";
    Status["COMPILE_ERROR"] = "Compile Error";
    Status["FILE_ERROR"] = "File Error";
    Status["INVALID_INTERACTION"] = "Invalid Interaction";
    Status["JUDGEMENT_FAILED"] = "Judgement Failed";
    Status["MEMORY_LIMIT_EXCEEDED"] = "Memory Limit Exceeded";
    Status["NO_TESTDATA"] = "No Testdata";
    Status["OUTPUT_LIMIT_EXCEEDED"] = "Output Limit Exceeded";
    Status["PARTIALLY_CORRECT"] = "Partially Correct";
    Status["RUNTIME_ERROR"] = "Runtime Error";
    Status["SYSTEM_ERROR"] = "System Error";
    Status["TIME_LIMIT_EXCEEDED"] = "Time Limit Exceeded";
    Status["UNKNOWN"] = "Unknown";
    Status["WRONG_ANSWER"] = "Wrong Answer";
    Status["WAITING"] = "Waiting";
    Status["CANCELLED"] = "Cancelled";
})(Status || (Status = {}));
var JudgeState = /** @class */ (function (_super) {
    __extends(JudgeState, _super);
    function JudgeState() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    JudgeState.prototype.loadRelationships = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!!this.user) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, user_1["default"].findById(this.user_id)];
                    case 1:
                        _a.user = _c.sent();
                        _c.label = 2;
                    case 2:
                        if (!!this.problem) return [3 /*break*/, 4];
                        if (!this.problem_id) return [3 /*break*/, 4];
                        _b = this;
                        return [4 /*yield*/, problem_1["default"].findById(this.problem_id)];
                    case 3:
                        _b.problem = _c.sent();
                        _c.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    JudgeState.prototype.saveHook = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.score === null)
                    this.score = 0;
                return [2 /*return*/];
            });
        });
    };
    JudgeState.prototype.isAllowedVisitBy = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, contest, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.loadRelationships()];
                    case 1:
                        _d.sent();
                        if (!(user && user.id === this.problem.user_id)) return [3 /*break*/, 2];
                        return [2 /*return*/, true];
                    case 2:
                        if (!(this.type === 0)) return [3 /*break*/, 6];
                        _a = this.problem.is_public;
                        if (_a) return [3 /*break*/, 5];
                        _b = user;
                        if (!_b) return [3 /*break*/, 4];
                        return [4 /*yield*/, user.hasPrivilege('manage_problem')];
                    case 3:
                        _b = (_d.sent());
                        _d.label = 4;
                    case 4:
                        _a = (_b);
                        _d.label = 5;
                    case 5: return [2 /*return*/, _a];
                    case 6:
                        if (!(this.type === 1)) return [3 /*break*/, 11];
                        return [4 /*yield*/, contest_1["default"].findById(this.type_info)];
                    case 7:
                        contest = _d.sent();
                        if (!contest.isRunning()) return [3 /*break*/, 10];
                        _c = user;
                        if (!_c) return [3 /*break*/, 9];
                        return [4 /*yield*/, contest.isSupervisior(user)];
                    case 8:
                        _c = (_d.sent());
                        _d.label = 9;
                    case 9: return [2 /*return*/, _c];
                    case 10: return [2 /*return*/, true];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    JudgeState.prototype.updateRelatedInfo = function (newSubmission) {
        return __awaiter(this, void 0, void 0, function () {
            var promises, contest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.type === 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.loadRelationships()];
                    case 1:
                        _a.sent();
                        promises = [];
                        promises.push(this.user.refreshSubmitInfo());
                        promises.push(this.problem.resetSubmissionCount());
                        if (!newSubmission) {
                            promises.push(this.problem.updateStatistics(this.user_id));
                        }
                        return [4 /*yield*/, Promise.all(promises)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 3:
                        if (!(this.type === 1)) return [3 /*break*/, 6];
                        return [4 /*yield*/, contest_1["default"].findById(this.type_info)];
                    case 4:
                        contest = _a.sent();
                        return [4 /*yield*/, contest.newSubmission(this)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    JudgeState.prototype.rejudge = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, syzoj.utils.lock(['JudgeState::rejudge', this.id], function () { return __awaiter(_this, void 0, void 0, function () {
                            var oldStatus, err_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.loadRelationships()];
                                    case 1:
                                        _a.sent();
                                        oldStatus = this.status;
                                        this.status = Status.UNKNOWN;
                                        this.pending = false;
                                        this.score = null;
                                        if (this.language) {
                                            // language is empty if it's a submit-answer problem
                                            this.total_time = null;
                                            this.max_memory = null;
                                        }
                                        this.result = {};
                                        this.task_id = require('randomstring').generate(10);
                                        return [4 /*yield*/, this.save()];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, this.updateRelatedInfo(false)];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4:
                                        _a.trys.push([4, 7, , 8]);
                                        return [4 /*yield*/, Judger.judge(this, this.problem, 1)];
                                    case 5:
                                        _a.sent();
                                        this.pending = true;
                                        this.status = Status.WAITING;
                                        return [4 /*yield*/, this.save()];
                                    case 6:
                                        _a.sent();
                                        return [3 /*break*/, 8];
                                    case 7:
                                        err_1 = _a.sent();
                                        console.log("Error while connecting to judge frontend: " + err_1.toString());
                                        throw new ErrorMessage("无法开始评测。");
                                    case 8: return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    JudgeState.prototype.getProblemType = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadRelationships()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.problem.type];
                }
            });
        });
    };
    __decorate([
        TypeORM.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], JudgeState.prototype, "id");
    __decorate([
        TypeORM.Column({ nullable: true, type: "mediumtext" }),
        __metadata("design:type", String)
    ], JudgeState.prototype, "code");
    __decorate([
        TypeORM.Column({ nullable: true, type: "varchar", length: 20 }),
        __metadata("design:type", String)
    ], JudgeState.prototype, "language");
    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "enum", "enum": Status }),
        __metadata("design:type", String)
    ], JudgeState.prototype, "status");
    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "varchar", length: 50 }),
        __metadata("design:type", String)
    ], JudgeState.prototype, "task_id");
    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer", "default": 0 }),
        __metadata("design:type", Number)
    ], JudgeState.prototype, "score");
    __decorate([
        TypeORM.Column({ nullable: true, type: "integer", "default": 0 }),
        __metadata("design:type", Number)
    ], JudgeState.prototype, "total_time");
    __decorate([
        TypeORM.Column({ nullable: true, type: "integer", "default": 0 }),
        __metadata("design:type", Number)
    ], JudgeState.prototype, "code_length");
    __decorate([
        TypeORM.Column({ nullable: true, type: "boolean", "default": 0 }),
        __metadata("design:type", Boolean)
    ], JudgeState.prototype, "pending");
    __decorate([
        TypeORM.Column({ nullable: true, type: "integer", "default": 0 }),
        __metadata("design:type", Number)
    ], JudgeState.prototype, "max_memory");
    __decorate([
        TypeORM.Column({ nullable: true, type: "json" }),
        __metadata("design:type", Object)
    ], JudgeState.prototype, "compilation");
    __decorate([
        TypeORM.Column({ nullable: true, type: "json" }),
        __metadata("design:type", Object)
    ], JudgeState.prototype, "result");
    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], JudgeState.prototype, "user_id");
    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], JudgeState.prototype, "problem_id");
    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], JudgeState.prototype, "submit_time");
    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], JudgeState.prototype, "type");
    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], JudgeState.prototype, "type_info");
    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "boolean" }),
        __metadata("design:type", Boolean)
    ], JudgeState.prototype, "is_public");
    JudgeState = __decorate([
        TypeORM.Entity(),
        TypeORM.Index(['type', 'type_info']),
        TypeORM.Index(['type', 'is_public', 'language', 'status', 'problem_id']),
        TypeORM.Index(['type', 'is_public', 'status', 'problem_id']),
        TypeORM.Index(['type', 'is_public', 'problem_id']),
        TypeORM.Index(['type', 'is_public', 'language', 'problem_id']),
        TypeORM.Index(['problem_id', 'type', 'pending', 'score'])
    ], JudgeState);
    return JudgeState;
}(common_1["default"]));
exports["default"] = JudgeState;
//# sourceMappingURL=judge_state.js.map