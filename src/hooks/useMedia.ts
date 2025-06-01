import {
  Collection,
  Media,
  MediaListParams,
  SearchFilters,
  VideoQuality,
} from "../types/media.types";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { MediaService } from "../services/media.service";

// Clés de requête pour React Query
export const mediaKeys = {
  all: ["media"] as const,
  lists: () => [...mediaKeys.all, "list"] as const,
  list: (params: MediaListParams) => [...mediaKeys.lists(), params] as const,
  details: () => [...mediaKeys.all, "detail"] as const,
  detail: (id: number) => [...mediaKeys.details(), id] as const,
  search: () => [...mediaKeys.all, "search"] as const,
  searchQuery: (query: string, filters: SearchFilters) =>
    [...mediaKeys.search(), query, filters] as const,
  recommendations: () => [...mediaKeys.all, "recommendations"] as const,
  watchHistory: () => [...mediaKeys.all, "watch-history"] as const,
  favorites: () => [...mediaKeys.all, "favorites"] as const,
  collections: () => [...mediaKeys.all, "collections"] as const,
  collection: (id: number) => [...mediaKeys.collections(), id] as const,
  stats: () => [...mediaKeys.all, "stats"] as const,
  libraries: () => [...mediaKeys.all, "libraries"] as const,
  library: (id: number) => [...mediaKeys.libraries(), id] as const,
};

// Hook pour obtenir la liste des médias avec pagination infinie
export const useMediaList = (params: MediaListParams = {}) => {
  return useInfiniteQuery({
    queryKey: mediaKeys.list(params),
    queryFn: ({ pageParam = 1 }) =>
      MediaService.getMediaList({ ...params, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.total / (params.limit || 20));
      return allPages.length < totalPages ? allPages.length + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true,
  });
};

// Hook pour obtenir un média par ID
export const useMedia = (id: number, enabled = true) => {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: () => MediaService.getMediaById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook pour obtenir plusieurs médias en parallèle
export const useMediaBatch = (ids: number[]) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["media", "batch", ids.sort()],
    queryFn: async () => {
      // Utiliser le cache existant ou faire des requêtes parallèles
      const promises = ids.map(async (id) => {
        const cached = queryClient.getQueryData<Media>(mediaKeys.detail(id));
        if (cached) return cached;
        return MediaService.getMediaById(id);
      });

      return Promise.all(promises);
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });
};

