# Phase 5 : Optimisation Raspberry Pi 4 (Semaine 7-8)

## 5.1 Configuration Docker Optimisée

### Dockerfile.backend

```dockerfile
# Multi-stage build pour optimiser la taille
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

# Image de production
FROM node:18-alpine AS production

# Optimisations pour ARM/RPi4
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV NODE_ENV=production

# Installation des dépendances système
RUN apk add --no-cache \
    ffmpeg \
    postgresql-client \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copie des fichiers de production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S streaming -u 1001
USER streaming

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

CMD ["node", "dist/index.js"]
```

### Dockerfile.frontend

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .
RUN npm run build

# Nginx pour servir les fichiers statiques
FROM nginx:alpine AS production

# Configuration Nginx optimisée pour RPi4
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Compression et cache
RUN gzip -9 /usr/share/nginx/html/assets/*.js
RUN gzip -9 /usr/share/nginx/html/assets/*.css

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## 5.2 Docker Compose Optimisé

### docker-compose.yml

```yaml
version: "3.8"

services:
  # Base de données PostgreSQL
  postgres:
    image: postgres:13-alpine
    container_name: streaming_postgres
    environment:
      POSTGRES_DB: streaming_app
      POSTGRES_USER: streaming_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/postgresql.conf:/etc/postgresql/postgresql.conf
    ports:
      - "5432:5432"
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
        reservations:
          memory: 256M
          cpus: "0.25"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U streaming_user -d streaming_app"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Cache Redis
  redis:
    image: redis:7-alpine
    container_name: streaming_redis
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: "0.25"
        reservations:
          memory: 64M
          cpus: "0.1"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: streaming_backend
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: streaming_user
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: streaming_app
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
      MEDIA_PATH: /media
    volumes:
      - media_storage:/media
      - hls_cache:/tmp/hls
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "1.0"
        reservations:
          memory: 512M
          cpus: "0.5"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: streaming_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: "0.25"
        reservations:
          memory: 64M
          cpus: "0.1"
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: streaming_nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - hls_cache:/var/www/hls
      - media_storage:/var/www/media
    ports:
      - "8080:80"
    depends_on:
      - backend
      - frontend
    deploy:
      resources:
        limits:
          memory: 64M
          cpus: "0.25"
        reservations:
          memory: 32M
          cpus: "0.1"
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  media_storage:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/media # Montage externe pour stockage
  hls_cache:
    driver: local
    driver_opts:
      type: tmpfs
      device: tmpfs
      o: size=1G # Cache temporaire en RAM
```

## 5.3 Configuration Nginx

### nginx.conf

```nginx
worker_processes auto;
worker_cpu_affinity auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Optimisations générales
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Cache pour les assets statiques
    map $sent_http_content_type $expires {
        default                    off;
        text/html                  epoch;
        text/css                   max;
        application/javascript     max;
        ~image/                    1M;
        ~video/                    1M;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    # Upstream pour le backend
    upstream backend {
        server backend:3001;
        keepalive 32;
    }

    # Configuration principale
    server {
        listen 80;
        server_name _;
        expires $expires;

        # Logs optimisés
        access_log /var/log/nginx/access.log combined buffer=16k flush=2m;
        error_log /var/log/nginx/error.log warn;

        # Frontend statique
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;

            # Cache pour les assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # API Backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Timeouts optimisés pour RPi4
            proxy_connect_timeout 5s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Endpoints d'authentification avec rate limiting strict
        location /api/auth/ {
            limit_req zone=auth burst=5 nodelay;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Streaming HLS
        location /hls/ {
            alias /var/www/hls/;

            # Headers pour CORS
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
            add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header Access-Control-Expose-Headers 'Content-Length,Content-Range';

            # Cache pour les segments
            location ~* \.m3u8$ {
                expires 10s;
                add_header Cache-Control "no-cache";
            }

            location ~* \.ts$ {
                expires 1h;
                add_header Cache-Control "public";
            }
        }

        # Médias statiques (thumbnails, posters)
        location /media/ {
            alias /var/www/media/;
            expires 1d;
            add_header Cache-Control "public";
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

## 5.4 Optimisations PostgreSQL

### postgresql.conf

```conf
# Optimisations pour Raspberry Pi 4 (4GB RAM)

# Connexions
max_connections = 20
superuser_reserved_connections = 3

# Mémoire
shared_buffers = 256MB                  # 25% de la RAM disponible
effective_cache_size = 1GB              # Estimation du cache OS
work_mem = 16MB                         # Pour les opérations de tri
maintenance_work_mem = 64MB             # Pour VACUUM, CREATE INDEX
temp_buffers = 8MB                      # Buffers temporaires

# WAL (Write-Ahead Logging)
wal_buffers = 16MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 10min
max_wal_size = 1GB
min_wal_size = 80MB

# Optimisations pour SSD
random_page_cost = 1.1                  # SSD = accès aléatoire rapide
effective_io_concurrency = 200          # Nombre d'I/O concurrentes

# Statistiques
default_statistics_target = 100
track_activities = on
track_counts = on
track_io_timing = on

# Logging optimisé
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000       # Log des requêtes > 1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Autovacuum optimisé
autovacuum = on
autovacuum_max_workers = 2
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
```

## 5.5 Scripts d'Optimisation

### setup-rpi.sh

```bash
#!/bin/bash
# Script d'optimisation pour Raspberry Pi 4

echo "🚀 Configuration optimisée pour Raspberry Pi 4"

# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
sudo apt install -y \
    docker.io \
    docker-compose \
    htop \
    iotop \
    git \
    curl \
    wget

# Configuration Docker
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# Optimisations système
echo "⚡ Application des optimisations système..."

# Augmentation des limites de fichiers
echo "fs.file-max = 65536" | sudo tee -a /etc/sysctl.conf
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimisations réseau
echo "net.core.somaxconn = 1024" | sudo tee -a /etc/sysctl.conf
echo "net.core.netdev_max_backlog = 5000" | sudo tee -a /etc/sysctl.conf

# Optimisations mémoire
echo "vm.swappiness = 10" | sudo tee -a /etc/sysctl.conf
echo "vm.dirty_ratio = 15" | sudo tee -a /etc/sysctl.conf
echo "vm.dirty_background_ratio = 5" | sudo tee -a /etc/sysctl.conf

# Configuration GPU (pour le décodage vidéo)
echo "gpu_mem=128" | sudo tee -a /boot/config.txt

# Création des dossiers
sudo mkdir -p /mnt/media
sudo mkdir -p /opt/streaming-app
sudo chown -R $USER:$USER /opt/streaming-app

# Application des changements
sudo sysctl -p

echo "✅ Configuration terminée. Redémarrage recommandé."
```

### monitor-rpi.sh

```bash
#!/bin/bash
# Script de monitoring pour Raspberry Pi 4

echo "📊 Monitoring Raspberry Pi 4 - Streaming App"
echo "=============================================="

# Température CPU
temp=$(cat /sys/class/thermal/thermal_zone0/temp)
temp_c=$((temp/1000))
echo "🌡️  Température CPU: ${temp_c}°C"

if [ $temp_c -gt 70 ]; then
    echo "⚠️  ATTENTION: Température élevée!"
fi

# Utilisation CPU
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
echo "💻 Utilisation CPU: ${cpu_usage}%"

# Utilisation mémoire
mem_info=$(free -h | grep "Mem:")
mem_used=$(echo $mem_info | awk '{print $3}')
mem_total=$(echo $mem_info | awk '{print $2}')
echo "🧠 Mémoire: ${mem_used}/${mem_total}"

# Utilisation disque
disk_usage=$(df -h / | tail -1 | awk '{print $5}')
echo "💾 Disque: ${disk_usage} utilisé"

# Processus FFmpeg actifs
ffmpeg_count=$(pgrep -c ffmpeg || echo "0")
echo "🎬 Streams actifs: ${ffmpeg_count}"

# Conteneurs Docker
echo ""
echo "🐳 État des conteneurs:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Logs récents si erreurs
echo ""
echo "📋 Logs récents (erreurs):"
docker logs streaming_backend --tail 5 2>/dev/null | grep -i error || echo "Aucune erreur récente"

echo ""
echo "✅ Monitoring terminé"
```

## 5.6 Configuration de Performance

### performance.config.ts

```typescript
// Configuration spécifique Raspberry Pi 4
export const RPiPerformanceConfig = {
  // Limitations matérielles
  hardware: {
    maxConcurrentStreams: 2,
    maxTranscodeQuality: "720p",
    preferredCodec: "h264",
    gpuAcceleration: false, // Désactivé pour la compatibilité
  },

  // Cache agressif
  cache: {
    thumbnails: {
      ttl: 24 * 60 * 60, // 24h
      maxSize: "100MB",
    },
    metadata: {
      ttl: 60 * 60, // 1h
      maxSize: "50MB",
    },
    hls: {
      ttl: 30 * 60, // 30min
      maxSize: "500MB",
    },
  },

  // Nettoyage automatique
  cleanup: {
    interval: 60 * 60, // 1h
    tempFiles: {
      maxAge: 2 * 60 * 60, // 2h
      path: "/tmp/hls",
    },
    logs: {
      maxAge: 7 * 24 * 60 * 60, // 7 jours
      maxSize: "100MB",
    },
  },

  // Optimisations FFmpeg
  ffmpeg: {
    preset: "veryfast",
    threads: 2, // Limité pour RPi4
    bufferSize: "2M",
    segmentTime: 10,
    hlsListSize: 0,
  },

  // Monitoring
  monitoring: {
    interval: 30, // 30s
    alerts: {
      cpuThreshold: 80,
      memoryThreshold: 85,
      temperatureThreshold: 70,
      diskThreshold: 90,
    },
  },
};
```

## 5.7 Health Checks

### health-check.js

```javascript
const http = require("http");
const fs = require("fs");

const checks = {
  // Vérification de la base de données
  async database() {
    // Implémentation de la vérification DB
    return true;
  },

  // Vérification de Redis
  async redis() {
    // Implémentation de la vérification Redis
    return true;
  },

  // Vérification de l'espace disque
  async diskSpace() {
    const stats = fs.statSync("/tmp");
    // Vérifier l'espace disponible
    return true;
  },

  // Vérification de la température
  async temperature() {
    try {
      const temp = fs.readFileSync(
        "/sys/class/thermal/thermal_zone0/temp",
        "utf8"
      );
      const tempC = parseInt(temp) / 1000;
      return tempC < 75; // Seuil de sécurité
    } catch {
      return true; // Si on ne peut pas lire, on assume que c'est OK
    }
  },
};

async function healthCheck() {
  try {
    const results = await Promise.all([
      checks.database(),
      checks.redis(),
      checks.diskSpace(),
      checks.temperature(),
    ]);

    const isHealthy = results.every((result) => result === true);

    if (isHealthy) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error("Health check failed:", error);
    process.exit(1);
  }
}

healthCheck();
```
