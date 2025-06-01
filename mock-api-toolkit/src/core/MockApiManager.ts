import type {
  MockCondition,
  MockConfig,
  MockEndpoint,
  MockLog,
  MockRequest,
  MockResponse,
} from "../types";

export class MockApiManager {
  private config: MockConfig;
  private logs: MockLog[] = [];
  private maxLogs: number = 1000;
  private storage: Storage | null = null;
  private storageKey: string = "mock-api-config";

  constructor(
    initialConfig?: Partial<MockConfig>,
    storage?: "localStorage" | "sessionStorage" | "memory",
    storageKey?: string
  ) {
    this.storageKey = storageKey || this.storageKey;
    this.setupStorage(storage);

    // Configuration par défaut
    const defaultConfig: MockConfig = {
      enabled: true,
      baseUrl: "/api",
      globalDelay: 0,
      logging: true,
      cors: true,
      endpoints: [],
    };

    // Charger la configuration depuis le stockage ou utiliser la configuration initiale
    const savedConfig = this.loadConfig();
    this.config = {
      ...defaultConfig,
      ...savedConfig,
      ...initialConfig,
    };

    this.saveConfig();
  }

  private setupStorage(
    storageType?: "localStorage" | "sessionStorage" | "memory"
  ) {
    switch (storageType) {
      case "localStorage":
        this.storage =
          typeof window !== "undefined" ? window.localStorage : null;
        break;
      case "sessionStorage":
        this.storage =
          typeof window !== "undefined" ? window.sessionStorage : null;
        break;
      case "memory":
      default:
        this.storage = null;
        break;
    }
  }

  private loadConfig(): Partial<MockConfig> {
    if (!this.storage) return {};

    try {
      const saved = this.storage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn("Failed to load mock config from storage:", error);
      return {};
    }
  }

  private saveConfig(): void {
    if (!this.storage) return;

    try {
      this.storage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.warn("Failed to save mock config to storage:", error);
    }
  }

  // Gestion de la configuration
  getConfig(): MockConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<MockConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  setEnabled(enabled: boolean): void {
    this.updateConfig({ enabled });
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  // Gestion des endpoints
  addEndpoint(endpoint: Omit<MockEndpoint, "id">): MockEndpoint {
    const newEndpoint: MockEndpoint = {
      ...endpoint,
      id: this.generateId(),
    };

    this.config.endpoints.push(newEndpoint);
    this.saveConfig();
    return newEndpoint;
  }

  updateEndpoint(
    id: string,
    updates: Partial<MockEndpoint>
  ): MockEndpoint | null {
    const index = this.config.endpoints.findIndex((ep) => ep.id === id);
    if (index === -1) return null;

    this.config.endpoints[index] = {
      ...this.config.endpoints[index],
      ...updates,
    };
    this.saveConfig();
    return this.config.endpoints[index];
  }

  removeEndpoint(id: string): boolean {
    const index = this.config.endpoints.findIndex((ep) => ep.id === id);
    if (index === -1) return false;

    this.config.endpoints.splice(index, 1);
    this.saveConfig();
    return true;
  }

  getEndpoints(): MockEndpoint[] {
    return [...this.config.endpoints];
  }

  getEndpoint(id: string): MockEndpoint | null {
    return this.config.endpoints.find((ep) => ep.id === id) || null;
  }

  // Correspondance des requêtes
  matchRequest(request: MockRequest): MockEndpoint | null {
    if (!this.config.enabled) return null;

    return (
      this.config.endpoints.find((endpoint) => {
        if (!endpoint.enabled) return false;
        if (endpoint.method !== request.method) return false;

        // Correspondance du chemin (support des paramètres)
        if (!this.matchPath(endpoint.path, request.url)) return false;

        return true;
      }) || null
    );
  }

  private matchPath(pattern: string, url: string): boolean {
    // Supprimer le baseUrl de l'URL si présent
    const cleanUrl = url.replace(this.config.baseUrl || "", "");

    // Convertir le pattern en regex (support des paramètres :id)
    const regexPattern = pattern
      .replace(/:[^/]+/g, "([^/]+)")
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(cleanUrl);
  }

  // Traitement des requêtes
  async processRequest(request: MockRequest): Promise<MockResponse> {
    const startTime = Date.now();
    const endpoint = this.matchRequest(request);

    if (!endpoint) {
      const response: MockResponse = {
        status: 404,
        data: { error: "Endpoint not found" },
      };
      this.logRequest(request, response, null, Date.now() - startTime);
      return response;
    }

    // Vérifier les conditions
    const response =
      this.evaluateConditions(request, endpoint) ||
      this.getScenarioResponse(endpoint) ||
      endpoint.response;

    // Appliquer le délai
    const delay = response.delay || this.config.globalDelay || 0;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.logRequest(request, response, endpoint, Date.now() - startTime);
    return response;
  }

  private evaluateConditions(
    request: MockRequest,
    endpoint: MockEndpoint
  ): MockResponse | null {
    if (!endpoint.conditions || endpoint.conditions.length === 0) return null;

    for (const condition of endpoint.conditions) {
      if (this.evaluateCondition(request, condition)) {
        return condition.response;
      }
    }

    return null;
  }

  private evaluateCondition(
    request: MockRequest,
    condition: MockCondition
  ): boolean {
    const value = this.getFieldValue(request, condition.field);
    if (value === undefined) return false;

    const stringValue = String(value);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case "equals":
        return stringValue === conditionValue;
      case "contains":
        return stringValue.includes(conditionValue);
      case "startsWith":
        return stringValue.startsWith(conditionValue);
      case "endsWith":
        return stringValue.endsWith(conditionValue);
      case "regex":
        try {
          const regex = new RegExp(conditionValue);
          return regex.test(stringValue);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private getFieldValue(request: MockRequest, field: string): any {
    const parts = field.split(".");
    let current: any = request;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private getScenarioResponse(endpoint: MockEndpoint): MockResponse | null {
    if (!endpoint.scenarios || !endpoint.activeScenario) return null;

    const scenario = endpoint.scenarios.find(
      (s) => s.id === endpoint.activeScenario
    );
    return scenario ? scenario.response : null;
  }

  // Gestion des logs
  private logRequest(
    request: MockRequest,
    response: MockResponse,
    endpoint: MockEndpoint | null,
    duration: number
  ): void {
    if (!this.config.logging) return;

    const log: MockLog = {
      id: this.generateId(),
      timestamp: new Date(),
      request,
      response,
      endpoint: endpoint || undefined,
      duration,
    };

    this.logs.unshift(log);

    // Limiter le nombre de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  getLogs(): MockLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  setMaxLogs(max: number): void {
    this.maxLogs = max;
    if (this.logs.length > max) {
      this.logs = this.logs.slice(0, max);
    }
  }

  // Utilitaires
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Export/Import de configuration
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      this.config = { ...this.config, ...config };
      this.saveConfig();
      return true;
    } catch (error) {
      console.error("Failed to import config:", error);
      return false;
    }
  }

  // Réinitialisation
  reset(): void {
    this.config.endpoints = [];
    this.logs = [];
    this.saveConfig();
  }
}
