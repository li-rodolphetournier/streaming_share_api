import { exec } from "child_process";
import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface StreamingQuality {
  name: string;
  resolution: string;
  videoBitrate: string;
  audioBitrate: string;
  maxrate: string;
  bufsize: string;
}

export interface StreamingOptions {
  mediaId: number;
  filePath: string;
  quality: string;
  startTime?: string;
}

export interface HLSPlaylist {
  playlistPath: string;
  segmentPaths: string[];
  duration: number;
  ready: boolean;
}

export class StreamingService {
  private readonly hlsOutputDir: string;
  private readonly supportedQualities: StreamingQuality[];
  private readonly segmentDuration = 10; // secondes
  private readonly maxConcurrentStreams = 2; // Limitation pour Raspberry Pi
  private activeStreams = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.hlsOutputDir = process.env.HLS_OUTPUT_DIR || "/tmp/hls";
    this.supportedQualities = [
      {
        name: "480p",
        resolution: "854:480",
        videoBitrate: "1000k",
        audioBitrate: "128k",
        maxrate: "1M",
        bufsize: "2M",
      },
      {
        name: "720p",
        resolution: "1280:720",
        videoBitrate: "2500k",
        audioBitrate: "192k",
        maxrate: "2.5M",
        bufsize: "5M",
      },
      {
        name: "1080p",
        resolution: "1920:1080",
        videoBitrate: "5000k",
        audioBitrate: "256k",
        maxrate: "5M",
        bufsize: "10M",
      },
    ];
  }

  /**
   * Génère un playlist HLS pour un média donné
   */
  async generateHLSPlaylist(options: StreamingOptions): Promise<HLSPlaylist> {
    const { mediaId, filePath, quality, startTime = "00:00:00" } = options;

    // Vérifier si le fichier source existe
    if (!existsSync(filePath)) {
      throw new Error(`Source file not found: ${filePath}`);
    }

    // Vérifier la qualité demandée
    const qualityConfig = this.getQualityConfig(quality);
    if (!qualityConfig) {
      throw new Error(`Unsupported quality: ${quality}`);
    }

    // Vérifier le nombre de streams actifs
    if (this.activeStreams.size >= this.maxConcurrentStreams) {
      throw new Error("Maximum concurrent streams reached");
    }

    const outputDir = path.join(this.hlsOutputDir, mediaId.toString(), quality);
    const playlistPath = path.join(outputDir, "playlist.m3u8");

    // Vérifier si le playlist existe déjà et est valide
    if (await this.isPlaylistValid(playlistPath)) {
      console.log(`Using existing HLS playlist: ${playlistPath}`);
      return await this.getPlaylistInfo(playlistPath);
    }

    // Créer le dossier de sortie
    await this.ensureDirectoryExists(outputDir);

    // Nettoyer les anciens fichiers
    await this.cleanupDirectory(outputDir);

    // Générer le playlist HLS
    await this.transcodeToHLS(filePath, outputDir, qualityConfig, startTime);

    // Programmer le nettoyage automatique
    this.scheduleCleanup(mediaId, quality);

    return await this.getPlaylistInfo(playlistPath);
  }

  /**
   * Obtient l'URL de streaming pour un média
   */
  async getStreamUrl(
    mediaId: number,
    quality: string = "720p"
  ): Promise<string> {
    const outputDir = path.join(this.hlsOutputDir, mediaId.toString(), quality);
    const playlistPath = path.join(outputDir, "playlist.m3u8");

    if (await this.isPlaylistValid(playlistPath)) {
      return `/stream/${mediaId}/${quality}/playlist.m3u8`;
    }

    throw new Error(
      "Stream not available. Please generate HLS playlist first."
    );
  }

  /**
   * Obtient les qualités disponibles pour un média
   */
  getAvailableQualities(): string[] {
    return this.supportedQualities.map((q) => q.name);
  }

  /**
   * Vérifie si un stream est actif
   */
  isStreamActive(mediaId: number, quality: string): boolean {
    const streamKey = `${mediaId}_${quality}`;
    return this.activeStreams.has(streamKey);
  }

  /**
   * Arrête un stream actif
   */
  async stopStream(mediaId: number, quality: string): Promise<void> {
    const streamKey = `${mediaId}_${quality}`;
    const timeout = this.activeStreams.get(streamKey);

    if (timeout) {
      clearTimeout(timeout);
      this.activeStreams.delete(streamKey);
    }

    // Nettoyer les fichiers
    const outputDir = path.join(this.hlsOutputDir, mediaId.toString(), quality);
    await this.cleanupDirectory(outputDir);

    console.log(`Stream stopped: ${streamKey}`);
  }

  /**
   * Obtient les statistiques des streams actifs
   */
  getStreamStats() {
    return {
      activeStreams: this.activeStreams.size,
      maxConcurrentStreams: this.maxConcurrentStreams,
      supportedQualities: this.getAvailableQualities(),
    };
  }

  /**
   * Transcode un fichier vidéo en HLS
   */
  private async transcodeToHLS(
    inputPath: string,
    outputDir: string,
    quality: StreamingQuality,
    startTime: string
  ): Promise<void> {
    const playlistPath = path.join(outputDir, "playlist.m3u8");
    const segmentPattern = path.join(outputDir, "segment_%03d.ts");

    const ffmpegCommand = [
      "ffmpeg",
      "-y", // Overwrite output files
      `-ss ${startTime}`, // Start time
      `-i "${inputPath}"`, // Input file
      "-c:v libx264", // Video codec
      "-preset veryfast", // Encoding preset (optimized for Raspberry Pi)
      `-crf 25`, // Constant Rate Factor
      `-maxrate ${quality.maxrate}`,
      `-bufsize ${quality.bufsize}`,
      `-vf scale=${quality.resolution}`, // Video filter for scaling
      "-c:a aac", // Audio codec
      `-b:a ${quality.audioBitrate}`, // Audio bitrate
      "-ac 2", // Audio channels
      "-ar 44100", // Audio sample rate
      `-hls_time ${this.segmentDuration}`, // Segment duration
      "-hls_list_size 0", // Keep all segments in playlist
      "-hls_flags delete_segments", // Delete old segments
      `-hls_segment_filename "${segmentPattern}"`,
      "-f hls", // Output format
      `"${playlistPath}"`,
    ].join(" ");

    console.log(`Starting HLS transcoding: ${ffmpegCommand}`);

    try {
      const { stdout, stderr } = await execAsync(ffmpegCommand);
      console.log("FFmpeg stdout:", stdout);
      if (stderr) console.log("FFmpeg stderr:", stderr);

      // Vérifier que le playlist a été créé
      if (!(await this.fileExists(playlistPath))) {
        throw new Error("Failed to generate HLS playlist");
      }

      console.log(`HLS transcoding completed: ${playlistPath}`);
    } catch (error) {
      console.error("FFmpeg transcoding failed:", error);
      throw new Error(
        `Transcoding failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Obtient la configuration pour une qualité donnée
   */
  private getQualityConfig(quality: string): StreamingQuality | null {
    return this.supportedQualities.find((q) => q.name === quality) || null;
  }

  /**
   * Vérifie si un playlist HLS est valide
   */
  private async isPlaylistValid(playlistPath: string): Promise<boolean> {
    try {
      if (!(await this.fileExists(playlistPath))) {
        return false;
      }

      const content = await fs.readFile(playlistPath, "utf-8");
      return content.includes("#EXTM3U") && content.includes("#EXT-X-ENDLIST");
    } catch {
      return false;
    }
  }

  /**
   * Obtient les informations d'un playlist HLS
   */
  private async getPlaylistInfo(playlistPath: string): Promise<HLSPlaylist> {
    try {
      const content = await fs.readFile(playlistPath, "utf-8");
      const lines = content.split("\n");

      const segmentPaths: string[] = [];
      let duration = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("#EXTINF:")) {
          const segmentDuration = parseFloat(line.split(":")[1].split(",")[0]);
          duration += segmentDuration;
        }

        if (line.endsWith(".ts")) {
          segmentPaths.push(path.join(path.dirname(playlistPath), line));
        }
      }

      return {
        playlistPath,
        segmentPaths,
        duration,
        ready: content.includes("#EXT-X-ENDLIST"),
      };
    } catch (error) {
      throw new Error(
        `Failed to read playlist info: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Programme le nettoyage automatique d'un stream
   */
  private scheduleCleanup(mediaId: number, quality: string): void {
    const streamKey = `${mediaId}_${quality}`;
    const cleanupDelay = 2 * 60 * 60 * 1000; // 2 heures

    // Annuler le nettoyage précédent s'il existe
    const existingTimeout = this.activeStreams.get(streamKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Programmer le nouveau nettoyage
    const timeout = setTimeout(async () => {
      await this.stopStream(mediaId, quality);
    }, cleanupDelay);

    this.activeStreams.set(streamKey, timeout);
    console.log(
      `Cleanup scheduled for stream: ${streamKey} in ${cleanupDelay / 1000}s`
    );
  }

  /**
   * Nettoie un répertoire
   */
  private async cleanupDirectory(dirPath: string): Promise<void> {
    try {
      if (existsSync(dirPath)) {
        const files = await fs.readdir(dirPath);
        await Promise.all(
          files.map((file) => fs.unlink(path.join(dirPath, file)))
        );
        console.log(`Cleaned up directory: ${dirPath}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup directory ${dirPath}:`, error);
    }
  }

  /**
   * S'assure qu'un répertoire existe
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create directory ${dirPath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Vérifie si un fichier existe
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
