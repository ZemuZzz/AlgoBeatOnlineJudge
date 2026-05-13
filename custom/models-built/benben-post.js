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
var BenbenPost = /** @class */ (function (_super) {
    __extends(BenbenPost, _super);
    function BenbenPost() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BenbenPost.cache = false;
    __decorate([
        TypeORM.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], BenbenPost.prototype, "id");
    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ type: "integer" }),
        __metadata("design:type", Number)
    ], BenbenPost.prototype, "user_id");
    __decorate([
        TypeORM.Column({ type: "text" }),
        __metadata("design:type", String)
    ], BenbenPost.prototype, "content");
    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], BenbenPost.prototype, "reply_to");
    __decorate([
        TypeORM.Column({ "default": 0, type: "tinyint" }),
        __metadata("design:type", Number)
    ], BenbenPost.prototype, "is_deleted");
    __decorate([
        TypeORM.Column({ type: "integer" }),
        __metadata("design:type", Number)
    ], BenbenPost.prototype, "created_at");
    BenbenPost = __decorate([
        TypeORM.Entity({ name: "benben_post" })
    ], BenbenPost);
    return BenbenPost;
}(common_1["default"]));
exports["default"] = BenbenPost;
