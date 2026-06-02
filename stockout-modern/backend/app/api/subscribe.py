from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.schemas import SubscribeResponse

router = APIRouter()


@router.get("/status")
async def subscription_status(user=Depends(get_current_user)):
    return {"is_subscribed": user.is_subscribed, "expires_at": user.subscription_expires_at}
