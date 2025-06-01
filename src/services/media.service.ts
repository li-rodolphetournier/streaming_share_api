import {
  Collection,
  Library,
  Media,
  MediaListParams,
  MediaListResponse,
  MediaRating,
  MediaStats,
  PlaybackSession,
  Recommendation,
  SearchFilters,
  SearchResult,
  StreamingQuality,
  VideoQuality,
  WatchHistory,
} from "../types/media.types";

import { ApiService } from "./api";

export class MediaService {
  // Gestion des médias
  static async getMediaList(
    params: MediaListParams = {}
  ): Promise<MediaListResponse> {
    const defaultParams = {
      page: 1,
      limit: 20,
      sort: "createdAt" as const,
      order: "DESC" as const,
    };

    const queryParams = { ...defaultParams, ...params };

    return ApiService.get<MediaListResponse>("/media", {
      params: queryParams,
      cache: true,
      cacheTime: 2 * 60 * 1000, // Cache 2 minutes
    });
  }

  static async getMediaById(id: number): Promise<Media> {
    return ApiService.get<Media>(`/media/${id}`, {
      cache: true,
      cacheTime: 5 * 60 * 1000, // Cache 5 minutes
    });
  }

  static async getMediaByPath(path: string): Promise<Media> {
    return ApiService.get<Media>("/media/by-path", {
      params: { path },
      cache: true,
      cacheTime: 5 * 60 * 1000,
    });
  }

  static async updateMedia(id: number, data: Partial<Media>): Promise<Media> {
    const response = await ApiService.put<Media>(`/media/${id}`, data);

    // Invalider le cache pour ce média
    ApiService.clearCache(`/media/${id}`);

    return response;
  }

  static async deleteMedia(id: number): Promise<void> {
    await ApiService.delete(`/media/${id}`);

    // Nettoyer le cache
    ApiService.clearCache(`/media/${id}`);
    ApiService.clearCache("/media");
  }

  // Streaming et qualités
  static async getStreamingQualities(
    mediaId: number
  ): Promise<StreamingQuality[]> {
    return ApiService.get<StreamingQuality[]>(`/media/${mediaId}/qualities`, {
      cache: true,
      cacheTime: 10 * 60 * 1000, // Cache 10 minutes
    });
  }

  static async getStreamingUrl(
    mediaId: number,
    quality: VideoQuality = "1080p"
  ): Promise<string> {
    const response = await ApiService.get<{ url: string }>(
      `/media/${mediaId}/stream`,
      {
        params: { quality },
      }
    );
    return response.url;
  }

  static async getHLSManifest(mediaId: number): Promise<string> {
    const response = await ApiService.get<{ manifest: string }>(
      `/media/${mediaId}/hls`
    );
    return response.manifest;
  }

  // Gestion des bibliothèques
  static async getLibraries(): Promise<Library[]> {
    return ApiService.get<Library[]>("/libraries", {
      cache: true,
      cacheTime: 5 * 60 * 1000,
    });
  }

  static async getLibraryById(id: number): Promise<Library> {
    return ApiService.get<Library>(`/libraries/${id}`, {
      cache: true,
      cacheTime: 5 * 60 * 1000,
    });
  }

  static async createLibrary(
    data: Omit<Library, "id" | "createdAt">
  ): Promise<Library> {
    const response = await ApiService.post<Library>("/libraries", data);

    // Invalider le cache des bibliothèques
    ApiService.clearCache("/libraries");

    return response;
  }

  static async updateLibrary(
    id: number,
    data: Partial<Library>
  ): Promise<Library> {
    const response = await ApiService.put<Library>(`/libraries/${id}`, data);

    // Invalider le cache
    ApiService.clearCache(`/libraries/${id}`);
    ApiService.clearCache("/libraries");

    return response;
  }

  static async deleteLibrary(id: number): Promise<void> {
    await ApiService.delete(`/libraries/${id}`);

    // Nettoyer le cache
    ApiService.clearCache(`/libraries/${id}`);
    ApiService.clearCache("/libraries");
  }

  static async scanLibrary(id: number): Promise<void> {
    await ApiService.post(`/libraries/${id}/scan`);
  }

  static async getLibraryScanProgress(id: number): Promise<any> {
    return ApiService.get(`/libraries/${id}/scan-progress`);
  }

  // Historique de visionnage
  static async getWatchHistory(
    params: {
      page?: number;
      limit?: number;
      mediaId?: number;
    } = {}
  ): Promise<{ data: WatchHistory[]; total: number }> {
    return ApiService.get("/watch-history", {
      params,
      cache: true,
      cacheTime: 1 * 60 * 1000, // Cache 1 minute
    });
  }

