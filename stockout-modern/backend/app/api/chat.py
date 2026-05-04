from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import httpx
import os
from app.api.deps import get_current_user

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """Tu es un expert en gestion de stock et supply chain. Tu aides les utilisateurs de StockSense.
Tu réponds en français, de façon concise et pratique sur:
- La gestion des stocks de sécurité
- Les stratégies de réapprovisionnement
- L interpretation des probabilités de rupture
- Les formules EOQ, point de commande
Reste bref (max 3-4 paragraphes)."""

class ChatRequest(BaseModel):
    messages: list[dict]

@router.post("/")
async def chat(payload: ChatRequest, user=Depends(get_current_user)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY non configurée")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *payload.messages],
                    "max_tokens": 1000,
                    "temperature": 0.7,
                }
            )
            data = response.json()
            if "choices" not in data:
                raise HTTPException(status_code=500, detail=str(data))
            return {"content": data["choices"][0]["message"]["content"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
