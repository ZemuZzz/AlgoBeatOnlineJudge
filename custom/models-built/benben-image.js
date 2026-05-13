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
var BenbenImage = /** @class */ (function (_super) {
    __extends(BenbenImage, _super);
    function BenbenImage() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BenbenImage.cache = false;
    __decorate([
        TypeORM.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], BenbenImage.prototype, "id");
    __decorate([
        TypeORM.Index(),
        TypeORM.Column({ type: "integer" }),
        __metadata("design:type", Number)
    ], BenbenImage.prototype, "post_id");
    __decorate([
        TypeORM.Column({ type: "varchar", length: 255 }),
        __metadata("design:type", String)
    ], BenbenImage.prototype, "filename");
    __decorate([
        TypeORM.Column({ nullable: true, type: "varchar", length: 255 }),
        __metadata("design:type", String)
    ], BenbenImage.prototype, "original_name");
    __decorate([
        TypeORM.Column({ type: "integer" }),
        __metadata("design:type", Number)
    ], BenbenImage.prototype, "uploader_id");
    __decorate([
        TypeORM.Column({ nullable: true, type: "integer" }),
        __metadata("design:type", Number)
    ], BenbenImage.prototype, "file_size");
    __decorate([
        TypeORM.Column({ type: "integer" }),
        __metadata("design:type", Number)
    ], BenbenImage.prototype, "created_at");
    BenbenImage = __decorate([
        TypeORM.Entity({ name: "benben_image" })
    ], BenbenImage);
    return BenbenImage;
}(common_1["default"]));
exports["default"] = BenbenImage;
