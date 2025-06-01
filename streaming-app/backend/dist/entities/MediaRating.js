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
exports.MediaRating = void 0;
const typeorm_1 = require("typeorm");
const Media_1 = require("./Media");
const User_1 = require("./User");
let MediaRating = class MediaRating {
    id;
    rating;
    review;
    isSpoiler;
    helpfulCount;
    reportedCount;
    createdAt;
    updatedAt;
    user;
    media;
    get formattedRating() {
        return `${this.rating.toFixed(1)}/10`;
    }
    get ratingStars() {
        const stars = Math.round(this.rating / 2);
        return "★".repeat(stars) + "☆".repeat(5 - stars);
    }
    isValidRating() {
        return this.rating >= 0 && this.rating <= 10;
    }
    incrementHelpful() {
        this.helpfulCount += 1;
    }
    incrementReported() {
        this.reportedCount += 1;
    }
    get isReported() {
        return this.reportedCount > 0;
    }
    get helpfulRatio() {
        const total = this.helpfulCount + this.reportedCount;
        return total > 0 ? this.helpfulCount / total : 0;
    }
};
exports.MediaRating = MediaRating;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MediaRating.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 3,
        scale: 1,
        transformer: {
            to: (value) => value,
            from: (value) => parseFloat(value),
        },
    }),
    __metadata("design:type", Number)
], MediaRating.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], MediaRating.prototype, "review", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_spoiler", default: false }),
    __metadata("design:type", Boolean)
], MediaRating.prototype, "isSpoiler", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "helpful_count", default: 0 }),
    __metadata("design:type", Number)
], MediaRating.prototype, "helpfulCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "reported_count", default: 0 }),
    __metadata("design:type", Number)
], MediaRating.prototype, "reportedCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], MediaRating.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], MediaRating.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.ratings, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", User_1.User)
], MediaRating.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Media_1.Media, (media) => media.ratings, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "media_id" }),
    __metadata("design:type", Media_1.Media)
], MediaRating.prototype, "media", void 0);
exports.MediaRating = MediaRating = __decorate([
    (0, typeorm_1.Entity)("media_ratings"),
    (0, typeorm_1.Unique)(["user", "media"]),
    (0, typeorm_1.Index)(["media", "rating"])
], MediaRating);
//# sourceMappingURL=MediaRating.js.map