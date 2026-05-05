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

var Ticket = /** @class */ (function (_super) {
    __extends(Ticket, _super);
    function Ticket() {
        return _super !== null && _super.apply(this, arguments) || this;
    }

    Ticket.cache = false;

    __decorate([
        TypeORM.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], Ticket.prototype, "id");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ type: "varchar", length: 20 }),
        __metadata("design:type", String)
    ], Ticket.prototype, "category");

    __decorate([
        TypeORM.Column({ type: "varchar", length: 60 }),
        __metadata("design:type", String)
    ], Ticket.prototype, "subtype");

    __decorate([
        TypeORM.Column({ type: "varchar", length: 200 }),
        __metadata("design:type", String)
    ], Ticket.prototype, "title");

    __decorate([
        TypeORM.Column({ nullable: true, type: "mediumtext" }),
        __metadata("design:type", String)
    ], Ticket.prototype, "description");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ type: "integer" }),
        __metadata("design:type", Number)
    ], Ticket.prototype, "creator_id");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], Ticket.prototype, "assignee_id");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ "default": "pending", type: "varchar", length: 20 }),
        __metadata("design:type", String)
    ], Ticket.prototype, "status");

    __decorate([
        TypeORM.Column({ nullable: true, type: "varchar", length: 20 }),
        __metadata("design:type", String)
    ], Ticket.prototype, "relation_type");

    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], Ticket.prototype, "relation_id");

    __decorate([
        TypeORM.Column({ nullable: true, type: "text" }),
        __metadata("design:type", String)
    ], Ticket.prototype, "extra_data");

    __decorate([
        TypeORM.Column({ "default": false, type: "boolean" }),
        __metadata("design:type", Boolean)
    ], Ticket.prototype, "is_public");

    __decorate([
        TypeORM.Column({ type: "integer" }),
        __metadata("design:type", Number)
    ], Ticket.prototype, "created_at");

    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ type: "integer" }),
        __metadata("design:type", Number)
    ], Ticket.prototype, "updated_at");

    Ticket = __decorate([
        TypeORM.Entity({ name: "ticket" })
    ], Ticket);

    return Ticket;
}(common_1["default"]));

exports["default"] = Ticket;
