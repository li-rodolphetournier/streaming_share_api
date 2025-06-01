import {
  ApiKey,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  SecurityEvent,
  Session,
  TwoFactorAuth,
  UpdatePreferencesRequest,
  UpdateProfileRequest,
  User,
  VerifyEmailRequest,
} from "../types/auth.types";

import { ApiService } from "./api";

export class AuthService {
  private static readonly TOKEN_KEY = "accessToken";
  private static readonly REFRESH_TOKEN_KEY = "refreshToken";
  private static readonly USER_KEY = "user";

  // Authentification
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await ApiService.post<LoginResponse>(
      "/auth/login",
      credentials
    );

    // Stocker les tokens et les informations utilisateur
    this.setTokens(response.accessToken, response.refreshToken);
    this.setUser(response.user);

    return response;
  }

  static async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await ApiService.post<RegisterResponse>(
      "/auth/register",
      userData
    );

    // Stocker les tokens et les informations utilisateur
    this.setTokens(response.accessToken, response.refreshToken);
    this.setUser(response.user);

    return response;
  }

  static async logout(): Promise<void> {
    try {
      await ApiService.post("/auth/logout");
    } catch (error) {
      console.warn("Logout request failed:", error);
    } finally {
      // Nettoyer le stockage local même si la requête échoue
      this.clearTokens();
      this.clearUser();

      // Nettoyer le cache API
      ApiService.clearCache();
    }
  }

  static async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await ApiService.post<RefreshTokenResponse>(
      "/auth/refresh",
      {
        refreshToken,
      } as RefreshTokenRequest
    );

    this.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  // Gestion des mots de passe
  static async forgotPassword(email: string): Promise<void> {
    await ApiService.post("/auth/forgot-password", {
      email,
    } as ForgotPasswordRequest);
  }

  static async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await ApiService.post("/auth/reset-password", data);
  }

  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    await ApiService.post("/auth/change-password", data);
  }

  // Vérification email
  static async verifyEmail(token: string): Promise<void> {
    await ApiService.post("/auth/verify-email", {
      token,
    } as VerifyEmailRequest);
  }

  static async resendVerificationEmail(): Promise<void> {
    await ApiService.post("/auth/resend-verification");
  }

  // Gestion du profil utilisateur
  static async getCurrentUser(): Promise<User> {
    return ApiService.get<User>("/auth/me", {
      cache: true,
      cacheTime: 2 * 60 * 1000,
    });
  }

  static async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await ApiService.put<User>("/auth/profile", data);
    this.setUser(response);
    return response;
  }

  static async updatePreferences(
    data: UpdatePreferencesRequest
  ): Promise<User> {
    const response = await ApiService.put<User>("/auth/preferences", data);
    this.setUser(response);
    return response;
  }

  static async uploadAvatar(file: File): Promise<User> {
    const response = await ApiService.upload<User>("/auth/avatar", file);
    this.setUser(response);
    return response;
  }

  // Gestion des sessions
  static async getSessions(): Promise<Session[]> {
    return ApiService.get<Session[]>("/auth/sessions");
  }

  static async revokeSession(sessionId: string): Promise<void> {
    await ApiService.delete(`/auth/sessions/${sessionId}`);
  }

  static async revokeAllSessions(): Promise<void> {
    await ApiService.delete("/auth/sessions");
  }

  // Sécurité
  static async getSecurityEvents(): Promise<SecurityEvent[]> {
    return ApiService.get<SecurityEvent[]>("/auth/security-events");
  }

  static async enable2FA(): Promise<TwoFactorAuth> {
    return ApiService.post<TwoFactorAuth>("/auth/2fa/enable");
  }

  static async disable2FA(): Promise<void> {
    await ApiService.post("/auth/2fa/disable");
  }

  static async verify2FA(code: string): Promise<void> {
    await ApiService.post("/auth/2fa/verify", { code });
  }

  // Gestion des clés API
  static async getApiKeys(): Promise<ApiKey[]> {
    return ApiService.get<ApiKey[]>("/auth/api-keys");
  }

  static async createApiKey(
    name: string,
    permissions: string[]
  ): Promise<ApiKey> {
    return ApiService.post<ApiKey>("/auth/api-keys", { name, permissions });
  }

  static async revokeApiKey(keyId: string): Promise<void> {
    await ApiService.delete(`/auth/api-keys/${keyId}`);
  }

  // Utilitaires de stockage local
  private static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  private static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private static clearUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // Getters publics
  static getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  static hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  static hasPermission(permission: string): boolean {
    const user = this.getUser();
    return user?.permissions?.some((p) => p.id === permission) || false;
  }

  // Utilitaires pour la validation des tokens
  static isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) return true;

    try {
      const payload = JSON.parse(atob(tokenToCheck.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  static getTokenExpirationTime(token?: string): Date | null {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) return null;

    try {
      const payload = JSON.parse(atob(tokenToCheck.split(".")[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  // Auto-refresh des tokens
  static startTokenRefreshTimer(): void {
    const checkInterval = 60 * 1000; // Vérifier toutes les minutes

    setInterval(() => {
      const token = this.getAccessToken();
      if (!token) return;

      const expirationTime = this.getTokenExpirationTime(token);
      if (!expirationTime) return;

      const timeUntilExpiry = expirationTime.getTime() - Date.now();
      const refreshThreshold = 5 * 60 * 1000; // Refresh 5 minutes avant expiration

      if (timeUntilExpiry <= refreshThreshold && timeUntilExpiry > 0) {
        this.refreshToken().catch((error) => {
          console.error("Auto token refresh failed:", error);
          this.logout();
        });
      }
    }, checkInterval);
  }

  // Initialisation du service
  static initialize(): void {
    // Démarrer le timer de refresh automatique
    this.startTokenRefreshTimer();

    // Vérifier si l'utilisateur est connecté au démarrage
    if (this.isAuthenticated() && this.isTokenExpired()) {
      this.refreshToken().catch(() => {
        this.logout();
      });
    }
  }
}
