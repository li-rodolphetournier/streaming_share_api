"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const database_1 = require("./config/database");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.API_PORT || process.env.PORT || 3001;
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
    optionsSuccessStatus: 200,
};
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "15") * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
    message: {
        error: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)({
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
}));
app.use((0, cors_1.default)(corsOptions));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)("combined"));
app.use(limiter);
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
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
        const { AppDataSource } = await Promise.resolve().then(() => __importStar(require("./config/database")));
        if (AppDataSource.isInitialized) {
            res.json({
                status: "OK",
                database: "Connected",
                timestamp: new Date().toISOString(),
            });
        }
        else {
            res.status(503).json({
                status: "ERROR",
                database: "Disconnected",
                timestamp: new Date().toISOString(),
            });
        }
    }
    catch (error) {
        res.status(503).json({
            status: "ERROR",
            database: "Error",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
        });
    }
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/media", media_routes_1.default);
app.get("/", (req, res) => {
    res.json({
        message: "Streaming App API",
        version: "1.0.0",
        documentation: "/api/docs",
        health: "/api/health",
    });
});
app.use((err, req, res, next) => {
    console.error("❌ Erreur serveur:", err);
    res.status(500).json({
        error: "Erreur interne du serveur",
        message: process.env.NODE_ENV === "development"
            ? err.message
            : "Une erreur est survenue",
        timestamp: new Date().toISOString(),
    });
});
app.use("*", (req, res) => {
    res.status(404).json({
        error: "Route non trouvée",
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
    });
});
const startServer = async () => {
    try {
        await (0, database_1.initializeDatabase)();
        const server = app.listen(PORT, () => {
            console.log(`🚀 Serveur démarré sur le port ${PORT}`);
            console.log(`🌐 API disponible sur http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🗄️  Database check: http://localhost:${PORT}/api/health/db`);
            if (process.env.NODE_ENV === "development") {
                console.log("🔧 Mode développement activé");
            }
        });
        const gracefulShutdown = async (signal) => {
            console.log(`\n📡 Signal ${signal} reçu, arrêt en cours...`);
            server.close(async () => {
                console.log("🔌 Serveur HTTP fermé");
                try {
                    await (0, database_1.closeDatabase)();
                    console.log("✅ Arrêt gracieux terminé");
                    process.exit(0);
                }
                catch (error) {
                    console.error("❌ Erreur lors de l'arrêt:", error);
                    process.exit(1);
                }
            });
        };
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    }
    catch (error) {
        console.error("❌ Erreur lors du démarrage du serveur:", error);
        process.exit(1);
    }
};
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=index.js.map