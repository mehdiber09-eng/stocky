from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, update, desc

from app.api.deps import get_db, get_current_user
from app.models import models
from app.models.schemas import NotificationOut, NotificationCount

router = APIRouter()


@router.get("/", response_model=list[NotificationOut])
async def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    stmt = (
        select(models.Notification)
        .where(models.Notification.user_id == user.id)
        .order_by(desc(models.Notification.created_at))
        .limit(min(limit, 200))
    )
    if unread_only:
        stmt = stmt.where(models.Notification.is_read == False)  # noqa: E712
    q = await db.execute(stmt)
    return q.scalars().all()


@router.get("/count", response_model=NotificationCount)
async def count_notifications(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    total = (await db.execute(
        select(func.count(models.Notification.id))
        .where(models.Notification.user_id == user.id)
    )).scalar() or 0
    unread = (await db.execute(
        select(func.count(models.Notification.id))
        .where(models.Notification.user_id == user.id)
        .where(models.Notification.is_read == False)  # noqa: E712
    )).scalar() or 0
    return NotificationCount(unread=unread, total=total)


@router.post("/{notif_id}/read")
async def mark_read(
    notif_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    n = await db.get(models.Notification, notif_id)
    if not n or n.user_id != user.id:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    n.is_read = True
    await db.commit()
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    await db.execute(
        update(models.Notification)
        .where(models.Notification.user_id == user.id)
        .where(models.Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    await db.commit()
    return {"ok": True}


@router.delete("/{notif_id}")
async def delete_notification(
    notif_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    n = await db.get(models.Notification, notif_id)
    if not n or n.user_id != user.id:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    await db.delete(n)
    await db.commit()
    return {"ok": True}
