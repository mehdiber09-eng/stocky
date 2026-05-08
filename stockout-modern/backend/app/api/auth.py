from datetime import datetime, timezone, timedelta
import os
import secrets as _secrets


def _frontend_url() -> str:
    """Lit FRONTEND_URL directement depuis l'env, fallback sur le domaine prod."""
    return os.getenv("FRONTEND_URL") or settings.FRONTEND_URL or "https://www.mstockpredictor.com"

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.schemas import UserCreate, Token, UserOut
from app.models import models
from app.api.deps import get_db, get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.core.rate_limit import check_rate_limit

router = APIRouter()


class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class PreferencesPayload(BaseModel):
    alert_threshold: float = Field(..., ge=0.05, le=0.95)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(request: Request, payload: UserCreate, db: AsyncSession = Depends(get_db)):
    await check_rate_limit(request, max_calls=5, window_seconds=300)

    q = await db.execute(select(models.User).filter(models.User.email == payload.email))
    if q.scalars().first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
    user = models.User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        email_verified=False,
    )
    db.add(user)
    await db.flush()  # pour récupérer user.id avant le commit

    # Token de vérification email (24h)
    token_str = _secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    verif_token = models.EmailVerificationToken(user_id=user.id, token=token_str, expires_at=expires)
    db.add(verif_token)
    await db.commit()
    await db.refresh(user)

    # Envoi de l'email (mode console si SMTP non configuré)
    verify_url = f"{_frontend_url()}/verify-email?token={token_str}"
    from app.services.email_service import send_verification_email
    send_verification_email(user.email, verify_url)

    return {"access_token": create_access_token(str(user.id))}


class VerifyEmailPayload(BaseModel):
    token: str


@router.post("/verify-email", status_code=200)
async def verify_email(payload: VerifyEmailPayload, db: AsyncSession = Depends(get_db)):
    """Confirme l'email à partir du token reçu par email."""
    q = await db.execute(select(models.EmailVerificationToken).where(
        models.EmailVerificationToken.token == payload.token,
        models.EmailVerificationToken.used == False,
    ))
    token = q.scalars().first()
    if not token:
        raise HTTPException(status_code=400, detail="Lien invalide ou déjà utilisé.")

    expires = token.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Lien expiré. Demande un nouveau lien.")

    user = await db.get(models.User, token.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Compte introuvable.")

    user.email_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    token.used = True
    db.add(user)
    db.add(token)
    await db.commit()
    return {"message": "Email confirmé avec succès."}


class ResendVerificationPayload(BaseModel):
    email: EmailStr


@router.post("/resend-verification", status_code=200)
async def resend_verification(
    request: Request,
    payload: ResendVerificationPayload,
    db: AsyncSession = Depends(get_db),
):
    """Re-envoie le mail de vérification (rate-limité)."""
    await check_rate_limit(request, max_calls=3, window_seconds=300)

    q = await db.execute(select(models.User).where(models.User.email == payload.email))
    user = q.scalars().first()
    # On ne révèle pas si l'email existe ou non
    if user and not user.email_verified:
        # Invalider les anciens tokens
        old = await db.execute(select(models.EmailVerificationToken).where(
            models.EmailVerificationToken.user_id == user.id,
            models.EmailVerificationToken.used == False,
        ))
        for t in old.scalars().all():
            t.used = True
            db.add(t)

        token_str = _secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=24)
        verif_token = models.EmailVerificationToken(user_id=user.id, token=token_str, expires_at=expires)
        db.add(verif_token)
        await db.commit()

        verify_url = f"{_frontend_url()}/verify-email?token={token_str}"
        from app.services.email_service import send_verification_email
        send_verification_email(user.email, verify_url)

    return {"message": "Si cet email existe et n'est pas vérifié, un nouveau lien a été envoyé."}


@router.post("/token", response_model=Token)
async def login(request: Request, payload: UserCreate, db: AsyncSession = Depends(get_db)):
    await check_rate_limit(request, max_calls=10, window_seconds=60)

    q = await db.execute(select(models.User).filter(models.User.email == payload.email))
    user = q.scalars().first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        # password_hash null = compte OAuth (Google/Apple), pas de login par mot de passe
        if user and user.oauth_provider:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Ce compte utilise la connexion {user.oauth_provider.capitalize()}. Connecte-toi avec ce service.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )
    return {"access_token": create_access_token(str(user.id))}


@router.get("/me", response_model=UserOut)
async def get_me(user=Depends(get_current_user)):
    return user


@router.post("/change-password", status_code=200)
async def change_password(
    payload: ChangePasswordPayload,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect.")
    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    await db.commit()
    return {"message": "Mot de passe modifié avec succès."}


@router.post("/preferences", status_code=200)
async def save_preferences(
    payload: PreferencesPayload,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    user.alert_threshold = payload.alert_threshold
    db.add(user)
    await db.commit()
    return {"alert_threshold": user.alert_threshold}


class ForgotPasswordPayload(BaseModel):
    email: EmailStr


class ResetPasswordPayload(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


@router.post("/forgot-password", status_code=200)
async def forgot_password(
    request: Request,
    payload: ForgotPasswordPayload,
    db: AsyncSession = Depends(get_db),
):
    await check_rate_limit(request, max_calls=3, window_seconds=300)

    # Chercher l'utilisateur (ne pas révéler s'il existe ou non)
    q = await db.execute(select(models.User).where(models.User.email == payload.email))
    user = q.scalars().first()
    if user:
        token_str = _secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(minutes=30)
        # Invalider les anciens tokens
        old = await db.execute(select(models.PasswordResetToken).where(
            models.PasswordResetToken.user_id == user.id,
            models.PasswordResetToken.used == False,
        ))
        for t in old.scalars().all():
            t.used = True
            db.add(t)
        reset_token = models.PasswordResetToken(user_id=user.id, token=token_str, expires_at=expires)
        db.add(reset_token)
        await db.commit()
        reset_url = f"{_frontend_url()}/reset-password?token={token_str}"
        from app.services.email_service import send_reset_email
        send_reset_email(user.email, reset_url)
    return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}


@router.post("/reset-password", status_code=200)
async def reset_password(payload: ResetPasswordPayload, db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(models.PasswordResetToken).where(
        models.PasswordResetToken.token == payload.token,
        models.PasswordResetToken.used == False,
    ))
    reset_token = q.scalars().first()
    if not reset_token:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré.")

    # Comparaison timezone-safe : gérer les deux cas (tz-aware et tz-naive)
    expires = reset_token.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token invalide ou expiré.")

    user = await db.get(models.User, reset_token.user_id)
    user.password_hash = hash_password(payload.new_password)
    reset_token.used = True
    db.add(user)
    db.add(reset_token)
    await db.commit()
    return {"message": "Mot de passe réinitialisé avec succès."}
