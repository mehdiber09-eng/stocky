from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.deps import get_db
from app.core.config import settings
from app.services.redis_service import get_redis
import time

router = APIRouter()


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
