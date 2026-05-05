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

var EmailVerificationToken = /** @class */ (function (_super) {
    __extends(EmailVerificationToken, _super);
    function EmailVerificationToken() {
        return _super !== null && _super.apply(this, arguments) || this;
    }

    EmailVerificationToken.cache = false;

    __decorate([
        TypeORM.PrimaryColumn({ type: "varchar", length: 64 }),
        __metadata("design:type", String)
    ], EmailVerificationToken.prototype, "token");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ type: "integer" }),
        __metadata("design:type", Number)
    ], EmailVerificationToken.prototype, "user_id");

    __decorate([
        TypeORM.Column({ nullable: true, type: "varchar", length: 120 }),
        __metadata("design:type", String)
    ], EmailVerificationToken.prototype, "email");

    __decorate([
        TypeORM.Column({ "default": "register", type: "varchar", length: 20 }),
        __metadata("design:type", String)
    ], EmailVerificationToken.prototype, "purpose");

    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], EmailVerificationToken.prototype, "created_at");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], EmailVerificationToken.prototype, "expires_at");

    __decorate([
        TypeORM.Column({ "default": false, type: "boolean" }),
        __metadata("design:type", Boolean)
    ], EmailVerificationToken.prototype, "used");

    EmailVerificationToken = __decorate([
        TypeORM.Entity({ name: "email_verification_token" })
    ], EmailVerificationToken);

    return EmailVerificationToken;
}(common_1["default"]));

exports["default"] = EmailVerificationToken;
