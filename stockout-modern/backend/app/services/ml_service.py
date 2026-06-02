import os
import math
import numpy as np
import joblib
from typing import Dict, List, Optional

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models_artifacts")
os.makedirs(MODEL_DIR, exist_ok=True)

# Features doivent correspondre exactement à celles utilisées lors de l'entraînement
# (scripts/train_model.py → FEATURES)
FEATURES = [
    "lag_1", "lag_7", "lag_14", "lag_30",
    "rolling_mean_7", "rolling_mean_14",
    "rolling_std_7", "rolling_std_14",
    "current_stock", "safety_stock", "stock_to_demand_ratio",
    "lead_time", "day_of_week", "month", "horizon",
]


def _normal_cdf(x: float) -> float:
    return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0


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
    std_d = float(np.std(recent, ddof=1))
    if std_d < 1e-6:
        std_d = max(mean_d * 0.25, 0.1)

    if mean_d <= 0:
        return {"probability": 0.04, "lower": 0.01, "upper": 0.08}

    effective_stock = max(0.0, float(current_stock) - float(safety_stock))
    expected_demand = mean_d * horizon
    std_demand = std_d * math.sqrt(horizon)

    z = (effective_stock - expected_demand) / std_demand
    prob = 1.0 - _normal_cdf(z)

    lead_factor = 1.0 + min((lead_time_days / 30.0) * 0.25, 0.5)
    prob = float(np.clip(prob * lead_factor, 0.01, 0.99))

    z_low = (effective_stock - (expected_demand - 1.28 * std_demand)) / std_demand
    z_high = (effective_stock - (expected_demand + 1.28 * std_demand)) / std_demand
    lower = float(np.clip(1.0 - _normal_cdf(z_low), 0.01, 0.99))
    upper = float(np.clip(1.0 - _normal_cdf(z_high), 0.01, 0.99))
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
    """Construit le vecteur de features XGBoost — doit correspondre à FEATURES."""
    from datetime import datetime
    if len(sales_data) < 2:
        return None

    now = datetime.now()
    arr = np.array(sales_data, dtype=float)

    lag_1 = float(arr[-1])
    lag_7 = float(np.mean(arr[-7:])) if len(arr) >= 7 else float(np.mean(arr))
    lag_14 = float(np.mean(arr[-14:])) if len(arr) >= 14 else lag_7
    lag_30 = float(np.mean(arr[-30:])) if len(arr) >= 30 else lag_14
    rolling_std_7 = float(np.std(arr[-7:])) if len(arr) >= 7 else 0.0
    rolling_std_14 = float(np.std(arr[-14:])) if len(arr) >= 14 else rolling_std_7
    stock_to_demand = float(current_stock) / max(lag_7, 0.1)

    return np.array([[
        lag_1, lag_7, lag_14, lag_30,
        lag_7, lag_14,              # rolling_mean_7, rolling_mean_14
        rolling_std_7, rolling_std_14,
        float(current_stock), float(safety_stock), stock_to_demand,
        float(lead_time), float(now.weekday()), float(now.month), float(horizon),
    ]])


def _load_model(filename: str):
    path = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(path):
        return None
    try:
        return joblib.load(path)
    except Exception:
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
    Priorité :
    1. Données réelles → modèle statistique (Normal) + blend XGBoost si dispo
    2. XGBoost seul avec proxy (si pas de données réelles)
    3. Heuristique seedée (dernier recours)
    """
    if sales_data and len(sales_data) >= 3:
        result = _statistical_probability(
            sales_data, current_stock, horizon, safety_stock, lead_time_days
        )

        xgb = _load_model("xgb_model.pkl")
        scaler = _load_model("scaler.pkl")
        if xgb is not None and scaler is not None:
            try:
                feats = _ml_features(sales_data, current_stock, safety_stock, lead_time_days, horizon)
                if feats is not None:
                    feats_scaled = scaler.transform(feats)
                    prob_ml = float(xgb.predict_proba(feats_scaled)[0][1])
                    # Blend pondéré : 60% statistique (fiable) + 40% ML (apprend patterns)
                    blended = 0.6 * result["probability"] + 0.4 * prob_ml
                    result["probability"] = round(float(np.clip(blended, 0.01, 0.99)), 4)
            except Exception:
                pass

        return result

    xgb = _load_model("xgb_model.pkl")
    scaler = _load_model("scaler.pkl")
    if xgb is not None and scaler is not None:
        try:
            rng = np.random.RandomState(product_id)
            proxy_sales = list(rng.poisson(lam=max(1, current_stock // max(horizon, 1)), size=30))
            feats = _ml_features(proxy_sales, current_stock, safety_stock, lead_time_days, horizon)
            if feats is not None:
                feats_scaled = scaler.transform(feats)
                prob = float(np.clip(xgb.predict_proba(feats_scaled)[0][1], 0.01, 0.99))
                return {
                    "probability": round(prob, 4),
                    "lower": round(max(0.01, prob - 0.10), 4),
                    "upper": round(min(0.99, prob + 0.10), 4),
                }
        except Exception:
            pass

    rng = np.random.RandomState(product_id + horizon)
    prob = float(np.clip(0.40 + rng.randn() * 0.12, 0.01, 0.99))
    return {
        "probability": round(prob, 4),
        "lower": round(max(0.0, prob - 0.12), 4),
        "upper": round(min(1.0, prob + 0.12), 4),
    }
