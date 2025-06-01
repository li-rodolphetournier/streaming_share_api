# Phase 6 : Déploiement & Monitoring (Semaine 10-11)

## 6.1 Script de Déploiement Automatisé

### deploy.sh

```bash
#!/bin/bash
# Script de déploiement automatisé pour Raspberry Pi 4

set -e  # Arrêt en cas d'erreur

# Configuration
APP_NAME="streaming-app"
APP_DIR="/opt/${APP_NAME}"
BACKUP_DIR="/opt/backups"
LOG_FILE="/var/log/${APP_NAME}-deploy.log"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Vérifications préalables
check_requirements() {
    log "🔍 Vérification des prérequis..."

    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
    fi

    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose n'est pas installé"
    fi

    # Vérifier l'espace disque (minimum 2GB)
    available_space=$(df / | tail -1 | awk '{print $4}')
    if [ $available_space -lt 2097152 ]; then
        error "Espace disque insuffisant (minimum 2GB requis)"
    fi

    # Vérifier la température CPU
    temp=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo "0")
    temp_c=$((temp/1000))
    if [ $temp_c -gt 75 ]; then
        warning "Température CPU élevée: ${temp_c}°C"
    fi

    success "Prérequis validés"
}

# Sauvegarde de l'installation existante
backup_existing() {
    if [ -d "$APP_DIR" ]; then
        log "💾 Sauvegarde de l'installation existante..."

        backup_name="${APP_NAME}-backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p $BACKUP_DIR

        # Sauvegarde de la base de données
        docker exec streaming_postgres pg_dump -U streaming_user streaming_app > "${BACKUP_DIR}/${backup_name}-db.sql" 2>/dev/null || true

        # Sauvegarde des volumes
        docker run --rm -v streaming_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/${backup_name}-postgres.tar.gz -C /data .
        docker run --rm -v streaming_redis_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/${backup_name}-redis.tar.gz -C /data .

        # Sauvegarde de la configuration
        cp -r $APP_DIR "${BACKUP_DIR}/${backup_name}-config"

        success "Sauvegarde créée: $backup_name"
    fi
}

# Arrêt des services existants
stop_services() {
    log "🛑 Arrêt des services existants..."

    cd $APP_DIR 2>/dev/null || return 0
    docker-compose down --remove-orphans 2>/dev/null || true

    success "Services arrêtés"
}

# Déploiement de la nouvelle version
deploy_application() {
    log "🚀 Déploiement de l'application..."

    # Création du répertoire d'application
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR

    # Copie des fichiers
    cp -r ./* $APP_DIR/
    cd $APP_DIR

    # Génération des secrets
    if [ ! -f .env ]; then
        log "🔐 Génération des secrets..."
        cat > .env << EOF
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)
REDIS_PASSWORD=$(openssl rand -base64 32)
NODE_ENV=production
EOF
    fi

    # Construction des images
    log "🏗️ Construction des images Docker..."
    docker-compose build --no-cache

    # Démarrage des services
    log "▶️ Démarrage des services..."
    docker-compose up -d

    success "Application déployée"
}

# Vérification de la santé des services
health_check() {
    log "🏥 Vérification de la santé des services..."

    # Attendre que les services démarrent
    sleep 30

    # Vérifier PostgreSQL
    if ! docker exec streaming_postgres pg_isready -U streaming_user -d streaming_app &>/dev/null; then
        error "PostgreSQL n'est pas prêt"
    fi

    # Vérifier Redis
    if ! docker exec streaming_redis redis-cli ping &>/dev/null; then
        error "Redis n'est pas prêt"
    fi

    # Vérifier le backend
    if ! curl -f http://localhost:3001/health &>/dev/null; then
        error "Backend n'est pas accessible"
    fi

    # Vérifier le frontend
    if ! curl -f http://localhost:80 &>/dev/null; then
        error "Frontend n'est pas accessible"
    fi

    success "Tous les services sont opérationnels"
}

# Migration de la base de données
run_migrations() {
    log "🗃️ Exécution des migrations..."

    docker exec streaming_backend npm run migration:run || error "Échec des migrations"

    success "Migrations terminées"
}

# Configuration du monitoring
setup_monitoring() {
    log "📊 Configuration du monitoring..."

    # Installation de Prometheus Node Exporter
    if ! systemctl is-active --quiet node_exporter; then
        wget -q https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-armv7.tar.gz
        tar xzf node_exporter-1.6.1.linux-armv7.tar.gz
        sudo cp node_exporter-1.6.1.linux-armv7/node_exporter /usr/local/bin/
        rm -rf node_exporter-1.6.1.linux-armv7*

        # Service systemd
        sudo tee /etc/systemd/system/node_exporter.service > /dev/null << EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=nobody
Group=nobody
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

        sudo systemctl daemon-reload
        sudo systemctl enable node_exporter
        sudo systemctl start node_exporter
    fi

    # Configuration des alertes
    cp monitoring/alerts.sh /usr/local/bin/streaming-alerts
    chmod +x /usr/local/bin/streaming-alerts

    # Cron job pour les alertes
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/streaming-alerts") | crontab -

    success "Monitoring configuré"
}

# Nettoyage post-déploiement
cleanup() {
    log "🧹 Nettoyage..."

    # Suppression des images inutilisées
    docker image prune -f

    # Nettoyage des logs anciens
    find /var/log -name "*.log" -mtime +7 -delete 2>/dev/null || true

    # Nettoyage du cache HLS ancien
    find /tmp/hls -type f -mtime +1 -delete 2>/dev/null || true

    success "Nettoyage terminé"
}

# Fonction principale
main() {
    log "🎬 Début du déploiement de $APP_NAME"

    check_requirements
    backup_existing
    stop_services
    deploy_application
    run_migrations
    health_check
    setup_monitoring
    cleanup

    success "🎉 Déploiement terminé avec succès!"
    log "📱 Application accessible sur: http://$(hostname -I | awk '{print $1}')"
    log "📊 Monitoring: http://$(hostname -I | awk '{print $1}'):9100/metrics"
}

# Gestion des signaux
trap 'error "Déploiement interrompu"' INT TERM

# Exécution
main "$@"
```

