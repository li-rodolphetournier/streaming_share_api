import "reflect-metadata";

import { AppDataSource } from "../config/database";

async function syncSchema() {
  try {
    console.log("🔄 Initialisation de la connexion à la base de données...");
    await AppDataSource.initialize();
    console.log("✅ Connexion établie");

    console.log("🔄 Synchronisation du schéma...");
    await AppDataSource.synchronize();
    console.log("✅ Schéma synchronisé avec succès");

    console.log("📋 Tables créées :");
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation:", error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log("✅ Connexion fermée");
    process.exit(0);
  }
}

syncSchema();
