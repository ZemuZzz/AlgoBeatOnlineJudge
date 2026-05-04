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
exports.__esModule = true;
var TypeORM = require("typeorm");
var common_1 = require("./common");

var ProblemSolutionSetting = /** @class */ (function (_super) {
    __extends(ProblemSolutionSetting, _super);
    function ProblemSolutionSetting() {
        return _super !== null && _super.apply(this, arguments) || this;
    }

    ProblemSolutionSetting.cache = false;

    __decorate([
        TypeORM.PrimaryColumn({ type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolutionSetting.prototype, "problem_id");

    __decorate([
        TypeORM.Column({ "default": false, type: "boolean" }),
        __metadata("design:type", Boolean)
    ], ProblemSolutionSetting.prototype, "disable_submission");

    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolutionSetting.prototype, "update_time");

    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolutionSetting.prototype, "updated_by");

    ProblemSolutionSetting = __decorate([
        TypeORM.Entity({ name: "problem_solution_setting" })
    ], ProblemSolutionSetting);

    return ProblemSolutionSetting;
}(common_1["default"]));

exports["default"] = ProblemSolutionSetting;
