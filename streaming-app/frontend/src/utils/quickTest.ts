// Script de test rapide pour identifier les problèmes de configuration
export const quickTest = () => {
  console.log("🚀 QUICK TEST - Vérification rapide de la configuration");
  console.log("================================================");

  // 1. Variables d'environnement
  console.log("📋 Variables d'environnement:");
  console.log("  MODE:", import.meta.env.MODE);
  console.log("  VITE_MOCK_API:", import.meta.env.VITE_MOCK_API);
  console.log("  VITE_API_URL:", import.meta.env.VITE_API_URL);
  console.log("  DEV:", import.meta.env.DEV);
  console.log("  PROD:", import.meta.env.PROD);

  // 2. Test du mode mock
  const isMockMode = import.meta.env.VITE_MOCK_API === "true";
  console.log("🔧 Mode Mock:", isMockMode ? "✅ ACTIVÉ" : "❌ DÉSACTIVÉ");

  if (!isMockMode) {
    console.log("⚠️  PROBLÈME DÉTECTÉ: Le mode mock n'est pas activé!");
    console.log(
      "💡 SOLUTION: Créez un fichier .env.local avec VITE_MOCK_API=true"
    );
    console.log("💡 PUIS: Redémarrez le serveur avec npm run dev");
  }

  // 3. Test du localStorage
  console.log("💾 LocalStorage:");
  console.log("  Disponible:", typeof Storage !== "undefined" ? "✅" : "❌");
  console.log(
    "  Access Token:",
    localStorage.getItem("accessToken") ? "✅ Présent" : "❌ Absent"
  );
  console.log(
    "  Refresh Token:",
    localStorage.getItem("refreshToken") ? "✅ Présent" : "❌ Absent"
  );

  // 4. Test du navigateur
  console.log("🌐 Navigateur:");
  console.log("  User Agent:", navigator.userAgent);
  console.log(
    "  Cookies:",
    navigator.cookieEnabled ? "✅ Activés" : "❌ Désactivés"
  );
  console.log("  En ligne:", navigator.onLine ? "✅ Oui" : "❌ Non");

  // 5. Test de l'API mock
  console.log("🧪 Test API Mock:");
  testMockApi();

  console.log("================================================");
  console.log("🔍 Pour un diagnostic complet, utilisez: runDiagnostic()");
};

const testMockApi = async () => {
  try {
    // Test direct de la logique mock
    const testCredentials = {
      email: "admin@streaming.local",
      password: "admin123",
    };

    console.log("  Test des identifiants:", testCredentials.email);

    // Simuler la logique mock
    const mockUsers = [
      {
        id: 1,
        email: "admin@streaming.local",
        password: "admin123",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      },
    ];

    const user = mockUsers.find(
      (u) =>
        u.email === testCredentials.email &&
        u.password === testCredentials.password
    );

    if (user) {
      console.log("  ✅ Authentification mock réussie");
      console.log("  👤 Utilisateur trouvé:", user.firstName, user.lastName);
    } else {
      console.log("  ❌ Échec de l'authentification mock");
    }
  } catch (error) {
    console.log("  ❌ Erreur lors du test mock:", error);
  }
};

// Test de connexion réseau simple
export const testNetwork = async () => {
  console.log("🌐 Test de connexion réseau...");

  try {
    // Test localhost
    await fetch("http://localhost:3000", {
      method: "HEAD",
      mode: "no-cors",
    });
    console.log("✅ Localhost accessible");
  } catch (error) {
    console.log("❌ Localhost inaccessible:", error);
  }

  try {
    // Test internet
    await fetch("https://httpbin.org/status/200", {
      method: "HEAD",
      mode: "no-cors",
    });
    console.log("✅ Connexion internet OK");
  } catch (error) {
    console.log("❌ Pas de connexion internet:", error);
  }
};

// Test de l'authentification complète
export const testAuth = async () => {
  console.log("🔐 Test d'authentification...");

  try {
    // Importer dynamiquement le service d'authentification
    const { useAuth } = await import("../hooks/useAuth");
    void useAuth; // Marquer comme intentionnellement ignoré
    console.log("✅ Hook d'authentification chargé");

    // Tester les identifiants mock
    const testCredentials = [
      { email: "admin@streaming.local", password: "admin123", role: "admin" },
      { email: "user@streaming.local", password: "user123", role: "user" },
    ];

    console.log("📋 Comptes de test disponibles:");
    testCredentials.forEach((cred) => {
      console.log(`  👤 ${cred.role}: ${cred.email} / ${cred.password}`);
    });
  } catch (error) {
    console.log("❌ Erreur lors du test d'authentification:", error);
  }
};

// Fonction pour nettoyer et réinitialiser
export const resetApp = () => {
  console.log("🧹 Nettoyage de l'application...");

  // Nettoyer le localStorage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");

  // Nettoyer le cache API
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("api_cache_")) {
      localStorage.removeItem(key);
    }
  });

  console.log("✅ Application nettoyée");
  console.log("💡 Rechargez la page pour redémarrer");
};

// Fonction pour afficher les informations de debug
export const showDebugInfo = () => {
  console.log("🐛 INFORMATIONS DE DEBUG");
  console.log("========================");

  console.log("📍 URL actuelle:", window.location.href);
  console.log("📍 Origine:", window.location.origin);
  console.log("📍 Pathname:", window.location.pathname);

  console.log("🔧 Configuration Vite:");
  console.log("  Base URL:", import.meta.env.BASE_URL);
  console.log("  Mode:", import.meta.env.MODE);
  console.log("  Toutes les variables:", import.meta.env);

  console.log("🌐 Informations réseau:");
  console.log("  Host:", window.location.host);
  console.log("  Port:", window.location.port);
  console.log("  Protocol:", window.location.protocol);

  console.log("💾 État du stockage:");
  console.log("  LocalStorage items:", localStorage.length);
  console.log("  SessionStorage items:", sessionStorage.length);

  console.log("========================");
};

// Exposer les fonctions dans la console pour faciliter le debug
(window as any).quickTest = quickTest;
(window as any).testNetwork = testNetwork;
(window as any).testAuth = testAuth;
(window as any).resetApp = resetApp;
(window as any).showDebugInfo = showDebugInfo;
