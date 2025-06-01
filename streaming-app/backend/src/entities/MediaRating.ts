import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import { Media } from "./Media";
import { User } from "./User";

@Entity("media_ratings")
@Unique(["user", "media"])
@Index(["media", "rating"])
export class MediaRating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "decimal",
    precision: 3,
    scale: 1,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  rating: number; // 0.0 à 10.0

  @Column({ type: "text", nullable: true })
  review?: string;

  @Column({ name: "is_spoiler", default: false })
  isSpoiler: boolean;

  @Column({ name: "helpful_count", default: 0 })
  helpfulCount: number;

  @Column({ name: "reported_count", default: 0 })
  reportedCount: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.ratings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Media, (media) => media.ratings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "media_id" })
  media: Media;

  // Méthodes utilitaires
  get formattedRating(): string {
    return `${this.rating.toFixed(1)}/10`;
  }

  get ratingStars(): string {
    const stars = Math.round(this.rating / 2); // Convertir sur 5 étoiles
    return "★".repeat(stars) + "☆".repeat(5 - stars);
  }

  isValidRating(): boolean {
    return this.rating >= 0 && this.rating <= 10;
  }

  incrementHelpful(): void {
    this.helpfulCount += 1;
  }

  incrementReported(): void {
    this.reportedCount += 1;
  }

  get isReported(): boolean {
    return this.reportedCount > 0;
  }

  get helpfulRatio(): number {
    const total = this.helpfulCount + this.reportedCount;
    return total > 0 ? this.helpfulCount / total : 0;
  }
}
