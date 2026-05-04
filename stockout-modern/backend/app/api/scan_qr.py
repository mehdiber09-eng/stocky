from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_db, get_current_user
from app.models import models
from app.services.ml_service import run_prediction

router = APIRouter()


class QRScanRequest(BaseModel):
    qr_data: str = Field(..., min_length=1, max_length=500, description="Contenu du QR code (product_id ou SKU)")


class QRScanResponse(BaseModel):
    product_id: int
    product_name: str
    sku: str
    current_stock: int
    risk_score: float
    risk_level: str
    recommendation: str
    alert_level: str
    lead_time_days: int
    safety_stock: int


@router.post("/", response_model=QRScanResponse, summary="Scan QR code → analyse IA instantanée")
async def scan_qr(
    payload: QRScanRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    qr_data = payload.qr_data.strip()

    product = None

    # Try product_id (integer)
    if qr_data.isdigit():
        candidate = await db.get(models.Product, int(qr_data))
        if candidate and candidate.owner_id == user.id:
            product = candidate

    # Try SKU (case-insensitive)
    if product is None:
        q = await db.execute(
            select(models.Product).where(
                models.Product.owner_id == user.id,
                func.lower(models.Product.sku) == qr_data.lower(),
            )
        )
        product = q.scalars().first()

    if product is None:
        raise HTTPException(status_code=404, detail="Aucun produit trouvé pour ce QR code")

    # Current inventory
    inv_q = await db.execute(
        select(models.Inventory).where(models.Inventory.product_id == product.id)
    )
    inventory = inv_q.scalars().first()
    current_stock = inventory.quantity if inventory else 0

    # Fetch recent sales for realistic prediction
    sales_q2 = await db.execute(
        select(models.Sale)
        .where(models.Sale.product_id == product.id, models.Sale.owner_id == user.id)
        .order_by(models.Sale.sold_at.asc())
        .limit(90)
    )
    sales_data = [s.quantity for s in sales_q2.scalars().all()]

    # IA prediction
    try:
        res = run_prediction(
            product.id,
            horizon=30,
            sales_data=sales_data,
            current_stock=current_stock,
            safety_stock=product.safety_stock,
            lead_time_days=product.lead_time_days,
        )
    except Exception:
        res = {"probability": 0.5, "lower": 0.4, "upper": 0.6}

    risk_score = res["probability"]

    if risk_score >= 0.8:
        risk_level = "CRITICAL"
        alert_level = "critical"
        recommendation = (
            f"URGENT — Commander immédiatement. Rupture quasi-certaine dans 30 jours. "
            f"Stock actuel: {current_stock} unités. Délai fournisseur: {product.lead_time_days}j."
        )
    elif risk_score >= 0.6:
        risk_level = "HIGH"
        alert_level = "warning"
        recommendation = (
            f"Commander rapidement. Risque élevé ({round(risk_score*100)}%). "
            f"Vérifier le stock de sécurité ({product.safety_stock} unités)."
        )
    elif risk_score >= 0.4:
        risk_level = "MEDIUM"
        alert_level = "warning"
        recommendation = (
            f"Surveiller ce produit. Risque modéré ({round(risk_score*100)}%). "
            f"Stock actuel: {current_stock} unités."
        )
    else:
        risk_level = "LOW"
        alert_level = "safe"
        recommendation = (
            f"Stock sain. {current_stock} unités disponibles. "
            f"Prochain réapprovisionnement dans environ {product.lead_time_days + 7} jours."
        )

    return QRScanResponse(
        product_id=product.id,
        product_name=product.name,
        sku=product.sku,
        current_stock=current_stock,
        risk_score=round(risk_score, 3),
        risk_level=risk_level,
        recommendation=recommendation,
        alert_level=alert_level,
        lead_time_days=product.lead_time_days,
        safety_stock=product.safety_stock,
    )
