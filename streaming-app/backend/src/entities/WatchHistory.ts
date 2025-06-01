import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Media } from "./Media";
import { User } from "./User";

@Entity("watch_history")
@Index(["user", "lastWatched"])
@Index(["media", "lastWatched"])
export class WatchHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "watched_duration", default: 0 })
  watchedDuration: number; // en secondes

  @Column({ name: "total_duration", default: 0 })
  totalDuration: number; // durée totale du média

  @Column({
    name: "progress_percentage",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0,
  })
  progressPercentage: number;

  @Column({ name: "is_completed", default: false })
  isCompleted: boolean;

  @Column({
    name: "last_watched",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  @Index()
  lastWatched: Date;

  @Column({ name: "watch_count", default: 1 })
  watchCount: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.watchHistory, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Media, (media) => media.watchHistory, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "media_id" })
  media: Media;

  // Méthodes utilitaires
  updateProgress(currentTime: number, totalDuration?: number): void {
    this.watchedDuration = currentTime;

    if (totalDuration) {
      this.totalDuration = totalDuration;
    }

    if (this.totalDuration > 0) {
      this.progressPercentage =
        Math.round((this.watchedDuration / this.totalDuration) * 100 * 100) /
        100;
      this.isCompleted = this.progressPercentage >= 90; // Considéré comme terminé à 90%
    }

    this.lastWatched = new Date();
  }

  incrementWatchCount(): void {
    this.watchCount += 1;
    this.lastWatched = new Date();
  }

  get formattedProgress(): string {
    return `${this.progressPercentage.toFixed(1)}%`;
  }

  get remainingTime(): number {
    return Math.max(0, this.totalDuration - this.watchedDuration);
  }

  get formattedRemainingTime(): string {
    const remaining = this.remainingTime;
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    }
    return `${minutes}m restantes`;
  }
}
