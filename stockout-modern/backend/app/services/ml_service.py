import os
import numpy as np
import joblib
from typing import Dict
from tensorflow.keras.models import load_model

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models_artifacts")
os.makedirs(MODEL_DIR, exist_ok=True)

def load_xgb():
    p = os.path.join(MODEL_DIR, "xgb_model.pkl")
    if os.path.exists(p):
        return joblib.load(p)
    return None

def load_scaler():
    p = os.path.join(MODEL_DIR, "scaler.pkl")
    if os.path.exists(p):
        return joblib.load(p)
    return None

def load_lstm():
    p = os.path.join(MODEL_DIR, "lstm_model.h5")
    if os.path.exists(p):
        return load_model(p)
    return None

def run_prediction(product_id: int, horizon: int) -> Dict:
    xgb = load_xgb()
    scaler = load_scaler()
    lstm = load_lstm()

    if xgb is None or lstm is None or scaler is None:
        rng = np.random.RandomState(product_id + horizon)
        prob = float(np.clip(0.4 + rng.randn()*0.12, 0.01, 0.99))
        lower = max(0.0, prob - 0.12)
        upper = min(1.0, prob + 0.12)
        return {"probability": prob, "lower": lower, "upper": upper}

    features = np.zeros((1,1))
    features_scaled = scaler.transform(features)
    prob = float(xgb.predict_proba(features_scaled)[:,1][0])

    seq = np.zeros((1,10,1))
    demand = float(lstm.predict(seq, verbose=0).mean())

    prob_adj = float(np.clip(prob * (1 + demand*0.01), 0.0, 1.0))
    lower = max(0.0, prob_adj - 0.1)
    upper = min(1.0, prob_adj + 0.1)
    return {"probability": prob_adj, "lower": lower, "upper": upper}
