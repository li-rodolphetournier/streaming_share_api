# Makefile pour Streaming App
# Commandes pour gérer Docker uniquement
# Compatible Windows PowerShell

.PHONY: help install start stop restart logs clean dev dev-all build test seed status apollo-dev apollo

# Variables
DOCKER_COMPOSE_FILE = streaming-app/docker-compose.yml
DOCKER_COMPOSE_DEV_FILE = streaming-app/docker-compose.dev.yml
BACKEND_DIR = streaming-app/backend
FRONTEND_DIR = streaming-app/frontend

# Commande par défaut
help: ## Afficher l'aide
	@echo "🎬 Streaming App - Commandes Docker disponibles:"
	@echo ""
	@echo "📦 INSTALLATION:"
	@echo "  install          Installer toutes les dépendances"
	@echo "  build            Builder toutes les images Docker"
	@echo ""
	@echo "🚀 DÉVELOPPEMENT:"
	@echo "  dev-all          Lancer TOUS les services Docker (PostgreSQL + Redis + Backend + Apollo + Frontend)"
	@echo "  dev              Lancer les services de base (PostgreSQL + Redis + Backend + Frontend)"
	@echo "  dev-db           Lancer seulement PostgreSQL et Redis"
	@echo "  dev-backend      Lancer PostgreSQL + Redis + Backend"
	@echo "  dev-apollo       Lancer PostgreSQL + Redis + Apollo GraphQL"
	@echo ""
	@echo "🏭 PRODUCTION:"
	@echo "  prod             Lancer en mode production (avec Nginx)"
	@echo "  prod-build       Builder et lancer en mode production"
	@echo ""
	@echo "🗄️  BASE DE DONNÉES:"
	@echo "  seed             Peupler la base de données avec des données de test"
	@echo "  db-reset         Réinitialiser la base de données"
	@echo "  db-backup        Sauvegarder la base de données"
	@echo "  db-restore       Restaurer la base de données"
	@echo ""
	@echo "📋 MONITORING:"
	@echo "  logs             Voir les logs de tous les services"
	@echo "  logs-backend     Voir les logs du backend uniquement"
	@echo "  logs-apollo      Voir les logs d'Apollo GraphQL"
	@echo "  logs-frontend    Voir les logs du frontend"
	@echo "  logs-db          Voir les logs de PostgreSQL"
	@echo "  status           Vérifier le statut de tous les services"
	@echo "  health           Vérifier la santé des APIs"
	@echo ""
	@echo "🧪 TESTS:"
	@echo "  test             Lancer tous les tests"
	@echo "  test-backend     Lancer les tests du backend"
	@echo "  test-frontend    Lancer les tests du frontend"
	@echo ""
	@echo "🛑 CONTRÔLE:"
	@echo "  stop             Arrêter tous les services"
	@echo "  restart          Redémarrer tous les services"
	@echo "  restart-backend  Redémarrer le backend uniquement"
	@echo "  restart-apollo   Redémarrer Apollo GraphQL uniquement"
	@echo ""
	@echo "🧹 NETTOYAGE:"
	@echo "  clean            Nettoyer tous les conteneurs et volumes"
	@echo "  clean-images     Nettoyer les images Docker"
	@echo "  clean-all        Nettoyage complet (conteneurs + volumes + images)"
	@echo ""
	@echo "🔧 UTILITAIRES:"
	@echo "  shell-backend    Ouvrir un shell dans le conteneur backend"
	@echo "  shell-apollo     Ouvrir un shell dans le conteneur Apollo"
	@echo "  shell-frontend   Ouvrir un shell dans le conteneur frontend"
	@echo "  shell-db         Ouvrir un shell PostgreSQL"
	@echo "  info             Afficher les informations du projet"
	@echo ""
	@echo "📋 Exemples d'utilisation:"
	@echo "  make install     # Installer et builder les images"
	@echo "  make dev-all     # Lancer TOUS les services (recommandé)"
	@echo "  make logs        # Voir les logs en temps réel"
	@echo "  make stop        # Arrêter tous les services"

# Installation et build
install: ## Installer toutes les dépendances et builder les images
	@echo "📦 Installation et build des images Docker..."
	@$(MAKE) build
	@echo "✅ Installation terminée!"

build: ## Builder toutes les images Docker
	@echo "🔨 Build des images Docker..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml build --no-cache
	@echo "✅ Build terminé!"

