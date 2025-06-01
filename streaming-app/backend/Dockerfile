# Stage de base avec Node.js
FROM node:18-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    ffmpeg \
    ffmpeg-dev \
    python3 \
    make \
    g++ \
    curl

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig.json ./
COPY nodemon.json ./

# Stage de développement
FROM base AS development

# Installer toutes les dépendances (dev + prod)
RUN npm install

# Copier le code source
COPY src/ ./src/

# Exposer le port
EXPOSE 3001

# Variables d'environnement par défaut
ENV NODE_ENV=development
ENV PORT=3001

# Créer les répertoires nécessaires
RUN mkdir -p /media /uploads /tmp/hls /app/logs

# Commande de développement avec hot reload
CMD ["npm", "run", "dev"]

# Stage de build pour la production
FROM base AS build

# Installer toutes les dépendances
RUN npm install

# Copier le code source
COPY src/ ./src/

# Compiler TypeScript
RUN npm run build

# Stage de production
FROM node:18-alpine AS production

# Installer les dépendances système pour la production
RUN apk add --no-cache \
    ffmpeg \
    curl \
    dumb-init

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S streaming -u 1001

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm install --only=production && npm cache clean --force

# Copier le code compilé depuis le stage de build
COPY --from=build /app/dist ./dist

# Créer les répertoires nécessaires avec les bonnes permissions
RUN mkdir -p /media /uploads /tmp/hls /app/logs && \
    chown -R streaming:nodejs /app /media /uploads /tmp/hls

# Changer vers l'utilisateur non-root
USER streaming

# Exposer le port
EXPOSE 3001

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Utiliser dumb-init pour une gestion propre des signaux
ENTRYPOINT ["dumb-init", "--"]

# Commande de production
CMD ["node", "dist/index.js"] 