// Hook pour la recherche avec debounce
export const useMediaSearch = (
  query: string,
  filters: SearchFilters = {},
  enabled = true
) => {
  return useInfiniteQuery({
    queryKey: mediaKeys.searchQuery(query, filters),
    queryFn: ({ pageParam = 1 }) =>
      MediaService.searchMedia(query, filters, { page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.total / 20);
      return allPages.length < totalPages ? allPages.length + 1 : undefined;
    },
    enabled: enabled && query.length >= 2,
    staleTime: 30 * 1000, // 30 secondes pour la recherche
    cacheTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
};

// Hook pour les suggestions de recherche
export const useSearchSuggestions = (query: string) => {
  return useQuery({
    queryKey: ["search", "suggestions", query],
    queryFn: () => MediaService.getSearchSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Hook pour les recommandations
export const useRecommendations = (params: { type?: string } = {}) => {
  return useQuery({
    queryKey: [...mediaKeys.recommendations(), params],
    queryFn: () => MediaService.getRecommendations(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook pour les recommandations d'un média spécifique
export const useMediaRecommendations = (mediaId: number, enabled = true) => {
  return useQuery({
    queryKey: [...mediaKeys.recommendations(), "media", mediaId],
    queryFn: () => MediaService.getRecommendationsForMedia(mediaId),
    enabled: enabled && !!mediaId,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
};

// Hook pour l'historique de visionnage
export const useWatchHistory = (params: { mediaId?: number } = {}) => {
  return useInfiniteQuery({
    queryKey: [...mediaKeys.watchHistory(), params],
    queryFn: ({ pageParam = 1 }) =>
      MediaService.getWatchHistory({ ...params, page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.total / 20);
      return allPages.length < totalPages ? allPages.length + 1 : undefined;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour mettre à jour le progrès de visionnage
export const useUpdateWatchProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mediaId,
      watchedDuration,
      totalDuration,
    }: {
      mediaId: number;
      watchedDuration: number;
      totalDuration: number;
    }) =>
      MediaService.updateWatchProgress(mediaId, watchedDuration, totalDuration),
    onSuccess: () => {
      // Invalider l'historique de visionnage
      queryClient.invalidateQueries({ queryKey: mediaKeys.watchHistory() });
    },
    // Optimistic update pour une meilleure UX
    onMutate: async ({ mediaId, watchedDuration, totalDuration }) => {
      const progressPercentage = Math.round(
        (watchedDuration / totalDuration) * 100
      );

      // Mettre à jour le cache du média si disponible
      const mediaQueryKey = mediaKeys.detail(mediaId);
      const previousMedia = queryClient.getQueryData<Media>(mediaQueryKey);

      if (previousMedia) {
        queryClient.setQueryData(mediaQueryKey, {
          ...previousMedia,
          watchProgress: {
            watchedDuration,
            totalDuration,
            progressPercentage,
            lastWatchedAt: new Date().toISOString(),
          },
        });
      }

      return { previousMedia };
    },
    onError: (error, variables, context) => {
      // Restaurer l'état précédent en cas d'erreur
      if (context?.previousMedia) {
        queryClient.setQueryData(
          mediaKeys.detail(variables.mediaId),
          context.previousMedia
        );
      }
    },
  });
};

// Hook pour marquer comme visionné
export const useMarkAsWatched = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: number) => MediaService.markAsWatched(mediaId),
    onSuccess: (_, mediaId) => {
      // Invalider les caches pertinents
      queryClient.invalidateQueries({ queryKey: mediaKeys.watchHistory() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.detail(mediaId) });
    },
  });
};

// Hook pour les favoris
export const useFavorites = () => {
  return useQuery({
    queryKey: mediaKeys.favorites(),
    queryFn: MediaService.getFavorites,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook pour ajouter/supprimer des favoris
export const useFavoriteToggle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mediaId,
      isFavorite,
    }: {
      mediaId: number;
      isFavorite: boolean;
    }) => {
      if (isFavorite) {
        await MediaService.removeFromFavorites(mediaId);
      } else {
        await MediaService.addToFavorites(mediaId);
      }
      return !isFavorite;
    },
    onSuccess: (newFavoriteStatus, { mediaId }) => {
      // Mettre à jour le cache des favoris
      queryClient.invalidateQueries({ queryKey: mediaKeys.favorites() });

      // Mettre à jour le cache du média
      const mediaQueryKey = mediaKeys.detail(mediaId);
      const previousMedia = queryClient.getQueryData<Media>(mediaQueryKey);

      if (previousMedia) {
        queryClient.setQueryData(mediaQueryKey, {
          ...previousMedia,
          isFavorite: newFavoriteStatus,
        });
      }
    },
    // Optimistic update
    onMutate: async ({ mediaId, isFavorite }) => {
      const newFavoriteStatus = !isFavorite;

      // Mettre à jour optimistiquement le cache du média
      const mediaQueryKey = mediaKeys.detail(mediaId);
      const previousMedia = queryClient.getQueryData<Media>(mediaQueryKey);

      if (previousMedia) {
        queryClient.setQueryData(mediaQueryKey, {
          ...previousMedia,
          isFavorite: newFavoriteStatus,
        });
      }

      return { previousMedia };
    },
    onError: (error, { mediaId }, context) => {
      // Restaurer l'état précédent
      if (context?.previousMedia) {
        queryClient.setQueryData(
          mediaKeys.detail(mediaId),
          context.previousMedia
        );
      }
    },
  });
};

// Hook pour les collections
export const useCollections = () => {
  return useQuery({
    queryKey: mediaKeys.collections(),
    queryFn: MediaService.getCollections,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook pour une collection spécifique
export const useCollection = (id: number, enabled = true) => {
  return useQuery({
    queryKey: mediaKeys.collection(id),
    queryFn: () => MediaService.getCollectionById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });
};

// Hook pour créer une collection
export const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Collection, "id" | "createdAt" | "updatedAt">) =>
      MediaService.createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.collections() });
    },
  });
};