# Développement avec Docker
dev-all: ## Lancer TOUS les services Docker (PostgreSQL + Redis + Backend + Apollo + Frontend)
	@echo "🚀 Démarrage COMPLET en mode développement Docker..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml up -d
	@echo "⏳ Attente du démarrage des services..."
	@powershell -Command "Start-Sleep -Seconds 15"
	@$(MAKE) seed
	@echo "✅ TOUS les services Docker sont démarrés!"
	@echo ""
	@echo "🌐 URLs disponibles:"
	@echo "  Frontend:        http://localhost:3000"
	@echo "  Backend Express: http://localhost:3001"
	@echo "  Apollo GraphQL:  http://localhost:4000/graphql"
	@echo "  GraphQL Playground: http://localhost:4000/graphql"
	@echo "  PostgreSQL:      localhost:5432"
	@echo "  Redis:           localhost:6379"
	@echo ""
	@echo "📋 Commandes utiles:"
	@echo "  make logs        # Voir les logs"
	@echo "  make status      # Vérifier le statut"
	@echo "  make stop        # Arrêter tous les services"

dev: ## Lancer les services de base (PostgreSQL + Redis + Backend + Frontend)
	@echo "🚀 Démarrage en mode développement Docker..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml up -d postgres redis backend frontend
	@echo "⏳ Attente du démarrage des services..."
	@powershell -Command "Start-Sleep -Seconds 15"
	@$(MAKE) seed
	@echo "✅ Services de développement démarrés!"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:3001"

dev-db: ## Lancer seulement PostgreSQL et Redis
	@echo "🐳 Démarrage des services de base de données..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml up -d postgres redis
	@echo "✅ Services de base de données démarrés!"

dev-backend: ## Lancer PostgreSQL + Redis + Backend
	@echo "🔧 Démarrage PostgreSQL + Redis + Backend..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml up -d postgres redis backend
	@echo "⏳ Attente du démarrage..."
	@powershell -Command "Start-Sleep -Seconds 10"
	@$(MAKE) seed
	@echo "✅ Backend démarré!"

dev-apollo: ## Lancer PostgreSQL + Redis + Apollo GraphQL
	@echo "🚀 Démarrage PostgreSQL + Redis + Apollo GraphQL..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml up -d postgres redis apollo
	@echo "⏳ Attente du démarrage..."
	@powershell -Command "Start-Sleep -Seconds 10"
	@echo "✅ Apollo GraphQL démarré!"
	@echo "🌐 GraphQL Playground: http://localhost:4000/graphql"

# Production
prod: ## Lancer en mode production
	@echo "🏭 Démarrage en mode production..."
	cd streaming-app && docker-compose up -d
	@echo "✅ Services de production démarrés!"
	@echo "🌐 Application: http://localhost:8081"

prod-build: ## Builder et lancer en mode production
	@echo "🏭 Build et démarrage en mode production..."
	cd streaming-app && docker-compose build --no-cache
	cd streaming-app && docker-compose up -d
	@echo "✅ Services de production démarrés!"

# Base de données
seed: ## Peupler la base de données avec des données de test
	@echo "🌱 Peuplement de la base de données..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec backend npm run seed
	@echo "✅ Base de données peuplée!"

db-reset: ## Réinitialiser la base de données
	@echo "🗄️  Réinitialisation de la base de données..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec postgres psql -U streaming_user -d streaming_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@$(MAKE) seed
	@echo "✅ Base de données réinitialisée!"

db-backup: ## Sauvegarder la base de données
	@echo "💾 Sauvegarde de la base de données..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U streaming_user streaming_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Sauvegarde terminée!"

db-restore: ## Restaurer la base de données (spécifier BACKUP_FILE=fichier.sql)
	@echo "📥 Restauration de la base de données..."
	@if [ -z "$(BACKUP_FILE)" ]; then echo "❌ Spécifiez BACKUP_FILE=fichier.sql"; exit 1; fi
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec -T postgres psql -U streaming_user -d streaming_db < $(BACKUP_FILE)
	@echo "✅ Restauration terminée!"

# Logs et monitoring
logs: ## Voir les logs de tous les services
	@echo "📋 Logs des services Docker:"
	cd streaming-app && docker-compose -f docker-compose.dev.yml logs -f

logs-backend: ## Voir les logs du backend uniquement
	@echo "📋 Logs du backend:"
	cd streaming-app && docker-compose -f docker-compose.dev.yml logs -f backend

logs-apollo: ## Voir les logs d'Apollo GraphQL
	@echo "📋 Logs d'Apollo GraphQL:"
	cd streaming-app && docker-compose -f docker-compose.dev.yml logs -f apollo

logs-frontend: ## Voir les logs du frontend
	@echo "📋 Logs du frontend:"
	cd streaming-app && docker-compose -f docker-compose.dev.yml logs -f frontend

logs-db: ## Voir les logs de PostgreSQL
	@echo "📋 Logs de PostgreSQL:"
	cd streaming-app && docker-compose -f docker-compose.dev.yml logs -f postgres

