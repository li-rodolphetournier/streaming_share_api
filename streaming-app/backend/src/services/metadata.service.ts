import { exec } from "child_process";
import { existsSync } from "fs";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface VideoMetadata {
  duration: number; // en secondes
  size: number; // en bytes
  bitrate: number; // en bits/sec
  resolution: string; // "1920x1080"
  width: number;
  height: number;
  codec: string; // "h264", "hevc", etc.
  fps: number; // frames per second
  aspectRatio: string; // "16:9"
}

export interface AudioMetadata {
  codec: string; // "aac", "mp3", etc.
  bitrate: number; // en bits/sec
  sampleRate: number; // en Hz
  channels: number; // nombre de canaux
  channelLayout: string; // "stereo", "5.1", etc.
}

export interface MediaMetadata {
  filename: string;
  filepath: string;
  filesize: number;
  format: string; // "mp4", "mkv", etc.
  video?: VideoMetadata;
  audio?: AudioMetadata;
  subtitles: SubtitleTrack[];
  chapters: Chapter[];
  thumbnail?: string;
  poster?: string;
  extractedAt: Date;
}

export interface SubtitleTrack {
  index: number;
  language?: string;
  title?: string;
  codec: string;
  forced: boolean;
  default: boolean;
}

export interface Chapter {
  id: number;
  start: number; // en secondes
  end: number; // en secondes
  title?: string;
}

export interface ThumbnailOptions {
  timestamp?: string; // "00:01:30"
  width?: number;
  height?: number;
  quality?: number; // 1-31 (1 = meilleure qualité)
}

export class MetadataService {
  private readonly thumbnailsDir: string;
  private readonly postersDir: string;
  private readonly defaultThumbnailTimestamp = "00:01:00";

  constructor() {
    this.thumbnailsDir = process.env.THUMBNAILS_DIR || "/tmp/thumbnails";
    this.postersDir = process.env.POSTERS_DIR || "/tmp/posters";
  }

