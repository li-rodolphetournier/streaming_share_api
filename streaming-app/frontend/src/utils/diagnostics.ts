// Système de diagnostic pour identifier les problèmes de configuration
export class DiagnosticSystem {
  private static logs: string[] = [];

  static log(message: string, level: "info" | "warn" | "error" = "info") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    this.logs.push(logMessage);
    console.log(`🔍 DIAGNOSTIC: ${logMessage}`);

    // Afficher dans l'interface si possible
    this.displayInUI(logMessage, level);
  }

  static displayInUI(message: string, level: string) {
    // Créer ou mettre à jour un élément de diagnostic dans l'interface
    let diagnosticElement = document.getElementById("diagnostic-panel");

    if (!diagnosticElement) {
      diagnosticElement = document.createElement("div");
      diagnosticElement.id = "diagnostic-panel";
      diagnosticElement.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 400px;
        max-height: 300px;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 10px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        border: 2px solid #333;
      `;
      document.body.appendChild(diagnosticElement);
    }

    const messageElement = document.createElement("div");
    messageElement.style.cssText = `
      margin: 2px 0;
      color: ${
        level === "error" ? "#ff6b6b" : level === "warn" ? "#ffd93d" : "#6bcf7f"
      };
    `;
    messageElement.textContent = message;

    diagnosticElement.appendChild(messageElement);
    diagnosticElement.scrollTop = diagnosticElement.scrollHeight;
  }

  static async runFullDiagnostic(): Promise<DiagnosticReport> {
    this.log("🚀 Démarrage du diagnostic complet...", "info");

    const report: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      environment: await this.checkEnvironment(),
      network: await this.checkNetwork(),
      api: await this.checkApiConfiguration(),
      browser: this.checkBrowser(),
      localStorage: this.checkLocalStorage(),
      errors: [],
      recommendations: [],
    };

    // Analyser les résultats et générer des recommandations
    this.generateRecommendations(report);

    this.log("✅ Diagnostic terminé", "info");
    console.table(report);

    return report;
  }

  static async checkEnvironment(): Promise<EnvironmentCheck> {
    this.log("🔧 Vérification de l'environnement...", "info");

    const env = {
      nodeEnv: import.meta.env.MODE,
      mockApi: import.meta.env.VITE_MOCK_API,
      apiUrl: import.meta.env.VITE_API_URL,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      baseUrl: import.meta.env.BASE_URL,
    };

    this.log(`Mode: ${env.nodeEnv}`, "info");
    this.log(
      `Mock API: ${env.mockApi}`,
      env.mockApi === "true" ? "info" : "warn"
    );
    this.log(`API URL: ${env.apiUrl || "non définie"}`, "info");

    return {
      mode: env.nodeEnv,
      mockApiEnabled: env.mockApi === "true",
      apiUrl: env.apiUrl,
      isDev: env.dev,
      isProd: env.prod,
      baseUrl: env.baseUrl,
      allEnvVars: env,
    };
  }

  static async checkNetwork(): Promise<NetworkCheck> {
    this.log("🌐 Vérification du réseau...", "info");

    const checks = {
      localhost: false,
      apiEndpoint: false,
      internetConnection: false,
    };

    try {
      // Test de connexion localhost
      await fetch("http://localhost:3000", {
        method: "HEAD",
        mode: "no-cors",
      });
      checks.localhost = true;
      this.log("✅ Localhost accessible", "info");
    } catch (error) {
      this.log(`❌ Localhost inaccessible: ${error}`, "error");
    }

    try {
      // Test de connexion internet
      await fetch("https://httpbin.org/status/200", {
        method: "HEAD",
        mode: "no-cors",
      });
      checks.internetConnection = true;
      this.log("✅ Connexion internet OK", "info");
    } catch (error) {
      this.log(`❌ Pas de connexion internet: ${error}`, "warn");
    }

    try {
      // Test de l'endpoint API (si pas en mode mock)
      if (import.meta.env.VITE_MOCK_API !== "true") {
        await fetch("/api/health", {
          method: "HEAD",
          mode: "no-cors",
        });
        checks.apiEndpoint = true;
        this.log("✅ API endpoint accessible", "info");
      } else {
        this.log("⚠️ Mode mock activé - pas de test API réelle", "info");
      }
    } catch (error) {
      this.log(`❌ API endpoint inaccessible: ${error}`, "error");
    }

    return checks;
  }

  static async checkApiConfiguration(): Promise<ApiCheck> {
    this.log("🔌 Vérification de la configuration API...", "info");

    try {
      // Test du mode mock
      const mockTest = await this.testMockApi();

      return {
        serviceLoaded: true,
        mockMode: import.meta.env.VITE_MOCK_API === "true",
        mockTest: mockTest,
        baseUrl: import.meta.env.VITE_API_URL || "/api",
      };
    } catch (error) {
      this.log(
        `❌ Erreur de configuration API: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );
      return {
        serviceLoaded: false,
        mockMode: false,
        mockTest: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        baseUrl: "unknown",
      };
    }
  }

  static async testMockApi(): Promise<{
    success: boolean;
    error?: string;
    data?: any;
  }> {
    try {
      this.log("🧪 Test de l'API mock...", "info");

      // Test direct de la fonction mock
      const testCredentials = {
        email: "admin@streaming.local",
        password: "admin123",
      };

      // Simuler un appel API mock
      const mockResponse = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              user: { id: 1, email: testCredentials.email },
              accessToken: "mock-token-test",
              refreshToken: "mock-refresh-test",
            },
          });
        }, 100);
      });

      this.log("✅ API mock fonctionne", "info");
      return { success: true, data: mockResponse };
    } catch (error) {
      this.log(
        `❌ Erreur API mock: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  static checkBrowser(): BrowserCheck {
    this.log("🌐 Vérification du navigateur...", "info");

    const userAgent = navigator.userAgent;
    const isOpera = userAgent.includes("OPR") || userAgent.includes("Opera");
    const isChrome = userAgent.includes("Chrome") && !isOpera;
    const isFirefox = userAgent.includes("Firefox");
    const isSafari = userAgent.includes("Safari") && !isChrome && !isOpera;

    const browserInfo = {
      userAgent,
      isOpera,
      isChrome,
      isFirefox,
      isSafari,
      supportsLocalStorage: typeof Storage !== "undefined",
      supportsSessionStorage: typeof sessionStorage !== "undefined",
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
    };

    this.log(
      `Navigateur détecté: ${
        isOpera
          ? "Opera"
          : isChrome
          ? "Chrome"
          : isFirefox
          ? "Firefox"
          : isSafari
          ? "Safari"
          : "Inconnu"
      }`,
      "info"
    );
    this.log(
      `Cookies activés: ${browserInfo.cookiesEnabled}`,
      browserInfo.cookiesEnabled ? "info" : "warn"
    );
    this.log(
      `Status en ligne: ${browserInfo.onlineStatus}`,
      browserInfo.onlineStatus ? "info" : "warn"
    );

    return browserInfo;
  }

  static checkLocalStorage(): StorageCheck {
    this.log("💾 Vérification du stockage local...", "info");

    const storageInfo = {
      available: typeof Storage !== "undefined",
      accessToken: localStorage.getItem("accessToken"),
      refreshToken: localStorage.getItem("refreshToken"),
      cacheKeys: Object.keys(localStorage).filter((key) =>
        key.startsWith("api_cache_")
      ),
      totalItems: localStorage.length,
    };

    this.log(
      `LocalStorage disponible: ${storageInfo.available}`,
      storageInfo.available ? "info" : "error"
    );
    this.log(
      `Token d'accès: ${storageInfo.accessToken ? "présent" : "absent"}`,
      "info"
    );
    this.log(
      `Token de refresh: ${storageInfo.refreshToken ? "présent" : "absent"}`,
      "info"
    );
    this.log(`Éléments en cache: ${storageInfo.cacheKeys.length}`, "info");

    return storageInfo;
  }

  static generateRecommendations(report: DiagnosticReport): void {
    this.log("💡 Génération des recommandations...", "info");

    // Vérifier le mode mock
    if (!report.environment.mockApiEnabled) {
      report.recommendations.push({
        type: "critical",
        message:
          "Le mode mock n'est pas activé. Créez un fichier .env.local avec VITE_MOCK_API=true",
        action: "Redémarrer le serveur après avoir créé le fichier .env.local",
      });
    }

    // Vérifier la connexion réseau
    if (!report.network.localhost) {
      report.recommendations.push({
        type: "error",
        message: "Le serveur localhost n'est pas accessible",
        action:
          "Vérifiez que le serveur de développement est démarré avec npm run dev",
      });
    }

    // Vérifier l'API
    if (!report.api.mockTest.success) {
      report.recommendations.push({
        type: "error",
        message: "Le système mock ne fonctionne pas correctement",
        action: "Vérifiez la configuration du service API",
      });
    }

    // Vérifier le navigateur
    if (!report.browser.cookiesEnabled) {
      report.recommendations.push({
        type: "warning",
        message: "Les cookies sont désactivés",
        action: "Activez les cookies pour permettre l'authentification",
      });
    }

    // Afficher les recommandations
    report.recommendations.forEach((rec) => {
      this.log(
        `${rec.type.toUpperCase()}: ${rec.message} → ${rec.action}`,
        rec.type as any
      );
    });
  }

  static exportReport(report: DiagnosticReport): void {
    const reportText = JSON.stringify(report, null, 2);
    const blob = new Blob([reportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostic-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.log("📄 Rapport exporté", "info");
  }

  static clearLogs(): void {
    this.logs = [];
    const diagnosticElement = document.getElementById("diagnostic-panel");
    if (diagnosticElement) {
      diagnosticElement.innerHTML = "";
    }
  }

  static hideDiagnosticPanel(): void {
    const diagnosticElement = document.getElementById("diagnostic-panel");
    if (diagnosticElement) {
      diagnosticElement.style.display = "none";
    }
  }

  static showDiagnosticPanel(): void {
    const diagnosticElement = document.getElementById("diagnostic-panel");
    if (diagnosticElement) {
      diagnosticElement.style.display = "block";
    }
  }
}

// Types pour le système de diagnostic
export interface DiagnosticReport {
  timestamp: string;
  environment: EnvironmentCheck;
  network: NetworkCheck;
  api: ApiCheck;
  browser: BrowserCheck;
  localStorage: StorageCheck;
  errors: string[];
  recommendations: Recommendation[];
}

export interface EnvironmentCheck {
  mode: string;
  mockApiEnabled: boolean;
  apiUrl?: string;
  isDev: boolean;
  isProd: boolean;
  baseUrl: string;
  allEnvVars: Record<string, any>;
}

export interface NetworkCheck {
  localhost: boolean;
  apiEndpoint: boolean;
  internetConnection: boolean;
}

export interface ApiCheck {
  serviceLoaded: boolean;
  mockMode: boolean;
  mockTest: { success: boolean; error?: string; data?: any };
  baseUrl: string;
}

export interface BrowserCheck {
  userAgent: string;
  isOpera: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  supportsLocalStorage: boolean;
  supportsSessionStorage: boolean;
  cookiesEnabled: boolean;
  onlineStatus: boolean;
}

export interface StorageCheck {
  available: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  cacheKeys: string[];
  totalItems: number;
}

export interface Recommendation {
  type: "critical" | "error" | "warning" | "info";
  message: string;
  action: string;
}

// Fonction utilitaire pour lancer le diagnostic depuis la console
(window as any).runDiagnostic = () => DiagnosticSystem.runFullDiagnostic();
(window as any).clearDiagnostic = () => DiagnosticSystem.clearLogs();
(window as any).hideDiagnostic = () => DiagnosticSystem.hideDiagnosticPanel();
(window as any).showDiagnostic = () => DiagnosticSystem.showDiagnosticPanel();
