from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, and_
from app.api.deps import get_db, get_current_user
from app.models import models
from datetime import datetime, timezone, timedelta

router = APIRouter()


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """Tableau de bord global de l'utilisateur."""
    total_products = (await db.execute(
        select(func.count(models.Product.id)).where(models.Product.owner_id == user.id)
    )).scalar()

    total_preds = (await db.execute(
        select(func.count(models.PredictionLog.id)).where(models.PredictionLog.user_id == user.id)
    )).scalar()

    high_risk = (await db.execute(
        select(func.count(models.PredictionLog.id)).where(
            and_(
                models.PredictionLog.user_id == user.id,
                models.PredictionLog.probability >= 0.5,
            )
        )
    )).scalar()

    avg_prob = (await db.execute(
        select(func.avg(models.PredictionLog.probability))
        .where(models.PredictionLog.user_id == user.id)
    )).scalar()

    total_sales_qty = (await db.execute(
        select(func.sum(models.Sale.quantity)).where(models.Sale.owner_id == user.id)
    )).scalar()

    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_sales = (await db.execute(
        select(func.sum(models.Sale.quantity)).where(
            and_(
                models.Sale.owner_id == user.id,
                models.Sale.sold_at >= thirty_days_ago,
            )
        )
    )).scalar()

    # Valeur du stock (unit_price × quantité) en devise de saisie
    inv_value_q = await db.execute(
        select(models.Inventory.quantity, models.Product.unit_price, models.Product.price_currency)
        .join(models.Product, models.Product.id == models.Inventory.product_id)
        .where(models.Product.owner_id == user.id, models.Product.unit_price.isnot(None))
    )
    inv_rows = inv_value_q.all()
    total_inventory_value_dzd = sum(
        (qty or 0) * (price or 0) * (
            1 if cur == "DZD" else
            149.25 if cur == "EUR" else
            135.14 if cur == "USD" else
            36.79 if cur == "AED" else 1
        )
        for qty, price, cur in inv_rows
    )

    return {
        "total_products": total_products or 0,
        "total_predictions": total_preds or 0,
        "high_risk_predictions": high_risk or 0,
        "avg_probability": round(float(avg_prob or 0), 3),
        "total_sales_qty": int(total_sales_qty or 0),
        "recent_sales_qty": int(recent_sales or 0),
        "total_inventory_value_dzd": round(total_inventory_value_dzd, 2),
    }


@router.get("/predictions/history")
async def prediction_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """N dernières prédictions avec nom du produit."""
    q = await db.execute(
        select(models.PredictionLog, models.Product.name)
        .join(models.Product, models.PredictionLog.product_id == models.Product.id)
        .where(models.PredictionLog.user_id == user.id)
        .order_by(desc(models.PredictionLog.predicted_at))
        .limit(min(limit, 200))
    )
    rows = q.all()
    return [
        {
            "id": log.id,
            "product_id": log.product_id,
            "product_name": name,
            "horizon": log.horizon,
            "probability": log.probability,
            "lower": log.lower,
            "upper": log.upper,
            "predicted_at": log.predicted_at.isoformat(),
            "risk": "high" if log.probability >= 0.7 else "medium" if log.probability >= 0.4 else "low",
        }
        for log, name in rows
    ]


