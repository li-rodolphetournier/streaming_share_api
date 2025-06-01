"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.initializeDatabase = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const Library_1 = require("../entities/Library");
const Media_1 = require("../entities/Media");
const MediaRating_1 = require("../entities/MediaRating");
const User_1 = require("../entities/User");
const UserPreference_1 = require("../entities/UserPreference");
const WatchHistory_1 = require("../entities/WatchHistory");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USER || "streaming_user",
    password: process.env.POSTGRES_PASSWORD || "streaming_password_2024",
    database: process.env.POSTGRES_DB || "streaming_db",
    synchronize: process.env.NODE_ENV === "development",
    logging: process.env.NODE_ENV === "development",
    entities: [User_1.User, Media_1.Media, Library_1.Library, WatchHistory_1.WatchHistory, MediaRating_1.MediaRating, UserPreference_1.UserPreference],
    migrations: ["src/migrations/*.ts"],
    subscribers: ["src/subscribers/*.ts"],
    ssl: process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false,
        }
        : false,
    extra: {
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
    },
});
const initializeDatabase = async () => {
    try {
        await exports.AppDataSource.initialize();
        console.log("✅ Base de données connectée avec succès");
        if (process.env.NODE_ENV === "development") {
            console.log("🔄 Mode développement : synchronisation automatique activée");
        }
    }
    catch (error) {
        console.error("❌ Erreur de connexion à la base de données:", error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
const closeDatabase = async () => {
    try {
        await exports.AppDataSource.destroy();
        console.log("✅ Connexion à la base de données fermée");
    }
    catch (error) {
        console.error("❌ Erreur lors de la fermeture de la base de données:", error);
    }
};
exports.closeDatabase = closeDatabase;
//# sourceMappingURL=database.js.map