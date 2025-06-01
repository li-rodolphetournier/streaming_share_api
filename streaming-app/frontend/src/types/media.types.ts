export type VideoQuality = "480p" | "720p" | "1080p" | "1440p" | "4K" | "8K";

export interface Media {
  id: string;
  title: string;
  description?: string;
  poster?: string;
  backdrop?: string;
  type: "movie" | "series" | "documentary";
  year: number;
  duration: number; // in minutes
  rating: number;
  genres: string[];
  qualities: string[];
  streamUrl: string;
  viewCount?: number;
  isFavorite: boolean;
  watchProgress?: WatchProgress;
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchProgress {
  currentTime: number; // in seconds
  duration: number; // in seconds
  progressPercentage: number;
  lastWatched: Date;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  poster?: string;
  mediaCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
