import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Library } from "./Library";
import { MediaRating } from "./MediaRating";
import { WatchHistory } from "./WatchHistory";

export type MediaType = "movie" | "tv" | "music" | "photo";

export interface MediaMetadata {
  duration: number; // en secondes
  resolution: string; // ex: "1920x1080"
  codec: string; // ex: "h264"
  bitrate: number; // en kbps
  size: number; // en bytes
  fps: number; // frames per second
  audioCodec?: string;
  audioChannels?: number;
  subtitles?: string[]; // langues disponibles
  chapters?: Array<{
    title: string;
    startTime: number;
    endTime: number;
  }>;
}

export interface MovieInfo {
  year?: number;
  genre?: string[];
  rating?: number; // note IMDB/TMDB
  director?: string;
  cast?: string[];
  imdbId?: string;
  tmdbId?: number;
  plot?: string;
  country?: string;
  language?: string;
  awards?: string;
  poster?: string;
  backdrop?: string;
  trailer?: string;
}

@Entity("media")
@Index(["title"])
@Index(["library", "createdAt"])
@Index(["viewCount"])
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  title: string;

  @Column({ name: "original_title", length: 500, nullable: true })
  originalTitle?: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "file_path", length: 1000, unique: true })
  filePath: string;

  @Column({ name: "thumbnail_path", length: 1000, nullable: true })
  thumbnailPath?: string;

  @Column({ name: "poster_path", length: 1000, nullable: true })
  posterPath?: string;

  @Column({ name: "backdrop_path", length: 1000, nullable: true })
  backdropPath?: string;

  @Column({
    type: "enum",
    enum: ["movie", "tv", "music", "photo"],
    default: "movie",
  })
  type: MediaType;

  @Column({ type: "jsonb", nullable: true })
  metadata?: MediaMetadata;

  @Column({ name: "movie_info", type: "jsonb", nullable: true })
  movieInfo?: MovieInfo;

  @Column({ name: "view_count", default: 0 })
  viewCount: number;

  @Column({ name: "last_viewed_at", type: "timestamp", nullable: true })
  lastViewedAt?: Date;

  @Column({ name: "file_size", type: "bigint", nullable: true })
  fileSize?: number;

  @Column({ name: "file_hash", length: 64, nullable: true })
  fileHash?: string; // SHA-256 pour détecter les doublons

  @Column({ name: "is_processed", default: false })
  isProcessed: boolean; // Indique si le transcodage est terminé

  @Column({ name: "processing_status", length: 50, default: "pending" })
  processingStatus: "pending" | "processing" | "completed" | "failed";

  @Column({ name: "hls_path", length: 1000, nullable: true })
  hlsPath?: string; // Chemin vers le fichier m3u8

  @Column({ name: "available_qualities", type: "simple-array", nullable: true })
  availableQualities?: string[]; // ex: ["480p", "720p", "1080p"]

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Library, (library) => library.medias, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "library_id" })
  library: Library;

  @OneToMany(() => WatchHistory, (history) => history.media)
  watchHistory: WatchHistory[];

  @OneToMany(() => MediaRating, (rating) => rating.media)
  ratings: MediaRating[];

  // Méthodes utilitaires
  get duration(): number {
    return this.metadata?.duration || 0;
  }

  get resolution(): string {
    return this.metadata?.resolution || "Unknown";
  }

  get formattedDuration(): string {
    const duration = this.duration;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  get formattedFileSize(): string {
    if (!this.fileSize) return "Unknown";

    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return `${(this.fileSize / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  get averageRating(): number {
    if (!this.ratings || this.ratings.length === 0) return 0;

    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return Math.round((sum / this.ratings.length) * 10) / 10;
  }

  get genres(): string[] {
    return this.movieInfo?.genre || [];
  }

  get year(): number | undefined {
    return this.movieInfo?.year;
  }

  get director(): string | undefined {
    return this.movieInfo?.director;
  }

  get cast(): string[] {
    return this.movieInfo?.cast || [];
  }

  // Méthode pour vérifier si le média est disponible en streaming
  isStreamingReady(): boolean {
    return (
      this.isProcessed &&
      this.processingStatus === "completed" &&
      !!this.hlsPath
    );
  }

  // Méthode pour obtenir la meilleure qualité disponible
  getBestQuality(): string | undefined {
    if (!this.availableQualities || this.availableQualities.length === 0) {
      return undefined;
    }

    const qualityOrder = ["2160p", "1440p", "1080p", "720p", "480p", "360p"];

    for (const quality of qualityOrder) {
      if (this.availableQualities.includes(quality)) {
        return quality;
      }
    }

    return this.availableQualities[0];
  }

  // Méthode pour incrémenter le compteur de vues
  incrementViewCount(): void {
    this.viewCount += 1;
    this.lastViewedAt = new Date();
  }

  // Méthode pour vérifier si le fichier existe toujours
  async fileExists(): Promise<boolean> {
    // Cette méthode sera implémentée avec les services de fichiers
    return true;
  }
}
