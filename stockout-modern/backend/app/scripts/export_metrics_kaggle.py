"""
Utility to export model metrics into Kaggle-friendly artifacts:
- prints metrics (EN and FR)
- writes metrics.csv for quick upload/visualization
Usage: python -m app.scripts.export_metrics_kaggle
"""
import os
import json
import csv

MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'models_artifacts')
MODEL_DIR = os.path.abspath(MODEL_DIR)

if __name__ == '__main__':
    mfile = os.path.join(MODEL_DIR, 'metrics.json')
    mfr = os.path.join(MODEL_DIR, 'metrics_fr.json')
    if not os.path.exists(mfile):
        print('metrics.json not found in', MODEL_DIR)
        raise SystemExit(1)
    with open(mfile, 'r') as f:
        metrics = json.load(f)
    metrics_fr = {}
    if os.path.exists(mfr):
        with open(mfr, 'r', encoding='utf-8') as f:
            metrics_fr = json.load(f)

    print('\nMetrics (EN):')
    for k, v in metrics.items():
        print(f"  {k}: {v}")

    if metrics_fr:
        print('\nMetrics (FR):')
        for k, v in metrics_fr.items():
            print(f"  {k}: {v}")

    # write CSV for Kaggle
    out_csv = os.path.join(MODEL_DIR, 'metrics_kaggle.csv')
    with open(out_csv, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['metric', 'value', 'lang'])
        for k, v in metrics.items():
            writer.writerow([k, v, 'en'])
        for k, v in metrics_fr.items():
            writer.writerow([k, v, 'fr'])

    print('\nWrote metrics_kaggle.csv to', out_csv)
