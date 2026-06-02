import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from pywebpush import webpush, WebPushException

from app.api.deps import get_db, get_current_user
from app.models.models import PushSubscription
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


class SubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionPayload(BaseModel):
    endpoint: str
    keys: SubscriptionKeys


class PushTestPayload(BaseModel):
    title: str = "🚨 Test Stocky"
    body: str = "Les notifications push fonctionnent !"


# ── Save subscription ────────────────────────────────────────────────────────

@router.post("/subscribe", status_code=204)
async def save_subscription(
    payload: PushSubscriptionPayload,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    # Upsert: delete old with same endpoint, insert new
    await db.execute(
        delete(PushSubscription).where(PushSubscription.endpoint == payload.endpoint)
    )
    sub = PushSubscription(
        user_id=user.id,
        endpoint=payload.endpoint,
        p256dh=payload.keys.p256dh,
        auth=payload.keys.auth,
    )
    db.add(sub)
    await db.commit()


@router.delete("/unsubscribe", status_code=204)
async def remove_subscription(
    endpoint: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    await db.execute(
        delete(PushSubscription).where(
            PushSubscription.endpoint == endpoint,
            PushSubscription.user_id == user.id,
        )
    )
    await db.commit()


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    return {"publicKey": settings.VAPID_PUBLIC_KEY, "enabled": settings.push_enabled}


@router.post("/test")
async def send_test_push(
    payload: PushTestPayload,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == user.id)
    )
    subs = result.scalars().all()
    if not subs:
        raise HTTPException(400, "Aucun abonnement push trouvé pour cet utilisateur")

    sent = 0
    for sub in subs:
        try:
            _send_push(sub, payload.title, payload.body, "/dashboard")
            sent += 1
        except Exception as e:
            logger.warning(f"Push failed for sub {sub.id}: {e}")

    return {"sent": sent, "total": len(subs)}


# ── Internal helper — called by other modules ────────────────────────────────

def _send_push(sub: PushSubscription, title: str, body: str, url: str = "/dashboard"):
    if not settings.push_enabled:
        return
    data = json.dumps({"title": title, "body": body, "url": url})
    try:
        webpush(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            data=data,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_MAILTO},
        )
    except WebPushException as e:
        logger.error(f"WebPushException: {e}")
        raise


async def notify_user_critical_stock(
    db: AsyncSession,
    user_id: int,
    product_name: str,
    current_stock: int,
):
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == user_id)
    )
    subs = result.scalars().all()
    for sub in subs:
        try:
            _send_push(
                sub,
                title=f"🚨 Stock critique — {product_name}",
                body=f"Stock restant : {current_stock} unité{'s' if current_stock != 1 else ''}. Commander maintenant.",
                url="/inventory-health",
            )
        except Exception as e:
            logger.warning(f"Push failed: {e}")
