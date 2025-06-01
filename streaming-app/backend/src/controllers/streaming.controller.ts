import { Request, Response } from "express";

import { MediaService } from "../services/media.service";
import { MetadataService } from "../services/metadata.service";
import { StreamingService } from "../services/streaming.service";
import { existsSync } from "fs";
import path from "path";

export class StreamingController {
  private streamingService = new StreamingService();
  private metadataService = new MetadataService();
  private mediaService = new MediaService();

  /**
   * Démarre un stream HLS pour un média
   */
  async startStream(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quality = "720p", startTime = "00:00:00" } = req.query;

      // Vérifier que l'ID est valide
      const mediaId = parseInt(id);
      if (isNaN(mediaId)) {
        res.status(400).json({ message: "Invalid media ID" });
        return;
      }

      // Récupérer les informations du média
      const media = await this.mediaService.getMediaById(mediaId);
      if (!media) {
        res.status(404).json({ message: "Media not found" });
        return;
      }

      // Vérifier que le fichier existe
      if (!existsSync(media.filePath)) {
        res.status(404).json({ message: "Media file not found on disk" });
        return;
      }

      // Vérifier que la qualité est supportée
      const availableQualities = this.streamingService.getAvailableQualities();
      if (!availableQualities.includes(quality as string)) {
        res.status(400).json({
          message: "Unsupported quality",
          availableQualities,
        });
        return;
      }

      // Générer le playlist HLS
      const playlist = await this.streamingService.generateHLSPlaylist({
        mediaId,
        filePath: media.filePath,
        quality: quality as string,
        startTime: startTime as string,
      });

      // Obtenir l'URL de streaming
      const streamUrl = await this.streamingService.getStreamUrl(
        mediaId,
        quality as string
      );

