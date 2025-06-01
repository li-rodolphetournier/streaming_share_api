import { AuthController } from "../controllers/auth.controller";
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const authController = new AuthController();

// Routes publiques
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/reset-password", authController.resetPassword);

// Routes protégées
router.use(authMiddleware.authenticate);

router.get("/profile", authController.getProfile);
router.put("/profile", authController.updateProfile);
router.post("/change-password", authController.changePassword);
router.post("/logout", authController.logout);

export default router;