@router.get("/sales/by-product")
async def sales_by_product(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """Quantité totale vendue groupée par produit (ses produits seulement)."""
    q = await db.execute(
        select(models.Product.name, func.sum(models.Sale.quantity).label("total"))
        .join(models.Sale, models.Sale.product_id == models.Product.id)
        .where(models.Product.owner_id == user.id)
        .group_by(models.Product.name)
        .order_by(desc("total"))
    )
    rows = q.all()
    return [{"product": name, "total": int(total or 0)} for name, total in rows]


@router.get("/predictions/by-risk")
async def predictions_by_risk(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """Distribution des prédictions par niveau de risque."""
    q = await db.execute(
        select(models.PredictionLog.probability)
        .where(models.PredictionLog.user_id == user.id)
    )
    probs = [r[0] for r in q.all()]
    return {
        "low": sum(1 for p in probs if p < 0.4),
        "medium": sum(1 for p in probs if 0.4 <= p < 0.7),
        "high": sum(1 for p in probs if p >= 0.7),
    }


@router.get("/inventory-health")
async def inventory_health(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """ABC classification, reorder points, and days-of-coverage per product."""
    now = datetime.now(timezone.utc)
    ninety_days_ago = now - timedelta(days=90)
    thirty_days_ago = now - timedelta(days=30)

    products_q = await db.execute(
        select(models.Product, models.Inventory.quantity.label("stock"))
        .outerjoin(models.Inventory, models.Inventory.product_id == models.Product.id)
        .where(models.Product.owner_id == user.id)
        .order_by(models.Product.id)
    )
    products = products_q.all()

    if not products:
        return []

    sales_q = await db.execute(
        select(models.Sale.product_id, models.Sale.quantity, models.Sale.sold_at)
        .where(and_(models.Sale.owner_id == user.id, models.Sale.sold_at >= ninety_days_ago))
    )
    sales_raw = sales_q.all()

    sales_by_product: dict = defaultdict(list)
    for pid, qty, sold_at in sales_raw:
        sales_by_product[pid].append((qty, sold_at))

    product_data = []
    for product, stock in products:
        stock = stock or 0
        prod_sales = sales_by_product.get(product.id, [])

        sales_30d = sum(qty for qty, d in prod_sales if d >= thirty_days_ago)
        sales_90d = sum(qty for qty, _ in prod_sales)

        avg_daily_30d = sales_30d / 30.0

        reorder_point = product.safety_stock + round(avg_daily_30d * product.lead_time_days)
        days_coverage = round(stock / avg_daily_30d) if avg_daily_30d > 0 else None

        product_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "current_stock": stock,
            "avg_daily_sales_30d": round(avg_daily_30d, 2),
            "sales_30d": sales_30d,
            "sales_90d_total": sales_90d,
            "reorder_point": reorder_point,
            "days_of_coverage": days_coverage,
            "needs_reorder": stock <= reorder_point,
            "lead_time_days": product.lead_time_days,
            "safety_stock": product.safety_stock,
            "abc_class": "C",
            "status": "ok",
        })

    # ABC classification by 90d revenue contribution
    total_sales = sum(d["sales_90d_total"] for d in product_data)
    if total_sales > 0:
        cumulative = 0
        for d in sorted(product_data, key=lambda x: x["sales_90d_total"], reverse=True):
            cumulative += d["sales_90d_total"]
            pct = cumulative / total_sales
            if pct <= 0.70:
                d["abc_class"] = "A"
            elif pct <= 0.90:
                d["abc_class"] = "B"
            else:
                d["abc_class"] = "C"

    # Stock status
    for d in product_data:
        if d["current_stock"] == 0:
            d["status"] = "critical"
        elif d["needs_reorder"]:
            d["status"] = "warning"
        elif d["days_of_coverage"] is not None and d["days_of_coverage"] > 90:
            d["status"] = "overstock"
        else:
            d["status"] = "ok"

    status_order = {"critical": 0, "warning": 1, "ok": 2, "overstock": 3}
    return sorted(product_data, key=lambda x: (status_order[x["status"]], x["product_name"]))


@router.get("/sales-velocity")
async def sales_velocity(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """Rolling 7d/30d/90d daily sales velocity with trend direction per product."""
    now = datetime.now(timezone.utc)
    ninety_days_ago = now - timedelta(days=90)

    products_q = await db.execute(
        select(models.Product).where(models.Product.owner_id == user.id)
    )
    products = {p.id: p for p in products_q.scalars().all()}

    if not products:
        return []

    sales_q = await db.execute(
        select(models.Sale.product_id, models.Sale.quantity, models.Sale.sold_at)
        .where(and_(models.Sale.owner_id == user.id, models.Sale.sold_at >= ninety_days_ago))
    )
    sales_raw = sales_q.all()

    sales_by_product: dict = defaultdict(list)
    for pid, qty, sold_at in sales_raw:
        sales_by_product[pid].append((qty, sold_at))

    result = []
    for pid, product in products.items():
        prod_sales = sales_by_product.get(pid, [])
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)

        v7 = sum(qty for qty, d in prod_sales if d >= seven_days_ago) / 7.0
        v30 = sum(qty for qty, d in prod_sales if d >= thirty_days_ago) / 30.0
        v90 = sum(qty for qty, _ in prod_sales) / 90.0
        v30_prev = sum(qty for qty, d in prod_sales if sixty_days_ago <= d < thirty_days_ago) / 30.0

        if v30_prev > 0:
            trend_pct = round((v30 - v30_prev) / v30_prev * 100, 1)
        elif v30 > 0:
            trend_pct = 100.0
        else:
            trend_pct = 0.0

        trend = "accelerating" if trend_pct > 15 else "decelerating" if trend_pct < -15 else "stable"

        result.append({
            "product_id": pid,
            "product_name": product.name,
            "sku": product.sku,
            "velocity_7d": round(v7, 2),
            "velocity_30d": round(v30, 2),
            "velocity_90d": round(v90, 2),
            "trend": trend,
            "trend_pct": trend_pct,
        })

    return sorted(result, key=lambda x: x["velocity_30d"], reverse=True)


@router.get("/stock-rotation")
async def stock_rotation(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """DSI, taux de rotation annuel et produits dormants."""
    now = datetime.now(timezone.utc)
    one_year_ago = now - timedelta(days=365)
    thirty_days_ago = now - timedelta(days=30)

    products_q = await db.execute(
        select(models.Product, models.Inventory.quantity.label("stock"))
        .outerjoin(models.Inventory, models.Inventory.product_id == models.Product.id)
        .where(models.Product.owner_id == user.id)
    )
    products = products_q.all()
    if not products:
        return []

    sales_q = await db.execute(
        select(models.Sale.product_id, models.Sale.quantity, models.Sale.sold_at)
        .where(and_(models.Sale.owner_id == user.id, models.Sale.sold_at >= one_year_ago))
    )
    sales_raw = sales_q.all()

    sales_by_pid: dict = defaultdict(list)
    last_sale_by_pid: dict = {}
    for pid, qty, sold_at in sales_raw:
        sales_by_pid[pid].append(qty)
        if pid not in last_sale_by_pid or sold_at > last_sale_by_pid[pid]:
            last_sale_by_pid[pid] = sold_at

    result = []
    for product, stock in products:
        stock = stock or 0
        sales_365 = sum(sales_by_pid.get(product.id, []))
        last_sale = last_sale_by_pid.get(product.id)
        days_since = (now - last_sale).days if last_sale else None
        is_dormant = (days_since is None or days_since > 30) and stock > 0

        daily_avg = sales_365 / 365.0
        dsi = round(stock / daily_avg, 1) if daily_avg > 0 else None
        rotation_rate = round(365.0 / dsi, 2) if dsi and dsi > 0 else None

        result.append({
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "current_stock": stock,
            "dsi": dsi,
            "rotation_rate": rotation_rate,
            "is_dormant": is_dormant,
            "last_sale_date": last_sale.isoformat() if last_sale else None,
            "days_since_last_sale": days_since,
            "sales_365d": sales_365,
        })

    return sorted(result, key=lambda x: (not x["is_dormant"], x["dsi"] or 9999))


@router.get("/margins")
async def margins(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """Marge brute et valorisation du stock par produit."""
    TO_DZD = {"DZD": 1.0, "EUR": 149.25, "USD": 135.14, "AED": 36.79}

    products_q = await db.execute(
        select(models.Product, models.Inventory.quantity.label("stock"))
        .outerjoin(models.Inventory, models.Inventory.product_id == models.Product.id)
        .where(
            models.Product.owner_id == user.id,
            models.Product.unit_price.isnot(None),
        )
    )
    rows = products_q.all()

    result = []
    for product, stock in rows:
        stock = stock or 0
        rate = TO_DZD.get(product.price_currency, 1.0)
        unit_dzd = (product.unit_price or 0) * rate
        cost_dzd = (product.cost_price or 0) * rate if product.cost_price else None
        margin_abs = round(unit_dzd - cost_dzd, 2) if cost_dzd is not None else None
        margin_pct = round(margin_abs / unit_dzd * 100, 1) if (cost_dzd is not None and unit_dzd > 0) else None
        stock_value = round(stock * unit_dzd, 2)

        result.append({
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "unit_price_dzd": round(unit_dzd, 2),
            "cost_price_dzd": round(cost_dzd, 2) if cost_dzd is not None else None,
            "margin_absolute": margin_abs,
            "margin_pct": margin_pct,
            "current_stock": stock,
            "stock_value_dzd": stock_value,
            "price_currency": product.price_currency,
        })

    return sorted(result, key=lambda x: (x["margin_pct"] or -999), reverse=True)
