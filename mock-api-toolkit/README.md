# Mock API Toolkit

Un toolkit complet pour créer et gérer des APIs mock avec interface de gestion, parfait pour le développement et les tests.

## 🚀 Fonctionnalités

- **🎭 Mock API complet** : Intercepte les requêtes Axios et retourne des réponses mock
- **🎨 Interface de gestion** : Composants React pour gérer les endpoints en temps réel
- **📊 Logs détaillés** : Suivi de toutes les requêtes avec métriques
- **🔧 Configuration flexible** : Conditions, scénarios, délais personnalisables
- **💾 Persistance** : Sauvegarde automatique dans localStorage/sessionStorage
- **📦 Templates prêts** : Endpoints d'authentification préconfigurés
- **🔌 Facile à intégrer** : Installation en une ligne sur vos instances Axios

## 📦 Installation

```bash
npm install @streaming/mock-api-toolkit
```

## 🎯 Utilisation Rapide

### Version Simple (sans React)

```typescript
import axios from "axios";
import { SimpleMockApi } from "@streaming/mock-api-toolkit";

// Créer et configurer le mock
const mockApi = new SimpleMockApi({
  baseUrl: "/api",
  enabled: true,
});

// Installer sur votre instance Axios
mockApi.install(axios);

// Ajouter des endpoints
mockApi.addEndpoint({
  name: "Get Users",
  method: "GET",
  path: "/users",
  response: {
    status: 200,
    data: [
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" },
    ],
  },
});

// Ajouter les endpoints d'authentification prédéfinis
mockApi.addAuthEndpoints();

// Maintenant vos requêtes Axios retourneront les réponses mock !
const users = await axios.get("/api/users");
console.log(users.data); // [{ id: 1, name: 'John Doe', ... }]
```

### Version avec React

```tsx
import React from "react";
import axios from "axios";
import {
  MockApiProvider,
  MockApiPanel,
  createAuthMock,
} from "@streaming/mock-api-toolkit";

// Créer le mock d'authentification
const authMock = createAuthMock();
authMock.installOn(axios);

function App() {
  return (
    <MockApiProvider>
      <div className="app">
        {/* Votre application */}
        <YourAppContent />

        {/* Panneau de gestion des mocks */}
        <MockApiPanel position="bottom" />
      </div>
    </MockApiProvider>
  );
}
```

## 🔧 Configuration Avancée

### Endpoints avec Conditions

```typescript
mockApi.addEndpoint({
  name: "Login Conditionnel",
  method: "POST",
  path: "/auth/login",
  response: {
    status: 200,
    data: { token: "default-token" },
  },
  conditions: [
    {
      field: "body.email",
      operator: "equals",
      value: "admin@example.com",
      response: {
        status: 200,
        data: {
          token: "admin-token",
          user: { role: "admin" },
        },
      },
    },
    {
      field: "body.password",
      operator: "equals",
      value: "wrong",
      response: {
        status: 401,
        data: { error: "Invalid credentials" },
      },
    },
  ],
});
```

### Scénarios de Test

```typescript
mockApi.addEndpoint({
  name: "API avec Scénarios",
  method: "GET",
  path: "/api/data",
  response: {
    status: 200,
    data: { message: "Default response" },
  },
  scenarios: [
    {
      id: "success",
      name: "Succès",
      response: {
        status: 200,
        data: { message: "Success scenario" },
      },
    },
    {
      id: "error",
      name: "Erreur serveur",
      response: {
        status: 500,
        data: { error: "Server error" },
        delay: 2000,
      },
    },
    {
      id: "slow",
      name: "Réponse lente",
      response: {
        status: 200,
        data: { message: "Slow response" },
        delay: 5000,
      },
    },
  ],
  activeScenario: "success", // Scénario actif
});
```

## 🎨 Interface de Gestion

Le `MockApiPanel` fournit une interface complète pour :

