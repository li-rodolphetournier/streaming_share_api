export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
  profile: UserProfile;
  subscription?: Subscription;
  permissions: Permission[];
}

export interface UserProfile {
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: SocialLinks;
  privacy: PrivacySettings;
  watchingPreferences: WatchingPreferences;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
}

export interface PrivacySettings {
  profileVisibility: "public" | "friends" | "private";
  showWatchHistory: boolean;
  showRatings: boolean;
  showFavorites: boolean;
  allowFriendRequests: boolean;
  allowMessages: boolean;
}

export interface WatchingPreferences {
  autoplay: boolean;
  autoplayTrailers: boolean;
  skipIntros: boolean;
  skipCredits: boolean;
  defaultSubtitleLanguage?: string;
  defaultAudioLanguage?: string;
  defaultQuality: VideoQuality;
  adaptiveQuality: boolean;
  parentalControls?: ParentalControls;
}

export interface ParentalControls {
  enabled: boolean;
  maxRating: ContentRating;
  blockedGenres: string[];
  timeRestrictions?: TimeRestriction[];
  requirePinForMature: boolean;
}

export interface TimeRestriction {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

export type ContentRating =
  | "G"
  | "PG"
  | "PG-13"
  | "R"
  | "NC-17"
  | "TV-Y"
  | "TV-Y7"
  | "TV-G"
  | "TV-PG"
  | "TV-14"
  | "TV-MA";

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
  performance: PerformanceSettings;
}

export interface NotificationSettings {
  email: EmailNotifications;
  push: PushNotifications;
  inApp: InAppNotifications;
}

export interface EmailNotifications {
  enabled: boolean;
  newContent: boolean;
  recommendations: boolean;
  watchReminders: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
  newsletter: boolean;
}

export interface PushNotifications {
  enabled: boolean;
  newContent: boolean;
  watchReminders: boolean;
  friendActivity: boolean;
  systemAlerts: boolean;
}

export interface InAppNotifications {
  enabled: boolean;
  newContent: boolean;
  recommendations: boolean;
  friendActivity: boolean;
  systemMessages: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  closedCaptions: boolean;
  audioDescriptions: boolean;
}

export interface PerformanceSettings {
  preloadThumbnails: boolean;
  preloadPreviews: boolean;
  backgroundSync: boolean;
  offlineMode: boolean;
  dataUsageLimit?: number; // MB per month
  qualityBasedOnConnection: boolean;
}

export type UserRole = "admin" | "moderator" | "user" | "guest";

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  paymentMethod?: PaymentMethod;
  features: SubscriptionFeature[];
}

export type SubscriptionPlan =
  | "free"
  | "basic"
  | "premium"
  | "family"
  | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "expired"
  | "suspended"
  | "trial";

export interface PaymentMethod {
  id: string;
  type: "credit_card" | "paypal" | "bank_transfer";
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  limit?: number;
}

// Types pour l'authentification
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  marketingConsent?: boolean;
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  emailVerificationRequired: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: File;
}

export interface UpdatePreferencesRequest {
  theme?: "light" | "dark" | "auto";
  language?: string;
  timezone?: string;
  notifications?: Partial<NotificationSettings>;
  accessibility?: Partial<AccessibilitySettings>;
  performance?: Partial<PerformanceSettings>;
  watching?: Partial<WatchingPreferences>;
  privacy?: Partial<PrivacySettings>;
}

export interface Session {
  id: string;
  userId: number;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  location?: SessionLocation;
}

export interface SessionLocation {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet" | "tv" | "console";
  platform: string;
  browser?: string;
  browserVersion?: string;
  osVersion?: string;
  resolution?: string;
  userAgent?: string;
}

export interface SecurityEvent {
  id: string;
  userId: number;
  type: SecurityEventType;
  description: string;
  ipAddress: string;
  userAgent: string;
  location?: SessionLocation;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  resolved: boolean;
}

export type SecurityEventType =
  | "login_success"
  | "login_failed"
  | "password_changed"
  | "email_changed"
  | "account_locked"
  | "suspicious_activity"
  | "data_export"
  | "account_deleted"
  | "permission_changed"
  | "two_factor_enabled"
  | "two_factor_disabled";

export interface TwoFactorAuth {
  enabled: boolean;
  method: "2fa_app" | "sms" | "email";
  backupCodes: string[];
  lastUsed?: Date;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  inviterId: number;
  email: string;
  role: UserRole;
  permissions: string[];
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
}

export interface ShareLink {
  id: string;
  mediaId: number;
  createdBy: number;
  token: string;
  expiresAt?: Date;
  maxViews?: number;
  currentViews: number;
  requiresAuth: boolean;
  allowedUsers?: number[];
  isActive: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId?: number;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export type VideoQuality = "480p" | "720p" | "1080p" | "1440p" | "4K" | "8K";
