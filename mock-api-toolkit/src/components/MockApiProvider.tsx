import type { MockApiProviderProps, MockConfig } from '../types';
import { createContext, useContext, useEffect, useState } from 'react';

import { MockApiManager } from '../core/MockApiManager';

// Contexte pour partager le gestionnaire mock
interface MockApiContextType {
  manager: MockApiManager;
  config: MockConfig;
  updateConfig: (updates: Partial<MockConfig>) => void;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const MockApiContext = createContext<MockApiContextType | null>(null);

// Hook pour utiliser le contexte mock API
export function useMockApi(): MockApiContextType {
  const context = useContext(MockApiContext);
  if (!context) {
    throw new Error('useMockApi must be used within a MockApiProvider');
  }
  return context;
}

// Composant Provider
export function MockApiProvider({
  children,
  config: initialConfig,
  onConfigChange,
  storage = 'localStorage',
  storageKey = 'mock-api-config',
}: MockApiProviderProps) {
  // Créer le gestionnaire mock
  const [manager] = useState(() =>
    new MockApiManager(initialConfig, storage, storageKey)
  );

  // État de la configuration
  const [config, setConfig] = useState<MockConfig>(() => manager.getConfig());
  const [isEnabled, setIsEnabledState] = useState(() => manager.isEnabled());

  // Fonction pour mettre à jour la configuration
  const updateConfig = (updates: Partial<MockConfig>) => {
    manager.updateConfig(updates);
    const newConfig = manager.getConfig();
    setConfig(newConfig);
    setIsEnabledState(manager.isEnabled());
    onConfigChange?.(newConfig);
  };

  // Fonction pour activer/désactiver le mock
  const setEnabled = (enabled: boolean) => {
    manager.setEnabled(enabled);
    setIsEnabledState(enabled);
    const newConfig = manager.getConfig();
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  // Synchroniser avec les changements externes
  useEffect(() => {
    const currentConfig = manager.getConfig();
    setConfig(currentConfig);
    setIsEnabledState(manager.isEnabled());
  }, [manager]);

  // Valeur du contexte
  const contextValue: MockApiContextType = {
    manager,
    config,
    updateConfig,
    isEnabled,
    setEnabled,
  };

  return (
    <MockApiContext.Provider value={contextValue}>
      {children}
    </MockApiContext.Provider>
  );
}

// Hook pour obtenir les logs
export function useMockLogs() {
  const { manager } = useMockApi();
  const [logs, setLogs] = useState(() => manager.getLogs());

  useEffect(() => {
    // Mettre à jour les logs périodiquement
    const interval = setInterval(() => {
      setLogs(manager.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, [manager]);

  const clearLogs = () => {
    manager.clearLogs();
    setLogs([]);
  };

  return { logs, clearLogs };
}

// Hook pour gérer les endpoints
export function useMockEndpoints() {
  const { manager, updateConfig } = useMockApi();
  const [endpoints, setEndpoints] = useState(() => manager.getEndpoints());

  useEffect(() => {
    setEndpoints(manager.getEndpoints());
  }, [manager]);

  const addEndpoint = (endpoint: Parameters<typeof manager.addEndpoint>[0]) => {
    const newEndpoint = manager.addEndpoint(endpoint);
    setEndpoints(manager.getEndpoints());
    return newEndpoint;
  };

  const updateEndpoint = (id: string, updates: Parameters<typeof manager.updateEndpoint>[1]) => {
    const updatedEndpoint = manager.updateEndpoint(id, updates);
    setEndpoints(manager.getEndpoints());
    return updatedEndpoint;
  };

  const removeEndpoint = (id: string) => {
    const success = manager.removeEndpoint(id);
    if (success) {
      setEndpoints(manager.getEndpoints());
    }
    return success;
  };

  const toggleEndpoint = (id: string) => {
    const endpoint = manager.getEndpoint(id);
    if (endpoint) {
      return updateEndpoint(id, { enabled: !endpoint.enabled });
    }
    return null;
  };

  return {
    endpoints,
    addEndpoint,
    updateEndpoint,
    removeEndpoint,
    toggleEndpoint,
  };
} 