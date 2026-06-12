Guide rapide — entraîner localement ou sur Kaggle

But: créer modèles et métriques pour production.

1) Pré-requis
- Python 3.11
- pip install xgboost scikit-learn pandas numpy joblib

2) Entraînement (synthetic / local)
- Depuis le dossier stockout-modern/backend :
    python -m app.scripts.train_model --products 300 --days 365
- Artefacts créés dans app/models_artifacts/: xgb_model.pkl, scaler.pkl, feature_names.pkl, metrics.json, metrics_fr.json, version.txt

3) Export métriques pour Kaggle
    python -m app.scripts.export_metrics_kaggle
- Produira app/models_artifacts/metrics_kaggle.csv (fr+en) pour import dans Notebook

4) Sur Kaggle
- Téléversez models_artifacts et le notebook Kaggle peut charger metrics_kaggle.csv et afficher les courbes.

5) Intégration avec l'API
- Les artefacts doivent être copiés dans backend/app/models_artifacts/ du déploiement.
- L'API logge la méthode utilisée ('statistical','ml_blend','ml_proxy','heuristic') et la version simple dans models_artifacts/version.txt

