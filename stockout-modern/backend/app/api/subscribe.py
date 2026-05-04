from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.models.schemas import SubscribeResponse

router = APIRouter()


@router.post("/", response_model=SubscribeResponse)
async def subscribe(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    if user.is_subscribed:
        return SubscribeResponse(subscribed=True, message="Already subscribed")
    user.is_subscribed = True
    db.add(user)
    await db.commit()
    return SubscribeResponse(subscribed=True, message="Subscription activated successfully")


@router.get("/status")
async def subscription_status(user=Depends(get_current_user)):
    return {"is_subscribed": user.is_subscribed}
