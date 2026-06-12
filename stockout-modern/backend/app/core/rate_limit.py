"""Rate limiter simple.

If REDIS_URL is configured, use Redis (atomic counters with expiry) which works across processes
and instances. Otherwise fall back to an in-memory list (best-effort, single-process only).
"""
from collections import defaultdict
import time
import logging
from fastapi import HTTPException, Request

from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback in-memory store: {ip: [timestamp, ...]}
_store: dict = defaultdict(list)

_redis = None
try:
    if settings.REDIS_URL:
        import redis.asyncio as aioredis

        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        # Do not await ping here; connection will be lazy.
        logger.info("Rate limiter: using Redis backend")
    else:
        logger.info("Rate limiter: no REDIS_URL configured, using in-memory backend")
except Exception as exc:
    _redis = None
    logger.warning("Rate limiter: Redis init failed, falling back to in-memory (%s)", exc)


async def check_rate_limit(request: Request, max_calls: int, window_seconds: int) -> None:
    """Enforce rate limit per IP. Raises HTTP 429 on limit exceeded.

    If Redis is available, uses an atomic INCR + EXPIRE pattern. Otherwise uses a process-local
    timestamp list (approximate and not safe across multiple workers).
    """
    ip = request.client.host if request.client else "unknown"

    if _redis:
        try:
            key = f"rl:{ip}:{window_seconds}:{max_calls}"
            val = await _redis.incr(key)
            if val == 1:
                # first hit — set TTL
                await _redis.expire(key, window_seconds)
            if val > max_calls:
                ttl = await _redis.ttl(key)
                raise HTTPException(
                    status_code=429,
                    detail=f"Trop de tentatives. Réessayez dans {ttl if ttl>0 else window_seconds} secondes.",
                )
            return
        except Exception as exc:
            # If Redis fails, log and fallback to in-memory behavior
            logger.warning("Rate limiter: Redis error, falling back to memory (%s)", exc)

    # In-memory fallback
    now = time.time()
    _store[ip] = [t for t in _store[ip] if now - t < window_seconds]
    if len(_store[ip]) >= max_calls:
        raise HTTPException(
            status_code=429,
            detail=f"Trop de tentatives. Réessayez dans {window_seconds} secondes.",
        )
    _store[ip].append(now)
