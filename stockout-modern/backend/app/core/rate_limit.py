import time
from collections import defaultdict
from fastapi import HTTPException, Request

# Stockage en mémoire : {ip: [timestamp, ...]}
_store: dict = defaultdict(list)


async def check_rate_limit(request: Request, max_calls: int, window_seconds: int) -> None:
    """Vérifie la limite de taux par IP. Lève HTTP 429 si dépassée."""
    ip = request.client.host if request.client else "unknown"
    now = time.time()

    # Nettoyer les entrées expirées de la fenêtre
    _store[ip] = [t for t in _store[ip] if now - t < window_seconds]

    if len(_store[ip]) >= max_calls:
        raise HTTPException(
            status_code=429,
            detail=f"Trop de tentatives. Réessayez dans {window_seconds} secondes.",
        )

    _store[ip].append(now)
