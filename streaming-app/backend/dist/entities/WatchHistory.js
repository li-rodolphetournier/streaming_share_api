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
exports.WatchHistory = void 0;
const typeorm_1 = require("typeorm");
const Media_1 = require("./Media");
const User_1 = require("./User");
let WatchHistory = class WatchHistory {
    id;
    watchedDuration;
    totalDuration;
    progressPercentage;
    isCompleted;
    lastWatched;
    watchCount;
    createdAt;
    updatedAt;
    user;
    media;
    updateProgress(currentTime, totalDuration) {
        this.watchedDuration = currentTime;
        if (totalDuration) {
            this.totalDuration = totalDuration;
        }
        if (this.totalDuration > 0) {
            this.progressPercentage =
                Math.round((this.watchedDuration / this.totalDuration) * 100 * 100) /
                    100;
            this.isCompleted = this.progressPercentage >= 90;
        }
        this.lastWatched = new Date();
    }
    incrementWatchCount() {
        this.watchCount += 1;
        this.lastWatched = new Date();
    }
    get formattedProgress() {
        return `${this.progressPercentage.toFixed(1)}%`;
    }
    get remainingTime() {
        return Math.max(0, this.totalDuration - this.watchedDuration);
    }
    get formattedRemainingTime() {
        const remaining = this.remainingTime;
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m restantes`;
        }
        return `${minutes}m restantes`;
    }
};
exports.WatchHistory = WatchHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WatchHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "watched_duration", default: 0 }),
    __metadata("design:type", Number)
], WatchHistory.prototype, "watchedDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "total_duration", default: 0 }),
    __metadata("design:type", Number)
], WatchHistory.prototype, "totalDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "progress_percentage",
        type: "decimal",
        precision: 5,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], WatchHistory.prototype, "progressPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_completed", default: false }),
    __metadata("design:type", Boolean)
], WatchHistory.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "last_watched",
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], WatchHistory.prototype, "lastWatched", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "watch_count", default: 1 }),
    __metadata("design:type", Number)
], WatchHistory.prototype, "watchCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], WatchHistory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], WatchHistory.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.watchHistory, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", User_1.User)
], WatchHistory.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Media_1.Media, (media) => media.watchHistory, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "media_id" }),
    __metadata("design:type", Media_1.Media)
], WatchHistory.prototype, "media", void 0);
exports.WatchHistory = WatchHistory = __decorate([
    (0, typeorm_1.Entity)("watch_history"),
    (0, typeorm_1.Index)(["user", "lastWatched"]),
    (0, typeorm_1.Index)(["media", "lastWatched"])
], WatchHistory);
//# sourceMappingURL=WatchHistory.js.map