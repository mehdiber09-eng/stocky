from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_db, get_current_user
from app.models import models

router = APIRouter()


@router.get("/", summary="État du système de protection Stocky")
async def get_system_status(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)
    twenty_four_hours_ago = now - timedelta(hours=24)

    # Unread critical notifications
    crit_q = await db.execute(
        select(models.Notification).where(
            models.Notification.user_id == user.id,
            models.Notification.severity == "critical",
            models.Notification.is_read == False,
        )
    )
    critical_notifs = crit_q.scalars().all()

    # Unread warning notifications
    warn_q = await db.execute(
        select(models.Notification).where(
            models.Notification.user_id == user.id,
            models.Notification.severity == "warning",
            models.Notification.is_read == False,
        )
    )
    warning_notifs = warn_q.scalars().all()

    # Recent predictions (1h) — detect anomalous rates
    recent_preds_q = await db.execute(
        select(models.PredictionLog).where(
            models.PredictionLog.user_id == user.id,
            models.PredictionLog.predicted_at >= one_hour_ago,
        )
    )
    recent_preds = recent_preds_q.scalars().all()

    # High-risk predictions last 24h
    high_risk_q = await db.execute(
        select(models.PredictionLog).where(
            models.PredictionLog.user_id == user.id,
            models.PredictionLog.probability >= 0.7,
            models.PredictionLog.predicted_at >= twenty_four_hours_ago,
        )
    )
    high_risk_preds = high_risk_q.scalars().all()

    # Collect product names at high risk
    high_risk_product_ids = list({p.product_id for p in high_risk_preds})[:5]
    high_risk_product_names = []
    for pid in high_risk_product_ids:
        prod = await db.get(models.Product, pid)
        if prod:
            high_risk_product_names.append(prod.name)

    # Total products
    prods_q = await db.execute(
        select(models.Product).where(models.Product.owner_id == user.id)
    )
    total_products = len(prods_q.scalars().all())

    # Security events (suspicious: >50 predictions in 1 hour)
    suspicious_rate = len(recent_preds) > 50
    security_events = []
    if suspicious_rate:
        security_events.append({
            "type": "rate_anomaly",
            "message": f"Taux de requêtes élevé: {len(recent_preds)} prédictions/heure",
            "severity": "warning",
        })
    if critical_notifs:
        security_events.append({
            "type": "critical_alerts",
            "message": f"{len(critical_notifs)} alerte(s) critique(s) non lues",
            "severity": "critical",
        })

    # Overall status
    if len(critical_notifs) >= 2 or suspicious_rate:
        status = "CRITICAL"
        status_color = "red"
        message = f"{len(critical_notifs)} alertes critiques — vérification requise"
    elif len(critical_notifs) >= 1 or len(warning_notifs) >= 3 or len(high_risk_product_ids) > 0:
        status = "WARNING"
        status_color = "orange"
        message = f"{len(high_risk_product_ids)} produit(s) à risque élevé détecté(s)"
    else:
        status = "SAFE"
        status_color = "green"
        message = "Tous les systèmes opérationnels"

    return {
        "status": status,
        "status_color": status_color,
        "message": message,
        "stats": {
            "total_products": total_products,
            "critical_notifications": len(critical_notifs),
            "warning_notifications": len(warning_notifs),
            "predictions_last_hour": len(recent_preds),
            "high_risk_products_24h": len(high_risk_product_ids),
        },
        "high_risk_products": high_risk_product_names,
        "security_events": security_events,
        "timestamp": now.isoformat(),
    }
