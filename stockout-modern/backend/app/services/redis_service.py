from redis.asyncio import from_url
from app.core.config import settings

_redis = None

async def get_redis():
    global _redis
    if _redis is None:
        _redis = await from_url(settings.REDIS_URL, decode_responses=True)
    return _redis

async def increment_free_trial(user_id: int):
    r = await get_redis()
    key = f"free_trials:{user_id}"
    val = await r.get(key)
    if val is None:
        await r.set(key, 1)
        await r.expire(key, 60*60*24*30)
        return 1
    return int(await r.incr(key))

async def get_free_trials(user_id: int):
    r = await get_redis()
    key = f"free_trials:{user_id}"
    val = await r.get(key)
    return int(val) if val else 0
