# Audit StockSense v3 — Inspection, nettoyage, améliorations

## 1. Vue d'ensemble

| Couche | État |
|---|---|
| Backend FastAPI + SQLAlchemy async | Solide, mais Pydantic v1, JWT artisanal, ML factice |
| Frontend React + Vite + Tailwind | Propre, mais token en `localStorage`, baseURL en dur |
| Infra Docker / K8s / Railway / Vercel | Fonctionnel, sans CI/CD ni observabilité |
| Tests | 5 tests backend basiques, 1 spec Cypress |
| ML | XGBoost + LSTM "présents" mais alimentés par des features à zéro — pratiquement inutilisables |

## 2. Nettoyage déjà effectué

- `.gitignore` réécrit (couvre Python, Node, env, IDE, logs, OS, ML artifacts, .bak)
- `requirements.txt` : doublon `httpx==0.25.0` supprimé

## 3. À supprimer (manuel, je ne peux pas le faire)

Exécute depuis `C:\Users\mehdi\stockout-predictor-v3\stockout-modern` :

```powershell
# Fichiers .bak (anciennes versions de pages refactorées)
Remove-Item frontend\src\pages\Dashboard.tsx.bak
Remove-Item frontend\src\pages\Analytics.tsx.bak
Remove-Item frontend\src\pages\Predict.tsx.bak

# Composant orphelin (utilisé seulement par Predict.tsx.bak)
Remove-Item frontend\src\components\PredictionChart.tsx
```

Puis :

```bash
git rm --cached infra/.env.backend  # ne devrait jamais être versionné
git add .gitignore backend/requirements.txt
git commit -m "chore: cleanup backups, gitignore, dedup deps"
```

## 4. Bugs critiques (à corriger en priorité)

### 4.1 Sécurité
1. **Pas de contrôle de propriété sur les produits** — `DELETE /products/{id}` permet à n'importe quel user de supprimer le produit d'un autre. Idem pour les ventes. Il faut un champ `owner_id` sur `Product` et un filtre dans toutes les routes.
2. **CORS hardcodé à `*`** dans `main.py` — la variable `CORS_ORIGINS` documentée n'est jamais utilisée. Risque CSRF si tu mets un cookie un jour.
3. **`SECRET_KEY` par défaut accepté** même en `APP_ENV=production` — la doc le promet mais le code ne le valide pas.
4. **Pas de rate limiting** sur `/auth/token` ni `/auth/register` → brute-force facile. Ajoute `slowapi` (5 essais/min/IP).
5. **Token dans `localStorage`** (frontend) → vol par XSS. Migrer vers cookie `httpOnly + Secure + SameSite=Lax`.
6. **`python-jose` est non maintenu** (CVE-2024-33663, CVE-2024-33664). Bascule vers `PyJWT` ou `authlib`.
7. **`passlib` n'est plus maintenu**. Utiliser `bcrypt` directement ou `argon2-cffi`.

### 4.2 Modèle ML
- `run_prediction()` reçoit `product_id` et `horizon` mais alimente XGBoost et LSTM avec **des zeros** (`np.zeros((1,1))`, `np.zeros((1,10,1))`). Le modèle ne voit jamais de données réelles. Il faut construire les features à partir de l'historique des ventes du produit.
- Aucune feature engineering : moyenne mobile, tendance, saisonnalité, jours depuis dernière vente, stock courant, lead_time, safety_stock — rien n'est utilisé.
- Pas de validation croisée temporelle, pas de métrique stockée (AUC, Brier).
- TensorFlow 2.14 = ~500 Mo de RAM pour rien. Si la LSTM ne sert qu'à renvoyer une moyenne, supprime-la et garde XGBoost.

### 4.3 Fiabilité
- `init_db()` fait `Base.metadata.create_all` à chaque démarrage → ignore Alembic. Soit tu utilises Alembic (et tu vires `create_all`), soit tu retires Alembic.
- `datetime.utcnow()` est déprécié en Python 3.12. Utilise `datetime.now(timezone.utc)`.
- Pas d'index DB sur `prediction_logs(user_id, predicted_at)` ni `sales(product_id, sold_at)` — les requêtes analytics deviendront lentes.
- Pas de pagination sur `/products`, `/analytics/predictions/history`, `/sales` — explosion mémoire à grande échelle.
- `init_db` import `chat` qui exige `GROQ_API_KEY` au runtime mais le fail est silencieux.

### 4.4 Code mort / incohérences
- `Inventory` existe en DB mais aucune route ne l'expose ni ne le crée → la décrémentation dans `sales.py` ne fonctionne jamais (l'inventaire n'est jamais peuplé).
- `frontend/src/api/api.ts` : `baseURL: 'https://m-stocky.up.railway.app'` est en dur → ignore `VITE_API_URL` annoncé dans `DEPLOIEMENT.md`. À remplacer par `import.meta.env.VITE_API_URL`.
- Pydantic v1 (`BaseSettings`, `validator`, `regex=`, `orm_mode`) avec un écosystème Python moderne. Migration v2 recommandée (`pydantic-settings`, `field_validator`, `pattern=`, `from_attributes`).
- `httpx` apparaissait deux fois dans `requirements.txt` (corrigé).

