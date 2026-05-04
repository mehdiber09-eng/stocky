# StockSense v2 — Prédiction de ruptures de stock

Application full-stack de prédiction de ruptures de stock avec ML (XGBoost + LSTM).

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI 0.103 + SQLAlchemy 2 async |
| Base de données | PostgreSQL 16 |
| Cache | Redis 7 |
| ML | XGBoost + TensorFlow/LSTM |
| Infra | Docker Compose / Kubernetes |
| Tests | Pytest + Cypress E2E |

## Démarrage rapide

```bash
# 1. Cloner et se placer dans le dossier
cd stockout-predictor

# 2. Copier et remplir les variables d'environnement
cp infra/.env.backend.example infra/.env.backend

# 3. Démarrer tous les services
cd infra && docker compose up --build

# Frontend → http://localhost:3000
# Backend API → http://localhost:8000
# Swagger docs → http://localhost:8000/docs
```

## Structure du projet

```
stockout-predictor/
├── backend/
│   ├── app/
│   │   ├── api/          # Routes FastAPI
│   │   ├── core/         # Config, sécurité
│   │   ├── models/       # DB models, schemas Pydantic
│   │   ├── services/     # ML service, Redis
│   │   └── tests/        # Tests pytest
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # Client Axios typé
│   │   ├── components/   # Sidebar, Layout, Charts, Toast
│   │   ├── context/      # AuthContext
│   │   └── pages/        # Dashboard, Login, Predict...
│   └── package.json
├── infra/
│   └── docker-compose.yml
├── k8s/                  # Manifests Kubernetes
├── e2e/                  # Tests Cypress
└── data/                 # Données d'exemple CSV
```

## Fonctionnalités

- **Auth JWT** : inscription, connexion, token Bearer
- **Produits** : CRUD avec SKU unique
- **Ventes** : enregistrement et décrément automatique de l'inventaire
- **Prédictions** : probabilité de rupture sur un horizon configurable (7–90 jours)
- **Freemium** : 5 prédictions gratuites par mois via Redis, abonnement illimité
- **ML** : XGBoost + LSTM (fallback aléatoire sans modèles entraînés)
- **UI** : Interface sombre moderne avec sidebar, graphiques Recharts, notifications toast

## Entraîner les modèles ML

```bash
cd backend
pip install -r requirements.txt
python app/train_models.py
```

## Tests

```bash
# Backend
cd backend && pytest

# E2E (frontend doit tourner)
cd e2e && npx cypress run
```

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `SECRET_KEY` | `dev-secret-key` | Clé JWT (à changer en prod !) |
| `DATABASE_URL` | `postgresql+asyncpg://...` | URL PostgreSQL |
| `REDIS_URL` | `redis://redis:6379/0` | URL Redis |
| `FREE_TRIALS_LIMIT` | `5` | Prédictions gratuites/mois |
| `CORS_ORIGINS` | `*` | Origines CORS autorisées |
| `APP_ENV` | `development` | Environnement (`production` force validation SECRET_KEY) |
