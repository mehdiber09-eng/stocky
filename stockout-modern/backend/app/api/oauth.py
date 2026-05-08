"""
OAuth endpoints — Google + Apple Sign-In.

Ces endpoints ne sont actifs que si les credentials sont définis dans les
variables d'environnement. Sinon ils retournent une erreur 503 explicite.
"""
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.models import models

router = APIRouter()


# ─── GOOGLE OAUTH ──────────────────────────────────────────────────────────

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def _google_redirect_uri() -> str:
    return f"{settings.API_BASE_URL}/auth/oauth/google/callback"


@router.get("/google/start")
async def google_start():
    """Redirige vers la page de consentement Google."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="Google OAuth non configuré. Contacte l'administrateur.",
        )

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": _google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
    }
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url=url, status_code=302)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Reçoit le code de Google, échange contre un token, crée ou login user."""
    if error:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?oauth_error={error}",
            status_code=302,
        )
    if not code:
        raise HTTPException(status_code=400, detail="Code OAuth manquant.")
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth non configuré.")

    # 1. Échange code → access_token
    async with httpx.AsyncClient(timeout=10) as client:
        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": _google_redirect_uri(),
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Échange de code OAuth échoué.")
        access_token = token_res.json().get("access_token")

        # 2. Récupère l'email + ID Google
        user_res = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Impossible de récupérer l'utilisateur Google.")
        info = user_res.json()
        email = info.get("email", "").lower().strip()
        google_id = info.get("id")
        verified = info.get("verified_email", False)

    if not email or not google_id:
        raise HTTPException(status_code=400, detail="Email Google manquant.")

    # 3. Trouve ou crée l'utilisateur
    q = await db.execute(select(models.User).where(models.User.email == email))
    user = q.scalars().first()

    if user is None:
        user = models.User(
            email=email,
            password_hash=None,  # OAuth, pas de mot de passe
            email_verified=verified,
            email_verified_at=datetime.now(timezone.utc) if verified else None,
            oauth_provider="google",
            oauth_id=google_id,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Si le user existait déjà avec mot de passe, on lie Google à son compte
        if not user.oauth_id:
            user.oauth_provider = "google"
            user.oauth_id = google_id
        if not user.email_verified and verified:
            user.email_verified = True
            user.email_verified_at = datetime.now(timezone.utc)
        db.add(user)
        await db.commit()

    # 4. Redirige le frontend avec le JWT
    jwt = create_access_token(str(user.id))
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/login?token={jwt}",
        status_code=302,
    )


# ─── APPLE SIGN-IN ─────────────────────────────────────────────────────────
# Stub pour le moment — Apple nécessite un compte développeur Apple ($99/an)
# et la signature JWT du client_secret avec une clé privée .p8.

@router.get("/apple/start")
async def apple_start():
    if not settings.APPLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="Apple Sign-In non configuré. Disponible bientôt.",
        )
    # TODO: implémenter quand un compte dev Apple sera disponible
    raise HTTPException(status_code=501, detail="Apple Sign-In en cours d'implémentation.")


@router.get("/apple/callback")
async def apple_callback():
    raise HTTPException(status_code=501, detail="Apple Sign-In en cours d'implémentation.")