  static async updateWatchProgress(
    mediaId: number,
    watchedDuration: number,
    totalDuration: number
  ): Promise<WatchHistory> {
    return ApiService.post<WatchHistory>("/watch-history", {
      mediaId,
      watchedDuration,
      totalDuration,
      progressPercentage: Math.round((watchedDuration / totalDuration) * 100),
    });
  }

  static async markAsWatched(mediaId: number): Promise<WatchHistory> {
    return ApiService.post<WatchHistory>(`/watch-history/${mediaId}/complete`);
  }

  static async removeFromWatchHistory(mediaId: number): Promise<void> {
    await ApiService.delete(`/watch-history/${mediaId}`);
  }

  // Évaluations et critiques
  static async getMediaRatings(mediaId: number): Promise<MediaRating[]> {
    return ApiService.get<MediaRating[]>(`/media/${mediaId}/ratings`, {
      cache: true,
      cacheTime: 5 * 60 * 1000,
    });
  }

  static async rateMedia(
    mediaId: number,
    rating: number,
    review?: string
  ): Promise<MediaRating> {
    const response = await ApiService.post<MediaRating>(
      `/media/${mediaId}/rate`,
      {
        rating,
        review,
      }
    );

    // Invalider le cache des évaluations
    ApiService.clearCache(`/media/${mediaId}/ratings`);

    return response;
  }

  static async updateRating(
    mediaId: number,
    ratingId: number,
    rating: number,
    review?: string
  ): Promise<MediaRating> {
    const response = await ApiService.put<MediaRating>(
      `/media/${mediaId}/ratings/${ratingId}`,
      {
        rating,
        review,
      }
    );

    // Invalider le cache
    ApiService.clearCache(`/media/${mediaId}/ratings`);

    return response;
  }

  static async deleteRating(mediaId: number, ratingId: number): Promise<void> {
    await ApiService.delete(`/media/${mediaId}/ratings/${ratingId}`);

    // Invalider le cache
    ApiService.clearCache(`/media/${mediaId}/ratings`);
  }

  // Sessions de lecture
  static async startPlaybackSession(
    mediaId: number,
    quality: VideoQuality
  ): Promise<PlaybackSession> {
    return ApiService.post<PlaybackSession>("/playback/start", {
      mediaId,
      quality,
      deviceInfo: this.getDeviceInfo(),
    });
  }

  static async updatePlaybackSession(
    sessionId: string,
    data: {
      position?: number;
      quality?: VideoQuality;
      bandwidth?: number;
      bufferingEvents?: any[];
      errors?: any[];
    }
  ): Promise<void> {
    await ApiService.put(`/playback/sessions/${sessionId}`, data);
  }

  static async endPlaybackSession(sessionId: string): Promise<void> {
    await ApiService.post(`/playback/sessions/${sessionId}/end`);
  }

  // Recherche avancée
  static async searchMedia(
    query: string,
    filters: SearchFilters = {},
    params: { page?: number; limit?: number } = {}
  ): Promise<SearchResult> {
    return ApiService.post<SearchResult>("/search", {
      query,
      filters,
      ...params,
    });
  }

  static async getSearchSuggestions(query: string): Promise<string[]> {
    const response = await ApiService.get<{ suggestions: string[] }>(
      "/search/suggestions",
      {
        params: { q: query },
        cache: true,
        cacheTime: 5 * 60 * 1000,
      }
    );
    return response.suggestions;
  }

  // Recommandations
  static async getRecommendations(
    params: { page?: number; limit?: number; type?: string } = {}
  ): Promise<Recommendation[]> {
    return ApiService.get<Recommendation[]>("/recommendations", {
      params,
      cache: true,
      cacheTime: 10 * 60 * 1000, // Cache 10 minutes
    });
  }

  static async getRecommendationsForMedia(
    mediaId: number
  ): Promise<Recommendation[]> {
    return ApiService.get<Recommendation[]>(
      `/media/${mediaId}/recommendations`,
      {
        cache: true,
        cacheTime: 10 * 60 * 1000,
      }
    );
  }

  // Collections
  static async getCollections(): Promise<Collection[]> {
    return ApiService.get<Collection[]>("/collections", {
      cache: true,
      cacheTime: 5 * 60 * 1000,
    });
  }

  static async getCollectionById(id: number): Promise<Collection> {
    return ApiService.get<Collection>(`/collections/${id}`, {
      cache: true,
      cacheTime: 5 * 60 * 1000,
    });
  }

  static async createCollection(
    data: Omit<Collection, "id" | "createdAt" | "updatedAt">
  ): Promise<Collection> {
    const response = await ApiService.post<Collection>("/collections", data);

    // Invalider le cache
    ApiService.clearCache("/collections");

    return response;
  }