## 5. Améliorations puissantes (par ordre d'impact)

### Tier 1 — Indispensable (sécurité + qualité produit)

1. **Multi-tenant correct** : ajouter `owner_id` à `Product`, `Sale`, `Inventory`. Filtrer toutes les routes par `user.id`. Migration Alembic à écrire.
2. **Rate limiting + lockout** sur `/auth/*` (slowapi + 5 tentatives/15 min/IP/email).
3. **Refresh tokens** : le JWT actuel dure 7 jours sans rotation. Ajouter un cycle access (15 min) + refresh (30 j en cookie httpOnly).
4. **Migration Pydantic v2 + JWT moderne** (PyJWT) + `passlib` → `argon2-cffi`.
5. **Modèle ML réel** :
   - Features par produit : ventes 7j/30j/90j, écart-type, jour de la semaine, lead_time, safety_stock, stock courant, jours depuis dernier événement.
   - Cible : rupture vue dans `horizon` jours (label construit depuis `Inventory + Sale`).
   - Modèle : LightGBM (plus léger que XGBoost+TF, ~10× plus rapide en inférence).
   - Calibration : `CalibratedClassifierCV` pour des probabilités fiables.
   - Stocker le modèle versionné + métriques (AUC, Brier, calibration plot).
6. **Suppression de TensorFlow** → -400 Mo de RAM. Utiliser Prophet ou statsmodels seulement si tu veux une décomposition saisonnière.

### Tier 2 — Productivité & qualité

7. **CI GitHub Actions** : lint (ruff), tests (pytest + cypress), build Docker, scan vuln (`pip-audit`, `npm audit`), preview Vercel par PR.
8. **Pre-commit hooks** : ruff, black, mypy, eslint, prettier.
9. **Observabilité** : Sentry (front + back), Prometheus `/metrics` via `prometheus-fastapi-instrumentator`, `structlog` JSON logs avec request_id.
10. **Healthcheck plus malin** : différencier `/health/live` (process up) et `/health/ready` (DB+Redis OK) pour Kubernetes.
11. **Tests** : couvrir `/predict`, `/products` (POST/DELETE + ownership), `/sales`, `/analytics`. Cible 80%.
12. **Frontend** : `react-query` ou `swr` pour caching/refetch, abandon des `useEffect` manuels. Skeletons de chargement, error boundaries.
13. **`VITE_API_URL` réellement lu** dans `api.ts` au lieu de l'URL Railway en dur.
14. **Pagination + filtres** : `limit`/`offset` partout, retour `{items, total}`.

### Tier 3 — Différenciateurs produit

15. **Recommandation de réapprovisionnement** : à partir d'une prédiction de rupture, calculer la quantité optimale à commander (formule EOQ : `sqrt(2·D·S/H)`), date de commande recommandée (= `prédite_rupture - lead_time`).
16. **Backtesting** : page "Performance des prédictions" qui compare prédit vs. observé (rupture réelle) sur les 90 derniers jours, avec courbe de calibration.
17. **Anomaly detection** sur les ventes (Z-score 30j ou Isolation Forest) → notification push d'alertes inhabituelles avant même la prédiction de rupture.
18. **Web hooks / intégrations** : sortie Slack/Discord/Webhook quand probabilité > seuil. Plus puissant que l'email seul.
19. **Import Shopify / WooCommerce / Stripe** des ventes en temps réel (un connecteur OAuth + cron). C'est ce qui fait passer de "démo" à "produit vendable".
20. **Multi-entrepôts** : ajouter un modèle `Warehouse`, calculer ruptures par site, transfert recommandé entre sites.
21. **Alerte ROI** : "vous avez évité X € de manque à gagner ce mois grâce aux alertes" (probabilité × marge × volume estimé) — ça vend le produit.
22. **Mode démo public** : compte read-only avec données générées, accessible sans inscription, pour la landing.

### Tier 4 — Scale & infra

23. **Workers async** : remplacer `BackgroundTasks` (in-process) par Celery/RQ + Redis pour les emails, ré-entraînements, exports lourds.
24. **Cache Redis sur les prédictions** : clé `pred:{user_id}:{product_id}:{horizon}` TTL 1h. Évite le coût ML sur clic répété.
25. **Stripe au lieu de l'abonnement bidon** (`/subscribe` flippe juste un boolean). Webhook `checkout.session.completed` → `is_subscribed = true`. Portail client pour annuler.
26. **Per-user OpenAPI** : un endpoint `/api/keys` qui génère un token d'API personnel pour scripter, séparé du JWT humain.
27. **Multi-stage Dockerfile** + image distroless → -70% taille, démarrage plus rapide sur Railway.
28. **Frontend en SSR (Next.js) ou pré-rendu** pour le SEO de la landing, surtout si tu veux acquérir du trafic.

## 6. Roadmap suggérée (4 semaines)

| Semaine | Objectif |
|---|---|
| S1 | Tier 1 sécurité (1-4) + suppression TF + ML features réelles (5) |
| S2 | CI + tests + observabilité (7-11) |
| S3 | EOQ + backtesting + webhooks Slack (15-18) |
| S4 | Stripe + import Shopify + démo publique (19, 22, 25) |

Après ça tu auras un SaaS vendable, pas juste un projet portfolio.
