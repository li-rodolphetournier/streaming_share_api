"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Library = void 0;
const typeorm_1 = require("typeorm");
const Media_1 = require("./Media");
const User_1 = require("./User");
let Library = class Library {
    id;
    name;
    path;
    type;
    description;
    isActive;
    lastScanDate;
    scanInProgress;
    autoScan;
    scanInterval;
    createdAt;
    updatedAt;
    owner;
    medias;
    get mediaCount() {
        return this.medias?.length || 0;
    }
    get totalSize() {
        if (!this.medias)
            return 0;
        return this.medias.reduce((total, media) => total + (media.fileSize || 0), 0);
    }
    get formattedTotalSize() {
        const size = this.totalSize;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(size) / Math.log(1024));
        return `${(size / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }
    needsScan() {
        if (!this.autoScan || this.scanInProgress)
            return false;
        if (!this.lastScanDate)
            return true;
        const hoursSinceLastScan = (Date.now() - this.lastScanDate.getTime()) / (1000 * 60 * 60);
        return hoursSinceLastScan >= this.scanInterval;
    }
    startScan() {
        this.scanInProgress = true;
        this.lastScanDate = new Date();
    }
    finishScan() {
        this.scanInProgress = false;
    }
};
exports.Library = Library;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Library.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Library.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 1000 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Library.prototype, "path", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["movie", "tv", "music", "photo"],
        default: "movie",
    }),
    __metadata("design:type", String)
], Library.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Library.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_active", default: true }),
    __metadata("design:type", Boolean)
], Library.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "last_scan_date", type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Library.prototype, "lastScanDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "scan_in_progress", default: false }),
    __metadata("design:type", Boolean)
], Library.prototype, "scanInProgress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "auto_scan", default: true }),
    __metadata("design:type", Boolean)
], Library.prototype, "autoScan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "scan_interval", default: 24 }),
    __metadata("design:type", Number)
], Library.prototype, "scanInterval", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Library.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Library.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.libraries, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "owner_id" }),
    __metadata("design:type", User_1.User)
], Library.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Media_1.Media, (media) => media.library),
    __metadata("design:type", Array)
], Library.prototype, "medias", void 0);
exports.Library = Library = __decorate([
    (0, typeorm_1.Entity)("libraries"),
    (0, typeorm_1.Index)(["owner", "name"])
], Library);
//# sourceMappingURL=Library.js.map