## 6.2 Monitoring et Alertes

### monitoring/system-monitor.sh

```bash
#!/bin/bash
# Monitoring système pour Raspberry Pi 4

ALERT_EMAIL="admin@streaming.local"
WEBHOOK_URL=""  # URL Slack/Discord si configuré
LOG_FILE="/var/log/streaming-monitor.log"

# Seuils d'alerte
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
TEMP_THRESHOLD=70
LOAD_THRESHOLD=3.0

# Fonction d'envoi d'alerte
send_alert() {
    local severity=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[$timestamp] [$severity] $message" >> $LOG_FILE

    # Envoi par email si configuré
    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "[$severity] Streaming App Alert" $ALERT_EMAIL
    fi

    # Envoi webhook si configuré
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"[$severity] $message\"}" \
            $WEBHOOK_URL 2>/dev/null
    fi
}

# Vérification CPU
check_cpu() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1)
    cpu_usage=${cpu_usage%.*}  # Conversion en entier

    if [ $cpu_usage -gt $CPU_THRESHOLD ]; then
        send_alert "WARNING" "Utilisation CPU élevée: ${cpu_usage}%"
    fi
}

# Vérification mémoire
check_memory() {
    local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')

    if [ $memory_usage -gt $MEMORY_THRESHOLD ]; then
        send_alert "WARNING" "Utilisation mémoire élevée: ${memory_usage}%"
    fi
}

# Vérification disque
check_disk() {
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)

    if [ $disk_usage -gt $DISK_THRESHOLD ]; then
        send_alert "CRITICAL" "Espace disque critique: ${disk_usage}%"
    fi
}

# Vérification température
check_temperature() {
    local temp=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo "0")
    local temp_c=$((temp/1000))

    if [ $temp_c -gt $TEMP_THRESHOLD ]; then
        send_alert "WARNING" "Température CPU élevée: ${temp_c}°C"
    fi
}

# Vérification charge système
check_load() {
    local load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | cut -d',' -f1)
    local load_int=$(echo "$load * 100" | bc | cut -d'.' -f1)
    local threshold_int=$(echo "$LOAD_THRESHOLD * 100" | bc | cut -d'.' -f1)

    if [ $load_int -gt $threshold_int ]; then
        send_alert "WARNING" "Charge système élevée: $load"
    fi
}

# Vérification des services Docker
check_docker_services() {
    local services=("streaming_postgres" "streaming_redis" "streaming_backend" "streaming_frontend")

    for service in "${services[@]}"; do
        if ! docker ps --format "table {{.Names}}" | grep -q "^$service$"; then
            send_alert "CRITICAL" "Service Docker arrêté: $service"
        fi
    done
}

# Vérification des processus FFmpeg
check_ffmpeg_processes() {
    local ffmpeg_count=$(pgrep -c ffmpeg || echo "0")

    if [ $ffmpeg_count -gt 3 ]; then
        send_alert "WARNING" "Trop de processus FFmpeg actifs: $ffmpeg_count"
    fi
}

# Vérification de l'espace HLS
check_hls_cache() {
    local hls_size=$(du -sm /tmp/hls 2>/dev/null | cut -f1 || echo "0")

    if [ $hls_size -gt 1000 ]; then  # Plus de 1GB
        send_alert "WARNING" "Cache HLS volumineux: ${hls_size}MB"
        # Nettoyage automatique
        find /tmp/hls -type f -mtime +0.5 -delete 2>/dev/null
    fi
}

# Vérification de la connectivité réseau
check_network() {
    if ! ping -c 1 8.8.8.8 &> /dev/null; then
        send_alert "WARNING" "Connectivité réseau dégradée"
    fi
}

# Rapport de santé complet
generate_health_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local temp=$(cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo "0")
    local temp_c=$((temp/1000))
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local disk_usage=$(df / | tail -1 | awk '{print $5}')
    local load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | cut -d',' -f1)
    local ffmpeg_count=$(pgrep -c ffmpeg || echo "0")

    cat > /tmp/health-report.json << EOF
{
    "timestamp": "$timestamp",
    "system": {
        "temperature": ${temp_c},
        "cpu_usage": "${cpu_usage}",
        "memory_usage": ${memory_usage},
        "disk_usage": "${disk_usage}",
        "load_average": ${load},
        "active_streams": ${ffmpeg_count}
    },
    "services": {
        "postgres": "$(docker ps --filter name=streaming_postgres --format '{{.Status}}' | head -1)",
        "redis": "$(docker ps --filter name=streaming_redis --format '{{.Status}}' | head -1)",
        "backend": "$(docker ps --filter name=streaming_backend --format '{{.Status}}' | head -1)",
        "frontend": "$(docker ps --filter name=streaming_frontend --format '{{.Status}}' | head -1)"
    }
}
EOF
}

# Fonction principale
main() {
    check_cpu
    check_memory
    check_disk
    check_temperature
    check_load
    check_docker_services
    check_ffmpeg_processes
    check_hls_cache
    check_network
    generate_health_report
}

# Exécution
main "$@"
```

