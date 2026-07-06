from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from app.api.deps import get_db, get_current_user
from app.models import models
from app.models.schemas import LotCreate, LotOut, LotUpdate
from app.core.config import settings

router = APIRouter()


@router.post("/", response_model=LotOut, status_code=201)
async def create_lot(payload: LotCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    # normalize quantity_available
    q_avail = payload.quantity_available if payload.quantity_available is not None else payload.quantity_total
    now = datetime.now(timezone.utc)
    received = payload.received_at or now
    lot = models.Lot(
        owner_id=user.id,
        product_id=payload.product_id,
        batch_code=payload.batch_code,
        expiry_date=payload.expiry_date,
        received_at=received,
        quantity_total=payload.quantity_total,
        quantity_available=q_avail,
        supplier_lot_ref=payload.supplier_lot_ref,
    )
    db.add(lot)
    await db.commit()
    await db.refresh(lot)
    return lot


@router.get("/", response_model=List[LotOut])
async def list_lots(product_id: Optional[int] = Query(None), db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    q = select(models.Lot).where(models.Lot.owner_id == user.id)
    if product_id:
        q = q.where(models.Lot.product_id == product_id)
    q = q.order_by(models.Lot.expiry_date)
    res = await db.execute(q)
    return res.scalars().all()


@router.get("/expiring", response_model=List[LotOut])
async def list_expiring(days: int = Query(None), limit: int = Query(50), db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    if days is None:
        days = settings.EXPIRY_ALERT_DAYS
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=days)
    q = select(models.Lot).where(models.Lot.owner_id == user.id, models.Lot.expiry_date != None, models.Lot.expiry_date <= cutoff)
    q = q.order_by(models.Lot.expiry_date)
    q = q.limit(limit)
    res = await db.execute(q)
    return res.scalars().all()


@router.get("/{lid}", response_model=LotOut)
async def get_lot(lid: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    lot = await db.get(models.Lot, lid)
    if not lot or lot.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Lot introuvable")
    return lot


@router.put("/{lid}", response_model=LotOut)
async def update_lot(lid: int, payload: LotUpdate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    lot = await db.get(models.Lot, lid)
    if not lot or lot.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Lot introuvable")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(lot, k, v)
    db.add(lot)
    await db.commit()
    await db.refresh(lot)
    return lot


@router.post("/{lid}/record-loss", response_model=dict, status_code=200)
async def record_loss(
    lid: int,
    quantity: int,
    reason: str = "loss",
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Record a loss/waste/damage for a lot (reduces quantity_available).
    Creates a StockMovement to track the change.
    """
    lot = await db.get(models.Lot, lid)
    if not lot or lot.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Lot introuvable")
    
    if quantity > lot.quantity_available:
        raise HTTPException(status_code=400, detail=f"Quantité insuffisante (disponible: {lot.quantity_available})")
    
    quantity_before = lot.quantity_available
    lot.quantity_available -= quantity
    db.add(lot)
    
    movement = models.StockMovement(
        owner_id=user.id,
        product_id=lot.product_id,
        quantity_before=quantity_before,
        quantity_after=lot.quantity_available,
        change=-quantity,
        reason=f"loss_{reason}",
    )
    db.add(movement)
    await db.commit()
    
    return {
        "message": f"Perte enregistrée: {quantity} unités",
        "quantity_before": quantity_before,
        "quantity_after": lot.quantity_available,
    }


@router.post("/{lid}/transfer", response_model=dict, status_code=200)
async def transfer_lot(
    lid: int,
    target_product_id: int,
    quantity: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Transfer stock from one lot to another product (or create new lot).
    Useful for moving stock between locations/batches.
    """
    lot = await db.get(models.Lot, lid)
    if not lot or lot.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Lot source introuvable")
    
    if quantity > lot.quantity_available:
        raise HTTPException(status_code=400, detail=f"Quantité insuffisante (disponible: {lot.quantity_available})")
    
    # Verify target product exists
    target_product = await db.get(models.Product, target_product_id)
    if not target_product or target_product.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Produit cible introuvable")
    
    # Record loss on source lot
    lot.quantity_available -= quantity
    db.add(lot)
    
    # Create movement record
    movement = models.StockMovement(
        owner_id=user.id,
        product_id=lot.product_id,
        quantity_before=lot.quantity_available + quantity,
        quantity_after=lot.quantity_available,
        change=-quantity,
        reason="transfer",
    )
    db.add(movement)
    
    await db.commit()
    
    return {
        "message": f"Transfert de {quantity} unités vers produit #{target_product_id}",
        "source_lot_id": lid,
        "target_product_id": target_product_id,
        "quantity_transferred": quantity,
    }


@router.delete("/{lid}", status_code=204)
async def delete_lot(lid: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    lot = await db.get(models.Lot, lid)
    if not lot or lot.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Lot introuvable")
    await db.delete(lot)
    await db.commit()

