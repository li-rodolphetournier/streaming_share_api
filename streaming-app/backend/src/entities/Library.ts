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

import { Media } from "./Media";
import { User } from "./User";

export type LibraryType = "movie" | "tv" | "music" | "photo";

@Entity("libraries")
@Index(["owner", "name"])
export class Library {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 1000 })
  @Index()
  path: string;

  @Column({
    type: "enum",
    enum: ["movie", "tv", "music", "photo"],
    default: "movie",
  })
  type: LibraryType;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "last_scan_date", type: "timestamp", nullable: true })
  lastScanDate?: Date;

  @Column({ name: "scan_in_progress", default: false })
  scanInProgress: boolean;

  @Column({ name: "auto_scan", default: true })
  autoScan: boolean;

  @Column({ name: "scan_interval", default: 24 })
  scanInterval: number; // en heures

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.libraries, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "owner_id" })
  owner: User;

  @OneToMany(() => Media, (media) => media.library)
  medias: Media[];

  // Méthodes utilitaires
  get mediaCount(): number {
    return this.medias?.length || 0;
  }

  get totalSize(): number {
    if (!this.medias) return 0;
    return this.medias.reduce(
      (total, media) => total + (media.fileSize || 0),
      0
    );
  }

  get formattedTotalSize(): string {
    const size = this.totalSize;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return `${(size / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  needsScan(): boolean {
    if (!this.autoScan || this.scanInProgress) return false;

    if (!this.lastScanDate) return true;

    const hoursSinceLastScan =
      (Date.now() - this.lastScanDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastScan >= this.scanInterval;
  }

  startScan(): void {
    this.scanInProgress = true;
    this.lastScanDate = new Date();
  }

  finishScan(): void {
    this.scanInProgress = false;
  }
}
