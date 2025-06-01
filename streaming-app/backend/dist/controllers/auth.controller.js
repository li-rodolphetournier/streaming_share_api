"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const validation_1 = require("../utils/validation");
const auth_service_1 = require("../services/auth.service");
class AuthController {
    authService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    register = async (req, res) => {
        try {
            const validation = (0, validation_1.validateRegisterData)(req.body);
            if (!validation.isValid) {
                res.status(400).json({
                    error: "Données invalides",
                    details: validation.errors,
                });
                return;
            }
            const tokens = await this.authService.register(req.body);
            res.status(201).json({
                message: "Inscription réussie",
                ...tokens,
            });
        }
        catch (error) {
            console.error("Erreur lors de l'inscription:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erreur d'inscription",
            });
        }
    };
    login = async (req, res) => {
        try {
            const validation = (0, validation_1.validateLoginData)(req.body);
            if (!validation.isValid) {
                res.status(400).json({
                    error: "Données invalides",
                    details: validation.errors,
                });
                return;
            }
            const tokens = await this.authService.login(req.body);
            res.json({
                message: "Connexion réussie",
                ...tokens,
            });
        }
        catch (error) {
            console.error("Erreur lors de la connexion:", error);
            res.status(401).json({
                error: error instanceof Error ? error.message : "Erreur de connexion",
            });
        }
    };
    refreshToken = async (req, res) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    error: "Token de rafraîchissement requis",
                });
                return;
            }
            const tokens = await this.authService.refreshToken(refreshToken);
            res.json({
                message: "Token rafraîchi avec succès",
                ...tokens,
            });
        }
        catch (error) {
            console.error("Erreur lors du rafraîchissement:", error);
            res.status(401).json({
                error: error instanceof Error ? error.message : "Token invalide",
            });
        }
    };
    getProfile = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    error: "Utilisateur non authentifié",
                });
                return;
            }
            const user = await this.authService.getUserProfile(userId);
            res.json({
                user,
            });
        }
        catch (error) {
            console.error("Erreur lors de la récupération du profil:", error);
            res.status(404).json({
                error: error instanceof Error ? error.message : "Profil non trouvé",
            });
        }
    };
    updateProfile = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    error: "Utilisateur non authentifié",
                });
                return;
            }
            const { firstName, lastName, avatar } = req.body;
            const user = await this.authService.updateProfile(userId, {
                firstName,
                lastName,
                avatar,
            });
            res.json({
                message: "Profil mis à jour avec succès",
                user,
            });
        }
        catch (error) {
            console.error("Erreur lors de la mise à jour du profil:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erreur de mise à jour",
            });
        }
    };
    changePassword = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    error: "Utilisateur non authentifié",
                });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                res.status(400).json({
                    error: "Mot de passe actuel et nouveau mot de passe requis",
                });
                return;
            }
            if (newPassword.length < 6) {
                res.status(400).json({
                    error: "Le nouveau mot de passe doit contenir au moins 6 caractères",
                });
                return;
            }
            await this.authService.changePassword(userId, currentPassword, newPassword);
            res.json({
                message: "Mot de passe modifié avec succès",
            });
        }
        catch (error) {
            console.error("Erreur lors du changement de mot de passe:", error);
            res.status(400).json({
                error: error instanceof Error
                    ? error.message
                    : "Erreur de changement de mot de passe",
            });
        }
    };
    resetPassword = async (req, res) => {
        try {
            const { email, newPassword } = req.body;
            if (!email || !newPassword) {
                res.status(400).json({
                    error: "Email et nouveau mot de passe requis",
                });
                return;
            }
            if (newPassword.length < 6) {
                res.status(400).json({
                    error: "Le nouveau mot de passe doit contenir au moins 6 caractères",
                });
                return;
            }
            await this.authService.resetPassword(email, newPassword);
            res.json({
                message: "Mot de passe réinitialisé avec succès",
            });
        }
        catch (error) {
            console.error("Erreur lors de la réinitialisation:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erreur de réinitialisation",
            });
        }
    };
    logout = async (req, res) => {
        try {
            res.json({
                message: "Déconnexion réussie",
            });
        }
        catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            res.status(500).json({
                error: "Erreur de déconnexion",
            });
        }
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map