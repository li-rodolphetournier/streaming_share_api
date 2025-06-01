# Phase 3 : Backend API (Semaine 3-5)

## 3.1 Structure du Backend

```
backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── media.controller.ts
│   │   ├── library.controller.ts
│   │   ├── user.controller.ts
│   │   └── streaming.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── media.service.ts
│   │   ├── library.service.ts
│   │   ├── streaming.service.ts
│   │   ├── metadata.service.ts
│   │   └── cache.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── upload.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── media.routes.ts
│   │   ├── library.routes.ts
│   │   └── user.routes.ts
│   ├── utils/
│   │   ├── ffmpeg.util.ts
│   │   ├── file.util.ts
│   │   └── validation.util.ts
│   ├── types/
│   │   └── express.d.ts
│   └── app.ts
├── Dockerfile
└── package.json
```

## 3.2 API Endpoints

### 3.2.1 Authentification

```typescript
// auth.routes.ts
POST / api / auth / register; // Inscription
POST / api / auth / login; // Connexion
POST / api / auth / refresh; // Refresh token
POST / api / auth / logout; // Déconnexion
GET / api / auth / profile; // Profil utilisateur
PUT / api / auth / profile; // Mise à jour profil
POST / api / auth / change - password; // Changement mot de passe
```

### 3.2.2 Bibliothèques

```typescript
// library.routes.ts
GET    /api/libraries         // Liste des bibliothèques
POST   /api/libraries         // Créer une bibliothèque
GET    /api/libraries/:id     // Détails d'une bibliothèque
PUT    /api/libraries/:id     // Modifier une bibliothèque
DELETE /api/libraries/:id     // Supprimer une bibliothèque
POST   /api/libraries/:id/scan // Scanner une bibliothèque
GET    /api/libraries/:id/stats // Statistiques
```

### 3.2.3 Médias

```typescript
// media.routes.ts
GET    /api/media             // Liste des médias (avec pagination)
GET    /api/media/:id         // Détails d'un média
PUT    /api/media/:id         // Modifier un média
DELETE /api/media/:id         // Supprimer un média
GET    /api/media/:id/stream  // Stream du média
GET    /api/media/:id/thumbnail // Miniature
GET    /api/media/:id/poster  // Poster
POST   /api/media/:id/rating  // Noter un média
GET    /api/media/search      // Recherche
GET    /api/media/recent      // Médias récents
GET    /api/media/popular     // Médias populaires
```

### 3.2.4 Historique & Progression

```typescript
// user.routes.ts
GET    /api/users/watch-history    // Historique de visionnage
POST   /api/users/watch-progress   // Sauvegarder progression
GET    /api/users/recommendations  // Recommandations
GET    /api/users/favorites        // Favoris
POST   /api/users/favorites/:id    // Ajouter aux favoris
DELETE /api/users/favorites/:id    // Retirer des favoris
```

## 3.3 Controllers

### 3.3.1 Auth Controller

```typescript
// auth.controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { validationResult } from "express-validator";

export class AuthController {
  private authService = new AuthService();

  async register(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName } = req.body;
      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refreshToken(refreshToken);

      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }
}
```

### 3.3.2 Media Controller

```typescript
// media.controller.ts
export class MediaController {
  private mediaService = new MediaService();

  async getMediaList(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = "title",
        order = "ASC",
        search,
        genre,
        library,
      } = req.query;

      const result = await this.mediaService.getMediaList({
        page: Number(page),
        limit: Number(limit),
        sort: sort as string,
        order: order as "ASC" | "DESC",
        search: search as string,
        genre: genre as string,
        libraryId: library ? Number(library) : undefined,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getMediaDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const media = await this.mediaService.getMediaDetails(Number(id), userId);

      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }

      res.json(media);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async streamMedia(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { quality = "720p" } = req.query;

      const streamUrl = await this.mediaService.getStreamUrl(
        Number(id),
        quality as string
      );

      res.redirect(streamUrl);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}
```

## 3.4 Services

### 3.4.1 Streaming Service

