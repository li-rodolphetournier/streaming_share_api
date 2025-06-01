-- Script d'initialisation de la base de données streaming
-- Créé automatiquement lors du premier démarrage de PostgreSQL

-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Créer un utilisateur pour l'application (si pas déjà créé par les variables d'environnement)
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'streaming_user') THEN
--         CREATE USER streaming_user WITH PASSWORD 'streaming_password_2024';
--     END IF;
-- END
-- $$;

-- Accorder les privilèges nécessaires
GRANT ALL PRIVILEGES ON DATABASE streaming_db TO streaming_user;
GRANT ALL ON SCHEMA public TO streaming_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO streaming_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO streaming_user;

-- Créer des index pour améliorer les performances de recherche
-- Ces index seront créés après que TypeORM ait créé les tables

-- Configuration pour améliorer les performances
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '128MB';
ALTER SYSTEM SET effective_cache_size = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '32MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '4MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Recharger la configuration
SELECT pg_reload_conf();

-- Message de confirmation
\echo 'Base de données streaming_db initialisée avec succès!'; 