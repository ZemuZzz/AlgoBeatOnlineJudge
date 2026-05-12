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
var HomepageBanner = /** @class */ (function (_super) {
    __extends(HomepageBanner, _super);
    function HomepageBanner() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HomepageBanner.cache = false;
    HomepageBanner.prototype.isCurrentlyActive = function () {
        if (!this.is_active) return false;
        var now = parseInt((new Date()).getTime() / 1000);
        if (this.start_time && now < this.start_time) return false;
        if (this.end_time && now > this.end_time) return false;
        return true;
    };
    __decorate([
        TypeORM.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], HomepageBanner.prototype, "id");
    __decorate([
        TypeORM.Column({ type: "varchar", length: 100 }),
        __metadata("design:type", String)
    ], HomepageBanner.prototype, "title");
    __decorate([
        TypeORM.Column({ type: "varchar", length: 500 }),
        __metadata("design:type", String)
    ], HomepageBanner.prototype, "image_path");
    __decorate([
        TypeORM.Column({ nullable: true, type: "varchar", length: 500 }),
        __metadata("design:type", String)
    ], HomepageBanner.prototype, "link_url");
    __decorate([
        TypeORM.Column({ "default": 0, type: "integer" }),
        __metadata("design:type", Number)
    ], HomepageBanner.prototype, "sort_order");
    __decorate([
        TypeORM.Column({ "default": 1, type: "tinyint" }),
        __metadata("design:type", Number)
    ], HomepageBanner.prototype, "is_active");
    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], HomepageBanner.prototype, "start_time");
    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], HomepageBanner.prototype, "end_time");
    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], HomepageBanner.prototype, "created_by");
    __decorate([
        TypeORM.Column({ type: "integer" }),
        __metadata("design:type", Number)
    ], HomepageBanner.prototype, "created_at");
    HomepageBanner = __decorate([
        TypeORM.Entity({ name: "homepage_banner" })
    ], HomepageBanner);
    return HomepageBanner;
}(common_1["default"]));
exports["default"] = HomepageBanner;
