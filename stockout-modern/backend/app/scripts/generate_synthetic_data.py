"""
Génère des données synthétiques réalistes pour entraîner le modèle XGBoost.

Simule des commerces algériens/français avec :
- Saisonnalité hebdomadaire (vendredi/samedi fort en Algérie)
- Pic Ramadan (×1.5-2.5 selon catégorie)
- Variabilité de demande (Poisson)
- Gestion de stock avec réapprovisionnements
- Labels de rupture sur 7/14/30 jours horizon
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict

# Profils de produits — base_demand = ventes moyennes/jour
PRODUCT_TYPES = [
    {
        "name": "épicerie_rapide",    # Lait, yaourt, pain
        "base_demand": 15,
        "weekly": [1.0, 1.0, 1.0, 1.0, 1.3, 1.9, 1.6],
        "ramadan": 1.8,
        "noise": 0.35,
    },
    {
        "name": "épicerie_lente",     # Conserves, huile, sucre
        "base_demand": 6,
        "weekly": [0.9, 0.9, 0.9, 0.9, 1.1, 1.5, 1.2],
        "ramadan": 1.5,
        "noise": 0.30,
    },
    {
        "name": "pharmacie",          # Médicaments courants
        "base_demand": 8,
        "weekly": [1.1, 1.1, 1.0, 1.0, 1.0, 1.2, 0.7],
        "ramadan": 1.1,
        "noise": 0.25,
    },
    {
        "name": "vêtements",          # Prêt-à-porter
        "base_demand": 3,
        "weekly": [0.6, 0.7, 0.7, 0.8, 1.0, 2.0, 2.2],
        "ramadan": 2.8,
        "noise": 0.5,
    },
    {
        "name": "électronique",       # Accessoires, petits appareils
        "base_demand": 2,
        "weekly": [0.7, 0.7, 0.8, 0.8, 1.0, 1.7, 2.0],
        "ramadan": 1.0,
        "noise": 0.6,
    },
    {
        "name": "cosmétiques",        # Soins, parfums
        "base_demand": 5,
        "weekly": [0.8, 0.8, 0.8, 0.8, 1.1, 1.7, 1.8],
        "ramadan": 1.6,
        "noise": 0.4,
    },
]


def generate_product_history(
    product_id: int,
    ptype: Dict,
    n_days: int,
    rng: np.random.RandomState,
) -> List[Dict]:
    """Simule l'historique de ventes et stock d'un produit."""
    base = max(1, int(rng.normal(ptype["base_demand"], ptype["base_demand"] * 0.25)))
    lead_time = int(rng.choice([3, 5, 7, 10, 14, 21]))
    safety_stock = max(0, int(base * rng.uniform(0.1, 1.2)))
    initial_stock = int(base * rng.uniform(8, 25))
    reorder_qty_factor = rng.uniform(1.5, 3.0)

    stock = initial_stock
    records = []
    days_since_reorder = 0

    for day in range(n_days):
        date = datetime(2024, 1, 1) + timedelta(days=day)

        # Ramadan 2024 : 11 mars – 9 avril (jours 70–99)
        is_ramadan = 70 <= day <= 99
        ramadan_factor = ptype["ramadan"] if is_ramadan else 1.0

        day_factor = ptype["weekly"][date.weekday()]
        noise = 1.0 + rng.normal(0, ptype["noise"])
        mu = max(0.1, base * day_factor * ramadan_factor * noise)
        demand = int(rng.poisson(mu))

        actual_sold = min(demand, max(0, stock))
        stock -= actual_sold

        records.append({
            "product_id": product_id,
            "day": day,
            "date": date,
            "sold": actual_sold,
            "demand": demand,
            "stock_after_sale": stock,
            "lead_time": lead_time,
            "safety_stock": safety_stock,
            "product_type": ptype["name"],
            "base_demand": base,
        })

        # Réapprovisionnement quand stock bas
        days_since_reorder += 1
        if stock <= safety_stock and days_since_reorder >= lead_time:
            reorder = int(base * lead_time * reorder_qty_factor) + safety_stock
            stock += reorder
            days_since_reorder = 0

    return records


def generate_dataset(n_products: int = 300, n_days: int = 365) -> pd.DataFrame:
    """Génère le dataset brut (une ligne par produit × jour)."""
    all_records = []
    rng = np.random.RandomState(42)

    for prod_idx in range(n_products):
        ptype = PRODUCT_TYPES[prod_idx % len(PRODUCT_TYPES)]
        prod_rng = np.random.RandomState(42 + prod_idx * 17)
        records = generate_product_history(prod_idx, ptype, n_days, prod_rng)
        all_records.extend(records)

    return pd.DataFrame(all_records)


def build_features(df: pd.DataFrame, horizons: List[int] = None) -> pd.DataFrame:
    """
    Calcule les features ML à partir du dataset brut.
    Retourne un DataFrame entraînable avec label 'stockout'.
    """
    if horizons is None:
        horizons = [7, 14, 30]

    features_list = []

    for prod_id in df["product_id"].unique():
        prod_df = df[df["product_id"] == prod_id].sort_values("day").copy()
        sales = prod_df["sold"].values
        stocks = prod_df["stock_after_sale"].values

        # Min 30 jours d'historique pour avoir des features significatives
        for i in range(30, len(prod_df) - max(horizons)):
            row = prod_df.iloc[i]
            s = sales[:i]

            lag_1 = float(s[-1])
            lag_7 = float(np.mean(s[-7:])) if len(s) >= 7 else float(np.mean(s))
            lag_14 = float(np.mean(s[-14:])) if len(s) >= 14 else lag_7
            lag_30 = float(np.mean(s[-30:])) if len(s) >= 30 else lag_14
            rolling_std_7 = float(np.std(s[-7:])) if len(s) >= 7 else 0.0
            rolling_std_14 = float(np.std(s[-14:])) if len(s) >= 14 else rolling_std_7
            current_stock = float(row["stock_after_sale"])
            safety_stock = float(row["safety_stock"])
            stock_to_demand = current_stock / max(lag_7, 0.1)

            for horizon in horizons:
                future_end = min(i + horizon, len(prod_df))
                future_stocks = stocks[i:future_end]
                stockout = int(np.any(future_stocks <= safety_stock))

                features_list.append({
                    "lag_1": lag_1,
                    "lag_7": lag_7,
                    "lag_14": lag_14,
                    "lag_30": lag_30,
                    "rolling_mean_7": lag_7,
                    "rolling_mean_14": lag_14,
                    "rolling_std_7": rolling_std_7,
                    "rolling_std_14": rolling_std_14,
                    "current_stock": current_stock,
                    "safety_stock": safety_stock,
                    "stock_to_demand_ratio": stock_to_demand,
                    "lead_time": float(row["lead_time"]),
                    "day_of_week": float(row["date"].weekday()),
                    "month": float(row["date"].month),
                    "horizon": float(horizon),
                    "stockout": stockout,
                })

    return pd.DataFrame(features_list)


if __name__ == "__main__":
    print("Génération du dataset synthétique...")
    raw = generate_dataset(n_products=300, n_days=365)
    print(f"Dataset brut : {len(raw):,} lignes")
    features = build_features(raw)
    print(f"Features ML  : {len(features):,} exemples")
    print(f"Taux rupture : {features['stockout'].mean():.1%}")
    print(features.describe())
