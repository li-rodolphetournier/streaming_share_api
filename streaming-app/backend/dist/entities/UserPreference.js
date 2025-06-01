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
exports.UserPreference = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let UserPreference = class UserPreference {
    id;
    videoPreferences;
    notificationPreferences;
    privacyPreferences;
    theme;
    language;
    timezone;
    adultContent;
    parentalPin;
    createdAt;
    updatedAt;
    user;
    getDefaultVideoPreferences() {
        return {
            defaultQuality: "1080p",
            autoPlay: true,
            subtitlesEnabled: false,
            subtitleLanguage: "fr",
            audioLanguage: "fr",
            skipIntro: false,
            skipCredits: false,
        };
    }
    getDefaultNotificationPreferences() {
        return {
            newContent: true,
            recommendations: true,
            watchReminders: false,
            email: true,
            push: false,
        };
    }
    getDefaultPrivacyPreferences() {
        return {
            shareWatchHistory: false,
            shareRatings: true,
            allowRecommendations: true,
            dataCollection: true,
        };
    }
    initializeDefaults() {
        if (!this.videoPreferences) {
            this.videoPreferences = this.getDefaultVideoPreferences();
        }
        if (!this.notificationPreferences) {
            this.notificationPreferences = this.getDefaultNotificationPreferences();
        }
        if (!this.privacyPreferences) {
            this.privacyPreferences = this.getDefaultPrivacyPreferences();
        }
    }
    updateVideoPreferences(preferences) {
        this.videoPreferences = {
            ...this.getDefaultVideoPreferences(),
            ...this.videoPreferences,
            ...preferences,
        };
    }
    updateNotificationPreferences(preferences) {
        this.notificationPreferences = {
            ...this.getDefaultNotificationPreferences(),
            ...this.notificationPreferences,
            ...preferences,
        };
    }
    updatePrivacyPreferences(preferences) {
        this.privacyPreferences = {
            ...this.getDefaultPrivacyPreferences(),
            ...this.privacyPreferences,
            ...preferences,
        };
    }
    hasParentalControl() {
        return !!this.parentalPin;
    }
    verifyParentalPin(pin) {
        return this.parentalPin === pin;
    }
};
exports.UserPreference = UserPreference;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserPreference.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], UserPreference.prototype, "videoPreferences", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], UserPreference.prototype, "notificationPreferences", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], UserPreference.prototype, "privacyPreferences", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "theme", length: 20, default: "dark" }),
    __metadata("design:type", String)
], UserPreference.prototype, "theme", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "language", length: 10, default: "fr" }),
    __metadata("design:type", String)
], UserPreference.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "timezone", length: 50, default: "Europe/Paris" }),
    __metadata("design:type", String)
], UserPreference.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "adult_content", default: false }),
    __metadata("design:type", Boolean)
], UserPreference.prototype, "adultContent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "parental_pin", length: 6, nullable: true }),
    __metadata("design:type", String)
], UserPreference.prototype, "parentalPin", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], UserPreference.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], UserPreference.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => User_1.User, (user) => user.preferences, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", User_1.User)
], UserPreference.prototype, "user", void 0);
exports.UserPreference = UserPreference = __decorate([
    (0, typeorm_1.Entity)("user_preferences")
], UserPreference);
//# sourceMappingURL=UserPreference.js.map