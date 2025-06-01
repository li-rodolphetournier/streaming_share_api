# Phase 4 : Frontend React (Semaine 5-7)

## 4.1 Structure Frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/ (shadcn/ui components)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── media/
│   │   │   ├── MediaCard.tsx
│   │   │   ├── MediaGrid.tsx
│   │   │   ├── MediaDetails.tsx
│   │   │   └── MediaSearch.tsx
│   │   ├── player/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── PlayerControls.tsx
│   │   │   └── QualitySelector.tsx
│   │   ├── library/
│   │   │   ├── LibraryCard.tsx
│   │   │   ├── LibraryManager.tsx
│   │   │   └── ScanProgress.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Navigation.tsx
│   │       └── Layout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Library.tsx
│   │   ├── MediaDetail.tsx
│   │   ├── Player.tsx
│   │   ├── Search.tsx
│   │   ├── Profile.tsx
│   │   └── Admin.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useMedia.ts
│   │   ├── usePlayer.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── media.service.ts
│   │   └── storage.service.ts
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── media.types.ts
│   │   └── api.types.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   └── styles/
│       └── globals.css
├── public/
├── package.json
└── vite.config.ts
```

## 4.2 Configuration Vite

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-select"],
        },
      },
    },
  },
});
```

## 4.3 Types TypeScript

### media.types.ts

```typescript
export interface Media {
  id: number;
  title: string;
  originalTitle?: string;
  description?: string;
  filePath: string;
  thumbnailPath?: string;
  posterPath?: string;
  backdropPath?: string;
  metadata: {
    duration: number;
    resolution: string;
    codec: string;
    bitrate: number;
    size: number;
    fps: number;
  };
  movieInfo?: {
    year?: number;
    genre?: string[];
    rating?: number;
    director?: string;
    cast?: string[];
    imdbId?: string;
    tmdbId?: number;
  };
  viewCount: number;
  lastViewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  library: Library;
  watchHistory?: WatchHistory[];
  userRating?: number;
  averageRating?: number;
}

export interface Library {
  id: number;
  name: string;
  path: string;
  type: "movie" | "tv" | "music" | "photo";
  description?: string;
  isActive: boolean;
  lastScanDate?: Date;
  createdAt: Date;
  mediaCount?: number;
}

export interface WatchHistory {
  id: number;
  watchedDuration: number;
  totalDuration: number;
  progressPercentage: number;
  isCompleted: boolean;
  lastWatched: Date;
  media: Media;
}
```

## 4.4 Services API

### api.ts

```typescript
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer le refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### media.service.ts

```typescript
import { api } from "./api";
import { Media, Library } from "@/types/media.types";

export interface MediaListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "ASC" | "DESC";
  search?: string;
  genre?: string;
  libraryId?: number;
}

export interface MediaListResponse {
  data: Media[];
  total: number;
  page: number;
  totalPages: number;
}

export const mediaService = {
  async getMediaList(params: MediaListParams = {}): Promise<MediaListResponse> {
    const response = await api.get("/media", { params });
    return response.data;
  },

  async getMediaDetails(id: number): Promise<Media> {
    const response = await api.get(`/media/${id}`);
    return response.data;
  },

  async searchMedia(query: string): Promise<Media[]> {
    const response = await api.get("/media/search", { params: { q: query } });
    return response.data;
  },

  async getRecentMedia(): Promise<Media[]> {
    const response = await api.get("/media/recent");
    return response.data;
  },

  async getPopularMedia(): Promise<Media[]> {
    const response = await api.get("/media/popular");
    return response.data;
  },

  async rateMedia(
    mediaId: number,
    rating: number,
    review?: string
  ): Promise<void> {
    await api.post(`/media/${mediaId}/rating`, { rating, review });
  },

  async updateWatchProgress(
    mediaId: number,
    watchedDuration: number
  ): Promise<void> {
    await api.post("/users/watch-progress", { mediaId, watchedDuration });
  },

  getStreamUrl(mediaId: number, quality: string = "720p"): string {
    return `${api.defaults.baseURL}/media/${mediaId}/stream?quality=${quality}`;
  },

  getThumbnailUrl(mediaId: number): string {
    return `${api.defaults.baseURL}/media/${mediaId}/thumbnail`;
  },

  getPosterUrl(mediaId: number): string {
    return `${api.defaults.baseURL}/media/${mediaId}/poster`;
  },
};
```

## 4.5 Hooks Personnalisés

### useAuth.ts

```typescript
import { useState, useEffect, createContext, useContext } from "react";
import { authService } from "@/services/auth.service";

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    setUser(response.user);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### useMedia.ts

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mediaService, MediaListParams } from "@/services/media.service";

