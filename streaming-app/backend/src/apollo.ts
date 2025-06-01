import "reflect-metadata";

import { ApolloGraphQLServer } from "./graphql/server";

async function startApolloServer() {
  try {
    const server = new ApolloGraphQLServer();
    const port = parseInt(process.env.APOLLO_PORT || "4000", 10);

    await server.start(port);

    // Gestion de l'arrêt propre
    process.on("SIGINT", async () => {
      console.log("\n🛑 Arrêt du serveur Apollo GraphQL...");
      await server.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n🛑 Arrêt du serveur Apollo GraphQL...");
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error(
      "❌ Erreur fatale lors du démarrage du serveur Apollo:",
      error
    );
    process.exit(1);
  }
}

// Démarrer le serveur si ce fichier est exécuté directement
if (require.main === module) {
  startApolloServer();
}

export { startApolloServer };