      res.json({
        success: true,
        streamUrl,
        playlist: {
          path: playlist.playlistPath,
          duration: playlist.duration,
          ready: playlist.ready,
          segments: playlist.segmentPaths.length,
        },
        quality,
        availableQualities,
      });
    } catch (error) {
      console.error("Stream start error:", error);
      res.status(500).json({
        message: "Failed to start stream",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Sert le fichier playlist HLS
   */
  async servePlaylist(req: Request, res: Response): Promise<void> {
    try {
      const { id, quality } = req.params;
      const mediaId = parseInt(id);

      if (isNaN(mediaId)) {
        res.status(400).json({ message: "Invalid media ID" });
        return;
      }

      // Construire le chemin du playlist
      const hlsOutputDir = process.env.HLS_OUTPUT_DIR || "/tmp/hls";
      const playlistPath = path.join(
        hlsOutputDir,
        mediaId.toString(),
        quality,
        "playlist.m3u8"
      );

      if (!existsSync(playlistPath)) {
        res.status(404).json({ message: "Playlist not found" });
        return;
      }

      // Servir le fichier playlist avec les bons headers
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.sendFile(path.resolve(playlistPath));
    } catch (error) {
      console.error("Playlist serve error:", error);
      res.status(500).json({ message: "Failed to serve playlist" });
    }
  }

  /**
   * Sert les segments vidéo HLS
   */
  async serveSegment(req: Request, res: Response): Promise<void> {
    try {
      const { id, quality, segment } = req.params;
      const mediaId = parseInt(id);

      if (isNaN(mediaId)) {
        res.status(400).json({ message: "Invalid media ID" });
        return;
      }

      // Vérifier que le nom du segment est valide
      if (!segment.endsWith(".ts")) {
        res.status(400).json({ message: "Invalid segment format" });
        return;
      }

      // Construire le chemin du segment
      const hlsOutputDir = process.env.HLS_OUTPUT_DIR || "/tmp/hls";
      const segmentPath = path.join(
        hlsOutputDir,
        mediaId.toString(),
        quality,
        segment
      );

      if (!existsSync(segmentPath)) {
        res.status(404).json({ message: "Segment not found" });
        return;
      }

      // Servir le segment avec les bons headers
      res.setHeader("Content-Type", "video/mp2t");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.sendFile(path.resolve(segmentPath));
    } catch (error) {
      console.error("Segment serve error:", error);
      res.status(500).json({ message: "Failed to serve segment" });
    }
  }

  /**
   * Arrête un stream actif
   */
  async stopStream(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quality = "720p" } = req.query;
      const mediaId = parseInt(id);

      if (isNaN(mediaId)) {
        res.status(400).json({ message: "Invalid media ID" });
        return;
      }

      await this.streamingService.stopStream(mediaId, quality as string);

      res.json({
        success: true,
        message: "Stream stopped successfully",
      });
    } catch (error) {
      console.error("Stream stop error:", error);
      res.status(500).json({
        message: "Failed to stop stream",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Obtient les statistiques des streams
   */
  async getStreamStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.streamingService.getStreamStats();
      res.json(stats);
    } catch (error) {
      console.error("Stream stats error:", error);
      res.status(500).json({ message: "Failed to get stream stats" });
    }
  }

  /**
   * Génère une miniature pour un média
   */
  async generateThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { timestamp, width, height, quality } = req.query;
      const mediaId = parseInt(id);

      if (isNaN(mediaId)) {
        res.status(400).json({ message: "Invalid media ID" });
        return;
      }

      // Récupérer les informations du média
      const media = await this.mediaService.getMediaById(mediaId);
      if (!media) {
        res.status(404).json({ message: "Media not found" });
        return;
      }

      if (!existsSync(media.filePath)) {
        res.status(404).json({ message: "Media file not found on disk" });
        return;
      }

      // Générer la miniature
      const thumbnailPath = await this.metadataService.generateThumbnail(
        media.filePath,
        undefined,
        {
          timestamp: timestamp as string,
          width: width ? parseInt(width as string) : undefined,
          height: height ? parseInt(height as string) : undefined,
          quality: quality ? parseInt(quality as string) : undefined,
        }
      );

      res.json({
        success: true,
        thumbnailPath,
        url: `/thumbnails/${path.basename(thumbnailPath)}`,
      });
    } catch (error) {
      console.error("Thumbnail generation error:", error);
      res.status(500).json({
        message: "Failed to generate thumbnail",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Sert une miniature
   */
  async serveThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      const thumbnailsDir = process.env.THUMBNAILS_DIR || "/tmp/thumbnails";
      const thumbnailPath = path.join(thumbnailsDir, filename);

      if (!existsSync(thumbnailPath)) {
        res.status(404).json({ message: "Thumbnail not found" });
        return;
      }

      // Servir l'image avec les bons headers
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400"); // 24h
      res.sendFile(path.resolve(thumbnailPath));
    } catch (error) {
      console.error("Thumbnail serve error:", error);
      res.status(500).json({ message: "Failed to serve thumbnail" });
    }
  }

  /**
   * Extrait les métadonnées d'un média
   */
  async extractMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const mediaId = parseInt(id);

      if (isNaN(mediaId)) {
        res.status(400).json({ message: "Invalid media ID" });
        return;
      }

      // Récupérer les informations du média
      const media = await this.mediaService.getMediaById(mediaId);
      if (!media) {
        res.status(404).json({ message: "Media not found" });
        return;
      }

      if (!existsSync(media.filePath)) {
        res.status(404).json({ message: "Media file not found on disk" });
        return;
      }

      // Extraire les métadonnées
      const metadata = await this.metadataService.extractMetadata(
        media.filePath
      );

      res.json({
        success: true,
        metadata,
      });
    } catch (error) {
      console.error("Metadata extraction error:", error);
      res.status(500).json({
        message: "Failed to extract metadata",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Vérifie si un fichier est un fichier vidéo
   */
  async checkVideoFile(req: Request, res: Response): Promise<void> {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        res.status(400).json({ message: "File path is required" });
        return;
      }

      if (!existsSync(filePath)) {
        res.status(404).json({ message: "File not found" });
        return;
      }

      const isVideo = await this.metadataService.isVideoFile(filePath);
      const supportedFormats = await this.metadataService.getSupportedFormats();

      res.json({
        success: true,
        isVideo,
        supportedFormats,
      });
    } catch (error) {
      console.error("Video file check error:", error);
      res.status(500).json({
        message: "Failed to check video file",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Génère plusieurs miniatures pour un média
   */
  async generateMultipleThumbnails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { count = 5 } = req.query;
      const mediaId = parseInt(id);

      if (isNaN(mediaId)) {
        res.status(400).json({ message: "Invalid media ID" });
        return;
      }

      // Récupérer les informations du média
      const media = await this.mediaService.getMediaById(mediaId);
      if (!media) {
        res.status(404).json({ message: "Media not found" });
        return;
      }

      if (!existsSync(media.filePath)) {
        res.status(404).json({ message: "Media file not found on disk" });
        return;
      }

      // Générer les miniatures
      const thumbnailPaths =
        await this.metadataService.generateMultipleThumbnails(
          media.filePath,
          parseInt(count as string)
        );

      const thumbnailUrls = thumbnailPaths.map((path) => ({
        path,
        url: `/thumbnails/${path.split("/").pop()}`,
      }));

      res.json({
        success: true,
        thumbnails: thumbnailUrls,
        count: thumbnailPaths.length,
      });
    } catch (error) {
      console.error("Multiple thumbnails generation error:", error);
      res.status(500).json({
        message: "Failed to generate multiple thumbnails",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
