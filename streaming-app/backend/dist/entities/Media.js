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
exports.Media = void 0;
const typeorm_1 = require("typeorm");
const Library_1 = require("./Library");
const MediaRating_1 = require("./MediaRating");
const WatchHistory_1 = require("./WatchHistory");
let Media = class Media {
    id;
    title;
    originalTitle;
    description;
    filePath;
    thumbnailPath;
    posterPath;
    backdropPath;
    type;
    metadata;
    movieInfo;
    viewCount;
    lastViewedAt;
    fileSize;
    fileHash;
    isProcessed;
    processingStatus;
    hlsPath;
    availableQualities;
    createdAt;
    updatedAt;
    library;
    watchHistory;
    ratings;
    get duration() {
        return this.metadata?.duration || 0;
    }
    get resolution() {
        return this.metadata?.resolution || "Unknown";
    }
    get formattedDuration() {
        const duration = this.duration;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
    get formattedFileSize() {
        if (!this.fileSize)
            return "Unknown";
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
        return `${(this.fileSize / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }
    get averageRating() {
        if (!this.ratings || this.ratings.length === 0)
            return 0;
        const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
        return Math.round((sum / this.ratings.length) * 10) / 10;
    }
    get genres() {
        return this.movieInfo?.genre || [];
    }
    get year() {
        return this.movieInfo?.year;
    }
    get director() {
        return this.movieInfo?.director;
    }
    get cast() {
        return this.movieInfo?.cast || [];
    }
    isStreamingReady() {
        return (this.isProcessed &&
            this.processingStatus === "completed" &&
            !!this.hlsPath);
    }
    getBestQuality() {
        if (!this.availableQualities || this.availableQualities.length === 0) {
            return undefined;
        }
        const qualityOrder = ["2160p", "1440p", "1080p", "720p", "480p", "360p"];
        for (const quality of qualityOrder) {
            if (this.availableQualities.includes(quality)) {
                return quality;
            }
        }
        return this.availableQualities[0];
    }
    incrementViewCount() {
        this.viewCount += 1;
        this.lastViewedAt = new Date();
    }
    async fileExists() {
        return true;
    }
};
exports.Media = Media;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Media.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Media.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "original_title", length: 500, nullable: true }),
    __metadata("design:type", String)
], Media.prototype, "originalTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Media.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "file_path", length: 1000, unique: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Media.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "thumbnail_path", length: 1000, nullable: true }),
    __metadata("design:type", String)
], Media.prototype, "thumbnailPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "poster_path", length: 1000, nullable: true }),
    __metadata("design:type", String)
], Media.prototype, "posterPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "backdrop_path", length: 1000, nullable: true }),
    __metadata("design:type", String)
], Media.prototype, "backdropPath", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["movie", "tv", "music", "photo"],
        default: "movie",
    }),
    __metadata("design:type", String)
], Media.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], Media.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "movie_info", type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], Media.prototype, "movieInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "view_count", default: 0 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Media.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "last_viewed_at", type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Media.prototype, "lastViewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "file_size", type: "bigint", nullable: true }),
    __metadata("design:type", Number)
], Media.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "file_hash", length: 64, nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Media.prototype, "fileHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "is_processed", default: false }),
    __metadata("design:type", Boolean)
], Media.prototype, "isProcessed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "processing_status", length: 50, default: "pending" }),
    __metadata("design:type", String)
], Media.prototype, "processingStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "hls_path", length: 1000, nullable: true }),
    __metadata("design:type", String)
], Media.prototype, "hlsPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "available_qualities", type: "simple-array", nullable: true }),
    __metadata("design:type", Array)
], Media.prototype, "availableQualities", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Media.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Media.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Library_1.Library, (library) => library.medias, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "library_id" }),
    __metadata("design:type", Library_1.Library)
], Media.prototype, "library", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => WatchHistory_1.WatchHistory, (history) => history.media),
    __metadata("design:type", Array)
], Media.prototype, "watchHistory", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MediaRating_1.MediaRating, (rating) => rating.media),
    __metadata("design:type", Array)
], Media.prototype, "ratings", void 0);
exports.Media = Media = __decorate([
    (0, typeorm_1.Entity)("media"),
    (0, typeorm_1.Index)(["title"]),
    (0, typeorm_1.Index)(["library", "createdAt"]),
    (0, typeorm_1.Index)(["viewCount"])
], Media);
//# sourceMappingURL=Media.js.map