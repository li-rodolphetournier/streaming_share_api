import "reflect-metadata";

import { closeDatabase, initializeDatabase } from "./config/database";

import authRoutes from "./routes/auth.routes";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mediaRoutes from "./routes/media.routes";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// Import des routes



// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || process.env.PORT || 3001;

// Configuration CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Configuration du rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "15") * 60 * 1000, // minutes en ms
  max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  message: {
    error: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares globaux
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        mediaSrc: ["'self'", "blob:"],
      },
    },
  })
);

app.use(cors(corsOptions));
app.use(compression());
app.use(morgan("combined"));
app.use(limiter);

// Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes de santé
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
  });
});

app.get("/api/health/db", async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    const { AppDataSource } = await import("./config/database");

    if (AppDataSource.isInitialized) {
      res.json({
        status: "OK",
        database: "Connected",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "ERROR",
        database: "Disconnected",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      database: "Error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/media", mediaRoutes);

// Route par défaut
app.get("/", (req, res) => {
  res.json({
    message: "Streaming App API",
    version: "1.0.0",
    documentation: "/api/docs",
    health: "/api/health",
  });
});

// Middleware de gestion d'erreurs
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("❌ Erreur serveur:", err);

    res.status(500).json({
      error: "Erreur interne du serveur",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Une erreur est survenue",
      timestamp: new Date().toISOString(),
    });
  }
);

// Route 404
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route non trouvée",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Fonction de démarrage du serveur
const startServer = async (): Promise<void> => {
  try {
    // Initialiser la base de données
    await initializeDatabase();

    // Démarrer le serveur
    const server = app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`🌐 API disponible sur http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Database check: http://localhost:${PORT}/api/health/db`);

      if (process.env.NODE_ENV === "development") {
        console.log("🔧 Mode développement activé");
      }
    });

    // Gestion de l'arrêt gracieux
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📡 Signal ${signal} reçu, arrêt en cours...`);

      server.close(async () => {
        console.log("🔌 Serveur HTTP fermé");

        try {
          await closeDatabase();
          console.log("✅ Arrêt gracieux terminé");
          process.exit(0);
        } catch (error) {
          console.error("❌ Erreur lors de l'arrêt:", error);
          process.exit(1);
        }
      });
    };

    // Écouter les signaux d'arrêt
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
};

// Démarrer le serveur si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
}

export default app;
