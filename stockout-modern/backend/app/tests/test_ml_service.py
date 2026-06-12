import os
from app.services import ml_service


def test_run_prediction_keys():
    # simple smoke test: no sales -> returns probability and method
    res = ml_service.run_prediction(product_id=12345, horizon=30, sales_data=[], current_stock=10)
    assert 'probability' in res
    assert 'lower' in res
    assert 'upper' in res
    assert 'method' in res


def test_run_prediction_statistical():
    sales = [1,2,3,4,5,2,1,0,1,2,3]
    res = ml_service.run_prediction(product_id=1, horizon=7, sales_data=sales, current_stock=5)
    assert res['probability'] >= 0.0 and res['probability'] <= 1.0
    assert res['method'] in ('statistical', 'ml_blend', 'ml_proxy') or res['method']=='heuristic'
