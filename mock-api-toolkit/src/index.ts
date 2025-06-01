// Types
export type * from "./types";

// Core classes
export {
  AxiosInterceptor,
  installMockInterceptor,
} from "./core/AxiosInterceptor";
export { MockApiManager } from "./core/MockApiManager";

// React components (optionnels - nécessitent React)
export {
  MockApiProvider,
  useMockApi,
  useMockEndpoints,
  useMockLogs,
} from "./components/MockApiProvider";

// Templates prédéfinis
export { AUTH_ENDPOINTS, DEFAULT_MOCK_USERS } from "./templates/AuthTemplates";

// Fonction utilitaire pour une configuration rapide
export function createMockApi(config?: {
  enabled?: boolean;
  baseUrl?: string;
  storage?: "localStorage" | "sessionStorage" | "memory";
  endpoints?: any[];
}) {
  const manager = new MockApiManager(
    {
      enabled: config?.enabled ?? true,
      baseUrl: config?.baseUrl ?? "/api",
      endpoints: config?.endpoints ?? [],
    },
    config?.storage
  );

  return {
    manager,
    installOn: (axiosInstance: any) =>
      installMockInterceptor(axiosInstance, manager),
  };
}

// Fonction pour créer rapidement un mock d'authentification
export function createAuthMock(users?: any[], baseUrl = "/api") {
  const manager = new MockApiManager({
    enabled: true,
    baseUrl,
    endpoints: [],
  });

  // Ajouter les endpoints d'authentification
  AUTH_ENDPOINTS.forEach((endpoint) => {
    manager.addEndpoint(endpoint);
  });

  return {
    manager,
    installOn: (axiosInstance: any) =>
      installMockInterceptor(axiosInstance, manager),
    users: users || DEFAULT_MOCK_USERS,
  };
}

// Version simplifiée sans React pour les projets non-React
export class SimpleMockApi {
  private manager: MockApiManager;
  private uninstall?: () => void;

  constructor(config?: {
    enabled?: boolean;
    baseUrl?: string;
    endpoints?: any[];
  }) {
    this.manager = new MockApiManager({
      enabled: config?.enabled ?? true,
      baseUrl: config?.baseUrl ?? "/api",
      endpoints: config?.endpoints ?? [],
    });
  }

  // Installer sur une instance Axios
  install(axiosInstance: any) {
    this.uninstall = installMockInterceptor(axiosInstance, this.manager);
    return this;
  }

  // Désinstaller
  destroy() {
    if (this.uninstall) {
      this.uninstall();
      this.uninstall = undefined;
    }
  }

  // Activer/désactiver
  enable() {
    this.manager.setEnabled(true);
    return this;
  }

  disable() {
    this.manager.setEnabled(false);
    return this;
  }

  // Ajouter un endpoint
  addEndpoint(endpoint: {
    name: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    path: string;
    response: {
      status: number;
      data: any;
      delay?: number;
    };
    enabled?: boolean;
  }) {
    this.manager.addEndpoint(endpoint);
    return this;
  }

  // Ajouter les endpoints d'authentification
  addAuthEndpoints() {
    AUTH_ENDPOINTS.forEach((endpoint) => {
      this.manager.addEndpoint(endpoint);
    });
    return this;
  }

  // Obtenir les logs
  getLogs() {
    return this.manager.getLogs();
  }

  // Vider les logs
  clearLogs() {
    this.manager.clearLogs();
    return this;
  }

  // Exporter la configuration
  exportConfig() {
    return this.manager.exportConfig();
  }

  // Importer une configuration
  importConfig(configJson: string) {
    this.manager.importConfig(configJson);
    return this;
  }
}
