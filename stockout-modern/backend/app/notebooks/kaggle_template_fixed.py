# Generated from stockout-modern/backend/app/notebooks/kaggle_template.ipynb

!pip install xgboost scikit-learn pandas numpy joblib

# ---- cell separator ----

# Exemple : exécuter l'entraînement sur M5 (dossier /kaggle/input/m5-forecasting-accuracy)
!python -m app.scripts.train_model --products 300 --days 365 --dataset /kaggle/input/m5-forecasting-accuracy --dataset-format m5

# ---- cell separator ----

# Après exécution, les artefacts seront dans app/models_artifacts/
!ls -la app/models_artifacts || true