### monitoring/performance-dashboard.html

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Streaming App - Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          sans-serif;
        margin: 0;
        padding: 20px;
        background: #f5f5f5;
      }
      .dashboard {
        max-width: 1200px;
        margin: 0 auto;
      }
      .header {
        background: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }
      .metric-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .metric-value {
        font-size: 2em;
        font-weight: bold;
        margin: 10px 0;
      }
      .metric-label {
        color: #666;
        font-size: 0.9em;
      }
      .status-ok {
        color: #28a745;
      }
      .status-warning {
        color: #ffc107;
      }
      .status-critical {
        color: #dc3545;
      }
      .chart-container {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }
      .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }
      .service-card {
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #28a745;
      }
      .service-card.warning {
        border-left-color: #ffc107;
      }
      .service-card.critical {
        border-left-color: #dc3545;
      }
    </style>
  </head>
  <body>
    <div class="dashboard">
      <div class="header">
        <h1>🎬 Streaming App - Dashboard</h1>
        <p>Monitoring en temps réel - Raspberry Pi 4</p>
        <p id="last-update">
          Dernière mise à jour: <span id="timestamp">-</span>
        </p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Température CPU</div>
          <div class="metric-value" id="temperature">-°C</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Utilisation CPU</div>
          <div class="metric-value" id="cpu-usage">-%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Utilisation Mémoire</div>
          <div class="metric-value" id="memory-usage">-%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Espace Disque</div>
          <div class="metric-value" id="disk-usage">-%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Streams Actifs</div>
          <div class="metric-value" id="active-streams">-</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Charge Système</div>
          <div class="metric-value" id="load-average">-</div>
        </div>
      </div>

      <div class="chart-container">
        <h3>Historique des Performances</h3>
        <canvas id="performance-chart" width="400" height="200"></canvas>
      </div>

      <div class="chart-container">
        <h3>État des Services</h3>
        <div class="services-grid" id="services-grid">
          <!-- Services seront ajoutés dynamiquement -->
        </div>
      </div>
    </div>

    <script>
      // Configuration du graphique
      const ctx = document.getElementById("performance-chart").getContext("2d");
      const chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "CPU (%)",
              data: [],
              borderColor: "rgb(255, 99, 132)",
              backgroundColor: "rgba(255, 99, 132, 0.1)",
              tension: 0.1,
            },
            {
              label: "Mémoire (%)",
              data: [],
              borderColor: "rgb(54, 162, 235)",
              backgroundColor: "rgba(54, 162, 235, 0.1)",
              tension: 0.1,
            },
            {
              label: "Température (°C)",
              data: [],
              borderColor: "rgb(255, 205, 86)",
              backgroundColor: "rgba(255, 205, 86, 0.1)",
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
            },
          },
          plugins: {
            legend: {
              position: "top",
            },
          },
        },
      });

      // Fonction de mise à jour des données
      async function updateDashboard() {
        try {
          const response = await fetch("/tmp/health-report.json");
          const data = await response.json();

          // Mise à jour des métriques
          document.getElementById("timestamp").textContent = data.timestamp;
          document.getElementById("temperature").textContent =
            data.system.temperature + "°C";
          document.getElementById("cpu-usage").textContent =
            data.system.cpu_usage;
          document.getElementById("memory-usage").textContent =
            data.system.memory_usage + "%";
          document.getElementById("disk-usage").textContent =
            data.system.disk_usage;
          document.getElementById("active-streams").textContent =
            data.system.active_streams;
          document.getElementById("load-average").textContent =
            data.system.load_average;

          // Mise à jour du graphique
          const now = new Date().toLocaleTimeString();
          chart.data.labels.push(now);
          chart.data.datasets[0].data.push(parseFloat(data.system.cpu_usage));
          chart.data.datasets[1].data.push(data.system.memory_usage);
          chart.data.datasets[2].data.push(data.system.temperature);

          // Limiter à 20 points
          if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets.forEach((dataset) => dataset.data.shift());
          }
          chart.update();

          // Mise à jour des services
          updateServices(data.services);

          // Mise à jour des couleurs selon les seuils
          updateMetricColors(data.system);
        } catch (error) {
          console.error("Erreur lors de la mise à jour:", error);
        }
      }

      function updateServices(services) {
        const grid = document.getElementById("services-grid");
        grid.innerHTML = "";

        Object.entries(services).forEach(([name, status]) => {
          const card = document.createElement("div");
          card.className = "service-card";

          if (status.includes("Up")) {
            card.classList.add("ok");
          } else {
            card.classList.add("critical");
          }

          card.innerHTML = `
                    <h4>${name}</h4>
                    <p>${status || "Arrêté"}</p>
                `;

          grid.appendChild(card);
        });
      }

      function updateMetricColors(system) {
        // Température
        const tempElement = document.getElementById("temperature");
        tempElement.className = "metric-value";
        if (system.temperature > 70)
          tempElement.classList.add("status-critical");
        else if (system.temperature > 60)
          tempElement.classList.add("status-warning");
        else tempElement.classList.add("status-ok");

        // CPU
        const cpuElement = document.getElementById("cpu-usage");
        cpuElement.className = "metric-value";
        const cpuValue = parseFloat(system.cpu_usage);
        if (cpuValue > 80) cpuElement.classList.add("status-critical");
        else if (cpuValue > 60) cpuElement.classList.add("status-warning");
        else cpuElement.classList.add("status-ok");

        // Mémoire
        const memElement = document.getElementById("memory-usage");
        memElement.className = "metric-value";
        if (system.memory_usage > 85)
          memElement.classList.add("status-critical");
        else if (system.memory_usage > 70)
          memElement.classList.add("status-warning");
        else memElement.classList.add("status-ok");
      }

      // Mise à jour toutes les 30 secondes
      setInterval(updateDashboard, 30000);

      // Première mise à jour
      updateDashboard();
    </script>
  </body>
