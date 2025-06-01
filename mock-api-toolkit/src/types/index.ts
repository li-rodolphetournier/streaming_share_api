// Types de base pour les requêtes et réponses
export interface MockRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface MockResponse {
  status: number;
  data: any;
  headers?: Record<string, string>;
  delay?: number;
}

// Configuration d'un endpoint mock
export interface MockEndpoint {
  id: string;
  name: string;
  description?: string;
  method: MockRequest["method"];
  path: string;
  response: MockResponse;
  enabled: boolean;
  conditions?: MockCondition[];
  scenarios?: MockScenario[];
  activeScenario?: string;
}

// Conditions pour les réponses dynamiques
export interface MockCondition {
  field: string; // ex: "body.email", "headers.authorization"
  operator: "equals" | "contains" | "startsWith" | "endsWith" | "regex";
  value: string;
  response: MockResponse;
}

// Scénarios pour tester différents cas
export interface MockScenario {
  id: string;
  name: string;
  description?: string;
  response: MockResponse;
}

// Configuration globale du mock
export interface MockConfig {
  enabled: boolean;
  baseUrl?: string;
  globalDelay?: number;
  logging?: boolean;
  cors?: boolean;
  endpoints: MockEndpoint[];
}

// Logs des requêtes
export interface MockLog {
  id: string;
  timestamp: Date;
  request: MockRequest;
  response: MockResponse;
  endpoint?: MockEndpoint;
  duration: number;
}

// Interface pour les données utilisateur (exemple)
export interface MockUser {
  id: number;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  preferences?: Record<string, any>;
  profile?: Record<string, any>;
  permissions?: string[];
}

// Interface pour l'authentification
export interface MockAuthResponse {
  user: Omit<MockUser, "password">;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// Configuration du provider
export interface MockProviderConfig {
  config: MockConfig;
  onConfigChange?: (config: MockConfig) => void;
  storage?: "localStorage" | "sessionStorage" | "memory";
  storageKey?: string;
}

// Props pour les composants (utilisant any pour éviter la dépendance React)
export interface MockApiProviderProps {
  children: any; // React.ReactNode
  config?: Partial<MockConfig>;
  onConfigChange?: (config: MockConfig) => void;
  storage?: "localStorage" | "sessionStorage" | "memory";
  storageKey?: string;
}

export interface MockApiPanelProps {
  className?: string;
  position?: "bottom" | "right" | "left" | "top";
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface MockEndpointEditorProps {
  endpoint?: MockEndpoint;
  onSave: (endpoint: MockEndpoint) => void;
  onCancel: () => void;
}

export interface MockLogsViewerProps {
  logs: MockLog[];
  onClear: () => void;
  maxLogs?: number;
}