  static async updateCollection(
    id: number,
    data: Partial<Collection>
  ): Promise<Collection> {
    const response = await ApiService.put<Collection>(
      `/collections/${id}`,
      data
    );

    // Invalider le cache
    ApiService.clearCache(`/collections/${id}`);
    ApiService.clearCache("/collections");

    return response;
  }

  static async deleteCollection(id: number): Promise<void> {
    await ApiService.delete(`/collections/${id}`);

    // Nettoyer le cache
    ApiService.clearCache(`/collections/${id}`);
    ApiService.clearCache("/collections");
  }

  static async addMediaToCollection(
    collectionId: number,
    mediaId: number
  ): Promise<void> {
    await ApiService.post(`/collections/${collectionId}/media/${mediaId}`);

    // Invalider le cache
    ApiService.clearCache(`/collections/${collectionId}`);
  }

  static async removeMediaFromCollection(
    collectionId: number,
    mediaId: number
  ): Promise<void> {
    await ApiService.delete(`/collections/${collectionId}/media/${mediaId}`);

    // Invalider le cache
    ApiService.clearCache(`/collections/${collectionId}`);
  }

  // Statistiques
  static async getMediaStats(): Promise<MediaStats> {
    return ApiService.get<MediaStats>("/stats/media", {
      cache: true,
      cacheTime: 15 * 60 * 1000, // Cache 15 minutes
    });
  }

  static async getUserStats(): Promise<any> {
    return ApiService.get("/stats/user", {
      cache: true,
      cacheTime: 5 * 60 * 1000,
    });
  }

  // Favoris
  static async getFavorites(): Promise<Media[]> {
    return ApiService.get<Media[]>("/favorites", {
      cache: true,
      cacheTime: 2 * 60 * 1000,
    });
  }

  static async addToFavorites(mediaId: number): Promise<void> {
    await ApiService.post(`/favorites/${mediaId}`);

    // Invalider le cache
    ApiService.clearCache("/favorites");
  }

  static async removeFromFavorites(mediaId: number): Promise<void> {
    await ApiService.delete(`/favorites/${mediaId}`);

    // Invalider le cache
    ApiService.clearCache("/favorites");
  }

  static async isFavorite(mediaId: number): Promise<boolean> {
    const response = await ApiService.get<{ isFavorite: boolean }>(
      `/favorites/${mediaId}/check`
    );
    return response.isFavorite;
  }

  // Métadonnées et informations externes
  static async refreshMetadata(mediaId: number): Promise<Media> {
    const response = await ApiService.post<Media>(
      `/media/${mediaId}/refresh-metadata`
    );

    // Invalider le cache
    ApiService.clearCache(`/media/${mediaId}`);

    return response;
  }

  static async getExternalInfo(
    mediaId: number,
    provider: "tmdb" | "imdb"
  ): Promise<any> {
    return ApiService.get(`/media/${mediaId}/external-info`, {
      params: { provider },
      cache: true,
      cacheTime: 60 * 60 * 1000, // Cache 1 heure
    });
  }

  // Utilitaires
  private static getDeviceInfo() {
    return {
      deviceId: this.getOrCreateDeviceId(),
      deviceName: navigator.platform,
      deviceType: this.getDeviceType(),
      platform: navigator.platform,
      browser: this.getBrowserInfo(),
      resolution: `${screen.width}x${screen.height}`,
      userAgent: navigator.userAgent,
    };
  }

  private static getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  }

  private static getDeviceType():
    | "desktop"
    | "mobile"
    | "tablet"
    | "tv"
    | "console" {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/mobile|android|iphone|ipod/.test(userAgent)) {
      return "mobile";
    }

    if (/tablet|ipad/.test(userAgent)) {
      return "tablet";
    }

    if (
      /smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast/.test(userAgent)
    ) {
      return "tv";
    }

    return "desktop";
  }

  private static getBrowserInfo(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    if (userAgent.includes("Opera")) return "Opera";

    return "Unknown";
  }

  // Préchargement intelligent
  static async preloadPopularMedia(): Promise<void> {
    const urls = [
      "/media?sort=viewCount&order=DESC&limit=20",
      "/media?sort=createdAt&order=DESC&limit=20",
      "/recommendations?limit=10",
    ];

    await ApiService.preload(urls);
  }

  // Nettoyage du cache spécifique aux médias
  static clearMediaCache(): void {
    ApiService.clearCache("media");
    ApiService.clearCache("libraries");
    ApiService.clearCache("collections");
    ApiService.clearCache("recommendations");
  }
}
