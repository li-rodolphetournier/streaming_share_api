export interface Media {
  id: number;
  title: string;
  originalTitle?: string;
  description?: string;
  filePath: string;
  thumbnailPath?: string;
  posterPath?: string;
  backdropPath?: string;
  metadata: MediaMetadata;
  movieInfo?: MovieInfo;
  tvInfo?: TVInfo;
  viewCount: number;
  lastViewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  library: Library;
  watchHistory?: WatchHistory[];
  userRating?: number;
  averageRating?: number;
  duration: number;
  fileSize: number;
  quality: VideoQuality;
  availableQualities: VideoQuality[];
}

export interface MediaMetadata {
  duration: number;
  resolution: string;
  codec: string;
  bitrate: number;
  size: number;
  fps: number;
  audioCodec?: string;
  audioChannels?: number;
  subtitles?: SubtitleTrack[];
  chapters?: Chapter[];
}

export interface MovieInfo {
  year?: number;
  genre?: string[];
  rating?: number;
  director?: string;
  cast?: string[];
  imdbId?: string;
  tmdbId?: number;
  budget?: number;
  revenue?: number;
  runtime?: number;
  tagline?: string;
  releaseDate?: Date;
  productionCompanies?: string[];
  spokenLanguages?: string[];
}

export interface TVInfo {
  firstAirDate?: Date;
  lastAirDate?: Date;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  episodeRunTime?: number[];
  genres?: string[];
  networks?: string[];
  originCountry?: string[];
  originalLanguage?: string;
  status?: "Returning Series" | "Ended" | "Canceled" | "In Production";
  type?: "Scripted" | "Reality" | "Documentary" | "News" | "Talk Show";
  seasons?: Season[];
}

export interface Season {
  id: number;
  seasonNumber: number;
  name: string;
  overview?: string;
  airDate?: Date;
  episodeCount: number;
  posterPath?: string;
  episodes?: Episode[];
}

export interface Episode {
  id: number;
  episodeNumber: number;
  name: string;
  overview?: string;
  airDate?: Date;
  runtime?: number;
  stillPath?: string;
  voteAverage?: number;
  voteCount?: number;
  seasonNumber: number;
  showId: number;
}

export interface Library {
  id: number;
  name: string;
  path: string;
  type: LibraryType;
  description?: string;
  isActive: boolean;
  lastScanDate?: Date;
  createdAt: Date;
  mediaCount?: number;
  totalSize?: number;
  scanProgress?: ScanProgress;
}

export interface ScanProgress {
  isScanning: boolean;
  progress: number;
  currentFile?: string;
  totalFiles: number;
  processedFiles: number;
  errors: string[];
  startTime?: Date;
  estimatedTimeRemaining?: number;
}

export interface WatchHistory {
  id: number;
  watchedDuration: number;
  totalDuration: number;
  progressPercentage: number;
  isCompleted: boolean;
  lastWatched: Date;
  media: Media;
  userId: number;
  deviceInfo?: DeviceInfo;
  playbackQuality?: VideoQuality;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  browser?: string;
  resolution?: string;
  userAgent?: string;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  url: string;
  format: "vtt" | "srt" | "ass";
  isDefault: boolean;
  isForced: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  thumbnailUrl?: string;
}

export interface StreamingQuality {
  quality: VideoQuality;
  url: string;
  bitrate: number;
  resolution: string;
  codec: string;
  isAvailable: boolean;
}

export type LibraryType = "movie" | "tv" | "music" | "photo" | "mixed";

export type VideoQuality = "480p" | "720p" | "1080p" | "1440p" | "4K" | "8K";

export type SortOption =
  | "title"
  | "createdAt"
  | "viewCount"
  | "lastViewedAt"
  | "rating"
  | "duration"
  | "fileSize"
  | "releaseDate";

export type SortOrder = "ASC" | "DESC";

export interface MediaListParams {
  page?: number;
  limit?: number;
  sort?: SortOption;
  order?: SortOrder;
  search?: string;
  genre?: string;
  libraryId?: number;
  quality?: VideoQuality;
  year?: number;
  rating?: number;
  type?: LibraryType;
  watched?: boolean;
}

export interface MediaListResponse {
  data: Media[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MediaRating {
  id: number;
  rating: number;
  review?: string;
  createdAt: Date;
  userId: number;
  mediaId: number;
  isPublic: boolean;
  helpfulVotes: number;
}

export interface PlaybackSession {
  id: string;
  mediaId: number;
  userId: number;
  startTime: Date;
  endTime?: Date;
  duration: number;
  quality: VideoQuality;
  deviceInfo: DeviceInfo;
  bandwidth: number;
  bufferingEvents: BufferingEvent[];
  errors: PlaybackError[];
}

export interface BufferingEvent {
  timestamp: Date;
  duration: number;
  position: number;
  reason: "network" | "decode" | "seek" | "quality_change";
}

export interface PlaybackError {
  timestamp: Date;
  code: string;
  message: string;
  severity: "warning" | "error" | "fatal";
  context?: Record<string, any>;
}

// Types pour les recommandations
export interface Recommendation {
  media: Media;
  score: number;
  reason: RecommendationReason;
  context?: string;
}

export type RecommendationReason =
  | "similar_genre"
  | "same_director"
  | "same_actor"
  | "trending"
  | "recently_added"
  | "continue_watching"
  | "because_you_watched";

// Types pour la recherche avancée
export interface SearchFilters {
  genres?: string[];
  years?: [number, number];
  ratings?: [number, number];
  durations?: [number, number];
  qualities?: VideoQuality[];
  libraries?: number[];
  cast?: string[];
  directors?: string[];
  languages?: string[];
  watched?: boolean;
  favorited?: boolean;
}

export interface SearchResult {
  media: Media[];
  total: number;
  facets: SearchFacets;
  suggestions: string[];
  correctedQuery?: string;
}

export interface SearchFacets {
  genres: FacetCount[];
  years: FacetCount[];
  qualities: FacetCount[];
  libraries: FacetCount[];
  ratings: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

// Types pour les collections
export interface Collection {
  id: number;
  name: string;
  description?: string;
  posterPath?: string;
  backdropPath?: string;
  mediaIds: number[];
  isPublic: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  mediaCount: number;
  totalDuration: number;
}

// Types pour les statistiques
export interface MediaStats {
  totalMedia: number;
  totalDuration: number;
  totalSize: number;
  byQuality: Record<VideoQuality, number>;
  byGenre: Record<string, number>;
  byYear: Record<number, number>;
  byLibrary: Record<string, number>;
  mostWatched: Media[];
  recentlyAdded: Media[];
  topRated: Media[];
}
