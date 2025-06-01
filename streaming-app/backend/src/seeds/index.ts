import "reflect-metadata";

import { AppDataSource } from "../config/database";
import { AuthService } from "../services/auth.service";
import { Library } from "../entities/Library";
import { Media } from "../entities/Media";
import { MediaService } from "../services/media.service";
import { User } from "../entities/User";
import { UserPreference } from "../entities/UserPreference";
import bcrypt from "bcryptjs";

async function seedDatabase() {
  try {
    console.log("🌱 Démarrage du seeding de la base de données...");

    // Initialiser la connexion à la base de données
    await AppDataSource.initialize();
    console.log("✅ Connexion à la base de données établie");

    // Synchroniser le schéma d'abord
    console.log("🔄 Synchronisation du schéma...");
    await AppDataSource.synchronize();
    console.log("✅ Schéma synchronisé");

    const authService = new AuthService();
    const mediaService = new MediaService();
    const libraryRepository = AppDataSource.getRepository(Library);
    const userRepository = AppDataSource.getRepository(User);
    const mediaRepository = AppDataSource.getRepository(Media);
    const preferencesRepository = AppDataSource.getRepository(UserPreference);

    // Vérifier si des données existent déjà
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log("⚠️  Des données existent déjà, arrêt du seeding");
      return;
    }

    // Créer les utilisateurs de test
    console.log("🔄 Création des utilisateurs de test...");

    // Utilisateur admin
    const adminUser = new User();
    adminUser.email = "admin@streaming.com";
    adminUser.password = await bcrypt.hash("admin123", 10);
    adminUser.role = "admin";
    adminUser.firstName = "Admin";
    adminUser.lastName = "Streaming";
    adminUser.isActive = true;
    adminUser.emailVerified = true;

    const savedAdmin = await userRepository.save(adminUser);

    // Utilisateur normal
    const normalUser = new User();
    normalUser.email = "user@streaming.com";
    normalUser.password = await bcrypt.hash("user123", 10);
    normalUser.role = "user";
    normalUser.firstName = "John";
    normalUser.lastName = "Doe";
    normalUser.isActive = true;
    normalUser.emailVerified = true;

    const savedUser = await userRepository.save(normalUser);

    console.log("✅ Utilisateurs créés avec succès");

    // Créer les préférences utilisateur
    console.log("🔄 Création des préférences utilisateur...");

    const adminPreferences = new UserPreference();
    adminPreferences.user = savedAdmin;
    adminPreferences.videoPreferences = {
      defaultQuality: "1080p",
      autoPlay: true,
      subtitlesEnabled: false,
      subtitleLanguage: "fr",
      audioLanguage: "fr",
      skipIntro: true,
      skipCredits: false,
    };
    adminPreferences.notificationPreferences = {
      newContent: true,
      recommendations: true,
      watchReminders: true,
      email: true,
      push: true,
    };
    adminPreferences.privacyPreferences = {
      shareWatchHistory: false,
      shareRatings: true,
      allowRecommendations: true,
      dataCollection: true,
    };

    await preferencesRepository.save(adminPreferences);

    const userPreferences = new UserPreference();
    userPreferences.user = savedUser;
    userPreferences.videoPreferences = {
      defaultQuality: "720p",
      autoPlay: false,
      subtitlesEnabled: true,
      subtitleLanguage: "en",
      audioLanguage: "en",
      skipIntro: false,
      skipCredits: false,
    };
    userPreferences.notificationPreferences = {
      newContent: false,
      recommendations: true,
      watchReminders: false,
      email: false,
      push: true,
    };
    userPreferences.privacyPreferences = {
      shareWatchHistory: true,
      shareRatings: true,
      allowRecommendations: true,
      dataCollection: false,
    };

    await preferencesRepository.save(userPreferences);

    console.log("✅ Préférences utilisateur créées");

    // Créer les bibliothèques
    console.log("🔄 Création des bibliothèques...");

    const movieLibrary = new Library();
    movieLibrary.name = "Films";
    movieLibrary.path = "/media/movies";
    movieLibrary.type = "movie";
    movieLibrary.description = "Collection de films";
    movieLibrary.owner = savedAdmin;
    movieLibrary.isActive = true;

    const savedMovieLibrary = await libraryRepository.save(movieLibrary);

    const tvLibrary = new Library();
    tvLibrary.name = "Séries TV";
    tvLibrary.path = "/media/tv";
    tvLibrary.type = "tv";
    tvLibrary.description = "Collection de séries télévisées";
    tvLibrary.owner = savedAdmin;
    tvLibrary.isActive = true;

    const savedTvLibrary = await libraryRepository.save(tvLibrary);

    console.log("✅ Bibliothèques créées");

    // Créer des médias de test
    console.log("🔄 Création des médias de test...");

    const movies = [
      {
        title: "The Matrix",
        originalTitle: "The Matrix",
        description:
          "Un programmeur informatique découvre que la réalité qu'il connaît n'est qu'une simulation.",
        filePath: "/media/movies/the_matrix_1999.mp4",
        thumbnailPath: "/media/thumbnails/the_matrix_thumb.jpg",
        posterPath: "/media/posters/the_matrix_poster.jpg",
        type: "movie" as const,
        metadata: {
          duration: 8160, // 2h 16min
          resolution: "1080p",
          codec: "h264",
          audioCodec: "aac",
          fileFormat: "mp4",
          bitrate: 5000,
          frameRate: 24,
          aspectRatio: "16:9",
        },
        movieInfo: {
          year: 1999,
          genre: ["Action", "Science-Fiction"],
          director: "Lana Wachowski, Lilly Wachowski",
          cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
          rating: "R",
          imdbId: "tt0133093",
          tmdbId: 603,
        },
        library: savedMovieLibrary,
      },
      {
        title: "Inception",
        originalTitle: "Inception",
        description:
          "Un voleur qui s'infiltre dans les rêves des autres pour voler leurs secrets.",
        filePath: "/media/movies/inception_2010.mp4",
        thumbnailPath: "/media/thumbnails/inception_thumb.jpg",
        posterPath: "/media/posters/inception_poster.jpg",
        type: "movie" as const,
        metadata: {
          duration: 8880, // 2h 28min
          resolution: "4K",
          codec: "h265",
          audioCodec: "dts",
          fileFormat: "mp4",
          bitrate: 15000,
          frameRate: 24,
          aspectRatio: "16:9",
        },
        movieInfo: {
          year: 2010,
          genre: ["Action", "Science-Fiction", "Thriller"],
          director: "Christopher Nolan",
          cast: ["Leonardo DiCaprio", "Marion Cotillard", "Tom Hardy"],
          rating: "PG-13",
          imdbId: "tt1375666",
          tmdbId: 27205,
        },
        library: savedMovieLibrary,
      },
    ];

    const tvShows = [
      {
        title: "Breaking Bad",
        originalTitle: "Breaking Bad",
        description:
          "Un professeur de chimie se lance dans la fabrication de méthamphétamine.",
        filePath: "/media/tv/breaking_bad_s01e01.mp4",
        thumbnailPath: "/media/thumbnails/breaking_bad_thumb.jpg",
        posterPath: "/media/posters/breaking_bad_poster.jpg",
        type: "tv" as const,
        metadata: {
          duration: 2760, // 46min
          resolution: "1080p",
          codec: "h264",
          audioCodec: "aac",
          fileFormat: "mp4",
          bitrate: 3000,
          frameRate: 24,
          aspectRatio: "16:9",
        },
        movieInfo: {
          year: 2008,
          genre: ["Drame", "Crime", "Thriller"],
          director: "Vince Gilligan",
          cast: ["Bryan Cranston", "Aaron Paul", "Anna Gunn"],
          rating: "TV-MA",
          imdbId: "tt0903747",
          tmdbId: 1396,
        },
        library: savedTvLibrary,
      },
    ];

    // Sauvegarder les films
    for (const movieData of movies) {
      const movie = new Media();
      Object.assign(movie, movieData);
      await mediaRepository.save(movie);
    }

    // Sauvegarder les séries
    for (const tvData of tvShows) {
      const tvShow = new Media();
      Object.assign(tvShow, tvData);
      await mediaRepository.save(tvShow);
    }

    console.log("✅ Médias de test créés");

    console.log("\n🎉 Seed terminé avec succès !");
    console.log("\n📋 Comptes de test créés :");
    console.log("👤 Admin: admin@streaming.com / admin123");
    console.log("👤 User:  user@streaming.com / user123");
    console.log("\n📚 Bibliothèques créées :");
    console.log("🎬 Films: 2 films de test");
    console.log("📺 Séries: 1 épisode de test");
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

// Exécuter le seed si ce fichier est appelé directement
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
