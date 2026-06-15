import os
import math
import numpy as np
import joblib
import logging
from typing import Dict, List, Optional

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models_artifacts")
os.makedirs(MODEL_DIR, exist_ok=True)

logger = logging.getLogger(__name__)

FEATURES = [
    "lag_1", "lag_7", "lag_14", "lag_30",
    "rolling_mean_7", "rolling_mean_14",
    "rolling_std_7", "rolling_std_14",
    "cv_demand",            # Volatilité relative de la demande
    "trend_7",              # Tendance court terme (lag_7 - lag_14)
    "trend_30",             # Tendance long terme (lag_14 - lag_30)
    "days_cover",           # Couverture en jours (stock / lag_7)
    "stock_ratio",          # Ratio stock / safety_stock
    "current_stock", "safety_stock",
    "lead_time",
    "day_of_week", "month", "is_weekend",
    "horizon",
]

SAFETY_STOCK_DAYS_ASSUMPTION = 7
DEFAULT_MEAN_DAILY_FALLBACK  = 1.0


def _normal_cdf(x: float) -> float:
    return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0


def _estimate_mean_daily(current_stock: int, safety_stock: int) -> float:
    if safety_stock and safety_stock > 0:
        return max(safety_stock / SAFETY_STOCK_DAYS_ASSUMPTION, 0.1)
    if current_stock and current_stock > 0:
        return max(current_stock / (2 * SAFETY_STOCK_DAYS_ASSUMPTION), 0.1)
    return DEFAULT_MEAN_DAILY_FALLBACK


def _statistical_probability(
    sales_data: List[int],
    current_stock: int,
    horizon: int,
    safety_stock: int = 0,
    lead_time_days: int = 7,
) -> Dict:
    if len(sales_data) < 2:
        return {"probability": 0.45, "lower": 0.33, "upper": 0.57}

    recent = sales_data[-min(30, len(sales_data)):]
    mean_d = float(np.mean(recent))
    std_d  = float(np.std(recent, ddof=1))
    if std_d < 1e-6:
        std_d = max(mean_d * 0.25, 0.1)
    if mean_d <= 0:
        return {"probability": 0.04, "lower": 0.01, "upper": 0.08}

    effective_stock = max(0.0, float(current_stock) - float(safety_stock))
    expected_demand = mean_d * horizon
    std_demand      = std_d * math.sqrt(horizon)

    z    = (effective_stock - expected_demand) / std_demand
    prob = 1.0 - _normal_cdf(z)

    lead_factor = 1.0 + min((lead_time_days / 30.0) * 0.25, 0.5)
    prob = float(np.clip(prob * lead_factor, 0.01, 0.99))

    z_low  = (effective_stock - (expected_demand - 1.28 * std_demand)) / std_demand
    z_high = (effective_stock - (expected_demand + 1.28 * std_demand)) / std_demand
    lower  = float(np.clip(1.0 - _normal_cdf(z_low),  0.01, 0.99))
    upper  = float(np.clip(1.0 - _normal_cdf(z_high), 0.01, 0.99))
    if lower > upper:
        lower, upper = upper, lower

    return {"probability": round(prob, 4), "lower": round(lower, 4), "upper": round(upper, 4)}


def _ml_features(
    sales_data: List[int],
    current_stock: int,
    safety_stock: int,
    lead_time: int,
    horizon: int,
) -> Optional[np.ndarray]:
    """Construit le vecteur de features ML — doit correspondre exactement à FEATURES."""
    from datetime import datetime
    if len(sales_data) < 2:
        return None

    now = datetime.now()
    arr = np.array(sales_data, dtype=float)

    lag_1  = float(arr[-1])
    lag_7  = float(np.mean(arr[-7:]))  if len(arr) >= 7  else float(np.mean(arr))
    lag_14 = float(np.mean(arr[-14:])) if len(arr) >= 14 else lag_7
    lag_30 = float(np.mean(arr[-30:])) if len(arr) >= 30 else lag_14

    std_7  = float(np.std(arr[-7:]))  if len(arr) >= 7  else 0.0
    std_14 = float(np.std(arr[-14:])) if len(arr) >= 14 else std_7

    cv_demand   = std_7 / max(lag_7, 0.1)
    trend_7     = lag_7  - lag_14
    trend_30    = lag_14 - lag_30
    days_cover  = float(current_stock) / max(lag_7, 0.1)
    stock_ratio = float(current_stock) / max(float(safety_stock), 0.1)

    is_weekend = float(now.weekday() >= 5)

    return np.array([[
        lag_1, lag_7, lag_14, lag_30,
        lag_7, lag_14,           # rolling_mean_7, rolling_mean_14
        std_7, std_14,
        min(cv_demand, 10.0),
        trend_7,
        trend_30,
        min(days_cover, 200.0),
        min(stock_ratio, 50.0),
        float(current_stock), float(safety_stock),
        float(lead_time),
        float(now.weekday()), float(now.month), is_weekend,
        float(horizon),
    ]], dtype=np.float32)


