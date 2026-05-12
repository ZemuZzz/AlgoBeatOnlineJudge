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

var ProblemSolution = /** @class */ (function (_super) {
    __extends(ProblemSolution, _super);
    function ProblemSolution() {
        return _super !== null && _super.apply(this, arguments) || this;
    }

    ProblemSolution.cache = false;

    // 权限判断:管理员 / 投稿者本人可以编辑
    ProblemSolution.prototype.isAllowedEditBy = function (user) {
        return user && (user.is_admin || this.user_id === user.id);
    };

    // 权限判断:管理员可以审核
    ProblemSolution.prototype.isAllowedReviewBy = function (user) {
        return user && user.is_admin;
    };

    // 权限判断:谁能看到这篇题解
    ProblemSolution.prototype.isAllowedSeeBy = async function (user) {
        // 已通过审核的题解所有人可见
        if (this.status === 'accepted') return true;
        if (!user) return false;
        // 未通过审核的,投稿者本人/管理员/有题目管理权限的人可见
        if (user.is_admin || this.user_id === user.id) return true;
        if (await user.hasPrivilege('manage_problem')) return true;
        return false;
    };
    // 重新计算评论数(每次新增/删除评论后调用)
    ProblemSolution.prototype.resetCommentsNum = async function () {
        var ProblemSolutionComment = require('./problem-solution-comment').default;
        this.comments_num = await ProblemSolutionComment.count({ solution_id: this.id });
        await this.save();
    };

    // 是否允许某用户评论
    ProblemSolution.prototype.isAllowedCommentBy = function (user) {
        if (!user) return false;                     // 未登录不能评论
        if (this.status !== 'accepted') return false; // 仅已通过的题解可评论
        if (!this.allow_comment) {                   // 作者关闭了评论
            // 但作者本人和管理员仍可评论
            if (user.is_admin) return true;
            if (this.user_id === user.id) return true;
            return false;
        }
        return true;
    };

    __decorate([
        TypeORM.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], ProblemSolution.prototype, "id");

    __decorate([
        TypeORM.Column({ nullable: true, type: "varchar", length: 80 }),
        __metadata("design:type", String)
    ], ProblemSolution.prototype, "title");

    __decorate([
        TypeORM.Column({ nullable: true, type: "mediumtext" }),
        __metadata("design:type", String)
    ], ProblemSolution.prototype, "content");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolution.prototype, "problem_id");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolution.prototype, "user_id");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ "default": "pending", type: "varchar", length: 20 }),
        __metadata("design:type", String)
    ], ProblemSolution.prototype, "status");

    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolution.prototype, "public_time");

    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolution.prototype, "update_time");

    __decorate([
        TypeORM.Column({ nullable: true, type: "varchar", length: 255 }),
        __metadata("design:type", String)
    ], ProblemSolution.prototype, "reject_reason");
    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolution.prototype, "reviewer_id");
    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolution.prototype, "reviewed_at");
    __decorate([
        TypeORM.Column({ "default": true, type: "boolean" }),
        __metadata("design:type", Boolean)
    ], ProblemSolution.prototype, "allow_comment");

    __decorate([
        TypeORM.Column({ "default": 0, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolution.prototype, "comments_num");
    ProblemSolution = __decorate([
        TypeORM.Entity({ name: "problem_solution" })
    ], ProblemSolution);

    return ProblemSolution;
}(common_1["default"]));

exports["default"] = ProblemSolution;
