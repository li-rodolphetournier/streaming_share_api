import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

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
const addAuthToken = (config: AxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Intercepteur pour gérer les erreurs et le refresh token
const handleResponseError = async (error: any) => {
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
};

// Intercepteur pour les métriques de performance
const addPerformanceMetrics = (config: AxiosRequestConfig) => {
  config.metadata = { startTime: new Date() };
  return config;
};

const logPerformanceMetrics = (response: AxiosResponse) => {
  const endTime = new Date();
  const startTime = response.config.metadata?.startTime;

  if (startTime) {
    const duration = endTime.getTime() - startTime.getTime();

    // Log des requêtes lentes (> 2 secondes)
    if (duration > 2000) {
      console.warn(
        `Slow API request: ${response.config.method?.toUpperCase()} ${
          response.config.url
        } took ${duration}ms`
      );
    }

    // Métriques pour le monitoring (peut être envoyé à un service d'analytics)
    if (import.meta.env.DEV) {
      console.log(
        `API Request: ${response.config.method?.toUpperCase()} ${
          response.config.url
        } - ${duration}ms`
      );
    }
  }

  return response;
};

// Application des intercepteurs
[api, uploadApi].forEach((instance) => {
  instance.interceptors.request.use(addAuthToken);
  instance.interceptors.request.use(addPerformanceMetrics);
  instance.interceptors.response.use(
    logPerformanceMetrics,
    handleResponseError
  );
});

// Intercepteur spécial pour le streaming (pas de retry automatique)
streamingApi.interceptors.request.use(addAuthToken);
streamingApi.interceptors.response.use(
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
    const maxRetries = config?.retries || 3;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await api.post<ApiResponse<T>>(url, data, config);
        return response.data.data;
      } catch (error: any) {
        lastError = error;

        // Ne pas retry sur les erreurs client (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
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

  // PUT avec optimistic updates
  static async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await api.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  // DELETE avec confirmation
  static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  // Upload de fichiers avec progress
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
        if (progressEvent.total && onProgress) {
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

  // Batch requests pour optimiser les performances
  static async batch<T>(requests: Array<() => Promise<any>>): Promise<T[]> {
    const results = await Promise.allSettled(requests.map((req) => req()));

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error(`Batch request ${index} failed:`, result.reason);
        return null;
      }
    });
  }

  // Requête avec abort controller pour annulation
  static async cancellableRequest<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<{ data: T; cancel: () => void }> {
    const controller = new AbortController();

    const requestConfig: AxiosRequestConfig = {
      ...config,
      signal: controller.signal,
    };

    const promise = api.get<ApiResponse<T>>(url, requestConfig);

    return {
      data: promise.then((response) => response.data.data),
      cancel: () => controller.abort(),
    };
  }

  // Nettoyage du cache
  static clearCache(pattern?: string): void {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => {
      if (!key.startsWith("api_cache_")) return false;
      if (pattern) return key.includes(pattern);
      return true;
    });

    cacheKeys.forEach((key) => localStorage.removeItem(key));
  }

  // Préchargement de données
  static async preload(urls: string[]): Promise<void> {
    const requests = urls.map((url) => () => this.get(url, { cache: true }));
    await this.batch(requests);
  }
}

// Configuration pour différents environnements
export const configureApi = () => {
  // Configuration pour le développement
  if (import.meta.env.DEV) {
    api.interceptors.request.use((config) => {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
      );
      return config;
    });
  }

  // Configuration pour la production
  if (import.meta.env.PROD) {
    // Désactiver les logs en production
    console.log = () => {};
    console.warn = () => {};
  }
};

// Initialisation
configureApi();

export default api;
