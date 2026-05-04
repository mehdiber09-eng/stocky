import os
import math
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_squared_error
from xgboost import XGBRegressor

try:
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense
    from tensorflow.keras.callbacks import EarlyStopping
    HAS_KERAS = True
except ImportError:
    HAS_KERAS = False

try:
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    HAS_OPTUNA = True
except ImportError:
    HAS_OPTUNA = False

ROOT = os.path.dirname(__file__)
DATA_DIR = os.path.join(ROOT, "..", "..", "data")
MODEL_DIR = os.path.join(ROOT, "models_artifacts")
os.makedirs(MODEL_DIR, exist_ok=True)


def create_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(["product_id", "sold_at"]).copy()
    df["sold_at"] = pd.to_datetime(df["sold_at"])

    df["lag_1"] = df.groupby("product_id")["quantity"].shift(1)
    df["lag_7"] = df.groupby("product_id")["quantity"].shift(7)
    df["lag_14"] = df.groupby("product_id")["quantity"].shift(14)

    df["rolling_mean_7"] = df.groupby("product_id")["quantity"].transform(
        lambda x: x.rolling(7, min_periods=1).mean()
    )
    df["rolling_mean_14"] = df.groupby("product_id")["quantity"].transform(
        lambda x: x.rolling(14, min_periods=1).mean()
    )
    df["rolling_std_7"] = df.groupby("product_id")["quantity"].transform(
        lambda x: x.rolling(7, min_periods=2).std().fillna(0)
    )

    df["day_of_week"] = df["sold_at"].dt.dayofweek
    df["month"] = df["sold_at"].dt.month
    df["day_of_month"] = df["sold_at"].dt.day

    return df.dropna(subset=["lag_1", "lag_7"])


FEATURES = ["lag_1", "lag_7", "lag_14", "rolling_mean_7", "rolling_mean_14",
            "rolling_std_7", "day_of_week", "month", "day_of_month"]
TARGET = "quantity"


def train_xgb():
    csv = os.path.join(DATA_DIR, "sample_sales.csv")
    if not os.path.exists(csv):
        print("No training data found, skipping XGBoost training.")
        return

    df = pd.read_csv(csv)
    df = create_features(df)

    X = df[FEATURES]
    y = df[TARGET]

    split = int(len(df) * 0.8)
    X_train, X_val = X.iloc[:split], X.iloc[split:]
    y_train, y_val = y.iloc[:split], y.iloc[split:]

    if HAS_OPTUNA and len(df) >= 50:
        def objective(trial):
            params = {
                "n_estimators": trial.suggest_int("n_estimators", 50, 300),
                "max_depth": trial.suggest_int("max_depth", 3, 8),
                "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
                "subsample": trial.suggest_float("subsample", 0.6, 1.0),
                "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
                "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
            }
            model = XGBRegressor(**params, random_state=42, verbosity=0)
            tscv = TimeSeriesSplit(n_splits=3)
            scores = []
            for tr, va in tscv.split(X_train):
                model.fit(X_train.iloc[tr], y_train.iloc[tr])
                pred = model.predict(X_train.iloc[va])
                scores.append(math.sqrt(mean_squared_error(y_train.iloc[va], pred)))
            return float(np.mean(scores))

        study = optuna.create_study(direction="minimize")
        study.optimize(objective, n_trials=20, show_progress_bar=False)
        best_params = study.best_params
        print(f"Optuna best params: {best_params}, RMSE: {study.best_value:.3f}")
    else:
        best_params = {
            "n_estimators": 200,
            "max_depth": 5,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
        }

    model = XGBRegressor(**best_params, random_state=42, verbosity=0)

    # TimeSeriesSplit CV for final eval
    tscv = TimeSeriesSplit(n_splits=5)
    cv_scores = []
    for tr, va in tscv.split(X):
        model.fit(X.iloc[tr], y.iloc[tr])
        pred = model.predict(X.iloc[va])
        cv_scores.append(math.sqrt(mean_squared_error(y.iloc[va], pred)))
    print(f"XGBoost CV RMSE: {np.mean(cv_scores):.3f} ± {np.std(cv_scores):.3f}")

    model.fit(X_train, y_train)
    val_pred = model.predict(X_val)
    val_rmse = math.sqrt(mean_squared_error(y_val, val_pred))
    print(f"XGBoost val RMSE: {val_rmse:.3f}")

    scaler = StandardScaler()
    scaler.fit(X_train)
    joblib.dump(model, os.path.join(MODEL_DIR, "xgb_model.pkl"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "scaler.pkl"))
    joblib.dump(FEATURES, os.path.join(MODEL_DIR, "feature_names.pkl"))
    print("XGBoost model saved.")


def train_lstm():
    if not HAS_KERAS:
        print("TensorFlow not available, skipping LSTM training.")
        return

    csv = os.path.join(DATA_DIR, "sample_sales.csv")
    if not os.path.exists(csv):
        print("No training data found, skipping LSTM training.")
        return

    df = pd.read_csv(csv)
    sequences, targets = [], []

    for pid, g in df.groupby("product_id"):
        arr = g.sort_values("sold_at")["quantity"].values.astype(float)
        if len(arr) < 12:
            continue
        # Normalize per product
        mu, sigma = arr.mean(), arr.std() + 1e-6
        arr_n = (arr - mu) / sigma
        for i in range(10, len(arr_n)):
            sequences.append(arr_n[i - 10:i])
            targets.append(arr_n[i])

    if len(sequences) < 20:
        print("Not enough sequences for LSTM, skipping.")
        return

    X = np.array(sequences).reshape(-1, 10, 1)
    y = np.array(targets)

    split = int(len(X) * 0.8)
    X_tr, X_va = X[:split], X[split:]
    y_tr, y_va = y[:split], y[split:]

    model = Sequential([
        LSTM(64, input_shape=(10, 1), return_sequences=False),
        Dense(32, activation="relu"),
        Dense(1),
    ])
    model.compile(optimizer="adam", loss="mse")
    es = EarlyStopping(patience=5, restore_best_weights=True)
    model.fit(X_tr, y_tr, epochs=50, batch_size=16,
              validation_data=(X_va, y_va), callbacks=[es], verbose=0)

    val_pred = model.predict(X_va, verbose=0).flatten()
    val_rmse = math.sqrt(mean_squared_error(y_va, val_pred))
    print(f"LSTM val RMSE: {val_rmse:.4f} (normalized)")

    model.save(os.path.join(MODEL_DIR, "lstm_model.keras"))
    print("LSTM model saved.")


if __name__ == "__main__":
    print("Training XGBoost with Optuna + TimeSeriesSplit...")
    train_xgb()
    print("Training LSTM...")
    train_lstm()
    print("Training complete.")