</html>
```

## 6.3 Sauvegarde Automatisée

### backup/backup-script.sh

```bash
#!/bin/bash
# Script de sauvegarde automatisée

BACKUP_DIR="/opt/backups"
RETENTION_DAYS=7
S3_BUCKET=""  # Optionnel: bucket S3 pour sauvegarde externe

# Création du répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Nom de la sauvegarde avec timestamp
BACKUP_NAME="streaming-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "🗄️ Début de la sauvegarde: $BACKUP_NAME"

# Sauvegarde de la base de données
echo "📊 Sauvegarde de la base de données..."
docker exec streaming_postgres pg_dump -U streaming_user -d streaming_app > "$BACKUP_PATH-database.sql"

# Sauvegarde des volumes Docker
echo "💾 Sauvegarde des volumes..."
docker run --rm -v streaming_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/$BACKUP_NAME-postgres-data.tar.gz -C /data .
docker run --rm -v streaming_redis_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/$BACKUP_NAME-redis-data.tar.gz -C /data .

# Sauvegarde de la configuration
echo "⚙️ Sauvegarde de la configuration..."
tar czf "$BACKUP_PATH-config.tar.gz" -C /opt streaming-app

# Sauvegarde des médias (métadonnées uniquement, pas les fichiers vidéo)
echo "🎬 Sauvegarde des métadonnées médias..."
find /mnt/media -name "*.jpg" -o -name "*.png" -o -name "*.json" | tar czf "$BACKUP_PATH-media-metadata.tar.gz" -T -

