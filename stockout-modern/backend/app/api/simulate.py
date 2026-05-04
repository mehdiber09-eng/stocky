from datetime import datetime, timezone, timedelta

import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_db, get_current_user
from app.models import models
from app.services.ml_service import run_prediction

router = APIRouter()

EVENT_MULTIPLIERS = {
    "none": 1.0,
    "ramadan": 1.8,
    "weather": 1.3,
    "sales_promo": 2.1,
    "holiday": 1.5,
}


class SimulationRequest(BaseModel):
    product_id: int = Field(..., gt=0)
    horizon: int = Field(default=30, ge=1, le=365)
    demand_increase_pct: float = Field(default=0.0, ge=-50.0, le=500.0, description="Variation demande en %")
    supplier_delay_days: int = Field(default=0, ge=0, le=90)
    event: str = Field(default="none", description="none | ramadan | weather | sales_promo | holiday")


class SimulationResponse(BaseModel):
    product_name: str
    sku: str
    current_stock: int
    base_risk: float
    simulated_risk: float
    risk_delta: float
    new_risk_level: str
    recommendation: str
    business_impact: str
    stock_impact_days: int
    avg_daily_demand: float
    scenario_label: str


@router.post("/", response_model=SimulationResponse, summary="Simuler un scénario de rupture")
async def simulate(
    payload: SimulationRequest,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    product = await db.get(models.Product, payload.product_id)
    if not product or product.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    # Current stock
    inv_q = await db.execute(
        select(models.Inventory).where(models.Inventory.product_id == product.id)
    )
    inventory = inv_q.scalars().first()
    current_stock = inventory.quantity if inventory else 0

    # Sales velocity (30d)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    sales_q = await db.execute(
        select(models.Sale).where(
            models.Sale.product_id == product.id,
            models.Sale.sold_at >= thirty_days_ago,
        )
    )
    recent_sales = sales_q.scalars().all()
    avg_daily = sum(s.quantity for s in recent_sales) / 30.0 if recent_sales else 1.0

    # Base prediction
    try:
        base = run_prediction(product.id, payload.horizon)
    except Exception:
        base = {"probability": 0.5, "lower": 0.4, "upper": 0.6}
    base_risk = base["probability"]

    # Apply scenario multipliers
    event = payload.event if payload.event in EVENT_MULTIPLIERS else "none"
    event_mult = EVENT_MULTIPLIERS[event]
    demand_factor = 1 + payload.demand_increase_pct / 100.0
    delay_impact = min(0.35, payload.supplier_delay_days * 0.012)

    combined_multiplier = demand_factor * event_mult + delay_impact
    simulated_risk = float(np.clip(base_risk * combined_multiplier, 0.0, 1.0))
    delta = round(simulated_risk - base_risk, 3)

    # Stock days under scenario
    effective_daily_demand = avg_daily * demand_factor * event_mult
    stock_days = int(current_stock / effective_daily_demand) if effective_daily_demand > 0 else 999

    # Scenario label
    labels = {
        "none": "Baseline",
        "ramadan": "Ramadan (demande x1.8)",
        "weather": "Météo extrême (demande x1.3)",
        "sales_promo": "Promo / Soldes (demande x2.1)",
        "holiday": "Jours fériés (demande x1.5)",
    }
    extra = []
    if payload.demand_increase_pct != 0:
        extra.append(f"+{payload.demand_increase_pct:.0f}% demande")
    if payload.supplier_delay_days > 0:
        extra.append(f"+{payload.supplier_delay_days}j délai fournisseur")
    scenario_label = labels.get(event, "Custom")
    if extra:
        scenario_label += " · " + " · ".join(extra)

    # Recommendation + business impact
    if simulated_risk >= 0.8:
        risk_level = "CRITICAL"
        recommendation = (
            f"URGENT — Commander {int(effective_daily_demand * payload.horizon)} unités minimum. "
            f"Rupture dans ~{stock_days} jours selon ce scénario."
        )
        loss_estimate = int(effective_daily_demand * max(0, payload.horizon - stock_days) * 2500)
        business_impact = f"Perte estimée: {loss_estimate:,} DZD si rupture non évitée."
    elif simulated_risk >= 0.6:
        risk_level = "HIGH"
        recommendation = (
            f"Augmenter la commande de {int((demand_factor * event_mult - 1) * 100)}%. "
            f"Stock tient ~{stock_days} jours dans ce scénario."
        )
        business_impact = f"Risque de rupture dans {stock_days} jours. Anticiper dès maintenant."
    elif simulated_risk >= 0.4:
        risk_level = "MEDIUM"
        recommendation = f"Surveillance accrue recommandée. Stock estimé à {stock_days} jours de couverture."
        business_impact = "Impact modéré. Vérifier le stock de sécurité configuré."
    else:
        risk_level = "LOW"
        recommendation = "Stock suffisant dans ce scénario. Aucune action immédiate requise."
        business_impact = f"Stock tient {min(stock_days, 365)} jours dans ce scénario."

    return SimulationResponse(
        product_name=product.name,
        sku=product.sku,
        current_stock=current_stock,
        base_risk=round(base_risk, 3),
        simulated_risk=round(simulated_risk, 3),
        risk_delta=delta,
        new_risk_level=risk_level,
        recommendation=recommendation,
        business_impact=business_impact,
        stock_impact_days=min(stock_days, 999),
        avg_daily_demand=round(avg_daily, 2),
        scenario_label=scenario_label,
    )