# Status et santé
status: ## Vérifier le statut de tous les services
	@echo "📊 Statut des services Docker:"
	cd streaming-app && docker-compose -f docker-compose.dev.yml ps

health: ## Vérifier la santé des APIs
	@echo "🏥 Vérification de la santé des APIs..."
	@echo "Backend Express:"
	@powershell -Command "try { Invoke-RestMethod -Uri 'http://localhost:3001/api/health' } catch { Write-Host '❌ Backend Express non accessible' }"
	@echo ""
	@echo "Apollo GraphQL:"
	@powershell -Command "try { Invoke-RestMethod -Uri 'http://localhost:4000/health' } catch { Write-Host '❌ Apollo GraphQL non accessible' }"

# Tests
test: ## Lancer tous les tests
	@echo "🧪 Lancement des tests..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec backend npm test
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec frontend npm test

test-backend: ## Lancer les tests du backend
	@echo "🧪 Tests backend..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec backend npm test

test-frontend: ## Lancer les tests du frontend
	@echo "🧪 Tests frontend..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec frontend npm test

# Contrôle des services
stop: ## Arrêter tous les services
	@echo "🛑 Arrêt de tous les services Docker..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml down
	cd streaming-app && docker-compose down
	@echo "✅ Tous les services arrêtés!"

restart: ## Redémarrer tous les services
	@$(MAKE) stop
	@$(MAKE) dev-all

restart-backend: ## Redémarrer le backend uniquement
	@echo "🔄 Redémarrage du backend..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml restart backend
	@echo "✅ Backend redémarré!"

restart-apollo: ## Redémarrer Apollo GraphQL uniquement
	@echo "🔄 Redémarrage d'Apollo GraphQL..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml restart apollo
	@echo "✅ Apollo GraphQL redémarré!"

# Nettoyage
clean: ## Nettoyer tous les conteneurs et volumes
	@echo "🧹 Nettoyage des conteneurs et volumes..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml down -v
	cd streaming-app && docker-compose down -v
	docker container prune -f
	docker volume prune -f
	@echo "✅ Nettoyage terminé!"

clean-images: ## Nettoyer les images Docker
	@echo "🧹 Nettoyage des images Docker..."
	docker image prune -f
	docker rmi $(shell docker images -f "dangling=true" -q) 2>/dev/null || true
	@echo "✅ Images nettoyées!"

clean-all: ## Nettoyage complet (conteneurs + volumes + images)
	@echo "🧹 Nettoyage complet..."
	@$(MAKE) clean
	@$(MAKE) clean-images
	docker system prune -f
	@echo "✅ Nettoyage complet terminé!"

# Utilitaires
shell-backend: ## Ouvrir un shell dans le conteneur backend
	@echo "🐚 Shell backend..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec backend /bin/bash

shell-apollo: ## Ouvrir un shell dans le conteneur Apollo
	@echo "🐚 Shell Apollo..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec apollo /bin/bash

shell-frontend: ## Ouvrir un shell dans le conteneur frontend
	@echo "🐚 Shell frontend..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec frontend /bin/bash

shell-db: ## Ouvrir un shell PostgreSQL
	@echo "🐚 Shell PostgreSQL..."
	cd streaming-app && docker-compose -f docker-compose.dev.yml exec postgres psql -U streaming_user -d streaming_db

# Informations
info: ## Afficher les informations du projet
	@echo "📋 Informations du projet:"
	@echo "Projet: Streaming App"
	@echo "Architecture: Microservices avec Docker"
	@echo "Backend: Node.js + TypeScript + TypeORM + PostgreSQL"
	@echo "GraphQL: Apollo Server + type-graphql"
	@echo "Frontend: React + Vite + TypeScript + TailwindCSS + Shadcn/ui"
	@echo "Base de données: PostgreSQL"
	@echo "Cache: Redis"
	@echo "Conteneurisation: Docker + Docker Compose"
	@echo ""
	@echo "🔗 URLs de développement:"
	@echo "Frontend:           http://localhost:3000"
	@echo "Backend Express:    http://localhost:3001"
	@echo "Apollo GraphQL:     http://localhost:4000/graphql"
	@echo "GraphQL Playground: http://localhost:4000/graphql"
	@echo "API Health:         http://localhost:3001/api/health"
	@echo "Apollo Health:      http://localhost:4000/health"
	@echo "PostgreSQL:         localhost:5432"
	@echo "Redis:              localhost:6379"
	@echo ""
	@echo "🔗 URLs de production:"
	@echo "Application:        http://localhost:8081"
	@echo ""
	@echo "👤 Comptes de test:"
	@echo "Admin: admin@streaming.com / admin123"
	@echo "User: user@streaming.com / user123" 