# Compression finale
echo "🗜️ Compression finale..."
tar czf "$BACKUP_PATH.tar.gz" "$BACKUP_PATH"*
rm "$BACKUP_PATH"*

# Upload vers S3 si configuré
if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    echo "☁️ Upload vers S3..."
    aws s3 cp "$BACKUP_PATH.tar.gz" "s3://$S3_BUCKET/backups/"
fi

# Nettoyage des anciennes sauvegardes
echo "🧹 Nettoyage des anciennes sauvegardes..."
find $BACKUP_DIR -name "streaming-backup-*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Sauvegarde terminée: $BACKUP_PATH.tar.gz"
```

## 6.4 Restauration

### restore/restore-script.sh

```bash
#!/bin/bash
# Script de restauration

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    exit 1
fi

BACKUP_FILE=$1
RESTORE_DIR="/tmp/restore-$(date +%s)"

echo "🔄 Début de la restauration depuis: $BACKUP_FILE"

# Vérification du fichier de sauvegarde
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier de sauvegarde introuvable: $BACKUP_FILE"
    exit 1
fi

# Extraction de la sauvegarde
echo "📦 Extraction de la sauvegarde..."
mkdir -p $RESTORE_DIR
tar xzf "$BACKUP_FILE" -C $RESTORE_DIR

