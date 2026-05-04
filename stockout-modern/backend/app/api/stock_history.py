from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import List

from app.api.deps import get_db, get_current_user
from app.models import models
from app.models.schemas import StockMovementOut

router = APIRouter()


@router.get("/{product_id}", response_model=List[StockMovementOut])
async def stock_history(
    product_id: int,
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    product = await db.get(models.Product, product_id)
    if not product or product.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    q = await db.execute(
        select(models.StockMovement)
        .where(models.StockMovement.product_id == product_id)
        .order_by(desc(models.StockMovement.created_at))
        .limit(limit)
    )
    return q.scalars().all()
