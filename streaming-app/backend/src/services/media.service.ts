import { Media, MediaMetadata, MediaType, MovieInfo } from "../entities/Media";

import { AppDataSource } from "../config/database";
import { Library } from "../entities/Library";
import { MediaRating } from "../entities/MediaRating";
import { Repository } from "typeorm";
import { User } from "../entities/User";
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

export class MediaService {
  private mediaRepository: Repository<Media>;
  private libraryRepository: Repository<Library>;
  private watchHistoryRepository: Repository<WatchHistory>;
  private ratingRepository: Repository<MediaRating>;

  constructor() {
    this.mediaRepository = AppDataSource.getRepository(Media);
    this.libraryRepository = AppDataSource.getRepository(Library);
    this.watchHistoryRepository = AppDataSource.getRepository(WatchHistory);
    this.ratingRepository = AppDataSource.getRepository(MediaRating);
  }

  // Obtenir tous les médias avec pagination
  async getAllMedias(
    options: { page: number; limit: number },
    userId?: number
  ): Promise<MediaSearchResult> {
    const { page = 1, limit = 20 } = options;

    const queryBuilder = this.mediaRepository
      .createQueryBuilder("media")
      .leftJoinAndSelect("media.library", "library")
      .leftJoinAndSelect("media.ratings", "ratings");

    if (userId) {
      queryBuilder.leftJoinAndSelect(
        "media.watchHistory",
        "watchHistory",
        "watchHistory.user.id = :userId",
        { userId }
      );
    }

    // Tri par défaut par date de création
    queryBuilder.orderBy("media.createdAt", "DESC");

    // Pagination
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

  // Créer un nouveau média
  async createMedia(data: CreateMediaData): Promise<Media> {
    const library = await this.libraryRepository.findOne({
      where: { id: data.libraryId },
    });

    if (!library) {
      throw new Error("Bibliothèque non trouvée");
    }

    // Vérifier si le fichier existe déjà
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

  // Obtenir un média par ID
  async getMediaById(id: number, userId?: number): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id },
      relations: ["library", "ratings", "watchHistory"],
    });

    if (!media) {
      throw new Error("Média non trouvé");
    }

    // Si un utilisateur est spécifié, inclure son historique de visionnage
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

  // Rechercher des médias
  async searchMedias(
    filters: MediaSearchFilters = {},
    options: MediaSearchOptions = {}
  ): Promise<MediaSearchResult> {
    const { query, type, genre, year, rating, libraryId, userId } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = options;

    const queryBuilder = this.mediaRepository
      .createQueryBuilder("media")
      .leftJoinAndSelect("media.library", "library")
      .leftJoinAndSelect("media.ratings", "ratings");

    // Filtres de recherche
    if (query) {
      queryBuilder.andWhere(
        "(media.title ILIKE :query OR media.originalTitle ILIKE :query OR media.description ILIKE :query)",
        { query: `%${query}%` }
      );
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
      queryBuilder.andWhere(
        "CAST(media.movieInfo->>'year' AS INTEGER) = :year",
        { year }
      );
    }

    if (rating) {
      queryBuilder.andWhere(
        "(SELECT AVG(CAST(r.rating AS DECIMAL)) FROM media_ratings r WHERE r.media_id = media.id) >= :rating",
        { rating }
      );
    }

    if (libraryId) {
      queryBuilder.andWhere("media.library.id = :libraryId", { libraryId });
    }

    if (userId) {
      queryBuilder.leftJoinAndSelect(
        "media.watchHistory",
        "watchHistory",
        "watchHistory.user.id = :userId",
        { userId }
      );
    }

    // Tri
    switch (sortBy) {
      case "title":
        queryBuilder.orderBy("media.title", sortOrder);
        break;
      case "viewCount":
        queryBuilder.orderBy("media.viewCount", sortOrder);
        break;
      case "rating":
        queryBuilder.orderBy(
          "(SELECT AVG(CAST(r.rating AS DECIMAL)) FROM media_ratings r WHERE r.media_id = media.id)",
          sortOrder
        );
        break;
      case "year":
        queryBuilder.orderBy(
          "CAST(media.movieInfo->>'year' AS INTEGER)",
          sortOrder
        );
        break;
      default:
        queryBuilder.orderBy("media.createdAt", sortOrder);
    }

    // Pagination
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

  // Obtenir les médias populaires
  async getPopularMedias(limit: number = 10): Promise<Media[]> {
    return this.mediaRepository.find({
      order: { viewCount: "DESC" },
      take: limit,
      relations: ["library", "ratings"],
    });
  }

  // Obtenir les médias récents
  async getRecentMedias(limit: number = 10): Promise<Media[]> {
    return this.mediaRepository.find({
      order: { createdAt: "DESC" },
      take: limit,
      relations: ["library", "ratings"],
    });
  }

  // Obtenir les recommandations pour un utilisateur
  async getRecommendations(
    userId: number,
    limit: number = 10
  ): Promise<Media[]> {
    // Algorithme de recommandation simple basé sur l'historique
    const userHistory = await this.watchHistoryRepository.find({
      where: { user: { id: userId } },
      relations: ["media"],
      order: { lastWatched: "DESC" },
      take: 20,
    });

    if (userHistory.length === 0) {
      // Si pas d'historique, retourner les médias populaires
      return this.getPopularMedias(limit);
    }

    // Extraire les genres préférés
    const preferredGenres = new Set<string>();
    userHistory.forEach((history) => {
      const genres = history.media.movieInfo?.genre || [];
      genres.forEach((genre) => preferredGenres.add(genre));
    });

    if (preferredGenres.size === 0) {
      return this.getPopularMedias(limit);
    }

    // Trouver des médias similaires
    const queryBuilder = this.mediaRepository
      .createQueryBuilder("media")
      .leftJoinAndSelect("media.library", "library")
      .leftJoinAndSelect("media.ratings", "ratings")
      .where("media.id NOT IN (:...watchedIds)", {
        watchedIds: userHistory.map((h) => h.media.id),
      });

    // Filtrer par genres préférés
    const genreArray = Array.from(preferredGenres);
    queryBuilder.andWhere("media.movieInfo->>'genre' ?| array[:...genres]", {
      genres: genreArray,
    });

    return queryBuilder
      .orderBy("media.viewCount", "DESC")
      .take(limit)
      .getMany();
  }

  // Mettre à jour un média
  async updateMedia(
    id: number,
    data: Partial<CreateMediaData>
  ): Promise<Media> {
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

  // Supprimer un média
  async deleteMedia(id: number): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id },
    });

    if (!media) {
      throw new Error("Média non trouvé");
    }

    await this.mediaRepository.remove(media);
  }

  // Enregistrer une vue
  async recordView(mediaId: number, userId: number): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error("Média non trouvé");
    }

    // Incrémenter le compteur de vues
    media.incrementViewCount();
    await this.mediaRepository.save(media);

    // Mettre à jour ou créer l'historique de visionnage
    let watchHistory = await this.watchHistoryRepository.findOne({
      where: { media: { id: mediaId }, user: { id: userId } },
    });

    if (watchHistory) {
      watchHistory.incrementWatchCount();
    } else {
      watchHistory = this.watchHistoryRepository.create({
        media: { id: mediaId } as Media,
        user: { id: userId } as User,
        watchedDuration: 0,
        totalDuration: media.duration,
      });
    }

    await this.watchHistoryRepository.save(watchHistory);
  }

  // Mettre à jour le progrès de visionnage
  async updateWatchProgress(
    mediaId: number,
    userId: number,
    currentTime: number,
    totalDuration?: number
  ): Promise<WatchHistory> {
    let watchHistory = await this.watchHistoryRepository.findOne({
      where: { media: { id: mediaId }, user: { id: userId } },
    });

    if (!watchHistory) {
      watchHistory = this.watchHistoryRepository.create({
        media: { id: mediaId } as Media,
        user: { id: userId } as User,
        watchedDuration: 0,
        totalDuration: totalDuration || 0,
      });
    }

    watchHistory.updateProgress(currentTime, totalDuration);
    return this.watchHistoryRepository.save(watchHistory);
  }

  // Obtenir l'historique de visionnage d'un utilisateur
  async getUserWatchHistory(
    userId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ history: WatchHistory[]; total: number }> {
    const [history, total] = await this.watchHistoryRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ["media", "media.library"],
      order: { lastWatched: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { history, total };
  }

  // Obtenir les statistiques d'un média
  async getMediaStats(mediaId: number): Promise<{
    viewCount: number;
    averageRating: number;
    totalRatings: number;
    completionRate: number;
  }> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
      relations: ["ratings", "watchHistory"],
    });

    if (!media) {
      throw new Error("Média non trouvé");
    }

    const totalWatches = media.watchHistory.length;
    const completedWatches = media.watchHistory.filter(
      (h) => h.isCompleted
    ).length;

    return {
      viewCount: media.viewCount,
      averageRating: media.averageRating,
      totalRatings: media.ratings.length,
      completionRate: totalWatches > 0 ? completedWatches / totalWatches : 0,
    };
  }
}
