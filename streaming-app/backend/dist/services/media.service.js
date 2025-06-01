"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const Media_1 = require("../entities/Media");
const database_1 = require("../config/database");
const Library_1 = require("../entities/Library");
const MediaRating_1 = require("../entities/MediaRating");
const WatchHistory_1 = require("../entities/WatchHistory");
class MediaService {
    mediaRepository;
    libraryRepository;
    watchHistoryRepository;
    ratingRepository;
    constructor() {
        this.mediaRepository = database_1.AppDataSource.getRepository(Media_1.Media);
        this.libraryRepository = database_1.AppDataSource.getRepository(Library_1.Library);
        this.watchHistoryRepository = database_1.AppDataSource.getRepository(WatchHistory_1.WatchHistory);
        this.ratingRepository = database_1.AppDataSource.getRepository(MediaRating_1.MediaRating);
    }
    async createMedia(data) {
        const library = await this.libraryRepository.findOne({
            where: { id: data.libraryId },
        });
        if (!library) {
            throw new Error("Bibliothèque non trouvée");
        }
        const existingMedia = await this.mediaRepository.findOne({
            where: { filePath: data.filePath },
        });
        if (existingMedia) {
            throw new Error("Un média avec ce chemin de fichier existe déjà");
        }
        const media = this.mediaRepository.create({
            ...data,
            library,
        });
        return this.mediaRepository.save(media);
    }
    async getMediaById(id, userId) {
        const media = await this.mediaRepository.findOne({
            where: { id },
            relations: ["library", "ratings", "watchHistory"],
        });
        if (!media) {
            throw new Error("Média non trouvé");
        }
        if (userId) {
            const userWatchHistory = await this.watchHistoryRepository.findOne({
                where: { media: { id }, user: { id: userId } },
            });
            if (userWatchHistory) {
                media.watchHistory = [userWatchHistory];
            }
        }
        return media;
    }
    async searchMedias(filters = {}, options = {}) {
        const { query, type, genre, year, rating, libraryId, userId } = filters;
        const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "DESC", } = options;
        const queryBuilder = this.mediaRepository
            .createQueryBuilder("media")
            .leftJoinAndSelect("media.library", "library")
            .leftJoinAndSelect("media.ratings", "ratings");
        if (query) {
            queryBuilder.andWhere("(media.title ILIKE :query OR media.originalTitle ILIKE :query OR media.description ILIKE :query)", { query: `%${query}%` });
        }
        if (type) {
            queryBuilder.andWhere("media.type = :type", { type });
        }
        if (genre && genre.length > 0) {
            queryBuilder.andWhere("media.movieInfo->>'genre' ?| array[:...genres]", {
                genres: genre,
            });
        }
        if (year) {
            queryBuilder.andWhere("CAST(media.movieInfo->>'year' AS INTEGER) = :year", { year });
        }
        if (rating) {
            queryBuilder.andWhere("(SELECT AVG(CAST(r.rating AS DECIMAL)) FROM media_ratings r WHERE r.media_id = media.id) >= :rating", { rating });
        }
        if (libraryId) {
            queryBuilder.andWhere("media.library.id = :libraryId", { libraryId });
        }
        if (userId) {
            queryBuilder.leftJoinAndSelect("media.watchHistory", "watchHistory", "watchHistory.user.id = :userId", { userId });
        }
        switch (sortBy) {
            case "title":
                queryBuilder.orderBy("media.title", sortOrder);
                break;
            case "viewCount":
                queryBuilder.orderBy("media.viewCount", sortOrder);
                break;
            case "rating":
                queryBuilder.orderBy("(SELECT AVG(CAST(r.rating AS DECIMAL)) FROM media_ratings r WHERE r.media_id = media.id)", sortOrder);
                break;
            case "year":
                queryBuilder.orderBy("CAST(media.movieInfo->>'year' AS INTEGER)", sortOrder);
                break;
            default:
                queryBuilder.orderBy("media.createdAt", sortOrder);
        }
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);
        const [medias, total] = await queryBuilder.getManyAndCount();
        return {
            medias,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getPopularMedias(limit = 10) {
        return this.mediaRepository.find({
            order: { viewCount: "DESC" },
            take: limit,
            relations: ["library", "ratings"],
        });
    }
    async getRecentMedias(limit = 10) {
        return this.mediaRepository.find({
            order: { createdAt: "DESC" },
            take: limit,
            relations: ["library", "ratings"],
        });
    }
    async getRecommendations(userId, limit = 10) {
        const userHistory = await this.watchHistoryRepository.find({
            where: { user: { id: userId } },
            relations: ["media"],
            order: { lastWatched: "DESC" },
            take: 20,
        });
        if (userHistory.length === 0) {
            return this.getPopularMedias(limit);
        }
        const preferredGenres = new Set();
        userHistory.forEach((history) => {
            const genres = history.media.movieInfo?.genre || [];
            genres.forEach((genre) => preferredGenres.add(genre));
        });
        if (preferredGenres.size === 0) {
            return this.getPopularMedias(limit);
        }
        const queryBuilder = this.mediaRepository
            .createQueryBuilder("media")
            .leftJoinAndSelect("media.library", "library")
            .leftJoinAndSelect("media.ratings", "ratings")
            .where("media.id NOT IN (:...watchedIds)", {
            watchedIds: userHistory.map((h) => h.media.id),
        });
        const genreArray = Array.from(preferredGenres);
        queryBuilder.andWhere("media.movieInfo->>'genre' ?| array[:...genres]", {
            genres: genreArray,
        });
        return queryBuilder
            .orderBy("media.viewCount", "DESC")
            .take(limit)
            .getMany();
    }
    async updateMedia(id, data) {
        const media = await this.mediaRepository.findOne({
            where: { id },
        });
        if (!media) {
            throw new Error("Média non trouvé");
        }
        if (data.libraryId) {
            const library = await this.libraryRepository.findOne({
                where: { id: data.libraryId },
            });
            if (!library) {
                throw new Error("Bibliothèque non trouvée");
            }
            media.library = library;
        }
        Object.assign(media, data);
        return this.mediaRepository.save(media);
    }
    async deleteMedia(id) {
        const media = await this.mediaRepository.findOne({
            where: { id },
        });
        if (!media) {
            throw new Error("Média non trouvé");
        }
        await this.mediaRepository.remove(media);
    }
    async recordView(mediaId, userId) {
        const media = await this.mediaRepository.findOne({
            where: { id: mediaId },
        });
        if (!media) {
            throw new Error("Média non trouvé");
        }
        media.incrementViewCount();
        await this.mediaRepository.save(media);
        let watchHistory = await this.watchHistoryRepository.findOne({
            where: { media: { id: mediaId }, user: { id: userId } },
        });
        if (watchHistory) {
            watchHistory.incrementWatchCount();
        }
        else {
            watchHistory = this.watchHistoryRepository.create({
                media: { id: mediaId },
                user: { id: userId },
                watchedDuration: 0,
                totalDuration: media.duration,
            });
        }
        await this.watchHistoryRepository.save(watchHistory);
    }
    async updateWatchProgress(mediaId, userId, currentTime, totalDuration) {
        let watchHistory = await this.watchHistoryRepository.findOne({
            where: { media: { id: mediaId }, user: { id: userId } },
        });
        if (!watchHistory) {
            watchHistory = this.watchHistoryRepository.create({
                media: { id: mediaId },
                user: { id: userId },
                watchedDuration: 0,
                totalDuration: totalDuration || 0,
            });
        }
        watchHistory.updateProgress(currentTime, totalDuration);
        return this.watchHistoryRepository.save(watchHistory);
    }
    async getUserWatchHistory(userId, page = 1, limit = 20) {
        const [history, total] = await this.watchHistoryRepository.findAndCount({
            where: { user: { id: userId } },
            relations: ["media", "media.library"],
            order: { lastWatched: "DESC" },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { history, total };
    }
    async getMediaStats(mediaId) {
        const media = await this.mediaRepository.findOne({
            where: { id: mediaId },
            relations: ["ratings", "watchHistory"],
        });
        if (!media) {
            throw new Error("Média non trouvé");
        }
        const totalWatches = media.watchHistory.length;
        const completedWatches = media.watchHistory.filter((h) => h.isCompleted).length;
        return {
            viewCount: media.viewCount,
            averageRating: media.averageRating,
            totalRatings: media.ratings.length,
            completionRate: totalWatches > 0 ? completedWatches / totalWatches : 0,
        };
    }
}
exports.MediaService = MediaService;
//# sourceMappingURL=media.service.js.map