- **Activer/désactiver** le système mock
- **Gérer les endpoints** : ajouter, modifier, supprimer
- **Voir les logs** en temps réel
- **Changer de scénarios** pour tester différents cas
- **Configurer** les paramètres globaux

```tsx
<MockApiPanel
  position="bottom" // 'bottom' | 'right' | 'left' | 'top'
  collapsible={true} // Peut être réduit
  defaultCollapsed={false} // État initial
/>
```

## 📊 Monitoring et Logs

```typescript
// Obtenir les logs
const logs = mockApi.getLogs();

// Vider les logs
mockApi.clearLogs();

// Chaque log contient :
// {
//   id: string,
//   timestamp: Date,
//   request: { url, method, headers, body, params },
//   response: { status, data, headers },
//   endpoint?: MockEndpoint,
//   duration: number (en ms)
// }
```

## 🔌 Intégration avec React Query

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MockApiProvider } from "@streaming/mock-api-toolkit";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MockApiProvider>
        <YourApp />
        <MockApiPanel />
      </MockApiProvider>
    </QueryClientProvider>
  );
}
```

## 📋 Templates Prédéfinis

### Authentification

```typescript
import {
  createAuthMock,
  DEFAULT_MOCK_USERS,
} from "@streaming/mock-api-toolkit";

const authMock = createAuthMock();

// Utilisateurs de test inclus :
// - admin@example.com / admin123 (rôle: admin)
// - user@example.com / user123 (rôle: user)

// Endpoints inclus :
// POST /auth/login
// POST /auth/register
// GET /auth/me
// POST /auth/logout
// POST /auth/refresh
// POST /auth/forgot-password
// POST /auth/reset-password
```

## 🛠️ API Complète

### MockApiManager

```typescript
const manager = new MockApiManager(config, storage, storageKey);

// Configuration
manager.getConfig();
manager.updateConfig(updates);
manager.setEnabled(enabled);
manager.isEnabled();

// Endpoints
manager.addEndpoint(endpoint);
manager.updateEndpoint(id, updates);
manager.removeEndpoint(id);
manager.getEndpoints();
manager.getEndpoint(id);

// Traitement
manager.processRequest(request);
manager.matchRequest(request);

// Logs
manager.getLogs();
manager.clearLogs();
manager.setMaxLogs(max);

// Import/Export
manager.exportConfig();
manager.importConfig(configJson);
manager.reset();
```

### Hooks React

```tsx
// Hook principal
const { manager, config, updateConfig, isEnabled, setEnabled } = useMockApi();

// Gestion des endpoints
const {
  endpoints,
  addEndpoint,
  updateEndpoint,
  removeEndpoint,
  toggleEndpoint,
} = useMockEndpoints();

// Logs
const { logs, clearLogs } = useMockLogs();
```

## 🎯 Cas d'Usage

### Développement Frontend

- Développer sans attendre le backend
- Tester différents scénarios d'erreur
- Simuler des réponses lentes

### Tests E2E

- Contrôler précisément les réponses API
- Tester les cas d'erreur
- Répétabilité des tests

### Démonstrations

- Présenter l'application sans backend
- Données cohérentes et prévisibles

### Prototypage

- Valider rapidement des concepts
- Itérer sur l'UX sans contraintes backend

## 🔧 Configuration TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "ES6"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "jsx": "react-jsx"
  }
}
```

## 📦 Build et Distribution

```bash
# Développement
npm run dev

# Build
npm run build

# Tests
npm run test

# Lint
npm run lint
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- 📖 [Documentation complète](https://github.com/your-org/mock-api-toolkit/wiki)
- 🐛 [Signaler un bug](https://github.com/your-org/mock-api-toolkit/issues)
- 💡 [Demander une fonctionnalité](https://github.com/your-org/mock-api-toolkit/issues)

---

**Mock API Toolkit** - Développez plus vite, testez mieux ! 🚀
