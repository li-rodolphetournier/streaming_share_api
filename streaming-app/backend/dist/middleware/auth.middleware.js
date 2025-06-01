"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.AuthMiddleware = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthMiddleware {
    authService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    authenticate = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                res.status(401).json({
                    error: "Token d'authentification requis",
                });
                return;
            }
            const token = authHeader.substring(7);
            const user = await this.authService.verifyAccessToken(token);
            req.user = user;
            next();
        }
        catch (error) {
            console.error("Erreur d'authentification:", error);
            res.status(401).json({
                error: "Token invalide ou expiré",
            });
        }
    };
    requireAdmin = async (req, res, next) => {
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
        }
        catch (error) {
            console.error("Erreur de vérification des permissions:", error);
            res.status(500).json({
                error: "Erreur de vérification des permissions",
            });
        }
    };
    optionalAuth = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.substring(7);
                try {
                    const user = await this.authService.verifyAccessToken(token);
                    req.user = user;
                }
                catch (error) {
                    console.log("Token optionnel invalide:", error);
                }
            }
            next();
        }
        catch (error) {
            console.error("Erreur d'authentification optionnelle:", error);
            next();
        }
    };
}
exports.AuthMiddleware = AuthMiddleware;
exports.authMiddleware = new AuthMiddleware();
//# sourceMappingURL=auth.middleware.js.map