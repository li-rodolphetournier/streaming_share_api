import { NextFunction, Request, Response } from "express";

import { AuthService } from "../services/auth.service";

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Middleware pour vérifier l'authentification
  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error: "Token d'authentification requis",
        });
        return;
      }

      const token = authHeader.substring(7); // Enlever "Bearer "

      const user = await this.authService.verifyAccessToken(token);
      req.user = user;

      next();
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      res.status(401).json({
        error: "Token invalide ou expiré",
      });
    }
  };

  // Middleware pour vérifier les permissions admin
  requireAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: "Authentification requise",
        });
        return;
      }

      if (!req.user.isAdmin()) {
        res.status(403).json({
          error: "Permissions administrateur requises",
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Erreur de vérification des permissions:", error);
      res.status(500).json({
        error: "Erreur de vérification des permissions",
      });
    }
  };

  // Middleware optionnel pour l'authentification (n'échoue pas si pas de token)
  optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
          const user = await this.authService.verifyAccessToken(token);
          req.user = user;
        } catch (error) {
          // Ignorer les erreurs de token pour l'auth optionnelle
          console.log("Token optionnel invalide:", error);
        }
      }

      next();
    } catch (error) {
      console.error("Erreur d'authentification optionnelle:", error);
      next(); // Continuer même en cas d'erreur
    }
  };
}

// Instance singleton du middleware
export const authMiddleware = new AuthMiddleware();
