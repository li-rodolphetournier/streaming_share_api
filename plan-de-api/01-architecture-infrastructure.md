# Phase 1 : Architecture & Infrastructure (Semaine 1-2)

## 1.1 Stack Technologique

### Frontend

- **React** + TypeScript + TailwindCSS + Shadcn/UI
- **Vite** pour le build rapide
- **React Query** pour la gestion d'état serveur
- **React Hook Form** pour les formulaires
- **Lucide React** pour les icônes

### Backend

- **Node.js** + Express + TypeScript
- **TypeORM** pour l'ORM
- **JWT** + bcrypt pour l'authentification
- **Multer** pour l'upload de fichiers
- **FFmpeg** pour le transcodage vidéo

### Base de données

- **PostgreSQL** (optimisé pour RPi4)
- **Redis** pour le cache et les sessions

### Infrastructure

- **Docker** + Docker Compose
- **Nginx** comme reverse proxy
- **HLS** (HTTP Live Streaming) pour le streaming

## 1.2 Architecture Système

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Media Server  │
│   (React)       │◄──►│   (Express)     │◄──►│   (FFmpeg)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   PostgreSQL    │◄─────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │     Redis       │
                        │   (Cache)       │
                        └─────────────────┘
```

## 1.3 Structure des Dossiers

```
streaming-app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## 1.4 Optimisations Raspberry Pi 4

### Ressources Limitées

- **RAM** : 4GB (allocation intelligente)
- **CPU** : ARM Cortex-A72 (optimisation ARM)
- **Stockage** : SSD recommandé pour les performances

### Configurations Spécifiques

- Limitation du transcodage simultané (max 2 streams)
- Qualités vidéo adaptées (480p, 720p)
- Cache agressif pour réduire les I/O
- Nettoyage automatique des fichiers temporaires

## 1.5 Sécurité

### Authentification

- JWT avec refresh tokens
- Hashage bcrypt pour les mots de passe
- Rate limiting sur les endpoints sensibles

### Autorisation

- Système de rôles (admin, user)
- Permissions granulaires sur les bibliothèques
- Validation des uploads de fichiers

## 1.6 Performance

### Cache Strategy

- Redis pour les métadonnées fréquemment accédées
- Cache HTTP pour les assets statiques
- Pagination pour les listes de médias

### Streaming Optimisé

- Génération de segments HLS à la demande
- Qualités multiples selon la bande passante
- Préchargement intelligent des segments