# Arrêt des services
echo "🛑 Arrêt des services..."
cd /opt/streaming-app
docker-compose down

# Restauration de la base de données
echo "📊 Restauration de la base de données..."
docker-compose up -d postgres
sleep 10

# Suppression de la base existante et recréation
docker exec streaming_postgres dropdb -U streaming_user streaming_app 2>/dev/null || true
docker exec streaming_postgres createdb -U streaming_user streaming_app

# Import des données
docker exec -i streaming_postgres psql -U streaming_user -d streaming_app < $RESTORE_DIR/*-database.sql

# Restauration des volumes
echo "💾 Restauration des volumes..."
docker run --rm -v streaming_postgres_data:/data -v $RESTORE_DIR:/backup alpine tar xzf /backup/*-postgres-data.tar.gz -C /data
docker run --rm -v streaming_redis_data:/data -v $RESTORE_DIR:/backup alpine tar xzf /backup/*-redis-data.tar.gz -C /data

# Restauration de la configuration
echo "⚙️ Restauration de la configuration..."
tar xzf $RESTORE_DIR/*-config.tar.gz -C /opt

# Restauration des métadonnées médias
echo "🎬 Restauration des métadonnées médias..."
tar xzf $RESTORE_DIR/*-media-metadata.tar.gz -C /

# Redémarrage des services
echo "▶️ Redémarrage des services..."
docker-compose up -d

# Nettoyage
rm -rf $RESTORE_DIR

echo "✅ Restauration terminée"
```

## 6.5 Mise à Jour Automatisée

### update/update-script.sh

```bash
#!/bin/bash
# Script de mise à jour automatisée

REPO_URL="https://github.com/user/streaming-app.git"
APP_DIR="/opt/streaming-app"
BACKUP_DIR="/opt/backups"

echo "🔄 Début de la mise à jour..."

# Sauvegarde avant mise à jour
echo "💾 Sauvegarde préventive..."
/opt/streaming-app/backup/backup-script.sh

# Récupération de la dernière version
echo "📥 Téléchargement de la dernière version..."
cd /tmp
git clone $REPO_URL streaming-app-update
cd streaming-app-update

# Vérification de la version
NEW_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "latest")
CURRENT_VERSION=$(cd $APP_DIR && git describe --tags --abbrev=0 2>/dev/null || echo "unknown")

echo "Version actuelle: $CURRENT_VERSION"
echo "Nouvelle version: $NEW_VERSION"

if [ "$NEW_VERSION" = "$CURRENT_VERSION" ]; then
    echo "✅ Déjà à jour"
    exit 0
fi

# Arrêt des services
echo "🛑 Arrêt des services..."
cd $APP_DIR
docker-compose down

# Sauvegarde de la configuration actuelle
cp .env /tmp/env-backup 2>/dev/null || true

# Mise à jour des fichiers
echo "📁 Mise à jour des fichiers..."
rsync -av --exclude='.env' --exclude='data/' /tmp/streaming-app-update/ $APP_DIR/

# Restauration de la configuration
cp /tmp/env-backup $APP_DIR/.env 2>/dev/null || true

# Reconstruction des images
echo "🏗️ Reconstruction des images..."
cd $APP_DIR
docker-compose build

# Exécution des migrations
echo "🗃️ Exécution des migrations..."
docker-compose up -d postgres
sleep 10
docker-compose run --rm backend npm run migration:run

# Redémarrage complet
echo "▶️ Redémarrage des services..."
docker-compose up -d

# Vérification
sleep 30
if curl -f http://localhost:3001/health &>/dev/null; then
    echo "✅ Mise à jour réussie vers $NEW_VERSION"
else
    echo "❌ Échec de la mise à jour, restauration..."
    # Logique de rollback ici
fi

# Nettoyage
rm -rf /tmp/streaming-app-update /tmp/env-backup

echo "🎉 Mise à jour terminée"
```
