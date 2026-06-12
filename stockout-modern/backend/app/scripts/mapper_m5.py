"""
Mapper for Kaggle M5 dataset -> raw time series similar to generate_synthetic_data output.
Expected input: a folder containing at least 'sales_train_validation.csv' and 'calendar.csv'.
Produces a DataFrame with columns: product_id, day (int), date (datetime), sold, demand, stock_after_sale,
lead_time, safety_stock, product_type, base_demand

Usage example:
from app.scripts.mapper_m5 import m5_to_raw
raw = m5_to_raw('/kaggle/input/m5-forecasting-accuracy', max_products=200, max_days=365)

Notes:
- Inventory is simulated (M5 doesn't include inventories). Defaults sensible but user should calibrate.
"""
import os
from typing import Optional
import numpy as np
import pandas as pd
from datetime import datetime


def m5_to_raw(dataset_dir: str, max_products: Optional[int] = None, max_days: Optional[int] = None,
              initial_stock_factor: float = 14.0, safety_stock_days: int = 7, reorder_qty_factor: float = 2.0,
              default_lead_time: int = 7):
    sales_fp = os.path.join(dataset_dir, 'sales_train_validation.csv')
    cal_fp = os.path.join(dataset_dir, 'calendar.csv')
    if not os.path.exists(sales_fp):
        raise FileNotFoundError(f"sales_train_validation.csv not found in {dataset_dir}")
    if not os.path.exists(cal_fp):
        raise FileNotFoundError(f"calendar.csv not found in {dataset_dir}")

    sales = pd.read_csv(sales_fp)
    cal = pd.read_csv(cal_fp)
    # calendar has d, date columns
    d_to_date = dict(zip(cal['d'], pd.to_datetime(cal['date'])))

    # Melt sales to long format
    id_cols = ['id', 'item_id', 'dept_id', 'cat_id', 'store_id', 'state_id']
    value_cols = [c for c in sales.columns if c.startswith('d_')]
    sales_long = sales.melt(id_vars=id_cols, value_vars=value_cols, var_name='d', value_name='sold')
    sales_long['date'] = sales_long['d'].map(d_to_date)
    # create a product key combining item_id and store_id
    sales_long['product_key'] = sales_long['item_id'].astype(str) + '|' + sales_long['store_id'].astype(str)

    products = sales_long['product_key'].unique()
    if max_products is not None:
        products = products[:max_products]

    rows = []
    prod_id_map = {k: i for i, k in enumerate(products)}

    for pk in products:
        prod_df = sales_long[sales_long['product_key'] == pk].sort_values('date')
        sold_arr = prod_df['sold'].fillna(0).astype(int).values
        dates = pd.to_datetime(prod_df['date']).values
        if len(sold_arr) == 0:
            continue
        if max_days is not None:
            sold_arr = sold_arr[:max_days]
            dates = dates[:max_days]
        mean_daily = float(np.mean(sold_arr)) if len(sold_arr) > 0 else 0.0
        base_demand = max(1, int(round(mean_daily)))
        # simulate inventory
        initial_stock = int(max(1, mean_daily * initial_stock_factor))
        safety_stock = int(max(0, mean_daily * safety_stock_days))
        lead_time = default_lead_time
        stock = initial_stock
        days_since_reorder = 0
        for day_idx, (d_sold, d_date) in enumerate(zip(sold_arr, dates)):
            demand = int(d_sold)
            actual_sold = min(demand, max(0, stock))
            stock -= actual_sold
            rows.append({
                'product_id': prod_id_map[pk],
                'day': day_idx,
                'date': pd.to_datetime(d_date),
                'sold': int(actual_sold),
                'demand': int(demand),
                'stock_after_sale': int(stock),
                'lead_time': int(lead_time),
                'safety_stock': int(safety_stock),
                'product_type': sales.loc[sales['item_id'] == prod_df['item_id'].iloc[0], 'dept_id'].iloc[0] if 'dept_id' in sales.columns else 'unknown',
                'base_demand': base_demand,
            })
            days_since_reorder += 1
            if stock <= safety_stock and days_since_reorder >= lead_time:
                reorder = int(max(1, mean_daily * lead_time * reorder_qty_factor)) + safety_stock
                stock += reorder
                days_since_reorder = 0

    raw = pd.DataFrame(rows)
    return raw
