# 🚀 Guide de Déploiement StockSense (100% Gratuit)

## Architecture cible

```
Frontend (Vercel)  ──→  Backend (Railway)  ──→  PostgreSQL (Railway)
                                           ──→  Redis (Railway)
```

- **Frontend** : Vercel (gratuit, domaine `xxx.vercel.app`)
- **Backend** : Railway (500h gratuites/mois)
- **PostgreSQL** : Railway plugin
- **Redis** : Railway plugin

---

## Étape 1 — Déployer le Backend sur Railway

### 1.1 Créer un compte Railway
→ https://railway.app (connexion avec GitHub)

### 1.2 Créer un nouveau projet
1. Cliquez **"New Project"**
2. Choisissez **"Deploy from GitHub repo"**
3. Sélectionnez votre repo, choisissez le dossier **`backend/`**

### 1.3 Ajouter PostgreSQL
1. Dans votre projet Railway, cliquez **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway crée automatiquement la variable `DATABASE_URL`

### 1.4 Ajouter Redis
1. Cliquez **"+ New"** → **"Database"** → **"Redis"**
2. Railway crée automatiquement la variable `REDIS_URL`

### 1.5 Variables d'environnement du backend
Dans Railway → Settings → Variables, ajoutez :

```
SECRET_KEY=votre-cle-secrete-longue-et-aleatoire
APP_ENV=production
FREE_TRIALS_LIMIT=5
ALERT_THRESHOLD=0.5

# Optionnel — alertes email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@gmail.com
SMTP_PASSWORD=votre-app-password-gmail
```

> Pour Gmail : activez "Authentification à 2 facteurs" puis créez un "Mot de passe d'application"

### 1.6 Récupérer l'URL du backend
Dans Railway → votre service → Settings → **Domains** → générer un domaine.
Notez l'URL : `https://stocksense-backend-xxx.railway.app`

---

## Étape 2 — Déployer le Frontend sur Vercel

### 2.1 Créer un compte Vercel
→ https://vercel.com (connexion avec GitHub)

### 2.2 Importer le projet
1. Cliquez **"New Project"**
2. Importez votre repo GitHub
3. **Root Directory** : `frontend`
4. **Framework Preset** : Vite

### 2.3 Variables d'environnement
Dans Vercel → Settings → Environment Variables :

```
VITE_API_URL=https://stocksense-backend-xxx.railway.app
```
(remplacez par votre vraie URL Railway)

### 2.4 Déployer
Cliquez **"Deploy"** — Vercel construit et déploie automatiquement.

Votre app sera accessible sur : `https://stocksense-xxx.vercel.app`

---

## Étape 3 — Domaine personnalisé (optionnel)

### Domaine gratuit avec Freenom
1. Allez sur https://www.freenom.com
2. Cherchez un nom de domaine `.tk`, `.ml` ou `.ga` (gratuits)
3. Dans Vercel → Domains → ajoutez votre domaine
4. Configurez les DNS comme indiqué par Vercel

### Domaine payant recommandé (~10€/an)
- https://porkbun.com (le moins cher)
- Cherchez un `.com` ou `.io`

---

## Étape 4 — Mises à jour automatiques

Une fois connecté à GitHub, chaque `git push` déclenche automatiquement :
- Un nouveau build Vercel (frontend)
- Un redéploiement Railway (backend)

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
# → déploiement automatique en ~2 minutes
```

---

## Limites du plan gratuit

| Service | Limite gratuite |
|---------|----------------|
| Vercel | 100GB bandwidth/mois, builds illimités |
| Railway | 500h compute/mois, 1GB RAM |
| PostgreSQL Railway | 1GB stockage |
| Redis Railway | 25MB |

> Pour un usage professionnel, Railway Starter à 5$/mois lève toutes les limites.

---

## Checklist de mise en production

- [ ] `SECRET_KEY` changé (min. 32 caractères aléatoires)
- [ ] `APP_ENV=production`
- [ ] `VITE_API_URL` pointe vers Railway
- [ ] Test d'inscription/connexion
- [ ] Test d'une prédiction
- [ ] Test de l'export CSV
- [ ] (Optionnel) SMTP configuré pour les alertes email
