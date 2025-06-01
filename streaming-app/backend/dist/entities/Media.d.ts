import { Library } from "./Library";
import { MediaRating } from "./MediaRating";
import { WatchHistory } from "./WatchHistory";
export type MediaType = "movie" | "tv" | "music" | "photo";
export interface MediaMetadata {
    duration: number;
    resolution: string;
    codec: string;
    bitrate: number;
    size: number;
    fps: number;
    audioCodec?: string;
    audioChannels?: number;
    subtitles?: string[];
    chapters?: Array<{
        title: string;
        startTime: number;
        endTime: number;
    }>;
}
export interface MovieInfo {
    year?: number;
    genre?: string[];
    rating?: number;
    director?: string;
    cast?: string[];
    imdbId?: string;
    tmdbId?: number;
    plot?: string;
    country?: string;
    language?: string;
    awards?: string;
    poster?: string;
    backdrop?: string;
    trailer?: string;
}
export declare class Media {
    id: number;
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
    viewCount: number;
    lastViewedAt?: Date;
    fileSize?: number;
    fileHash?: string;
    isProcessed: boolean;
    processingStatus: "pending" | "processing" | "completed" | "failed";
    hlsPath?: string;
    availableQualities?: string[];
    createdAt: Date;
    updatedAt: Date;
    library: Library;
    watchHistory: WatchHistory[];
    ratings: MediaRating[];
    get duration(): number;
    get resolution(): string;
    get formattedDuration(): string;
    get formattedFileSize(): string;
    get averageRating(): number;
    get genres(): string[];
    get year(): number | undefined;
    get director(): string | undefined;
    get cast(): string[];
    isStreamingReady(): boolean;
    getBestQuality(): string | undefined;
    incrementViewCount(): void;
    fileExists(): Promise<boolean>;
}
//# sourceMappingURL=Media.d.ts.map