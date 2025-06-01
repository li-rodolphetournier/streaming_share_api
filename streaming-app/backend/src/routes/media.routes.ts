import { MediaController } from "../controllers/media.controller";
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const mediaController = new MediaController();

// Routes publiques (avec authentification optionnelle)
router.get("/", authMiddleware.optionalAuth, mediaController.getAllMedias);
router.get(
  "/search",
  authMiddleware.optionalAuth,
  mediaController.searchMedias
);
router.get(
  "/popular",
  authMiddleware.optionalAuth,
  mediaController.getPopularMedias
);
router.get(
  "/recent",
  authMiddleware.optionalAuth,
  mediaController.getRecentMedias
);
router.get("/:id", authMiddleware.optionalAuth, mediaController.getMediaById);
router.get("/:id/stats", mediaController.getMediaStats);

// Routes protégées (authentification requise)
router.get(
  "/recommendations",
  authMiddleware.authenticate,
  mediaController.getRecommendations
);
router.post(
  "/:id/view",
  authMiddleware.authenticate,
  mediaController.recordView
);
router.post(
  "/:id/progress",
  authMiddleware.authenticate,
  mediaController.updateWatchProgress
);
router.get(
  "/history/watch",
  authMiddleware.authenticate,
  mediaController.getWatchHistory
);

// Routes admin (permissions administrateur requises)
router.post(
  "/",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  mediaController.createMedia
);
router.put(
  "/:id",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  mediaController.updateMedia
);
router.delete(
  "/:id",
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  mediaController.deleteMedia
);

export default router;
