from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user
from app.models import models
from app.models.schemas import SupplierCreate, SupplierOut

router = APIRouter()


def _supplier_score(lead_time_days: int, product_count: int, age_days: int) -> float:
    if lead_time_days <= 3:    delay = 5.0
    elif lead_time_days <= 7:  delay = 4.0
    elif lead_time_days <= 14: delay = 3.0
    elif lead_time_days <= 30: delay = 2.0
    else:                      delay = 1.0
    product_bonus = min(product_count * 0.2, 1.0)
    age_bonus = 0.5 if age_days > 90 else 0.0
    return round(min((delay + product_bonus + age_bonus) / 6.5 * 5, 5.0), 1)


@router.get("/with-scores")
async def list_suppliers_with_scores(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    q = await db.execute(
        select(models.Supplier).where(models.Supplier.owner_id == user.id).order_by(models.Supplier.name)
    )
    suppliers = q.scalars().all()
    now = datetime.now(timezone.utc)
    result = []
    for s in suppliers:
        count_q = await db.execute(
            select(func.count(models.Product.id))
            .where(models.Product.supplier_id == s.id, models.Product.owner_id == user.id)
        )
        product_count = count_q.scalar() or 0
        age_days = (now - s.created_at).days
        score = _supplier_score(s.lead_time_days, product_count, age_days)
        result.append({
            "id": s.id,
            "name": s.name,
            "contact_email": s.contact_email,
            "phone": s.phone,
            "lead_time_days": s.lead_time_days,
            "created_at": s.created_at.isoformat(),
            "reliability_score": score,
            "product_count": product_count,
        })
    return result


@router.get("/", response_model=List[SupplierOut])
async def list_suppliers(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    q = await db.execute(
        select(models.Supplier)
        .where(models.Supplier.owner_id == user.id)
        .order_by(models.Supplier.name)
    )
    return q.scalars().all()


@router.post("/", response_model=SupplierOut, status_code=201)
async def create_supplier(
    payload: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    s = models.Supplier(owner_id=user.id, **payload.dict())
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


@router.put("/{sid}", response_model=SupplierOut)
async def update_supplier(
    sid: int,
    payload: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    s = await db.get(models.Supplier, sid)
    if not s or s.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Fournisseur introuvable")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(s, k, v)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


@router.delete("/{sid}", status_code=204)
async def delete_supplier(
    sid: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    s = await db.get(models.Supplier, sid)
    if not s or s.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Fournisseur introuvable")
    await db.delete(s)
    await db.commit()
