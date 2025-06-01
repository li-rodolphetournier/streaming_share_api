import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Exclude } from "class-transformer";
import { Library } from "./Library";
import { MediaRating } from "./MediaRating";
import { UserPreference } from "./UserPreference";
import { WatchHistory } from "./WatchHistory";

export type UserRole = "admin" | "user";

@Entity("users")
@Index(["email"], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({
    type: "enum",
    enum: ["admin", "user"],
    default: "user",
  })
  role: UserRole;

  @Column({ name: "first_name", length: 100, nullable: true })
  firstName?: string;

  @Column({ name: "last_name", length: 100, nullable: true })
  lastName?: string;

  @Column({ length: 500, nullable: true })
  avatar?: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "email_verified", default: false })
  emailVerified: boolean;

  @Column({ name: "last_login", type: "timestamp", nullable: true })
  lastLogin?: Date;

  @Column({ name: "login_attempts", default: 0 })
  loginAttempts: number;

  @Column({ name: "locked_until", type: "timestamp", nullable: true })
  lockedUntil?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Library, (library) => library.owner)
  libraries: Library[];

  @OneToMany(() => WatchHistory, (history) => history.user)
  watchHistory: WatchHistory[];

  @OneToMany(() => MediaRating, (rating) => rating.user)
  ratings: MediaRating[];

  @OneToOne(() => UserPreference, (preference) => preference.user)
  preferences: UserPreference;

  // Méthodes utilitaires
  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.email;
  }

  get isLocked(): boolean {
    return this.lockedUntil ? this.lockedUntil > new Date() : false;
  }

  // Méthode pour incrémenter les tentatives de connexion
  incrementLoginAttempts(): void {
    this.loginAttempts += 1;

    // Verrouiller le compte après 5 tentatives
    if (this.loginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
  }

  // Méthode pour réinitialiser les tentatives de connexion
  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = undefined;
    this.lastLogin = new Date();
  }

  // Méthode pour vérifier si l'utilisateur est admin
  isAdmin(): boolean {
    return this.role === "admin";
  }

  // Méthode pour obtenir les statistiques de l'utilisateur
  getStats(): {
    totalWatchTime: number;
    favoriteGenres: string[];
    totalRatings: number;
  } {
    // Cette méthode sera implémentée avec les services
    return {
      totalWatchTime: 0,
      favoriteGenres: [],
      totalRatings: 0,
    };
  }
}
