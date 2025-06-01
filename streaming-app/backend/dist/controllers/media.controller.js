"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const validation_1 = require("../utils/validation");
const media_service_1 = require("../services/media.service");
class MediaController {
    mediaService;
    constructor() {
        this.mediaService = new media_service_1.MediaService();
    }
    createMedia = async (req, res) => {
        try {
            const validation = (0, validation_1.validateCreateMediaData)(req.body);
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
        }
        catch (error) {
            console.error("Erreur lors de la création du média:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erreur de création",
            });
        }
    };
    getMediaById = async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const media = await this.mediaService.getMediaById(parseInt(id), userId);
            res.json({
                media,
            });
        }
        catch (error) {
            console.error("Erreur lors de la récupération du média:", error);
            res.status(404).json({
                error: error instanceof Error ? error.message : "Média non trouvé",
            });
        }
    };
    searchMedias = async (req, res) => {
        try {
            const validation = (0, validation_1.validateSearchParams)(req.query);
            if (!validation.isValid) {
                res.status(400).json({
                    error: "Paramètres de recherche invalides",
                    details: validation.errors,
                });
                return;
            }
            const filters = {
                query: req.query.query,
                type: req.query.type,
                genre: req.query.genre,
                year: req.query.year ? parseInt(req.query.year) : undefined,
                rating: req.query.rating
                    ? parseFloat(req.query.rating)
                    : undefined,
                libraryId: req.query.libraryId
                    ? parseInt(req.query.libraryId)
                    : undefined,
                userId: req.user?.id,
            };
            const options = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
            };
            const result = await this.mediaService.searchMedias(filters, options);
            res.json(result);
        }
        catch (error) {
            console.error("Erreur lors de la recherche:", error);
            res.status(500).json({
                error: "Erreur de recherche",
            });
        }
    };
    getPopularMedias = async (req, res) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const medias = await this.mediaService.getPopularMedias(limit);
            res.json({
                medias,
            });
        }
        catch (error) {
            console.error("Erreur lors de la récupération des médias populaires:", error);
            res.status(500).json({
                error: "Erreur de récupération",
            });
        }
    };
    getRecentMedias = async (req, res) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const medias = await this.mediaService.getRecentMedias(limit);
            res.json({
                medias,
            });
        }
        catch (error) {
            console.error("Erreur lors de la récupération des médias récents:", error);
            res.status(500).json({
                error: "Erreur de récupération",
            });
        }
    };
    getRecommendations = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    error: "Authentification requise",
                });
                return;
            }
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const medias = await this.mediaService.getRecommendations(userId, limit);
            res.json({
                medias,
            });
        }
        catch (error) {
            console.error("Erreur lors de la récupération des recommandations:", error);
            res.status(500).json({
                error: "Erreur de récupération",
            });
        }
    };
    updateMedia = async (req, res) => {
        try {
            const { id } = req.params;
            const media = await this.mediaService.updateMedia(parseInt(id), req.body);
            res.json({
                message: "Média mis à jour avec succès",
                media,
            });
        }
        catch (error) {
            console.error("Erreur lors de la mise à jour du média:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erreur de mise à jour",
            });
        }
    };
    deleteMedia = async (req, res) => {
        try {
            const { id } = req.params;
            await this.mediaService.deleteMedia(parseInt(id));
            res.json({
                message: "Média supprimé avec succès",
            });
        }
        catch (error) {
            console.error("Erreur lors de la suppression du média:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erreur de suppression",
            });
        }
    };
    recordView = async (req, res) => {
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
        }
        catch (error) {
            console.error("Erreur lors de l'enregistrement de la vue:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erreur d'enregistrement",
            });
        }
    };
    updateWatchProgress = async (req, res) => {
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
            const watchHistory = await this.mediaService.updateWatchProgress(parseInt(id), userId, currentTime, totalDuration);
            res.json({
                message: "Progrès mis à jour avec succès",
                watchHistory,
            });
        }
        catch (error) {
            console.error("Erreur lors de la mise à jour du progrès:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erreur de mise à jour",
            });
        }
    };
    getWatchHistory = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    error: "Authentification requise",
                });
                return;
            }
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const result = await this.mediaService.getUserWatchHistory(userId, page, limit);
            res.json(result);
        }
        catch (error) {
            console.error("Erreur lors de la récupération de l'historique:", error);
            res.status(500).json({
                error: "Erreur de récupération",
            });
        }
    };
    getMediaStats = async (req, res) => {
        try {
            const { id } = req.params;
            const stats = await this.mediaService.getMediaStats(parseInt(id));
            res.json({
                stats,
            });
        }
        catch (error) {
            console.error("Erreur lors de la récupération des statistiques:", error);
            res.status(404).json({
                error: error instanceof Error ? error.message : "Média non trouvé",
            });
        }
    };
}
exports.MediaController = MediaController;
//# sourceMappingURL=media.controller.js.map