def _load_artifact(filename: str):
    path = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(path):
        return None

    # Première tentative: joblib.load (fonctionne pour sklearn objects et pickles compatibles)
    try:
        return joblib.load(path)
    except ModuleNotFoundError as mnfe:
        # Si l'erreur mentionne 'catboost', essayer d'importer catboost avant de réessayer
        msg = str(mnfe).lower()
        if 'catboost' in msg:
            try:
                import importlib
                importlib.import_module('catboost')
                # réessayer unpickle maintenant que le module est présent
                return joblib.load(path)
            except Exception:
                # Dernier recours : tenter un chargement explicite via l'API CatBoost
                try:
                    from catboost import CatBoost
                    model = CatBoost()
                    model.load_model(path)
                    return model
                except Exception as e:
                    logger.exception(f"Failed loading CatBoost model {filename}: {e}")
                    return None
        logger.exception(f"ModuleNotFoundError loading {filename}: {mnfe}")
        return None
    except Exception as e:
        # Pour les autres erreurs, journaliser et retourner None
        logger.exception(f"Failed loading {filename}: {e}")
        return None


def _load_threshold() -> float:
    """Charge le seuil optimal depuis threshold.json (généré par le notebook Optuna)."""
    import json
    path = os.path.join(MODEL_DIR, 'threshold.json')
    if os.path.exists(path):
        try:
            with open(path) as f:
                return float(json.load(f).get('threshold', 0.5))
        except Exception:
            pass
    return 0.5


def _apply_ml(
    sales_data: List[int],
    current_stock: int,
    safety_stock: int,
    lead_time_days: int,
    horizon: int,
    model, scaler, calibrator,
) -> Optional[float]:
    """Retourne la probabilité ML calibrée, ou None si échec."""
    try:
        feats = _ml_features(sales_data, current_stock, safety_stock, lead_time_days, horizon)
        if feats is None:
            return None
        feats_s   = scaler.transform(feats)
        raw_prob  = float(model.predict_proba(feats_s)[0][1])
        if calibrator is not None:
            return float(np.clip(calibrator.predict([raw_prob])[0], 0.01, 0.99))
        return float(np.clip(raw_prob, 0.01, 0.99))
    except Exception as e:
        logger.exception(f"ML prediction failed: {e}")
        return None


def run_prediction(
    product_id: int,
    horizon: int,
    sales_data: Optional[List[int]] = None,
    current_stock: int = 0,
    safety_stock: int = 0,
    lead_time_days: int = 7,
) -> Dict:
    """
    Priorités :
    1. Données réelles (>=3 jours) → statistique + blend ML calibré  ('ml_blend' / 'statistical')
    2. Pas d'historique, ML dispo  → estimation via safety_stock + statistique + blend ML ('ml_proxy')
    3. Pas d'historique, ML indispo→ estimation via safety_stock + statistique seule ('heuristic')

    Toujours retourné : 'probability', 'lower', 'upper', 'method'
    Si modèle dispo   : 'model_version', 'threshold'
    """
    # Chargement des artefacts (une fois, en prod on peut les mettre en cache module-level)
    model      = _load_artifact('xgb_model.pkl')
    scaler     = _load_artifact('scaler.pkl')
    calibrator = _load_artifact('calibrator.pkl')   # nouveau : calibration isotonique
    threshold  = _load_threshold()                  # nouveau : seuil F1-optimal

    model_version = None
    ver_path = os.path.join(MODEL_DIR, 'version.txt')
    if os.path.exists(ver_path):
        try:
            model_version = open(ver_path).read().strip()
        except Exception:
            pass

    ml_available = (model is not None and scaler is not None)

    # ── Cas 1 : assez de données réelles ──────────────────────────────────────
    if sales_data and len(sales_data) >= 3:
        result = _statistical_probability(sales_data, current_stock, horizon,
                                          safety_stock, lead_time_days)
        result['method'] = 'statistical'

        if ml_available:
            prob_ml = _apply_ml(sales_data, current_stock, safety_stock,
                                lead_time_days, horizon, model, scaler, calibrator)
            if prob_ml is not None:
                blended = 0.6 * result['probability'] + 0.4 * prob_ml
                result['probability'] = round(float(np.clip(blended, 0.01, 0.99)), 4)
                result['method'] = 'ml_blend'

        if model_version:
            result['model_version'] = model_version
        result['threshold'] = threshold
        return result

    # ── Cas 2 & 3 : pas (ou peu) d'historique ────────────────────────────────
    # On reconstruit une demande plausible à partir de safety_stock / current_stock
    mean_daily   = _estimate_mean_daily(current_stock, safety_stock)
    rng          = np.random.RandomState(product_id)
    proxy_sales  = list(np.clip(
        rng.normal(loc=mean_daily, scale=max(mean_daily * 0.3, 0.1), size=30),
        a_min=0, a_max=None
    ).round().astype(int))

    result = _statistical_probability(proxy_sales, current_stock, horizon,
                                      safety_stock, lead_time_days)

    if ml_available:
        prob_ml = _apply_ml(proxy_sales, current_stock, safety_stock,
                            lead_time_days, horizon, model, scaler, calibrator)
        if prob_ml is not None:
            blended = 0.6 * result['probability'] + 0.4 * prob_ml
            result['probability'] = round(float(np.clip(blended, 0.01, 0.99)), 4)
            result['method'] = 'ml_proxy'
            if model_version:
                result['model_version'] = model_version
            result['threshold'] = threshold
            return result

    result['method'] = 'heuristic'
    if model_version:
        result['model_version'] = model_version
    result['threshold'] = threshold
    return result