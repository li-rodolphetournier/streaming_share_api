/// <reference path="../types/express.d.ts" />

import { Request, Response } from "express";
import { validateLoginData, validateRegisterData } from "../utils/validation";

import { AuthService } from "../services/auth.service";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Inscription
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = validateRegisterData(req.body);
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
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erreur d'inscription",
      });
    }
  };

  // Connexion
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = validateLoginData(req.body);
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
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      res.status(401).json({
        error: error instanceof Error ? error.message : "Erreur de connexion",
      });
    }
  };

  // Rafraîchir le token
  refreshToken = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      res.status(401).json({
        error: error instanceof Error ? error.message : "Token invalide",
      });
    }
  };

  // Obtenir le profil utilisateur
  getProfile = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      res.status(404).json({
        error: error instanceof Error ? error.message : "Profil non trouvé",
      });
    }
  };

  // Mettre à jour le profil
  updateProfile = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erreur de mise à jour",
      });
    }
  };

  // Changer le mot de passe
  changePassword = async (req: Request, res: Response): Promise<void> => {
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

      await this.authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.json({
        message: "Mot de passe modifié avec succès",
      });
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erreur de changement de mot de passe",
      });
    }
  };

  // Réinitialiser le mot de passe
  resetPassword = async (req: Request, res: Response): Promise<void> => {
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
    } catch (error) {
      console.error("Erreur lors de la réinitialisation:", error);
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erreur de réinitialisation",
      });
    }
  };

  // Déconnexion (côté client principalement)
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // Dans une implémentation complète, on pourrait blacklister le token
      res.json({
        message: "Déconnexion réussie",
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      res.status(500).json({
        error: "Erreur de déconnexion",
      });
    }
  };
}
