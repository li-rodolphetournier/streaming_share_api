import type { AxiosInstance, AxiosRequestConfig } from "axios";

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Mode mock pour les tests (FORCÉ pour le debug)
const MOCK_MODE = true; // Forcer le mode mock temporairement
// const MOCK_MODE = import.meta.env.VITE_MOCK_API === "true";

// Debug log pour vérifier le mode
console.log("🔧 API Service - Mode Mock FORCÉ:", MOCK_MODE);
console.log("🔧 VITE_MOCK_API:", import.meta.env.VITE_MOCK_API);
console.log("🔧 Mode développement:", import.meta.env.DEV);

// Comptes de test pour le mode mock
const MOCK_USERS = [
  {
    id: 1,
    email: "admin@streaming.com",
    password: "admin123",
    role: "admin" as const,
    firstName: "Admin",
    lastName: "Streaming",
    avatar: null,
    isActive: true,
    emailVerified: true,
    lastLogin: new Date().toISOString(),
    loginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    email: "user@streaming.com",
    password: "user123",
    role: "user" as const,
    firstName: "John",
    lastName: "Doe",
    avatar: null,
    isActive: true,
    emailVerified: true,
    lastLogin: new Date().toISOString(),
    loginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock API responses
const mockApiCall = async (
  url: string,
  method: string,
  data?: any
): Promise<any> => {
  console.log(`🎭 Mock API Call: ${method} ${url}`, data);

  // Simuler un délai réseau
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (url === "/auth/login" && method === "POST") {
    console.log("🔐 Mock Login - Données reçues:", data);
    const { email, password } = data;
    const user = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      console.log("✅ Mock Login - Utilisateur trouvé:", user.email);
      const { password: _, ...userWithoutPassword } = user;
      const response = {
        data: {
          user: userWithoutPassword,
          accessToken: "mock-access-token-" + Date.now(),
          refreshToken: "mock-refresh-token-" + Date.now(),
          expiresIn: 3600,
          tokenType: "Bearer",
        },
      };
      console.log("📤 Mock Login - Réponse:", response);
      return response;
    } else {
      console.log("❌ Mock Login - Identifiants invalides");
      throw new Error("Invalid credentials");
    }
  }

  if (url === "/auth/me" && method === "GET") {
    console.log("👤 Mock Get Current User");
    const token = localStorage.getItem("accessToken");
    if (token && token.startsWith("mock-access-token")) {
      const user = MOCK_USERS[0];
      const { password: _, ...userWithoutPassword } = user;
      return { data: userWithoutPassword };
    } else {
      throw new Error("Unauthorized");
    }
  }

  if (url === "/auth/logout" && method === "POST") {
    console.log("🚪 Mock Logout");
    return { data: { success: true } };
  }

  // Pour toutes les autres requêtes, retourner une erreur
  console.log(`❌ Mock API: Endpoint ${method} ${url} not implemented`);
  throw new Error(`Mock API: Endpoint ${method} ${url} not implemented`);
};

// Configuration optimisée pour haute performance
const axiosConfig: AxiosRequestConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes pour les requêtes normales
  headers: {
    "Content-Type": "application/json",
  },
  // Optimisations pour haute performance
  maxRedirects: 5,
  maxContentLength: 100 * 1024 * 1024, // 100MB pour les uploads
  maxBodyLength: 100 * 1024 * 1024,
};

export const api: AxiosInstance = axios.create(axiosConfig);

// Configuration spéciale pour les uploads de fichiers volumineux
export const uploadApi: AxiosInstance = axios.create({
  ...axiosConfig,
  timeout: 300000, // 5 minutes pour les uploads
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

// Configuration pour le streaming (pas de timeout)
export const streamingApi: AxiosInstance = axios.create({
  ...axiosConfig,
  timeout: 0, // Pas de timeout pour le streaming
  responseType: "stream",
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs et le refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        // Retry la requête originale avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Échec du refresh, rediriger vers la page de connexion
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Appliquer les mêmes intercepteurs à uploadApi
uploadApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

uploadApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Types pour les réponses API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Utilitaires pour les requêtes
export class ApiService {
  // GET avec cache intelligent
  static async get<T>(
    url: string,
    config?: AxiosRequestConfig & { cache?: boolean; cacheTime?: number }
  ): Promise<T> {
    // Mode mock
    if (MOCK_MODE) {
      const response = await mockApiCall(url, "GET", config?.params);
      return response.data;
    }

    const cacheKey = `api_cache_${url}_${JSON.stringify(config?.params || {})}`;
    const cacheTime = config?.cacheTime || 5 * 60 * 1000; // 5 minutes par défaut

    // Vérifier le cache si activé
    if (config?.cache) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheTime) {
          return data;
        }
      }
    }

    const response = await api.get<ApiResponse<T>>(url, config);

    // Mettre en cache si demandé
    if (config?.cache) {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: response.data.data,
          timestamp: Date.now(),
        })
      );
    }

    return response.data.data;
  }

  // POST avec retry automatique
  static async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { retries?: number }
  ): Promise<T> {
    // Mode mock
    if (MOCK_MODE) {
      const response = await mockApiCall(url, "POST", data);
      return response.data;
    }

    const maxRetries = config?.retries || 3;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await api.post<ApiResponse<T>>(url, data, config);
        return response.data.data;
      } catch (error: any) {
        lastError = error;

        // Ne pas retry pour les erreurs 4xx (sauf 429)
        if (
          error.response?.status >= 400 &&
          error.response?.status < 500 &&
          error.response?.status !== 429
        ) {
          break;
        }

        // Attendre avant le retry (backoff exponentiel)
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw lastError;
  }

  // PUT
  static async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    // Mode mock
    if (MOCK_MODE) {
      const response = await mockApiCall(url, "PUT", data);
      return response.data;
    }

    const response = await api.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  // DELETE
  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // Mode mock
    if (MOCK_MODE) {
      const response = await mockApiCall(url, "DELETE");
      return response.data;
    }

    const response = await api.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  // Upload de fichier avec progress
  static async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    const uploadConfig: AxiosRequestConfig = {
      ...config,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    };

    const response = await uploadApi.post<ApiResponse<T>>(
      url,
      formData,
      uploadConfig
    );
    return response.data.data;
  }

  // Requêtes en batch
  static async batch<T>(requests: Array<() => Promise<any>>): Promise<T[]> {
    const results = await Promise.allSettled(requests.map((req) => req()));

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error(`Batch request ${index} failed:`, result.reason);
        throw result.reason;
      }
    });
  }

  // Requête avec possibilité d'annulation
  static async cancellableRequest<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<{ data: T; cancel: () => void }> {
    const source = axios.CancelToken.source();

    const requestConfig = {
      ...config,
      cancelToken: source.token,
    };

    const promise = api.get<ApiResponse<T>>(url, requestConfig);

    return {
      data: promise.then((response) => response.data.data),
      cancel: () => source.cancel("Request cancelled by user"),
    } as any;
  }

  // Nettoyer le cache
  static clearCache(pattern?: string): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("api_cache_")) {
        if (!pattern || key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      }
    });
  }

  // Précharger des données
  static async preload(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => this.get(url, { cache: true })));
  }
}

export const configureApi = () => {
  // Configuration initiale si nécessaire
  console.log("API Service configured");
};
