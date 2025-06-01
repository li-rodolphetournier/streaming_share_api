import { SimpleMockApi } from "../src";
import axios from "axios";

// Exemple d'utilisation pour une application de streaming
export function setupStreamingMocks() {
  const mockApi = new SimpleMockApi({
    baseUrl: "/api",
    enabled: true,
  });

  // Installer sur l'instance Axios
  mockApi.install(axios);

  // Ajouter les endpoints d'authentification
  mockApi.addAuthEndpoints();

  // Endpoints spécifiques au streaming
  mockApi
    // Bibliothèque de médias
    .addEndpoint({
      name: "Get Media Library",
      method: "GET",
      path: "/media",
      response: {
        status: 200,
        data: {
          items: [
            {
              id: 1,
              title: "Inception",
              type: "movie",
              duration: 8880, // en secondes
              quality: ["1080p", "4K"],
              thumbnail: "https://example.com/inception.jpg",
              description: "Un voleur qui s'infiltre dans les rêves...",
              genre: ["Sci-Fi", "Thriller"],
              year: 2010,
              rating: 8.8,
              watchProgress: 0,
            },
            {
              id: 2,
              title: "Breaking Bad",
              type: "series",
              seasons: 5,
              episodes: 62,
              quality: ["1080p", "4K"],
              thumbnail: "https://example.com/breaking-bad.jpg",
              description: "Un professeur de chimie devient...",
              genre: ["Drama", "Crime"],
              year: 2008,
              rating: 9.5,
              watchProgress: 45,
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
          },
        },
      },
    })

    // Détails d'un média
    .addEndpoint({
      name: "Get Media Details",
      method: "GET",
      path: "/media/:id",
      response: {
        status: 200,
        data: {
          id: 1,
          title: "Inception",
          type: "movie",
          duration: 8880,
          quality: ["720p", "1080p", "4K", "8K"],
          streamUrl: "https://stream.example.com/inception.m3u8",
          thumbnail: "https://example.com/inception.jpg",
          backdrop: "https://example.com/inception-backdrop.jpg",
          description:
            "Un voleur qui s'infiltre dans les rêves des autres pour voler leurs secrets...",
          genre: ["Sci-Fi", "Thriller", "Action"],
          year: 2010,
          rating: 8.8,
          director: "Christopher Nolan",
          cast: ["Leonardo DiCaprio", "Marion Cotillard", "Tom Hardy"],
          watchProgress: 0,
          isFavorite: false,
          subtitles: [
            {
              language: "fr",
              url: "https://subs.example.com/inception-fr.vtt",
            },
            {
              language: "en",
              url: "https://subs.example.com/inception-en.vtt",
            },
          ],
          recommendations: [2, 3, 4],
        },
      },
    })

    // Streaming URL
    .addEndpoint({
      name: "Get Stream URL",
      method: "POST",
      path: "/media/:id/stream",
      response: {
        status: 200,
        data: {
          streamUrl: "https://stream.example.com/inception.m3u8",
          quality: "4K",
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1h
          token: "stream-token-123",
        },
      },
      scenarios: [
        {
          id: "hd",
          name: "Qualité HD",
          response: {
            status: 200,
            data: {
              streamUrl: "https://stream.example.com/inception-hd.m3u8",
              quality: "1080p",
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
              token: "stream-token-hd",
            },
          },
        },
        {
          id: "4k",
          name: "Qualité 4K",
          response: {
            status: 200,
            data: {
              streamUrl: "https://stream.example.com/inception-4k.m3u8",
              quality: "4K",
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
              token: "stream-token-4k",
            },
          },
        },
        {
          id: "error",
          name: "Erreur de streaming",
          response: {
            status: 403,
            data: { error: "Streaming not available for this content" },
          },
        },
      ],
    })

    // Progression de visionnage
    .addEndpoint({
      name: "Update Watch Progress",
      method: "PUT",
      path: "/media/:id/progress",
      response: {
        status: 200,
        data: {
          mediaId: 1,
          progress: 45.5, // pourcentage
          timestamp: 4050, // position en secondes
          updatedAt: new Date().toISOString(),
        },
      },
    })

    // Favoris
    .addEndpoint({
      name: "Toggle Favorite",
      method: "POST",
      path: "/media/:id/favorite",
      response: {
        status: 200,
        data: {
          mediaId: 1,
          isFavorite: true,
          updatedAt: new Date().toISOString(),
        },
      },
    })

    // Recherche
    .addEndpoint({
      name: "Search Media",
      method: "GET",
      path: "/search",
      response: {
        status: 200,
        data: {
          query: "inception",
          results: [
            {
              id: 1,
              title: "Inception",
              type: "movie",
              year: 2010,
              thumbnail: "https://example.com/inception.jpg",
              rating: 8.8,
            },
          ],
          suggestions: ["interstellar", "the matrix", "blade runner"],
          totalResults: 1,
        },
      },
    })

    // Recommandations
    .addEndpoint({
      name: "Get Recommendations",
      method: "GET",
      path: "/recommendations",
      response: {
        status: 200,
        data: {
          trending: [1, 2, 3],
          forYou: [4, 5, 6],
          newReleases: [7, 8, 9],
          continueWatching: [
            {
              mediaId: 2,
              progress: 45,
              lastWatched: new Date(Date.now() - 86400000).toISOString(), // hier
            },
          ],
        },
      },
    })

    // Collections/Playlists
    .addEndpoint({
      name: "Get Collections",
      method: "GET",
      path: "/collections",
      response: {
        status: 200,
        data: [
          {
            id: 1,
            name: "Mes Favoris",
            description: "Films et séries que j'adore",
            mediaIds: [1, 2],
            thumbnail: "https://example.com/favorites.jpg",
            isPublic: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            name: "À regarder plus tard",
            description: "Ma watchlist",
            mediaIds: [3, 4, 5],
            thumbnail: "https://example.com/watchlist.jpg",
            isPublic: false,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    })

    // Profil utilisateur
    .addEndpoint({
      name: "Get User Profile",
      method: "GET",
      path: "/profile",
      response: {
        status: 200,
        data: {
          id: 1,
          email: "admin@streaming.local",
          firstName: "Admin",
          lastName: "User",
          avatar: "https://example.com/avatar.jpg",
          preferences: {
            language: "fr",
            autoplay: true,
            quality: "auto",
            subtitles: true,
            notifications: {
              newReleases: true,
              recommendations: true,
              watchReminders: false,
            },
          },
          subscription: {
            plan: "premium",
            expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 jours
            features: ["4k", "8k", "offline", "multiple_devices"],
          },
          stats: {
            totalWatchTime: 125400, // en secondes
            moviesWatched: 45,
            seriesWatched: 12,
            favoriteGenre: "Sci-Fi",
          },
        },
      },
    });

  return mockApi;
}

// Fonction pour configurer des scénarios de test spécifiques
export function setupTestScenarios(mockApi: SimpleMockApi) {
  // Scénario : Connexion lente
  mockApi.addEndpoint({
    name: "Slow Network Simulation",
    method: "GET",
    path: "/media",
    response: {
      status: 200,
      data: {
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
      delay: 5000, // 5 secondes
    },
  });

  // Scénario : Erreur serveur
  mockApi.addEndpoint({
    name: "Server Error Simulation",
    method: "GET",
    path: "/media/error",
    response: {
      status: 500,
      data: { error: "Internal server error", code: "INTERNAL_ERROR" },
    },
  });

  // Scénario : Contenu non disponible
  mockApi.addEndpoint({
    name: "Content Unavailable",
    method: "POST",
    path: "/media/999/stream",
    response: {
      status: 404,
      data: { error: "Content not found or unavailable in your region" },
    },
  });

  return mockApi;
}

// Exemple d'utilisation
export default function initializeStreamingMocks() {
  const mockApi = setupStreamingMocks();

  // Ajouter des scénarios de test en mode développement
  if (process.env.NODE_ENV === "development") {
    setupTestScenarios(mockApi);
  }

  console.log("🎭 Mock API Streaming initialisé avec succès !");
  console.log("📊 Endpoints disponibles :", mockApi.getLogs().length);

  return mockApi;
}
