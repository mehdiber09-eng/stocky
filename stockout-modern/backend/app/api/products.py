from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_user
from app.models.schemas import ProductCreate, ProductOut
from app.models import models

router = APIRouter()


@router.post("/", response_model=ProductOut, status_code=201)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    product = models.Product(
        owner_id=user.id,
        name=payload.name,
        sku=payload.sku,
        lead_time_days=payload.lead_time_days,
        safety_stock=payload.safety_stock,
    )
    db.add(product)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="SKU déjà utilisé")

    # Initialiser le stock
    inv = models.Inventory(
        owner_id=user.id,
        product_id=product.id,
        quantity=payload.initial_stock,
    )
    db.add(inv)
    await db.commit()
    await db.refresh(product)
    return product


@router.get("/", response_model=list[ProductOut])
async def list_products(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    q = await db.execute(
        select(models.Product)
        .where(models.Product.owner_id == user.id)
        .order_by(models.Product.created_at.desc())
    )
    return q.scalars().all()


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    p = await db.get(models.Product, product_id)
    if not p or p.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return p


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    p = await db.get(models.Product, product_id)
    if not p or p.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    await db.delete(p)
    await db.commit()
    return {"ok": True}
