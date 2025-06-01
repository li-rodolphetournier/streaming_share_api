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
export declare class UserPreference {
    id: number;
    videoPreferences?: VideoPreferences;
    notificationPreferences?: NotificationPreferences;
    privacyPreferences?: PrivacyPreferences;
    theme: "light" | "dark" | "auto";
    language: string;
    timezone: string;
    adultContent: boolean;
    parentalPin?: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    getDefaultVideoPreferences(): VideoPreferences;
    getDefaultNotificationPreferences(): NotificationPreferences;
    getDefaultPrivacyPreferences(): PrivacyPreferences;
    initializeDefaults(): void;
    updateVideoPreferences(preferences: Partial<VideoPreferences>): void;
    updateNotificationPreferences(preferences: Partial<NotificationPreferences>): void;
    updatePrivacyPreferences(preferences: Partial<PrivacyPreferences>): void;
    hasParentalControl(): boolean;
    verifyParentalPin(pin: string): boolean;
}
//# sourceMappingURL=UserPreference.d.ts.map