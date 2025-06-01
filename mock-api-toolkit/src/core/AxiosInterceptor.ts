import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import type { MockRequest, MockResponse } from "../types";

import { MockApiManager } from "./MockApiManager";

export class AxiosInterceptor {
  private mockManager: MockApiManager;
  private interceptorId: number | null = null;

  constructor(mockManager: MockApiManager) {
    this.mockManager = mockManager;
  }

  // Installer l'intercepteur sur une instance Axios
  install(axiosInstance: AxiosInstance): void {
    if (this.interceptorId !== null) {
      console.warn("Interceptor already installed");
      return;
    }

    this.interceptorId = axiosInstance.interceptors.request.use(
      async (config) => {
        // Vérifier si le mock est activé
        if (!this.mockManager.isEnabled()) {
          return config;
        }

        // Construire la requête mock
        const mockRequest = this.buildMockRequest(config);

        // Traiter la requête avec le gestionnaire mock
        const mockResponse = await this.mockManager.processRequest(mockRequest);

        // Convertir la réponse mock en réponse Axios
        const axiosResponse = this.buildAxiosResponse(mockResponse, config);

        // Retourner la réponse mock en tant que Promise rejetée avec la réponse
        // Cela permet d'interrompre la requête réelle et de retourner la réponse mock
        return Promise.reject({
          isAxiosError: false,
          isMockResponse: true,
          response: axiosResponse,
          config,
        });
      },
      (error) => Promise.reject(error)
    );

    // Installer aussi un intercepteur de réponse pour gérer les réponses mock
    axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Si c'est une réponse mock, la retourner comme succès
        if (error.isMockResponse) {
          return Promise.resolve(error.response);
        }
        return Promise.reject(error);
      }
    );
  }

  // Désinstaller l'intercepteur
  uninstall(axiosInstance: AxiosInstance): void {
    if (this.interceptorId !== null) {
      axiosInstance.interceptors.request.eject(this.interceptorId);
      this.interceptorId = null;
    }
  }

  private buildMockRequest(config: AxiosRequestConfig): MockRequest {
    const url = this.buildFullUrl(config);

    return {
      url,
      method: (config.method?.toUpperCase() as MockRequest["method"]) || "GET",
      headers: (config.headers as Record<string, string>) || {},
      body: config.data,
      params: config.params || {},
      query: this.extractQueryParams(url),
    };
  }

  private buildFullUrl(config: AxiosRequestConfig): string {
    const baseURL = config.baseURL || "";
    const url = config.url || "";

    // Combiner baseURL et url
    let fullUrl = url;
    if (baseURL && !url.startsWith("http")) {
      fullUrl = baseURL.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
    }

    // Ajouter les paramètres de requête
    if (config.params) {
      const searchParams = new URLSearchParams();
      for (const key in config.params) {
        if (config.params.hasOwnProperty(key)) {
          const value = config.params[key];
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        }
      }

      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += (fullUrl.includes("?") ? "&" : "?") + queryString;
      }
    }

    return fullUrl;
  }

  private extractQueryParams(url: string): Record<string, string> {
    const params: Record<string, string> = {};

    try {
      const urlObj = new URL(url, "http://localhost");
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } catch {
      // Si l'URL n'est pas valide, extraire manuellement
      const queryStart = url.indexOf("?");
      if (queryStart !== -1) {
        const queryString = url.substring(queryStart + 1);
        queryString.split("&").forEach((param) => {
          const [key, value] = param.split("=");
          if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || "");
          }
        });
      }
    }

    return params;
  }

  private buildAxiosResponse(
    mockResponse: MockResponse,
    config: AxiosRequestConfig
  ): AxiosResponse {
    return {
      data: mockResponse.data,
      status: mockResponse.status,
      statusText: this.getStatusText(mockResponse.status),
      headers: mockResponse.headers || {},
      config: config as any,
      request: {},
    };
  }

  private getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: "OK",
      201: "Created",
      204: "No Content",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      422: "Unprocessable Entity",
      500: "Internal Server Error",
    };

    return statusTexts[status] || "Unknown";
  }
}

// Fonction utilitaire pour installer rapidement l'intercepteur
export function installMockInterceptor(
  axiosInstance: AxiosInstance,
  mockManager: MockApiManager
): () => void {
  const interceptor = new AxiosInterceptor(mockManager);
  interceptor.install(axiosInstance);

  // Retourner une fonction de nettoyage
  return () => interceptor.uninstall(axiosInstance);
}
