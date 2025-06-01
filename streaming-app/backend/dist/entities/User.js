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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const class_transformer_1 = require("class-transformer");
const Library_1 = require("./Library");
const MediaRating_1 = require("./MediaRating");
const UserPreference_1 = require("./UserPreference");
const WatchHistory_1 = require("./WatchHistory");
let User = class User {
    id;
    email;
    password;
    role;
    firstName;
    lastName;
    avatar;
    isActive;
    emailVerified;
    lastLogin;
    loginAttempts;
    lockedUntil;
    createdAt;
    updatedAt;
    libraries;
    watchHistory;
    ratings;
    preferences;
    get fullName() {
        if (this.firstName && this.lastName) {
            return `${this.firstName} ${this.lastName}`;
        }
        return this.firstName || this.lastName || this.email;
    }
    get isLocked() {
        return this.lockedUntil ? this.lockedUntil > new Date() : false;
    }
    incrementLoginAttempts() {
        this.loginAttempts += 1;
        if (this.loginAttempts >= 5) {
            this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
    }
    resetLoginAttempts() {
        this.loginAttempts = 0;
        this.lockedUntil = undefined;
        this.lastLogin = new Date();
    }
    isAdmin() {
        return this.role === "admin";
    }
    getStats() {
        return {
            totalWatchTime: 0,
            favoriteGenres: [],
            totalRatings: 0,
        };
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 255 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["admin", "user"],
        default: "user",
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "first_name", length: 100, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "last_name", length: 100, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_active", default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "email_verified", default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "emailVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "last_login", type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "login_attempts", default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "loginAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "locked_until", type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lockedUntil", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Library_1.Library, (library) => library.owner),
    __metadata("design:type", Array)
], User.prototype, "libraries", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => WatchHistory_1.WatchHistory, (history) => history.user),
    __metadata("design:type", Array)
], User.prototype, "watchHistory", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MediaRating_1.MediaRating, (rating) => rating.user),
    __metadata("design:type", Array)
], User.prototype, "ratings", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => UserPreference_1.UserPreference, (preference) => preference.user),
    __metadata("design:type", UserPreference_1.UserPreference)
], User.prototype, "preferences", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)("users"),
    (0, typeorm_1.Index)(["email"], { unique: true })
], User);
//# sourceMappingURL=User.js.map