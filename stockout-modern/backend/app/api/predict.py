from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.deps import get_db, get_current_user
from app.models.schemas import PredictRequest, PredictResponse
from app.services.ml_service import run_prediction
from app.services.redis_service import increment_free_trial, get_free_trials
from app.services.email_service import send_alert_email
from app.core.config import settings
from app.models import models
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=PredictResponse, summary="Run stockout prediction")
async def predict(
    payload: PredictRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trials_used = None
    trials_limit = None

    is_superuser = user.email.lower() in settings.superuser_emails_set

    # Auto-subscribe superusers in DB on first prediction (permanent, no more Redis check)
    if is_superuser and not user.is_subscribed:
        user.is_subscribed = True
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if not user.is_subscribed and not is_superuser:
        used = await get_free_trials(user.id)
        if used >= settings.FREE_TRIALS_LIMIT:
            raise HTTPException(
                status_code=403,
                detail=f"Limite d'essais gratuits atteinte ({settings.FREE_TRIALS_LIMIT}). Abonnez-vous pour continuer.",
            )
        new_count = await increment_free_trial(user.id)
        trials_used = new_count
        trials_limit = settings.FREE_TRIALS_LIMIT

    product = await db.get(models.Product, payload.product_id)
    if not product or product.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    # Fetch recent sales (90 days) for statistical prediction
    sales_q = await db.execute(
        select(models.Sale)
        .where(models.Sale.product_id == payload.product_id, models.Sale.owner_id == user.id)
        .order_by(models.Sale.sold_at.asc())
        .limit(90)
    )
    sales_rows = sales_q.scalars().all()
    sales_data = [s.quantity for s in sales_rows]

    # Fetch current inventory
    inv_q = await db.execute(
        select(models.Inventory).where(models.Inventory.product_id == payload.product_id)
    )
    inventory = inv_q.scalars().first()
    current_stock = inventory.quantity if inventory else 0

    try:
        res = run_prediction(
            payload.product_id,
            payload.horizon,
            sales_data=sales_data,
            current_stock=current_stock,
            safety_stock=product.safety_stock,
            lead_time_days=product.lead_time_days,
        )
    except Exception as e:
        logger.exception(f"ML prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Service de prédiction indisponible")

    log = models.PredictionLog(
        user_id=user.id,
        product_id=payload.product_id,
        horizon=payload.horizon,
        probability=res["probability"],
        lower=res["lower"],
        upper=res["upper"],
    )
    db.add(log)

    # Notification + email si seuil dépassé (seuil per-user ou global par défaut)
    alert_threshold = getattr(user, "alert_threshold", None) or settings.ALERT_THRESHOLD
    if res["probability"] >= alert_threshold:
        severity = "critical" if res["probability"] >= 0.7 else "warning"
        pct = round(res["probability"] * 100, 1)
        db.add(models.Notification(
            user_id=user.id,
            product_id=product.id,
            kind="stockout_risk",
            severity=severity,
            title=f"Risque de rupture {pct}%",
            message=f"{product.name} a {pct}% de risque de rupture sur {payload.horizon} jours",
        ))
        background_tasks.add_task(
            send_alert_email,
            to_email=user.email,
            product_name=product.name,
            probability=res["probability"],
            horizon=payload.horizon,
        )

    await db.commit()

    return PredictResponse(
        probability=res["probability"],
        lower=res["lower"],
        upper=res["upper"],
        trials_used=trials_used,
        trials_limit=trials_limit,
    )


@router.post("/batch", summary="Run stockout prediction for all products at once")
async def predict_batch(
    horizon: int = Query(default=30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    is_superuser = user.email.lower() in settings.superuser_emails_set

    if is_superuser and not user.is_subscribed:
        user.is_subscribed = True
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if not user.is_subscribed and not is_superuser:
        used = await get_free_trials(user.id)
        if used >= settings.FREE_TRIALS_LIMIT:
            raise HTTPException(
                status_code=403,
                detail=f"Limite d'essais gratuits atteinte ({settings.FREE_TRIALS_LIMIT}). Abonnez-vous pour continuer.",
            )
        await increment_free_trial(user.id)

    products_q = await db.execute(
        select(models.Product).where(models.Product.owner_id == user.id)
    )
    products = products_q.scalars().all()

    if not products:
        return {"results": [], "summary": {"high": 0, "medium": 0, "low": 0, "total": 0}}

    # Pre-fetch all sales and inventories for efficiency
    all_sales_q = await db.execute(
        select(models.Sale)
        .where(models.Sale.owner_id == user.id)
        .order_by(models.Sale.sold_at.asc())
    )
    all_sales = all_sales_q.scalars().all()
    sales_by_product: dict = {}
    for s in all_sales:
        sales_by_product.setdefault(s.product_id, []).append(s.quantity)

    all_inv_q = await db.execute(
        select(models.Inventory).where(models.Inventory.owner_id == user.id)
    )
    inv_by_product = {i.product_id: i.quantity for i in all_inv_q.scalars().all()}

    results = []
    for product in products:
        try:
            res = run_prediction(
                product.id,
                horizon,
                sales_data=sales_by_product.get(product.id, []),
                current_stock=inv_by_product.get(product.id, 0),
                safety_stock=product.safety_stock,
                lead_time_days=product.lead_time_days,
            )
        except Exception:
            res = {"probability": 0.5, "lower": 0.4, "upper": 0.6}

        risk = "high" if res["probability"] >= 0.7 else "medium" if res["probability"] >= 0.4 else "low"
        db.add(models.PredictionLog(
            user_id=user.id,
            product_id=product.id,
            horizon=horizon,
            probability=res["probability"],
            lower=res["lower"],
            upper=res["upper"],
        ))
        results.append({
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "probability": res["probability"],
            "lower": res["lower"],
            "upper": res["upper"],
            "risk": risk,
            "horizon": horizon,
        })

    await db.commit()

    summary = {
        "high": sum(1 for r in results if r["risk"] == "high"),
        "medium": sum(1 for r in results if r["risk"] == "medium"),
        "low": sum(1 for r in results if r["risk"] == "low"),
        "total": len(results),
    }
    return {
        "results": sorted(results, key=lambda x: x["probability"], reverse=True),
        "summary": summary,
    }
