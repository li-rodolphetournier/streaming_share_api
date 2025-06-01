import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from "type-graphql";
import { IsOptional, Length, Max, Min } from "class-validator";

export enum MediaType {
  MOVIE = "movie",
  TV_SHOW = "tv_show",
  DOCUMENTARY = "documentary",
  ANIME = "anime",
  MUSIC_VIDEO = "music_video",
}

export enum VideoQuality {
  SD = "480p",
  HD = "720p",
  FULL_HD = "1080p",
  UHD_4K = "2160p",
  UHD_8K = "4320p",
}

export enum MediaStatus {
  PROCESSING = "processing",
  READY = "ready",
  ERROR = "error",
  ARCHIVED = "archived",
}

registerEnumType(MediaType, {
  name: "MediaType",
  description: "Types de médias disponibles",
});

registerEnumType(VideoQuality, {
  name: "VideoQuality",
  description: "Qualités vidéo disponibles",
});

registerEnumType(MediaStatus, {
  name: "MediaStatus",
  description: "Statuts des médias",
});

@ObjectType()
export class VideoMetadata {
  @Field(() => VideoQuality)
  quality!: VideoQuality;

  @Field(() => Int)
  width!: number;

  @Field(() => Int)
  height!: number;

  @Field(() => Float)
  frameRate!: number;

  @Field(() => Int)
  bitrate!: number;

  @Field()
  codec!: string;

  @Field(() => Float)
  aspectRatio!: number;
}

@ObjectType()
export class AudioMetadata {
  @Field()
  codec!: string;

  @Field(() => Int)
  bitrate!: number;

  @Field(() => Int)
  sampleRate!: number;

  @Field(() => Int)
  channels!: number;

  @Field({ nullable: true })
  language?: string;
}

@ObjectType()
export class Media {
  @Field(() => ID)
  id!: number;

  @Field()
  @Length(1, 255)
  title!: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => MediaType)
  type!: MediaType;

  @Field(() => MediaStatus)
  status!: MediaStatus;

  @Field()
  filePath!: string;

  @Field()
  fileName!: string;

  @Field(() => Float)
  fileSize!: number;

  @Field()
  fileHash!: string;

  @Field({ nullable: true })
  thumbnailPath?: string;

  @Field({ nullable: true })
  posterPath?: string;

  @Field({ nullable: true })
  hlsPath?: string;

  @Field(() => Int)
  duration!: number;

  @Field(() => Float)
  @Min(0)
  @Max(10)
  rating!: number;

  @Field(() => Int)
  viewCount!: number;

  @Field(() => Int)
  likeCount!: number;

  @Field(() => Int)
  dislikeCount!: number;

  @Field(() => [String])
  genres!: string[];

  @Field(() => [String])
  tags!: string[];

  @Field(() => [String])
  cast!: string[];

  @Field(() => [String])
  directors!: string[];

  @Field({ nullable: true })
  releaseDate?: Date;

  @Field({ nullable: true })
  imdbId?: string;

  @Field({ nullable: true })
  tmdbId?: string;

  @Field(() => [VideoMetadata])
  videoTracks!: VideoMetadata[];

  @Field(() => [AudioMetadata])
  audioTracks!: AudioMetadata[];

  @Field({ nullable: true })
  subtitlePath?: string;

  @Field()
  isPublic!: boolean;

  @Field()
  isProcessed!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Champs calculés
  @Field()
  get formattedDuration(): string {
    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    const seconds = this.duration % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  }

  @Field()
  get formattedFileSize(): string {
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (this.fileSize === 0) return "0 B";
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return `${(this.fileSize / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  @Field(() => VideoQuality, { nullable: true })
  get bestQuality(): VideoQuality | null {
    if (this.videoTracks.length === 0) return null;

    const qualityOrder = [
      VideoQuality.UHD_8K,
      VideoQuality.UHD_4K,
      VideoQuality.FULL_HD,
      VideoQuality.HD,
      VideoQuality.SD,
    ];

    for (const quality of qualityOrder) {
      if (this.videoTracks.some((track) => track.quality === quality)) {
        return quality;
      }
    }

    return this.videoTracks[0].quality;
  }
}

@ObjectType()
export class MediaConnection {
  @Field(() => [Media])
  nodes!: Media[];

  @Field()
  totalCount!: number;

  @Field()
  hasNextPage!: boolean;

  @Field()
  hasPreviousPage!: boolean;
}

@ObjectType()
export class WatchProgress {
  @Field(() => ID)
  id!: number;

  @Field(() => ID)
  userId!: number;

  @Field(() => ID)
  mediaId!: number;

  @Field(() => Media)
  media!: Media;

  @Field(() => Int)
  currentTime!: number;

  @Field(() => Float)
  progressPercentage!: number;

  @Field()
  completed!: boolean;

  @Field()
  lastWatched!: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