```typescript
// streaming.service.ts
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export class StreamingService {
  private readonly hlsOutputDir = "/tmp/hls";
  private readonly supportedQualities = ["480p", "720p", "1080p"];

  async generateHLSPlaylist(
    mediaId: number,
    filePath: string,
    quality: string
  ) {
    if (!this.supportedQualities.includes(quality)) {
      throw new Error(`Unsupported quality: ${quality}`);
    }

    const outputDir = path.join(this.hlsOutputDir, mediaId.toString(), quality);
    const playlistPath = path.join(outputDir, "playlist.m3u8");

    // Vérifier si le playlist existe déjà
    if (await this.fileExists(playlistPath)) {
      return playlistPath;
    }

    // Créer le dossier de sortie
    await execAsync(`mkdir -p "${outputDir}"`);

    // Configuration FFmpeg selon la qualité
    const ffmpegConfig = this.getFFmpegConfig(quality);

    const ffmpegCommand = `
      ffmpeg -i "${filePath}" 
      ${ffmpegConfig.videoOptions}
      ${ffmpegConfig.audioOptions}
      -hls_time 10 
      -hls_list_size 0 
      -hls_segment_filename "${outputDir}/segment_%03d.ts" 
      "${playlistPath}"
    `;

    await execAsync(ffmpegCommand);
    return playlistPath;
  }

  private getFFmpegConfig(quality: string) {
    const configs = {
      "480p": {
        videoOptions:
          "-c:v libx264 -preset veryfast -crf 28 -maxrate 1M -bufsize 2M -vf scale=854:480",
        audioOptions: "-c:a aac -b:a 128k",
      },
      "720p": {
        videoOptions:
          "-c:v libx264 -preset veryfast -crf 25 -maxrate 2.5M -bufsize 5M -vf scale=1280:720",
        audioOptions: "-c:a aac -b:a 192k",
      },
      "1080p": {
        videoOptions:
          "-c:v libx264 -preset veryfast -crf 23 -maxrate 5M -bufsize 10M -vf scale=1920:1080",
        audioOptions: "-c:a aac -b:a 256k",
      },
    };

    return configs[quality];
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await execAsync(`test -f "${filePath}"`);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 3.4.2 Metadata Service

```typescript
// metadata.service.ts
export class MetadataService {
  async extractMetadata(filePath: string) {
    try {
      const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
      const { stdout } = await execAsync(command);
      const data = JSON.parse(stdout);

      const videoStream = data.streams.find((s) => s.codec_type === "video");
      const audioStream = data.streams.find((s) => s.codec_type === "audio");

      return {
        duration: Math.round(parseFloat(data.format.duration)),
        size: parseInt(data.format.size),
        bitrate: parseInt(data.format.bit_rate),
        resolution: videoStream
          ? `${videoStream.width}x${videoStream.height}`
          : null,
        codec: videoStream?.codec_name,
        fps: videoStream ? this.parseFPS(videoStream.r_frame_rate) : null,
        audioCodec: audioStream?.codec_name,
        audioChannels: audioStream?.channels,
      };
    } catch (error) {
      throw new Error(`Failed to extract metadata: ${error.message}`);
    }
  }

  async generateThumbnail(
    filePath: string,
    outputPath: string,
    timestamp = "00:00:10"
  ) {
    const command = `ffmpeg -i "${filePath}" -ss ${timestamp} -vframes 1 -q:v 2 "${outputPath}"`;
    await execAsync(command);
    return outputPath;
  }

  private parseFPS(frameRate: string): number {
    const [num, den] = frameRate.split("/").map(Number);
    return Math.round(num / den);
  }
}
```

## 3.5 Middleware

### 3.5.1 Auth Middleware

```typescript
// auth.middleware.ts
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token." });
  }
};

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }
  next();
};
```

### 3.5.2 Rate Limiting

```typescript
// rate-limit.middleware.ts
import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: "Too many requests, please try again later.",
});
```

## 3.6 Configuration Raspberry Pi

### 3.6.1 Optimisations Performance

```typescript
// config/rpi.config.ts
export const RPiConfig = {
  // Limitation du transcodage simultané
  maxConcurrentStreams: 2,

  // Qualités supportées (pas de 4K sur RPi4)
  supportedQualities: ["480p", "720p"],

  // Configuration FFmpeg optimisée pour ARM
  ffmpegPreset: "veryfast", // Plus rapide sur ARM

  // Cache settings
  cache: {
    thumbnails: 24 * 60 * 60, // 24h
    metadata: 60 * 60, // 1h
    playlists: 30 * 60, // 30min
  },

  // Nettoyage automatique
  cleanup: {
    tempFiles: 60 * 60, // 1h
    oldSegments: 2 * 60 * 60, // 2h
  },
};
```

### 3.6.2 Monitoring Système

```typescript
// services/system.service.ts
export class SystemService {
  async getSystemHealth() {
    const [cpu, memory, temperature, disk] = await Promise.all([
      this.getCPUUsage(),
      this.getMemoryUsage(),
      this.getCPUTemperature(),
      this.getDiskUsage(),
    ]);

    return {
      cpu,
      memory,
      temperature,
      disk,
      activeStreams: await this.getActiveStreams(),
      timestamp: new Date(),
    };
  }

  private async getCPUTemperature(): Promise<number> {
    try {
      const { stdout } = await execAsync(
        "cat /sys/class/thermal/thermal_zone0/temp"
      );
      return parseInt(stdout.trim()) / 1000; // Conversion en Celsius
    } catch {
      return 0;
    }
  }

  private async getActiveStreams(): Promise<number> {
    try {
      const { stdout } = await execAsync("pgrep -c ffmpeg");
      return parseInt(stdout.trim());
    } catch {
      return 0;
    }
  }
}
```
