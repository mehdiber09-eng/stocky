import os
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping

ROOT = os.path.dirname(__file__)
DATA_DIR = os.path.join(ROOT, "..", "..", "data")
MODEL_DIR = os.path.join(ROOT, "models_artifacts")
os.makedirs(MODEL_DIR, exist_ok=True)

def train_xgb():
    df = pd.read_csv(os.path.join(DATA_DIR, "sample_sales.csv"))
    agg = df.groupby("product_id").quantity.sum().reset_index()
    agg["feature1"] = agg["quantity"]
    X = agg[["feature1"]].values
    y = (agg["feature1"] > agg["feature1"].median()).astype(int).values
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)
    xgb = XGBClassifier(use_label_encoder=False, eval_metric="logloss", n_estimators=50)
    xgb.fit(Xs, y)
    joblib.dump(xgb, os.path.join(MODEL_DIR, "xgb_model.pkl"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
    print("XGBoost trained and saved.")

def train_lstm():
    df = pd.read_csv(os.path.join(DATA_DIR, "sample_sales.csv"))
    seqs = []
    for pid, g in df.groupby("product_id"):
        arr = g.sort_values("sold_at").quantity.values
        if len(arr) < 10:
            arr = np.pad(arr, (10-len(arr),0), 'constant')
        seqs.append(arr[-10:])
    X = np.array(seqs)
    X = X.reshape((X.shape[0], X.shape[1], 1))
    y = X.mean(axis=1)
    model = Sequential([
        LSTM(32, input_shape=(X.shape[1], X.shape[2])),
        Dense(1)
    ])
    model.compile(optimizer="adam", loss="mse")
    es = EarlyStopping(patience=3, restore_best_weights=True)
    model.fit(X, y, epochs=20, batch_size=8, callbacks=[es], verbose=1)
    model.save(os.path.join(MODEL_DIR, "lstm_model.h5"))
    print("LSTM trained and saved.")

if __name__ == "__main__":
    train_xgb()
    train_lstm()
    print("Training complete.")