export const useMediaList = (params: MediaListParams = {}) => {
  return useQuery({
    queryKey: ["media", params],
    queryFn: () => mediaService.getMediaList(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMediaDetails = (id: number) => {
  return useQuery({
    queryKey: ["media", id],
    queryFn: () => mediaService.getMediaDetails(id),
    enabled: !!id,
  });
};

export const useMediaSearch = (query: string) => {
  return useQuery({
    queryKey: ["media", "search", query],
    queryFn: () => mediaService.searchMedia(query),
    enabled: query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useRateMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mediaId,
      rating,
      review,
    }: {
      mediaId: number;
      rating: number;
      review?: string;
    }) => mediaService.rateMedia(mediaId, rating, review),
    onSuccess: (_, { mediaId }) => {
      queryClient.invalidateQueries({ queryKey: ["media", mediaId] });
    },
  });
};

export const useUpdateWatchProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mediaId,
      watchedDuration,
    }: {
      mediaId: number;
      watchedDuration: number;
    }) => mediaService.updateWatchProgress(mediaId, watchedDuration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchHistory"] });
    },
  });
};
```

## 4.6 Composants Principaux

### VideoPlayer.tsx

```typescript
import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useUpdateWatchProgress } from "@/hooks/useMedia";

interface VideoPlayerProps {
  mediaId: number;
  streamUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
  startTime?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  mediaId,
  streamUrl,
  onTimeUpdate,
  startTime = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const updateWatchProgress = useUpdateWatchProgress();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false, // Désactivé pour RPi4
        lowLatencyMode: false,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (startTime > 0) {
          video.currentTime = startTime;
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    }
  }, [streamUrl, startTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);

      // Sauvegarder la progression toutes les 30 secondes
      if (Math.floor(time) % 30 === 0) {
        updateWatchProgress.mutate({ mediaId, watchedDuration: time });
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [mediaId, onTimeUpdate, updateWatchProgress]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="relative w-full h-full bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video ref={videoRef} className="w-full h-full" onClick={togglePlay} />

      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-white mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </Button>
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Settings size={20} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize size={20} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### MediaGrid.tsx

```typescript
import React, { useState } from "react";
import { MediaCard } from "./MediaCard";
import { useMediaList } from "@/hooks/useMedia";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

export const MediaGrid: React.FC = () => {
  const [sortBy, setSortBy] = useState<string>("title");
  const [order, setOrder] = useState<"ASC" | "DESC">("ASC");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useMediaList({
    page,
    limit: 24,
    sort: sortBy,
    order,
    search: search || undefined,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] bg-gray-200 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Erreur lors du chargement des médias</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <Input
            placeholder="Rechercher des médias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Titre</SelectItem>
              <SelectItem value="createdAt">Date d'ajout</SelectItem>
              <SelectItem value="viewCount">Popularité</SelectItem>
              <SelectItem value="lastViewedAt">Récemment vus</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={order}
            onValueChange={(value: "ASC" | "DESC") => setOrder(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASC">Croissant</SelectItem>
              <SelectItem value="DESC">Décroissant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grille de médias */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {data?.data.map((media) => (
          <MediaCard key={media.id} media={media} />
        ))}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="flex items-center px-4">
            Page {page} sur {data.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === data.totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
};
```

## 4.7 Optimisations Performance

### Lazy Loading

```typescript
import { lazy, Suspense } from "react";

const VideoPlayer = lazy(() => import("@/components/player/VideoPlayer"));
const MediaGrid = lazy(() => import("@/components/media/MediaGrid"));

// Usage avec Suspense
<Suspense fallback={<div>Chargement...</div>}>
  <VideoPlayer mediaId={mediaId} streamUrl={streamUrl} />
</Suspense>;
```

### Virtual Scrolling pour grandes listes

```typescript
import { FixedSizeGrid as Grid } from "react-window";

export const VirtualMediaGrid: React.FC<{ medias: Media[] }> = ({ medias }) => {
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * 6 + columnIndex;
    const media = medias[index];

    if (!media) return null;

    return (
      <div style={style}>
        <MediaCard media={media} />
      </div>
    );
  };

  return (
    <Grid
      columnCount={6}
      columnWidth={200}
      height={600}
      rowCount={Math.ceil(medias.length / 6)}
      rowHeight={300}
      width="100%"
    >
      {Cell}
    </Grid>
  );
};
```