// Hook pour les statistiques des médias
export const useMediaStats = () => {
  return useQuery({
    queryKey: mediaKeys.stats(),
    queryFn: MediaService.getMediaStats,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook pour les bibliothèques
export const useLibraries = () => {
  return useQuery({
    queryKey: mediaKeys.libraries(),
    queryFn: MediaService.getLibraries,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });
};

// Hook pour une bibliothèque spécifique
export const useLibrary = (id: number, enabled = true) => {
  return useQuery({
    queryKey: mediaKeys.library(id),
    queryFn: () => MediaService.getLibraryById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });
};

// Hook pour scanner une bibliothèque
export const useScanLibrary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (libraryId: number) => MediaService.scanLibrary(libraryId),
    onSuccess: (_, libraryId) => {
      // Invalider les caches pertinents
      queryClient.invalidateQueries({ queryKey: mediaKeys.library(libraryId) });
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
};

// Hook pour obtenir les qualités de streaming
export const useStreamingQualities = (mediaId: number, enabled = true) => {
  return useQuery({
    queryKey: ["media", mediaId, "qualities"],
    queryFn: () => MediaService.getStreamingQualities(mediaId),
    enabled: enabled && !!mediaId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook pour obtenir l'URL de streaming
export const useStreamingUrl = (
  mediaId: number,
  quality: VideoQuality = "1080p"
) => {
  return useQuery({
    queryKey: ["media", mediaId, "stream", quality],
    queryFn: () => MediaService.getStreamingUrl(mediaId, quality),
    enabled: !!mediaId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook pour démarrer une session de lecture
export const useStartPlaybackSession = () => {
  return useMutation({
    mutationFn: ({
      mediaId,
      quality,
    }: {
      mediaId: number;
      quality: VideoQuality;
    }) => MediaService.startPlaybackSession(mediaId, quality),
  });
};

// Hook pour mettre à jour une session de lecture
export const useUpdatePlaybackSession = () => {
  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: {
        position?: number;
        quality?: VideoQuality;
        bandwidth?: number;
        bufferingEvents?: any[];
        errors?: any[];
      };
    }) => MediaService.updatePlaybackSession(sessionId, data),
  });
};

// Hook pour terminer une session de lecture
export const useEndPlaybackSession = () => {
  return useMutation({
    mutationFn: (sessionId: string) =>
      MediaService.endPlaybackSession(sessionId),
  });
};

// Hook pour noter un média
export const useRateMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mediaId,
      rating,
      review,
    }: {
      mediaId: number;
      rating: number;
      review?: string;
    }) => MediaService.rateMedia(mediaId, rating, review),
    onSuccess: (_, { mediaId }) => {
      // Invalider les caches pertinents
      queryClient.invalidateQueries({
        queryKey: ["media", mediaId, "ratings"],
      });
      queryClient.invalidateQueries({ queryKey: mediaKeys.detail(mediaId) });
    },
  });
};

// Hook pour précharger les médias populaires
export const usePreloadPopularMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: MediaService.preloadPopularMedia,
    onSuccess: () => {
      // Invalider les caches pour forcer le rechargement avec les nouvelles données
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.recommendations() });
    },
  });
};

// Hook utilitaire pour nettoyer le cache des médias
export const useClearMediaCache = () => {
  const queryClient = useQueryClient();

  return () => {
    MediaService.clearMediaCache();
    queryClient.invalidateQueries({ queryKey: mediaKeys.all });
  };
};
