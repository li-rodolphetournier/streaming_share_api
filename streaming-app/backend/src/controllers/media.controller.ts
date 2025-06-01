import { Request, Response } from "express";
import {
  validateCreateMediaData,
  validateSearchParams,
} from "../utils/validation";

import { MediaService } from "../services/media.service";

export class MediaController {
  private mediaService: MediaService;

  constructor() {
    this.mediaService = new MediaService();
  }

  // Obtenir tous les médias avec pagination
  getAllMedias = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const userId = req.user?.id;

      const result = await this.mediaService.getAllMedias(
        { page, limit },
        userId
      );

      res.json(result);
    } catch (error) {
      console.error("Erreur lors de la récupération des médias:", error);
      res.status(500).json({
        error: "Erreur de récupération",
      });
    }
  };

  // Créer un nouveau média
  createMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = validateCreateMediaData(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          error: "Données invalides",
          details: validation.errors,
        });
        return;
      }

      const media = await this.mediaService.createMedia(req.body);

      res.status(201).json({
        message: "Média créé avec succès",
        media,
      });
    } catch (error) {
      console.error("Erreur lors de la création du média:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erreur de création",
      });
    }
  };

  // Obtenir un média par ID
  getMediaById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const media = await this.mediaService.getMediaById(parseInt(id), userId);

      res.json({
        media,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du média:", error);
      res.status(404).json({
        error: error instanceof Error ? error.message : "Média non trouvé",
      });
    }
  };

  // Rechercher des médias
  searchMedias = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = validateSearchParams(req.query);
      if (!validation.isValid) {
        res.status(400).json({
          error: "Paramètres de recherche invalides",
          details: validation.errors,
        });
        return;
      }

      const filters = {
        query: req.query.query as string,
        type: req.query.type as any,
        genre: req.query.genre as string[],
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        rating: req.query.rating
          ? parseFloat(req.query.rating as string)
          : undefined,
        libraryId: req.query.libraryId
          ? parseInt(req.query.libraryId as string)
          : undefined,
        userId: req.user?.id,
      };

      const options = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const result = await this.mediaService.searchMedias(filters, options);

      res.json(result);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      res.status(500).json({
        error: "Erreur de recherche",
      });
    }
  };

  // Obtenir les médias populaires
  getPopularMedias = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const medias = await this.mediaService.getPopularMedias(limit);

      res.json({
        medias,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des médias populaires:",
        error
      );
      res.status(500).json({
        error: "Erreur de récupération",
      });
    }
  };

  // Obtenir les médias récents
  getRecentMedias = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const medias = await this.mediaService.getRecentMedias(limit);

      res.json({
        medias,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des médias récents:",
        error
      );
      res.status(500).json({
        error: "Erreur de récupération",
      });
    }
  };

  // Obtenir les recommandations
  getRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: "Authentification requise",
        });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const medias = await this.mediaService.getRecommendations(userId, limit);

      res.json({
        medias,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des recommandations:",
        error
      );
      res.status(500).json({
        error: "Erreur de récupération",
      });
    }
  };

  // Mettre à jour un média
  updateMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const media = await this.mediaService.updateMedia(parseInt(id), req.body);

      res.json({
        message: "Média mis à jour avec succès",
        media,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du média:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erreur de mise à jour",
      });
    }
  };

  // Supprimer un média
  deleteMedia = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.mediaService.deleteMedia(parseInt(id));

      res.json({
        message: "Média supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du média:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erreur de suppression",
      });
    }
  };

  // Enregistrer une vue
  recordView = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: "Authentification requise",
        });
        return;
      }

      await this.mediaService.recordView(parseInt(id), userId);

      res.json({
        message: "Vue enregistrée avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la vue:", error);
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erreur d'enregistrement",
      });
    }
  };

  // Mettre à jour le progrès de visionnage
  updateWatchProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { currentTime, totalDuration } = req.body;

      if (!userId) {
        res.status(401).json({
          error: "Authentification requise",
        });
        return;
      }

      if (typeof currentTime !== "number") {
        res.status(400).json({
          error: "Temps actuel requis",
        });
        return;
      }

      const watchHistory = await this.mediaService.updateWatchProgress(
        parseInt(id),
        userId,
        currentTime,
        totalDuration
      );

      res.json({
        message: "Progrès mis à jour avec succès",
        watchHistory,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du progrès:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erreur de mise à jour",
      });
    }
  };

  // Obtenir l'historique de visionnage
  getWatchHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          error: "Authentification requise",
        });
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await this.mediaService.getUserWatchHistory(
        userId,
        page,
        limit
      );

      res.json(result);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      res.status(500).json({
        error: "Erreur de récupération",
      });
    }
  };

  // Obtenir les statistiques d'un média
  getMediaStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const stats = await this.mediaService.getMediaStats(parseInt(id));

      res.json({
        stats,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      res.status(404).json({
        error: error instanceof Error ? error.message : "Média non trouvé",
      });
    }
  };
}
