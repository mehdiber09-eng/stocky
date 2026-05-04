from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.schemas import UserCreate, Token, UserOut
from app.models import models
from app.api.deps import get_db, get_current_user
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()


class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class PreferencesPayload(BaseModel):
    alert_threshold: float = Field(..., ge=0.05, le=0.95)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(models.User).filter(models.User.email == payload.email))
    if q.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"access_token": create_access_token(str(user.id))}


@router.post("/token", response_model=Token)
async def login(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(models.User).filter(models.User.email == payload.email))
    user = q.scalars().first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
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
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    await db.commit()
    return {"message": "Mot de passe modifié avec succès"}


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