  /**
   * Extrait toutes les métadonnées d'un fichier média
   */
  async extractMetadata(filePath: string): Promise<MediaMetadata> {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      console.log(`Extracting metadata from: ${filePath}`);

      // Utiliser ffprobe pour extraire les métadonnées
      const command = `ffprobe -v quiet -print_format json -show_format -show_streams -show_chapters "${filePath}"`;
      const { stdout } = await execAsync(command);
      const data = JSON.parse(stdout);

      // Extraire les informations de base
      const filename = path.basename(filePath);
      const fileStats = await fs.stat(filePath);

      // Analyser les streams
      const videoStream = data.streams.find(
        (s: any) => s.codec_type === "video"
      );
      const audioStream = data.streams.find(
        (s: any) => s.codec_type === "audio"
      );
      const subtitleStreams = data.streams.filter(
        (s: any) => s.codec_type === "subtitle"
      );

      // Construire les métadonnées
      const metadata: MediaMetadata = {
        filename,
        filepath: filePath,
        filesize: fileStats.size,
        format: this.getFileFormat(data.format.format_name),
        video: videoStream
          ? this.extractVideoMetadata(videoStream, data.format)
          : undefined,
        audio: audioStream ? this.extractAudioMetadata(audioStream) : undefined,
        subtitles: this.extractSubtitleTracks(subtitleStreams),
        chapters: this.extractChapters(data.chapters || []),
        extractedAt: new Date(),
      };

      console.log(`Metadata extracted successfully for: ${filename}`);
      return metadata;
    } catch (error) {
      console.error(`Failed to extract metadata from ${filePath}:`, error);
      throw new Error(
        `Metadata extraction failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Génère une miniature pour un fichier vidéo
   */
  async generateThumbnail(
    filePath: string,
    outputPath?: string,
    options: ThumbnailOptions = {}
  ): Promise<string> {
    if (!existsSync(filePath)) {
      throw new Error(`Source file not found: ${filePath}`);
    }

    const {
      timestamp = this.defaultThumbnailTimestamp,
      width = 320,
      height = 180,
      quality = 2,
    } = options;

    // Générer le chemin de sortie si non fourni
    if (!outputPath) {
      const filename = path.basename(filePath, path.extname(filePath));
      await this.ensureDirectoryExists(this.thumbnailsDir);
      outputPath = path.join(this.thumbnailsDir, `${filename}_thumb.jpg`);
    }

    try {
      const command = [
        "ffmpeg",
        "-y", // Overwrite output file
        `-ss ${timestamp}`, // Seek to timestamp
        `-i "${filePath}"`, // Input file
        "-vframes 1", // Extract 1 frame
        `-vf scale=${width}:${height}`, // Scale to desired size
        `-q:v ${quality}`, // Quality (1-31, lower is better)
        `"${outputPath}"`,
      ].join(" ");

      console.log(`Generating thumbnail: ${command}`);
      await execAsync(command);

      if (!existsSync(outputPath)) {
        throw new Error(
          "Thumbnail generation failed - output file not created"
        );
      }

      console.log(`Thumbnail generated: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error(`Thumbnail generation failed:`, error);
      throw new Error(
        `Failed to generate thumbnail: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Génère un poster (image de couverture) pour un fichier vidéo
   */
  async generatePoster(
    filePath: string,
    outputPath?: string,
    options: ThumbnailOptions = {}
  ): Promise<string> {
    const {
      timestamp = this.defaultThumbnailTimestamp,
      width = 600,
      height = 900,
      quality = 2,
    } = options;

    if (!outputPath) {
      const filename = path.basename(filePath, path.extname(filePath));
      await this.ensureDirectoryExists(this.postersDir);
      outputPath = path.join(this.postersDir, `${filename}_poster.jpg`);
    }

    return await this.generateThumbnail(filePath, outputPath, {
      timestamp,
      width,
      height,
      quality,
    });
  }

  /**
   * Génère plusieurs miniatures à différents moments
   */
  async generateMultipleThumbnails(
    filePath: string,
    count: number = 5,
    outputDir?: string
  ): Promise<string[]> {
    if (!existsSync(filePath)) {
      throw new Error(`Source file not found: ${filePath}`);
    }

    // Obtenir la durée de la vidéo
    const metadata = await this.extractMetadata(filePath);
    if (!metadata.video) {
      throw new Error("No video stream found in file");
    }

    const duration = metadata.video.duration;
    const interval = duration / (count + 1);

    if (!outputDir) {
      const filename = path.basename(filePath, path.extname(filePath));
      outputDir = path.join(this.thumbnailsDir, filename);
    }

    await this.ensureDirectoryExists(outputDir);

    const thumbnailPaths: string[] = [];

    for (let i = 1; i <= count; i++) {
      const timestamp = this.secondsToTimestamp(interval * i);
      const outputPath = path.join(
        outputDir,
        `thumb_${i.toString().padStart(2, "0")}.jpg`
      );

      try {
        await this.generateThumbnail(filePath, outputPath, {
          timestamp,
          width: 320,
          height: 180,
        });
        thumbnailPaths.push(outputPath);
      } catch (error) {
        console.warn(`Failed to generate thumbnail ${i}:`, error);
      }
    }

    return thumbnailPaths;
  }

  /**
   * Vérifie si un fichier est un fichier vidéo supporté
   */
  async isVideoFile(filePath: string): Promise<boolean> {
    try {
      const command = `ffprobe -v quiet -select_streams v:0 -show_entries stream=codec_type -of csv=p=0 "${filePath}"`;
      const { stdout } = await execAsync(command);
      return stdout.trim() === "video";
    } catch {
      return false;
    }
  }

  /**
   * Obtient la durée d'un fichier vidéo en secondes
   */
  async getVideoDuration(filePath: string): Promise<number> {
    try {
      const command = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`;
      const { stdout } = await execAsync(command);
      return parseFloat(stdout.trim());
    } catch (error) {
      throw new Error(
        `Failed to get video duration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Obtient les formats supportés par FFmpeg
   */
  async getSupportedFormats(): Promise<string[]> {
    try {
      const { stdout } = await execAsync("ffmpeg -formats");
      const lines = stdout.split("\n");
      const formats: string[] = [];

      for (const line of lines) {
        if (line.includes("DE ")) {
          const match = line.match(/DE\s+(\w+)/);
          if (match) {
            formats.push(match[1]);
          }
        }
      }

      return formats;
    } catch (error) {
      console.warn("Failed to get supported formats:", error);
      return ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"];
    }
  }

  /**
   * Extrait les métadonnées vidéo d'un stream
   */
  private extractVideoMetadata(videoStream: any, format: any): VideoMetadata {
    const width = parseInt(videoStream.width) || 0;
    const height = parseInt(videoStream.height) || 0;
    const duration = parseFloat(format.duration) || 0;
    const bitrate =
      parseInt(format.bit_rate) || parseInt(videoStream.bit_rate) || 0;

    return {
      duration: Math.round(duration),
      size: parseInt(format.size) || 0,
      bitrate,
      resolution: `${width}x${height}`,
      width,
      height,
      codec: videoStream.codec_name || "unknown",
      fps: this.parseFPS(
        videoStream.r_frame_rate || videoStream.avg_frame_rate
      ),
      aspectRatio: this.calculateAspectRatio(width, height),
    };
  }

  /**
   * Extrait les métadonnées audio d'un stream
   */
  private extractAudioMetadata(audioStream: any): AudioMetadata {
    return {
      codec: audioStream.codec_name || "unknown",
      bitrate: parseInt(audioStream.bit_rate) || 0,
      sampleRate: parseInt(audioStream.sample_rate) || 0,
      channels: parseInt(audioStream.channels) || 0,
      channelLayout: audioStream.channel_layout || "unknown",
    };
  }

  /**
   * Extrait les pistes de sous-titres
   */
  private extractSubtitleTracks(subtitleStreams: any[]): SubtitleTrack[] {
    return subtitleStreams.map((stream, index) => ({
      index,
      language: stream.tags?.language,
      title: stream.tags?.title,
      codec: stream.codec_name || "unknown",
      forced: stream.disposition?.forced === 1,
      default: stream.disposition?.default === 1,
    }));
  }

  /**
   * Extrait les chapitres
   */
  private extractChapters(chapters: any[]): Chapter[] {
    return chapters.map((chapter) => ({
      id: parseInt(chapter.id),
      start: parseFloat(chapter.start_time),
      end: parseFloat(chapter.end_time),
      title: chapter.tags?.title,
    }));
  }

  /**
   * Parse le frame rate depuis une chaîne de caractères
   */
  private parseFPS(frameRate: string): number {
    if (!frameRate || frameRate === "0/0") return 0;

    const [num, den] = frameRate.split("/").map(Number);
    if (den === 0) return 0;

    return Math.round((num / den) * 100) / 100; // Arrondir à 2 décimales
  }

  /**
   * Calcule le ratio d'aspect
   */
  private calculateAspectRatio(width: number, height: number): string {
    if (width === 0 || height === 0) return "unknown";

    const gcd = this.greatestCommonDivisor(width, height);
    const ratioWidth = width / gcd;
    const ratioHeight = height / gcd;

    return `${ratioWidth}:${ratioHeight}`;
  }

  /**
   * Calcule le plus grand commun diviseur
   */
  private greatestCommonDivisor(a: number, b: number): number {
    return b === 0 ? a : this.greatestCommonDivisor(b, a % b);
  }

  /**
   * Obtient le format de fichier principal
   */
  private getFileFormat(formatName: string): string {
    if (formatName.includes("mp4")) return "mp4";
    if (formatName.includes("matroska")) return "mkv";
    if (formatName.includes("avi")) return "avi";
    if (formatName.includes("mov")) return "mov";
    if (formatName.includes("wmv")) return "wmv";
    if (formatName.includes("flv")) return "flv";
    if (formatName.includes("webm")) return "webm";

    return formatName.split(",")[0] || "unknown";
  }

  /**
   * Convertit des secondes en timestamp HH:MM:SS
   */
  private secondsToTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return [hours, minutes, secs]
      .map((val) => val.toString().padStart(2, "0"))
      .join(":");
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
}
