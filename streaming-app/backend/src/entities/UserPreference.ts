import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "./User";

export interface VideoPreferences {
  defaultQuality: string;
  autoPlay: boolean;
  subtitlesEnabled: boolean;
  subtitleLanguage: string;
  audioLanguage: string;
  skipIntro: boolean;
  skipCredits: boolean;
}

export interface NotificationPreferences {
  newContent: boolean;
  recommendations: boolean;
  watchReminders: boolean;
  email: boolean;
  push: boolean;
}

export interface PrivacyPreferences {
  shareWatchHistory: boolean;
  shareRatings: boolean;
  allowRecommendations: boolean;
  dataCollection: boolean;
}

@Entity("user_preferences")
export class UserPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "jsonb", nullable: true })
  videoPreferences?: VideoPreferences;

  @Column({ type: "jsonb", nullable: true })
  notificationPreferences?: NotificationPreferences;

  @Column({ type: "jsonb", nullable: true })
  privacyPreferences?: PrivacyPreferences;

  @Column({ name: "theme", length: 20, default: "dark" })
  theme: "light" | "dark" | "auto";

  @Column({ name: "language", length: 10, default: "fr" })
  language: string;

  @Column({ name: "timezone", length: 50, default: "Europe/Paris" })
  timezone: string;

  @Column({ name: "adult_content", default: false })
  adultContent: boolean;

  @Column({ name: "parental_pin", length: 6, nullable: true })
  parentalPin?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.preferences, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  // Méthodes utilitaires
  getDefaultVideoPreferences(): VideoPreferences {
    return {
      defaultQuality: "1080p",
      autoPlay: true,
      subtitlesEnabled: false,
      subtitleLanguage: "fr",
      audioLanguage: "fr",
      skipIntro: false,
      skipCredits: false,
    };
  }

  getDefaultNotificationPreferences(): NotificationPreferences {
    return {
      newContent: true,
      recommendations: true,
      watchReminders: false,
      email: true,
      push: false,
    };
  }

  getDefaultPrivacyPreferences(): PrivacyPreferences {
    return {
      shareWatchHistory: false,
      shareRatings: true,
      allowRecommendations: true,
      dataCollection: true,
    };
  }

  initializeDefaults(): void {
    if (!this.videoPreferences) {
      this.videoPreferences = this.getDefaultVideoPreferences();
    }
    if (!this.notificationPreferences) {
      this.notificationPreferences = this.getDefaultNotificationPreferences();
    }
    if (!this.privacyPreferences) {
      this.privacyPreferences = this.getDefaultPrivacyPreferences();
    }
  }

  updateVideoPreferences(preferences: Partial<VideoPreferences>): void {
    this.videoPreferences = {
      ...this.getDefaultVideoPreferences(),
      ...this.videoPreferences,
      ...preferences,
    };
  }

  updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): void {
    this.notificationPreferences = {
      ...this.getDefaultNotificationPreferences(),
      ...this.notificationPreferences,
      ...preferences,
    };
  }

  updatePrivacyPreferences(preferences: Partial<PrivacyPreferences>): void {
    this.privacyPreferences = {
      ...this.getDefaultPrivacyPreferences(),
      ...this.privacyPreferences,
      ...preferences,
    };
  }

  hasParentalControl(): boolean {
    return !!this.parentalPin;
  }

  verifyParentalPin(pin: string): boolean {
    return this.parentalPin === pin;
  }
}
