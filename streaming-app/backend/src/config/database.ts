import { DataSource } from "typeorm";
import { Library } from "../entities/Library";
import { Media } from "../entities/Media";
import { MediaRating } from "../entities/MediaRating";
import { User } from "../entities/User";
import { UserPreference } from "../entities/UserPreference";
import { WatchHistory } from "../entities/WatchHistory";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  username: process.env.POSTGRES_USER || "streaming_user",
  password: process.env.POSTGRES_PASSWORD || "streaming_password_2024",
  database: process.env.POSTGRES_DB || "streaming_db",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [User, Media, Library, WatchHistory, MediaRating, UserPreference],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
  ssl: false,
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Base de données connectée avec succès");

    if (process.env.NODE_ENV === "development") {
      console.log(
        "🔄 Mode développement : synchronisation automatique activée"
      );
    }
  } catch (error) {
    console.error("❌ Erreur de connexion à la base de données:", error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.destroy();
    console.log("✅ Connexion à la base de données fermée");
  } catch (error) {
    console.error(
      "❌ Erreur lors de la fermeture de la base de données:",
      error
    );
  }
};
