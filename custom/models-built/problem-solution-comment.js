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

var ProblemSolutionComment = /** @class */ (function (_super) {
    __extends(ProblemSolutionComment, _super);
    function ProblemSolutionComment() {
        return _super !== null && _super.apply(this, arguments) || this;
    }

    ProblemSolutionComment.cache = false;

    // 异步加载关联的用户和题解
    ProblemSolutionComment.prototype.loadRelationships = async function () {
        var User = require('./user').default;
        var ProblemSolution = require('./problem-solution').default;
        this.user = await User.findById(this.user_id);
        this.solution = await ProblemSolution.findById(this.solution_id);
    };

    // 谁能编辑/删除这条评论:管理员/评论作者本人/题解作者本人
    ProblemSolutionComment.prototype.isAllowedEditBy = async function (user) {
        if (!user) return false;
        if (user.is_admin) return true;
        if (this.user_id === user.id) return true;
        await this.loadRelationships();
        if (this.solution && this.solution.user_id === user.id) return true;
        if (await user.hasPrivilege('manage_problem')) return true;
        return false;
    };

    __decorate([
        TypeORM.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], ProblemSolutionComment.prototype, "id");

    __decorate([
        TypeORM.Column({ nullable: true, type: "text" }),
        __metadata("design:type", String)
    ], ProblemSolutionComment.prototype, "content");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolutionComment.prototype, "solution_id");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolutionComment.prototype, "user_id");

    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], ProblemSolutionComment.prototype, "public_time");

    ProblemSolutionComment = __decorate([
        TypeORM.Entity({ name: "problem_solution_comment" })
    ], ProblemSolutionComment);

    return ProblemSolutionComment;
}(common_1["default"]));

exports["default"] = ProblemSolutionComment;
