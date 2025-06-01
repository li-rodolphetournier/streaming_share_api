import { GraphQLContext, createGraphQLContext } from "./context";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import cors from "cors";
import express from "express";
import http from "http";
import { createGraphQLSchema } from "./schema";

export class ApolloGraphQLServer {
  private app: express.Application;
  private httpServer: http.Server;
  private apolloServer: ApolloServer<GraphQLContext> | null = null;

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
  }

  async initialize(): Promise<void> {
    try {
      // Créer le schéma GraphQL
      const schema = await createGraphQLSchema();

      // Créer le serveur Apollo
      this.apolloServer = new ApolloServer<GraphQLContext>({
        schema,
        plugins: [
          // Plugin pour gérer l'arrêt propre du serveur HTTP
          ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),

          // Plugin pour la page d'accueil en développement
          process.env.NODE_ENV === "development"
            ? ApolloServerPluginLandingPageLocalDefault({ footer: false })
            : ApolloServerPluginLandingPageLocalDefault({
                footer: false,
                embed: true,
              }),
        ],

        // Configuration pour la production
        introspection: process.env.NODE_ENV !== "production",

        // Formatage des erreurs
        formatError: (err) => {
          console.error("GraphQL Error:", err);

          // En production, ne pas exposer les détails des erreurs internes
          if (process.env.NODE_ENV === "production") {
            // Garder seulement les erreurs de validation et d'authentification
            if (
              err.message.includes("Unauthorized") ||
              err.message.includes("Validation") ||
              err.message.includes("Authentication")
            ) {
              return err;
            }

            return new Error("Erreur interne du serveur");
          }

          return err;
        },
      });

      // Démarrer Apollo Server
      await this.apolloServer.start();

      // Configuration CORS
      const corsOptions = {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      };

      // Middleware Express - IMPORTANT: L'ordre est crucial !
      this.app.use(cors(corsOptions));
      this.app.use(express.json({ limit: "10mb" })); // JSON middleware AVANT tout le reste

      // Route de santé (avant les middlewares GraphQL)
      this.app.get("/health", (req, res) => {
        res.json({
          status: "OK",
          timestamp: new Date().toISOString(),
          service: "Apollo GraphQL Server",
        });
      });

      // Route d'information
      this.app.get("/info", (req, res) => {
        res.json({
          name: "Streaming App GraphQL API",
          version: "1.0.0",
          graphql: "/graphql",
          playground:
            process.env.NODE_ENV === "development" ? "/graphql" : null,
          environment: process.env.NODE_ENV || "development",
        });
      });

      // Middleware Apollo GraphQL avec authentification intégrée
      this.app.use(
        "/graphql",
        expressMiddleware(this.apolloServer, {
          context: createGraphQLContext,
        })
      );

      console.log("🚀 Apollo Server initialisé avec succès");
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'initialisation d'Apollo Server:",
        error
      );
      throw error;
    }
  }

  async start(port: number = 4000): Promise<void> {
    try {
      await this.initialize();

      this.httpServer.listen(port, () => {
        console.log(
          `🚀 Serveur Apollo GraphQL démarré sur http://localhost:${port}/graphql`
        );
        console.log(
          `📊 Playground GraphQL disponible sur http://localhost:${port}/graphql`
        );
        console.log(
          `💚 Health check disponible sur http://localhost:${port}/health`
        );
      });
    } catch (error) {
      console.error("❌ Erreur lors du démarrage du serveur:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.apolloServer) {
        await this.apolloServer.stop();
      }

      this.httpServer.close();
      console.log("🛑 Serveur Apollo GraphQL arrêté");
    } catch (error) {
      console.error("❌ Erreur lors de l'arrêt du serveur:", error);
      throw error;
    }
  }

  getApp(): express.Application {
    return this.app;
  }

  getHttpServer(): http.Server {
    return this.httpServer;
  }
}
