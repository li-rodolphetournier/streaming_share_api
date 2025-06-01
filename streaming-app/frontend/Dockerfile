# Frontend Dockerfile pour l'application de streaming
# Multi-stage build pour optimiser la taille de l'image

# Stage 1: Base avec Node.js
FROM node:18-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache git curl

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY components.json ./

# Installer les dépendances
RUN npm ci

# Stage 2: Développement
FROM base AS development

# Copier le code source
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Variables d'environnement pour le développement
ENV VITE_API_URL=http://localhost:3001/api
ENV VITE_GRAPHQL_URL=http://localhost:4000/graphql
ENV VITE_MOCK_API=false

# Exposer le port 3000 pour Vite
EXPOSE 3000

# Healthcheck pour le mode développement
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Commande de développement avec Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage 3: Build pour la production
FROM base AS builder

# Copier le code source
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Variables d'environnement pour le build
ARG VITE_API_URL=http://localhost:3001/api
ARG VITE_GRAPHQL_URL=http://localhost:4000/graphql
ARG VITE_MOCK_API=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
ENV VITE_MOCK_API=$VITE_MOCK_API

# Build de l'application
RUN npm run build

# Stage 4: Production avec Nginx
FROM nginx:alpine AS production

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Créer un script d'entrée pour gérer les variables d'environnement
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Remplacer les variables d'\''environnement dans les fichiers JS' >> /docker-entrypoint.sh && \
    echo 'find /usr/share/nginx/html -name "*.js" -exec sed -i "s|VITE_API_URL_PLACEHOLDER|${VITE_API_URL:-http://localhost:3001/api}|g" {} \;' >> /docker-entrypoint.sh && \
    echo 'find /usr/share/nginx/html -name "*.js" -exec sed -i "s|VITE_MOCK_API_PLACEHOLDER|${VITE_MOCK_API:-false}|g" {} \;' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Démarrer Nginx' >> /docker-entrypoint.sh && \
    echo 'exec "$@"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Exposer le port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Point d'entrée
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"] 