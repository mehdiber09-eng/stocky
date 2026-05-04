from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user
from app.models import models
from app.models.schemas import InventoryOut, InventoryUpdate

router = APIRouter()


@router.get("/", response_model=list[InventoryOut])
async def list_inventory(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    q = await db.execute(
        select(models.Inventory).where(models.Inventory.owner_id == user.id)
    )
    return q.scalars().all()


@router.get("/{product_id}", response_model=InventoryOut)
async def get_inventory(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    product = await db.get(models.Product, product_id)
    if not product or product.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    q = await db.execute(
        select(models.Inventory).where(models.Inventory.product_id == product_id)
    )
    inv = q.scalars().first()
    if not inv:
        # Crée un inventaire à 0 si absent
        inv = models.Inventory(owner_id=user.id, product_id=product_id, quantity=0)
        db.add(inv)
        await db.commit()
        await db.refresh(inv)
    return inv


@router.put("/{product_id}", response_model=InventoryOut)
async def update_inventory(
    product_id: int,
    payload: InventoryUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    product = await db.get(models.Product, product_id)
    if not product or product.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    q = await db.execute(
        select(models.Inventory).where(models.Inventory.product_id == product_id)
    )
    inv = q.scalars().first()

    quantity_before = inv.quantity if inv else 0

    if inv:
        inv.quantity = payload.quantity
        inv.updated_at = datetime.now(timezone.utc)
    else:
        inv = models.Inventory(
            owner_id=user.id,
            product_id=product_id,
            quantity=payload.quantity,
        )
        db.add(inv)

    # Enregistrer le mouvement de stock
    movement = models.StockMovement(
        owner_id=user.id,
        product_id=product_id,
        quantity_before=quantity_before,
        quantity_after=payload.quantity,
        change=payload.quantity - quantity_before,
        reason="manual",
    )
    db.add(movement)

    # Notification de réapprovisionnement si stock <= seuil de réapprovisionnement
    reorder_point = product.safety_stock
    if payload.quantity <= reorder_point:
        notif = models.Notification(
            user_id=user.id,
            product_id=product_id,
            kind="low_stock",
            severity="critical",
            title=f"Stock critique : {product.name}",
            message=(
                f"Le stock de « {product.name} » est à {payload.quantity} unité(s), "
                f"en dessous du seuil de réapprovisionnement ({reorder_point}). "
                "Pensez à passer une commande."
            ),
        )
        db.add(notif)

    await db.commit()
    await db.refresh(inv)
    return inv
