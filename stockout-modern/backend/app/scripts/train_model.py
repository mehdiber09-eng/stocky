"""
Entraîne le modèle XGBoost de prédiction de rupture de stock.

Usage depuis le dossier backend/ :
    python -m app.scripts.train_model

Produit dans models_artifacts/ :
    xgb_model.pkl       Modèle XGBoost entraîné
    scaler.pkl          StandardScaler (même transformation qu'en inférence)
    feature_names.pkl   Ordre des features (pour vérification)
    metrics.json        AUC, Brier score, taux de positifs
"""

import os
import sys
import json
import logging
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s")
logger = logging.getLogger(__name__)

# Le script s'exécute depuis backend/ — ajouter au path pour les imports app.*
_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models_artifacts")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = [
    "lag_1", "lag_7", "lag_14", "lag_30",
    "rolling_mean_7", "rolling_mean_14",
    "rolling_std_7", "rolling_std_14",
    "current_stock", "safety_stock", "stock_to_demand_ratio",
    "lead_time", "day_of_week", "month", "horizon",
]


def train(n_products: int = 300, n_days: int = 365) -> dict:
    try:
        import pandas as pd
        import xgboost as xgb
        import joblib
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import roc_auc_score, brier_score_loss
    except ImportError as e:
        logger.error(f"Dépendance manquante : {e}")
        logger.error("Installe : pip install xgboost scikit-learn pandas numpy joblib")
        sys.exit(1)

    from app.scripts.generate_synthetic_data import generate_dataset, build_features

    logger.info(f"Génération données synthétiques — {n_products} produits × {n_days} jours...")
    raw = generate_dataset(n_products=n_products, n_days=n_days)
    df = build_features(raw, horizons=[7, 14, 30])

    pos_rate = df["stockout"].mean()
    logger.info(f"Dataset : {len(df):,} exemples | {pos_rate:.1%} ruptures")

    X = df[FEATURES].values.astype(np.float32)
    y = df["stockout"].values.astype(np.int32)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    # Compenser le déséquilibre de classes
    neg = (y_train == 0).sum()
    pos = (y_train == 1).sum()
    scale_pos = neg / max(pos, 1)
    logger.info(f"scale_pos_weight = {scale_pos:.2f}  (neg={neg}, pos={pos})")

    logger.info("Entraînement XGBoost...")
    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        gamma=1.0,
        scale_pos_weight=scale_pos,
        random_state=42,
        eval_metric="auc",
        early_stopping_rounds=30,
        verbosity=0,
    )
    model.fit(
        X_train_s, y_train,
        eval_set=[(X_test_s, y_test)],
        verbose=False,
    )

    proba = model.predict_proba(X_test_s)[:, 1]
    auc = roc_auc_score(y_test, proba)
    brier = brier_score_loss(y_test, proba)

    logger.info(f"AUC    = {auc:.4f}  (>0.75 = bon, >0.85 = excellent)")
    logger.info(f"Brier  = {brier:.4f}  (<0.15 = bon, <0.10 = excellent)")

    # Feature importance
    importances = dict(zip(FEATURES, model.feature_importances_))
    top5 = sorted(importances.items(), key=lambda x: -x[1])[:5]
    logger.info("Top 5 features : " + " | ".join(f"{k}={v:.3f}" for k, v in top5))

    # Sauvegardes
    joblib.dump(model, os.path.join(MODEL_DIR, "xgb_model.pkl"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
    joblib.dump(FEATURES, os.path.join(MODEL_DIR, "feature_names.pkl"))

    metrics = {
        "auc": round(auc, 4),
        "brier": round(brier, 4),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "pos_rate": round(float(pos_rate), 4),
        "best_iteration": model.best_iteration,
    }
    with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    logger.info(f"Modèles sauvegardés dans {os.path.abspath(MODEL_DIR)}")
    return metrics


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Entraîne le modèle XGBoost Stocky")
    parser.add_argument("--products", type=int, default=300, help="Nombre de produits simulés (défaut: 300)")
    parser.add_argument("--days", type=int, default=365, help="Jours d'historique simulé (défaut: 365)")
    args = parser.parse_args()

    metrics = train(n_products=args.products, n_days=args.days)
    print(f"\nRésultat : AUC={metrics['auc']} | Brier={metrics['brier']}")
