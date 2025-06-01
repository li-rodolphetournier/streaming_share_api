import { Router } from "express";
import { StreamingController } from "../controllers/streaming.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const streamingController = new StreamingController();

// Routes de streaming HLS (protégées par authentification)
router.post(
  "/start/:id",
  authMiddleware.authenticate,
  streamingController.startStream.bind(streamingController)
);
router.delete(
  "/stop/:id",
  authMiddleware.authenticate,
  streamingController.stopStream.bind(streamingController)
);
router.get(
  "/stats",
  authMiddleware.authenticate,
  streamingController.getStreamStats.bind(streamingController)
);

// Routes pour servir les fichiers HLS (publiques pour le lecteur vidéo)
router.get(
  "/hls/:id/:quality/playlist.m3u8",
  streamingController.servePlaylist.bind(streamingController)
);
router.get(
  "/hls/:id/:quality/:segment",
  streamingController.serveSegment.bind(streamingController)
);

// Routes de métadonnées (protégées)
router.get(
  "/metadata/:id",
  authMiddleware.authenticate,
  streamingController.extractMetadata.bind(streamingController)
);
router.post(
  "/check-video",
  authMiddleware.authenticate,
  streamingController.checkVideoFile.bind(streamingController)
);

// Routes de miniatures (protégées pour la génération, publiques pour la consultation)
router.post(
  "/thumbnail/:id",
  authMiddleware.authenticate,
  streamingController.generateThumbnail.bind(streamingController)
);
router.post(
  "/thumbnails/:id",
  authMiddleware.authenticate,
  streamingController.generateMultipleThumbnails.bind(streamingController)
);
router.get(
  "/thumbnails/:filename",
  streamingController.serveThumbnail.bind(streamingController)
);

export default router;
