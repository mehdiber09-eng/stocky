import hmac
import hashlib
import json
import logging
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models import models

SUBSCRIPTION_DAYS = 30

router = APIRouter()
logger = logging.getLogger(__name__)

CHARGILY_METHODS = {"edahabia": "Dahabia (Poste Algérie)", "cib": "CIB (Carte Bancaire)"}
PAYPAL_BASE_SANDBOX = "https://api-m.sandbox.paypal.com"
PAYPAL_BASE_LIVE = "https://api-m.paypal.com"


def _paypal_base() -> str:
    return PAYPAL_BASE_SANDBOX if settings.PAYPAL_SANDBOX else PAYPAL_BASE_LIVE


async def _paypal_token(client: httpx.AsyncClient) -> str:
    r = await client.post(
        f"{_paypal_base()}/v1/oauth2/token",
        auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_SECRET),
        data={"grant_type": "client_credentials"},
        timeout=10.0,
    )
    r.raise_for_status()
    return r.json()["access_token"]


@router.get("/status")
async def payment_status(user=Depends(get_current_user)):
    return {
        "is_subscribed": user.is_subscribed,
        "price_dzd": settings.PRICE_DZD,
        "price_usd": settings.PRICE_USD,
        "price_eur": settings.PRICE_EUR,
        "chargily_enabled": bool(settings.CHARGILY_API_KEY),
        "paypal_enabled": bool(settings.PAYPAL_CLIENT_ID and settings.PAYPAL_SECRET),
    }


# ── Chargily Pay (Dahabia / CIB / Visa — Algeria) ───────────────────────────

@router.post("/chargily/checkout")
async def chargily_checkout(
    method: str = Query(default="edahabia", description="edahabia | cib"),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.is_subscribed:
        raise HTTPException(status_code=400, detail="Vous êtes déjà abonné Pro.")

    if not settings.CHARGILY_API_KEY:
        raise HTTPException(status_code=503, detail="Paiement Chargily non configuré (CHARGILY_API_KEY manquant).")

    if method not in CHARGILY_METHODS:
        raise HTTPException(status_code=400, detail=f"Méthode invalide. Options: {', '.join(CHARGILY_METHODS)}")

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                "https://pay.chargily.net/api/v2/checkouts",
                headers={
                    "Authorization": f"Bearer {settings.CHARGILY_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "amount": settings.PRICE_DZD,
                    "currency": "dzd",
                    "payment_method": method,
                    "success_url": f"{settings.FRONTEND_URL}/payment/success",
                    "failure_url": f"{settings.FRONTEND_URL}/payment/cancel",
                    "webhook_endpoint": f"{settings.API_BASE_URL}/payments/chargily/webhook",
                    "description": f"StockSense Pro — {user.email}",
                    "locale": "ar",
                    "metadata": {"user_id": str(user.id), "email": user.email},
                },
                timeout=10.0,
            )
            res.raise_for_status()
            data = res.json()
            return {"checkout_url": data["checkout_url"], "checkout_id": data["id"]}
        except httpx.HTTPStatusError as e:
            logger.error(f"Chargily HTTP error {e.response.status_code}: {e.response.text}")
            raise HTTPException(status_code=502, detail="Erreur côté Chargily. Réessayez.")
        except Exception as e:
            logger.exception(f"Chargily error: {e}")
            raise HTTPException(status_code=502, detail="Service de paiement indisponible.")


@router.post("/chargily/webhook", include_in_schema=False)
async def chargily_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    sig = request.headers.get("signature", "")

    if settings.CHARGILY_SECRET:
        expected = hmac.new(
            settings.CHARGILY_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(sig, expected):
            raise HTTPException(status_code=400, detail="Signature invalide")

    try:
        payload = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Payload invalide")

    event_type = payload.get("type", "")
    if event_type in ("checkout.paid", "payment.paid"):
        meta = payload.get("data", {}).get("metadata", {})
        user_id = meta.get("user_id")
        if user_id:
            user = await db.get(models.User, int(user_id))
            if user:
                now = datetime.now(timezone.utc)
                # Prolonger depuis la date d'expiration actuelle si déjà abonné
                base = user.subscription_expires_at if (user.is_subscribed and user.subscription_expires_at and user.subscription_expires_at > now) else now
                user.is_subscribed = True
                user.subscription_expires_at = base + timedelta(days=SUBSCRIPTION_DAYS)
                db.add(user)
                await db.commit()
                logger.info(f"[Chargily] Subscribed user_id={user_id} until {user.subscription_expires_at}")

    return {"received": True}


# ── PayPal ───────────────────────────────────────────────────────────────────

@router.post("/paypal/create")
async def paypal_create_order(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.is_subscribed:
        raise HTTPException(status_code=400, detail="Vous êtes déjà abonné Pro.")

    if not settings.PAYPAL_CLIENT_ID or not settings.PAYPAL_SECRET:
        raise HTTPException(status_code=503, detail="Paiement PayPal non configuré.")

    async with httpx.AsyncClient() as client:
        try:
            token = await _paypal_token(client)
            res = await client.post(
                f"{_paypal_base()}/v2/checkout/orders",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [{
                        "amount": {"currency_code": "USD", "value": f"{settings.PRICE_USD:.2f}"},
                        "description": f"StockSense Pro — {user.email}",
                        "custom_id": str(user.id),
                    }],
                    "application_context": {
                        "return_url": f"{settings.FRONTEND_URL}/payment/success?method=paypal",
                        "cancel_url": f"{settings.FRONTEND_URL}/payment/cancel",
                        "brand_name": "StockSense",
                        "user_action": "PAY_NOW",
                        "landing_page": "BILLING",
                    },
                },
                timeout=10.0,
            )
            res.raise_for_status()
            order = res.json()
            approval_url = next(l["href"] for l in order["links"] if l["rel"] == "approve")
            return {"order_id": order["id"], "approval_url": approval_url}
        except StopIteration:
            raise HTTPException(status_code=502, detail="Réponse PayPal invalide.")
        except httpx.HTTPStatusError as e:
            logger.error(f"PayPal error {e.response.status_code}: {e.response.text}")
            raise HTTPException(status_code=502, detail="Erreur PayPal. Réessayez.")
        except Exception as e:
            logger.exception(f"PayPal error: {e}")
            raise HTTPException(status_code=502, detail="Service PayPal indisponible.")


@router.post("/paypal/capture")
async def paypal_capture(
    order_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    if not settings.PAYPAL_CLIENT_ID or not settings.PAYPAL_SECRET:
        raise HTTPException(status_code=503, detail="Paiement PayPal non configuré.")

    async with httpx.AsyncClient() as client:
        try:
            token = await _paypal_token(client)
            res = await client.post(
                f"{_paypal_base()}/v2/checkout/orders/{order_id}/capture",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                timeout=10.0,
            )
            res.raise_for_status()
            data = res.json()
            if data.get("status") != "COMPLETED":
                raise HTTPException(status_code=402, detail="Paiement non complété.")
        except httpx.HTTPStatusError as e:
            logger.error(f"PayPal capture error: {e.response.text}")
            raise HTTPException(status_code=502, detail="Capture PayPal échouée.")

    now = datetime.now(timezone.utc)
    base = user.subscription_expires_at if (user.is_subscribed and user.subscription_expires_at and user.subscription_expires_at > now) else now
    user.is_subscribed = True
    user.subscription_expires_at = base + timedelta(days=SUBSCRIPTION_DAYS)
    db.add(user)
    await db.commit()
    logger.info(f"[PayPal] Subscribed user_id={user.id} until {user.subscription_expires_at}")
    return {"subscribed": True}
