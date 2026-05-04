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

var PrivateMessage = /** @class */ (function (_super) {
    __extends(PrivateMessage, _super);
    function PrivateMessage() {
        return _super !== null && _super.apply(this, arguments) || this;
    }

    PrivateMessage.cache = false;

    __decorate([
        TypeORM.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], PrivateMessage.prototype, "id");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], PrivateMessage.prototype, "sender_id");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], PrivateMessage.prototype, "receiver_id");

    __decorate([
        TypeORM.Column({ nullable: true, type: "text" }),
        __metadata("design:type", String)
    ], PrivateMessage.prototype, "content");

    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], PrivateMessage.prototype, "public_time");

    __decorate([
        TypeORM.Column({ "default": false, type: "boolean" }),
        __metadata("design:type", Boolean)
    ], PrivateMessage.prototype, "is_read");

    __decorate([
        TypeORM.Column({ "default": false, type: "boolean" }),
        __metadata("design:type", Boolean)
    ], PrivateMessage.prototype, "sender_deleted");

    __decorate([
        TypeORM.Column({ "default": false, type: "boolean" }),
        __metadata("design:type", Boolean)
    ], PrivateMessage.prototype, "receiver_deleted");

    PrivateMessage = __decorate([
        TypeORM.Entity({ name: "private_message" })
    ], PrivateMessage);

    return PrivateMessage;
}(common_1["default"]));

exports["default"] = PrivateMessage;
