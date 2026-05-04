from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.api.deps import get_db, get_current_user
from app.models import models
from app.models.schemas import SupplierCreate, SupplierOut

router = APIRouter()


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
