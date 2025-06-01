# Phase 2 : Base de Données & Modèles (Semaine 2-3)

## 2.1 Schéma de Base de Données

### Entités Principales

#### User (Utilisateur)

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hashé avec bcrypt

  @Column({ default: "user" })
  role: "admin" | "user";

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  avatar: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Library, (library) => library.owner)
  libraries: Library[];

  @OneToMany(() => WatchHistory, (history) => history.user)
  watchHistory: WatchHistory[];

  @OneToMany(() => UserPreference, (preference) => preference.user)
  preferences: UserPreference[];
}
```

#### Library (Bibliothèque)

```typescript
@Entity()
export class Library {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  path: string; // Chemin vers le dossier de médias

  @Column({ default: "movie" })
  type: "movie" | "tv" | "music" | "photo";

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastScanDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.libraries)
  owner: User;

  @OneToMany(() => Media, (media) => media.library)
  medias: Media[];
}
```

#### Media (Média)

```typescript
@Entity()
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  originalTitle: string;

  @Column({ nullable: true, type: "text" })
  description: string;

  @Column()
  filePath: string;

  @Column({ nullable: true })
  thumbnailPath: string;

  @Column({ nullable: true })
  posterPath: string;

  @Column({ nullable: true })
  backdropPath: string;

  @Column({ type: "json", nullable: true })
  metadata: {
    duration: number;
    resolution: string;
    codec: string;
    bitrate: number;
    size: number;
    fps: number;
  };

  @Column({ type: "json", nullable: true })
  movieInfo: {
    year?: number;
    genre?: string[];
    rating?: number;
    director?: string;
    cast?: string[];
    imdbId?: string;
    tmdbId?: number;
  };

  @Column({ default: 0 })
  viewCount: number;

  @Column({ nullable: true })
  lastViewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Library, (library) => library.medias)
  library: Library;

  @OneToMany(() => WatchHistory, (history) => history.media)
  watchHistory: WatchHistory[];

  @OneToMany(() => MediaRating, (rating) => rating.media)
  ratings: MediaRating[];
}
```

#### WatchHistory (Historique de visionnage)

```typescript
@Entity()
export class WatchHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  watchedDuration: number; // en secondes

  @Column({ default: 0 })
  totalDuration: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastWatched: Date;

  @ManyToOne(() => User, (user) => user.watchHistory)
  user: User;

  @ManyToOne(() => Media, (media) => media.watchHistory)
  media: Media;
}
```

#### MediaRating (Évaluations)

```typescript
@Entity()
export class MediaRating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "decimal", precision: 3, scale: 1 })
  rating: number; // 0.0 à 10.0

  @Column({ nullable: true, type: "text" })
  review: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @ManyToOne(() => Media, (media) => media.ratings)
  media: Media;
}
```

#### UserPreference (Préférences utilisateur)

```typescript
@Entity()
export class UserPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "json" })
  preferences: {
    defaultQuality: "480p" | "720p" | "1080p";
    autoplay: boolean;
    subtitles: boolean;
    language: string;
    theme: "light" | "dark";
    notifications: boolean;
  };

  @OneToOne(() => User, (user) => user.preferences)
  user: User;
}
```

## 2.2 Relations et Index

### Index pour Performance

```sql
-- Index pour les recherches fréquentes
CREATE INDEX idx_media_title ON media(title);
CREATE INDEX idx_media_library ON media(library_id);
CREATE INDEX idx_watch_history_user ON watch_history(user_id);
CREATE INDEX idx_watch_history_media ON watch_history(media_id);
CREATE INDEX idx_media_created_at ON media(created_at);
CREATE INDEX idx_media_view_count ON media(view_count);

-- Index composites
CREATE INDEX idx_media_library_type ON media(library_id, created_at);
CREATE INDEX idx_watch_history_user_date ON watch_history(user_id, last_watched);
```

### Contraintes

```sql
-- Contraintes d'unicité
ALTER TABLE media ADD CONSTRAINT unique_media_path UNIQUE (file_path);
ALTER TABLE library ADD CONSTRAINT unique_library_path_user UNIQUE (path, owner_id);
ALTER TABLE media_rating ADD CONSTRAINT unique_user_media_rating UNIQUE (user_id, media_id);
```

## 2.3 Configuration TypeORM

### data-source.ts

```typescript
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Library } from "./entities/Library";
import { Media } from "./entities/Media";
import { WatchHistory } from "./entities/WatchHistory";
import { MediaRating } from "./entities/MediaRating";
import { UserPreference } from "./entities/UserPreference";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "streaming_user",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "streaming_app",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [User, Library, Media, WatchHistory, MediaRating, UserPreference],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
  // Optimisations pour Raspberry Pi
  extra: {
    max: 10, // Limite des connexions
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
```

## 2.4 Migrations

### Migration Initiale

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1234567890123 implements MigrationInterface {
  name = "InitialMigration1234567890123";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Création des tables avec les contraintes et index
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'user',
        "first_name" character varying,
        "last_name" character varying,
        "avatar" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id")
      )
    `);

    // ... autres tables
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
    // ... suppression autres tables
  }
}
```

## 2.5 Seeders (Données de test)

### User Seeder

```typescript
export class UserSeeder {
  static async run(dataSource: DataSource) {
    const userRepository = dataSource.getRepository(User);

    const adminUser = userRepository.create({
      email: "admin@streaming.local",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      firstName: "Admin",
      lastName: "User",
    });

    await userRepository.save(adminUser);
  }
}
```

## 2.6 Optimisations Raspberry Pi

### Configuration PostgreSQL

```sql
-- postgresql.conf optimisé pour RPi4
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Stratégie de Cache

```typescript
export class CacheService {
  private redis: Redis;

  async cacheMediaMetadata(mediaId: number, metadata: any) {
    await this.redis.setex(
      `media:${mediaId}:metadata`,
      3600, // 1 heure
      JSON.stringify(metadata)
    );
  }

  async getCachedMediaMetadata(mediaId: number) {
    const cached = await this.redis.get(`media:${mediaId}:metadata`);
    return cached ? JSON.parse(cached) : null;
  }
}
```
