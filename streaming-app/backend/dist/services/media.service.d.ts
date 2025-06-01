import { Media, MediaMetadata, MediaType, MovieInfo } from "../entities/Media";
import { WatchHistory } from "../entities/WatchHistory";
export interface MediaSearchFilters {
    query?: string;
    type?: MediaType;
    genre?: string[];
    year?: number;
    rating?: number;
    libraryId?: number;
    userId?: number;
}
export interface MediaSearchOptions {
    page?: number;
    limit?: number;
    sortBy?: "title" | "createdAt" | "viewCount" | "rating" | "year";
    sortOrder?: "ASC" | "DESC";
}
export interface MediaSearchResult {
    medias: Media[];
    total: number;
    page: number;
    totalPages: number;
}
export interface CreateMediaData {
    title: string;
    originalTitle?: string;
    description?: string;
    filePath: string;
    thumbnailPath?: string;
    posterPath?: string;
    backdropPath?: string;
    type: MediaType;
    metadata?: MediaMetadata;
    movieInfo?: MovieInfo;
    libraryId: number;
}
export declare class MediaService {
    private mediaRepository;
    private libraryRepository;
    private watchHistoryRepository;
    private ratingRepository;
    constructor();
    createMedia(data: CreateMediaData): Promise<Media>;
    getMediaById(id: number, userId?: number): Promise<Media>;
    searchMedias(filters?: MediaSearchFilters, options?: MediaSearchOptions): Promise<MediaSearchResult>;
    getPopularMedias(limit?: number): Promise<Media[]>;
    getRecentMedias(limit?: number): Promise<Media[]>;
    getRecommendations(userId: number, limit?: number): Promise<Media[]>;
    updateMedia(id: number, data: Partial<CreateMediaData>): Promise<Media>;
    deleteMedia(id: number): Promise<void>;
    recordView(mediaId: number, userId: number): Promise<void>;
    updateWatchProgress(mediaId: number, userId: number, currentTime: number, totalDuration?: number): Promise<WatchHistory>;
    getUserWatchHistory(userId: number, page?: number, limit?: number): Promise<{
        history: WatchHistory[];
        total: number;
    }>;
    getMediaStats(mediaId: number): Promise<{
        viewCount: number;
        averageRating: number;
        totalRatings: number;
        completionRate: number;
    }>;
}
//# sourceMappingURL=media.service.d.ts.map