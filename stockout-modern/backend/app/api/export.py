from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.api.deps import get_db, get_current_user
from app.models import models
from datetime import datetime
import csv
import io

router = APIRouter()


@router.get("/predictions/csv")
async def export_predictions_csv(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """Export historique des prédictions au format CSV (utilisateur courant)."""
    q = await db.execute(
        select(models.PredictionLog, models.Product.name)
        .join(models.Product, models.PredictionLog.product_id == models.Product.id)
        .where(models.PredictionLog.user_id == user.id)
        .order_by(desc(models.PredictionLog.predicted_at))
    )
    rows = q.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Produit", "Horizon (jours)", "Probabilité (%)", "Borne inf. (%)", "Borne sup. (%)", "Risque"])
    for log, name in rows:
        risk = "Élevé" if log.probability >= 0.7 else "Modéré" if log.probability >= 0.4 else "Faible"
        writer.writerow([
            log.predicted_at.strftime("%Y-%m-%d %H:%M"),
            name,
            log.horizon,
            round(log.probability * 100, 1),
            round((log.lower or 0) * 100, 1),
            round((log.upper or 0) * 100, 1),
            risk,
        ])

    output.seek(0)
    filename = f"stocksense_predictions_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/sales/csv")
async def export_sales_csv(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    """Export ventes au format CSV (utilisateur courant)."""
    q = await db.execute(
        select(models.Sale, models.Product.name, models.Product.sku)
        .join(models.Product, models.Sale.product_id == models.Product.id)
        .where(models.Sale.owner_id == user.id)
        .order_by(desc(models.Sale.sold_at))
    )
    rows = q.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Produit", "SKU", "Quantité"])
    for sale, name, sku in rows:
        writer.writerow([
            sale.sold_at.strftime("%Y-%m-%d %H:%M"),
            name,
            sku,
            sale.quantity,
        ])

    output.seek(0)
    filename = f"stocksense_ventes_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
