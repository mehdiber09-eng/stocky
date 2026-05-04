from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.api.deps import get_db, get_current_user
from app.models.schemas import SaleCreate, SaleOut
from app.models import models

router = APIRouter()


@router.post("/", status_code=201)
async def add_sale(
    payload: SaleCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    product = await db.get(models.Product, payload.product_id)
    if not product or product.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    sale = models.Sale(
        owner_id=user.id,
        product_id=payload.product_id,
        quantity=payload.quantity,
    )
    db.add(sale)

    # Mise à jour ou création de l'inventaire
    q = await db.execute(
        select(models.Inventory).where(models.Inventory.product_id == payload.product_id)
    )
    inv = q.scalars().first()
    if inv:
        new_qty = max(0, inv.quantity - payload.quantity)
        await db.execute(
            update(models.Inventory)
            .where(models.Inventory.product_id == payload.product_id)
            .values(quantity=new_qty)
        )
    else:
        inv = models.Inventory(
            owner_id=user.id,
            product_id=payload.product_id,
            quantity=0,
        )
        db.add(inv)

    # Notification stock bas
    new_qty_val = max(0, (inv.quantity if inv else 0) - payload.quantity)
    if new_qty_val <= product.safety_stock and new_qty_val > 0:
        db.add(models.Notification(
            user_id=user.id,
            product_id=product.id,
            kind="low_stock",
            severity="warning",
            title="Stock bas",
            message=f"{product.name} : il reste {new_qty_val} unité(s), seuil de sécurité {product.safety_stock}",
        ))
    elif new_qty_val == 0:
        db.add(models.Notification(
            user_id=user.id,
            product_id=product.id,
            kind="low_stock",
            severity="critical",
            title="Rupture de stock",
            message=f"{product.name} : stock épuisé !",
        ))

    await db.commit()
    return {"ok": True}


@router.get("/", response_model=list[SaleOut])
async def list_sales(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    q = await db.execute(
        select(models.Sale)
        .where(models.Sale.owner_id == user.id)
        .order_by(models.Sale.sold_at.desc())
        .limit(min(limit, 500))
    )
    return q.scalars().all()
