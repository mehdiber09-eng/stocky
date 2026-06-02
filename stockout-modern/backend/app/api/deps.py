from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status, Header
import jwt
from jwt.exceptions import InvalidTokenError
from app.core.config import settings
from app.models.db import AsyncSessionLocal
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import models


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants manquants.")
    try:
        scheme, _, token = authorization.partition(" ")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide.")
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide.")

    user = await db.get(models.User, int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable.")

    # Expiration automatique de l'abonnement mensuel
    if user.is_subscribed and user.subscription_expires_at is not None:
        expires = user.subscription_expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            user.is_subscribed = False
            db.add(user)
            await db.commit()

    return user
