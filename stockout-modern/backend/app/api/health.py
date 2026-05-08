from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.deps import get_db
from app.core.config import settings
from app.services.redis_service import get_redis
import os
import time

router = APIRouter()


@router.get("/env-check", summary="DEBUG: vérifie les env vars critiques")
async def env_check():
    """Endpoint temporaire pour vérifier que Railway expose bien les vars au process."""
    return {
        "FRONTEND_URL_from_env": os.getenv("FRONTEND_URL", "NOT_SET"),
        "FRONTEND_URL_from_settings": settings.FRONTEND_URL,
        "API_BASE_URL_from_env": os.getenv("API_BASE_URL", "NOT_SET"),
        "SMTP_PASSWORD_starts_with": (os.getenv("SMTP_PASSWORD", "")[:5] + "..." if os.getenv("SMTP_PASSWORD") else "NOT_SET"),
        "FROM_EMAIL_from_env": os.getenv("FROM_EMAIL", "NOT_SET"),
        "all_env_keys_count": len(os.environ),
        "frontend_url_in_env_keys": "FRONTEND_URL" in os.environ,
    }


@router.get("/", summary="Health check")
async def health(db: AsyncSession = Depends(get_db)):
    checks: dict = {
        "status": "ok",
        "version": "3.0.0",
        "timestamp": time.time(),
    }

    # DB check
    try:
        await db.execute(text("SELECT 1"))
        checks["db"] = "ok"
    except Exception as e:
        checks["db"] = f"error: {str(e)}"
        checks["status"] = "degraded"

    # Redis check
    try:
        r = await get_redis()
        await r.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"
        checks["status"] = "degraded"

    # Payment gateways
    checks["payments"] = {
        "chargily": bool(settings.CHARGILY_API_KEY),
        "paypal": bool(settings.PAYPAL_CLIENT_ID and settings.PAYPAL_SECRET),
    }

    return checks
