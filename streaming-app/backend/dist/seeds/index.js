"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("../config/database");
const auth_service_1 = require("../services/auth.service");
const Library_1 = require("../entities/Library");
const media_service_1 = require("../services/media.service");
const User_1 = require("../entities/User");
async function seedDatabase() {
    try {
        console.log("🌱 Démarrage du seeding de la base de données...");
        await database_1.AppDataSource.initialize();
        console.log("✅ Connexion à la base de données établie");
        const authService = new auth_service_1.AuthService();
        const mediaService = new media_service_1.MediaService();
        const libraryRepository = database_1.AppDataSource.getRepository(Library_1.Library);
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        const existingUsers = await userRepository.count();
        if (existingUsers > 0) {
            console.log("⚠️  Des données existent déjà, arrêt du seeding");
            return;
        }
        console.log("👤 Création de l'utilisateur admin...");
        const admin = await authService.createAdminUser("admin@streaming.local", "admin123", "Admin", "Streaming");
        console.log("✅ Utilisateur admin créé:", admin.email);
        console.log("👤 Création de l'utilisateur normal...");
        const user = await authService.register({
            email: "user@streaming.local",
            password: "user123",
            firstName: "User",
            lastName: "Test",
        });
        console.log("✅ Utilisateur normal créé:", user.user.email);
        console.log("📚 Création des bibliothèques...");
        const movieLibrary = libraryRepository.create({
            name: "Films",
            path: "/media/movies",
            type: "movie",
            description: "Collection de films",
            owner: admin,
            isActive: true,
            autoScan: true,
            scanInterval: 24,
        });
        await libraryRepository.save(movieLibrary);
        const tvLibrary = libraryRepository.create({
            name: "Séries TV",
            path: "/media/tv",
            type: "tv",
            description: "Collection de séries télévisées",
            owner: admin,
            isActive: true,
            autoScan: true,
            scanInterval: 12,
        });
        await libraryRepository.save(tvLibrary);
        console.log("✅ Bibliothèques créées");
        console.log("🎬 Création des médias de test...");
        const testMovies = [
            {
                title: "Inception",
                originalTitle: "Inception",
                description: "Un voleur qui s'infiltre dans les rêves des gens pour voler leurs secrets.",
                filePath: "/media/movies/inception.mp4",
                thumbnailPath: "/media/thumbnails/inception_thumb.jpg",
                posterPath: "/media/posters/inception_poster.jpg",
                backdropPath: "/media/backdrops/inception_backdrop.jpg",
                type: "movie",
                libraryId: movieLibrary.id,
                metadata: {
                    duration: 8880,
                    resolution: "1920x1080",
                    codec: "h264",
                    bitrate: 5000,
                    size: 2147483648,
                    fps: 24,
                    audioCodec: "aac",
                    audioChannels: 6,
                    subtitles: ["fr", "en"],
                },
                movieInfo: {
                    year: 2010,
                    genre: ["Action", "Sci-Fi", "Thriller"],
                    rating: 8.8,
                    director: "Christopher Nolan",
                    cast: ["Leonardo DiCaprio", "Marion Cotillard", "Tom Hardy"],
                    imdbId: "tt1375666",
                    tmdbId: 27205,
                    plot: "Dom Cobb est un voleur expérimenté dans l'art périlleux de l'extraction...",
                    country: "USA",
                    language: "en",
                },
            },
            {
                title: "Interstellar",
                originalTitle: "Interstellar",
                description: "Une équipe d'explorateurs voyage à travers un trou de ver dans l'espace.",
                filePath: "/media/movies/interstellar.mp4",
                thumbnailPath: "/media/thumbnails/interstellar_thumb.jpg",
                posterPath: "/media/posters/interstellar_poster.jpg",
                backdropPath: "/media/backdrops/interstellar_backdrop.jpg",
                type: "movie",
                libraryId: movieLibrary.id,
                metadata: {
                    duration: 10140,
                    resolution: "3840x2160",
                    codec: "h265",
                    bitrate: 15000,
                    size: 8589934592,
                    fps: 24,
                    audioCodec: "dts",
                    audioChannels: 8,
                    subtitles: ["fr", "en", "es"],
                },
                movieInfo: {
                    year: 2014,
                    genre: ["Adventure", "Drama", "Sci-Fi"],
                    rating: 8.6,
                    director: "Christopher Nolan",
                    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
                    imdbId: "tt0816692",
                    tmdbId: 157336,
                    plot: "Dans un futur proche, la Terre se meurt...",
                    country: "USA",
                    language: "en",
                },
            },
            {
                title: "The Matrix",
                originalTitle: "The Matrix",
                description: "Un programmeur découvre que la réalité n'est qu'une simulation.",
                filePath: "/media/movies/matrix.mp4",
                thumbnailPath: "/media/thumbnails/matrix_thumb.jpg",
                posterPath: "/media/posters/matrix_poster.jpg",
                backdropPath: "/media/backdrops/matrix_backdrop.jpg",
                type: "movie",
                libraryId: movieLibrary.id,
                metadata: {
                    duration: 8160,
                    resolution: "1920x1080",
                    codec: "h264",
                    bitrate: 4500,
                    size: 1879048192,
                    fps: 24,
                    audioCodec: "ac3",
                    audioChannels: 6,
                    subtitles: ["fr", "en"],
                },
                movieInfo: {
                    year: 1999,
                    genre: ["Action", "Sci-Fi"],
                    rating: 8.7,
                    director: "Lana Wachowski, Lilly Wachowski",
                    cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
                    imdbId: "tt0133093",
                    tmdbId: 603,
                    plot: "Neo, un jeune informaticien, est contacté par Morpheus...",
                    country: "USA",
                    language: "en",
                },
            },
        ];
        for (const movieData of testMovies) {
            const media = await mediaService.createMedia(movieData);
            console.log(`✅ Film créé: ${media.title}`);
        }
        const testTVShows = [
            {
                title: "Breaking Bad",
                originalTitle: "Breaking Bad",
                description: "Un professeur de chimie se lance dans la fabrication de méthamphétamine.",
                filePath: "/media/tv/breaking-bad/s01e01.mp4",
                thumbnailPath: "/media/thumbnails/breaking_bad_thumb.jpg",
                posterPath: "/media/posters/breaking_bad_poster.jpg",
                backdropPath: "/media/backdrops/breaking_bad_backdrop.jpg",
                type: "tv",
                libraryId: tvLibrary.id,
                metadata: {
                    duration: 2760,
                    resolution: "1920x1080",
                    codec: "h264",
                    bitrate: 3000,
                    size: 1073741824,
                    fps: 24,
                    audioCodec: "aac",
                    audioChannels: 2,
                    subtitles: ["fr", "en"],
                },
                movieInfo: {
                    year: 2008,
                    genre: ["Crime", "Drama", "Thriller"],
                    rating: 9.5,
                    director: "Vince Gilligan",
                    cast: ["Bryan Cranston", "Aaron Paul", "Anna Gunn"],
                    imdbId: "tt0903747",
                    tmdbId: 1396,
                    plot: "Walter White, un professeur de chimie...",
                    country: "USA",
                    language: "en",
                },
            },
            {
                title: "Stranger Things",
                originalTitle: "Stranger Things",
                description: "Des événements surnaturels frappent une petite ville dans les années 80.",
                filePath: "/media/tv/stranger-things/s01e01.mp4",
                thumbnailPath: "/media/thumbnails/stranger_things_thumb.jpg",
                posterPath: "/media/posters/stranger_things_poster.jpg",
                backdropPath: "/media/backdrops/stranger_things_backdrop.jpg",
                type: "tv",
                libraryId: tvLibrary.id,
                metadata: {
                    duration: 3000,
                    resolution: "3840x2160",
                    codec: "h265",
                    bitrate: 8000,
                    size: 3221225472,
                    fps: 24,
                    audioCodec: "eac3",
                    audioChannels: 6,
                    subtitles: ["fr", "en", "es", "de"],
                },
                movieInfo: {
                    year: 2016,
                    genre: ["Drama", "Fantasy", "Horror"],
                    rating: 8.7,
                    director: "The Duffer Brothers",
                    cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"],
                    imdbId: "tt4574334",
                    tmdbId: 66732,
                    plot: "Quand un jeune garçon disparaît...",
                    country: "USA",
                    language: "en",
                },
            },
        ];
        for (const tvData of testTVShows) {
            const media = await mediaService.createMedia(tvData);
            console.log(`✅ Série créée: ${media.title}`);
        }
        console.log("🎉 Seeding terminé avec succès!");
        console.log("\n📋 Comptes créés:");
        console.log("👨‍💼 Admin: admin@streaming.local / admin123");
        console.log("👤 User: user@streaming.local / user123");
    }
    catch (error) {
        console.error("❌ Erreur lors du seeding:", error);
        throw error;
    }
    finally {
        await database_1.AppDataSource.destroy();
    }
}
if (require.main === module) {
    seedDatabase()
        .then(() => {
        console.log("✅ Seeding terminé");
        process.exit(0);
    })
        .catch((error) => {
        console.error("❌ Erreur:", error);
        process.exit(1);
    });
}
exports.default = seedDatabase;
//# sourceMappingURL=index.js.map