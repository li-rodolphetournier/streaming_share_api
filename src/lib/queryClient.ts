import { QueryClient } from "@tanstack/react-query";

// Configuration optimisée pour haute performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Temps avant qu'une requête soit considérée comme obsolète
      staleTime: 5 * 60 * 1000, // 5 minutes par défaut

      // Temps de cache avant garbage collection
      cacheTime: 10 * 60 * 1000, // 10 minutes par défaut

      // Retry automatique en cas d'échec
      retry: (failureCount, error: any) => {
        // Ne pas retry pour les erreurs 4xx (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry jusqu'à 3 fois pour les autres erreurs
        return failureCount < 3;
      },

      // Délai entre les retries (exponentiel)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch automatique
      refetchOnWindowFocus: false, // Désactivé pour éviter les requêtes inutiles
      refetchOnReconnect: true,
      refetchOnMount: true,

      // Optimisations réseau
      networkMode: "online",
    },
    mutations: {
      // Retry pour les mutations
      retry: (failureCount, error: any) => {
        // Ne pas retry pour les erreurs 4xx
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2; // Moins de retries pour les mutations
      },

      // Délai entre les retries pour les mutations
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

      // Mode réseau
      networkMode: "online",
    },
  },
});

// Configuration spécifique pour les machines haute performance
if (typeof window !== "undefined") {
  // Détecter les capacités de la machine
  const isHighPerformance =
    navigator.hardwareConcurrency >= 8 && // Au moins 8 cœurs
    (navigator as any).deviceMemory >= 8; // Au moins 8GB RAM (si disponible)

  if (isHighPerformance) {
    // Augmenter les limites pour les machines puissantes
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 10 * 60 * 1000, // 10 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
      },
    });

    // Précharger plus agressivement
    queryClient.setQueryDefaults(["media"], {
      staleTime: 15 * 60 * 1000,
      cacheTime: 60 * 60 * 1000, // 1 heure pour les médias
    });

    queryClient.setQueryDefaults(["auth"], {
      staleTime: 10 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
    });
  }
}

// Gestionnaire d'erreurs global
queryClient.setDefaultOptions({
  queries: {
    onError: (error: any) => {
      console.error("Query error:", error);

      // Gestion spécifique des erreurs d'authentification
      if (error?.response?.status === 401) {
        // Rediriger vers la page de connexion ou rafraîchir le token
        console.warn("Authentication error detected");
      }

      // Gestion des erreurs réseau
      if (!navigator.onLine) {
        console.warn("Network error: offline");
      }
    },
  },
  mutations: {
    onError: (error: any) => {
      console.error("Mutation error:", error);

      // Gestion des erreurs de mutation
      if (error?.response?.status === 401) {
        console.warn("Authentication error in mutation");
      }
    },
  },
});

// Optimisations pour le garbage collection
if (typeof window !== "undefined") {
  // Nettoyer le cache périodiquement
  setInterval(() => {
    queryClient.getQueryCache().clear();
  }, 60 * 60 * 1000); // Toutes les heures

  // Nettoyer lors de la fermeture de l'onglet
  window.addEventListener("beforeunload", () => {
    queryClient.clear();
  });

  // Optimiser selon l'état de la batterie (si disponible)
  if ("getBattery" in navigator) {
    (navigator as any).getBattery().then((battery: any) => {
      const updateCacheStrategy = () => {
        if (battery.charging || battery.level > 0.5) {
          // Batterie OK : cache agressif
          queryClient.setDefaultOptions({
            queries: {
              staleTime: 10 * 60 * 1000,
              cacheTime: 30 * 60 * 1000,
            },
          });
        } else {
          // Batterie faible : cache conservateur
          queryClient.setDefaultOptions({
            queries: {
              staleTime: 2 * 60 * 1000,
              cacheTime: 5 * 60 * 1000,
            },
          });
        }
      };

      battery.addEventListener("chargingchange", updateCacheStrategy);
      battery.addEventListener("levelchange", updateCacheStrategy);
      updateCacheStrategy();
    });
  }
}

export default queryClient;
