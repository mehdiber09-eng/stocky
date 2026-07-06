from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_subscribed: bool
    subscription_expires_at: Optional[datetime] = None
    alert_threshold: float = 0.5
    email_verified: bool = False
    oauth_provider: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    lead_time_days: int = Field(default=7, ge=0, le=365)
    safety_stock: int = Field(default=0, ge=0)
    initial_stock: int = Field(default=0, ge=0)
    unit_price: Optional[float] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    price_currency: str = Field(default="DZD", max_length=10)
    supplier_id: Optional[int] = None
    image_url: Optional[str] = Field(None, max_length=5_000_000)

    @field_validator("sku", mode="before")
    @classmethod
    def sku_normalize(cls, v: object) -> str:
        if not isinstance(v, str):
            raise ValueError("sku doit être une chaîne")
        v = v.strip().upper()
        if not v:
            raise ValueError("sku ne peut pas être vide")
        import re
        if not re.match(r"^[A-Z0-9\-_.:/ ]+$", v):
            raise ValueError("sku ne peut contenir que lettres, chiffres, et - _ . : / espace")
        return v


class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    lead_time_days: int
    safety_stock: int
    supplier_id: Optional[int] = None
    unit_price: Optional[float] = None
    cost_price: Optional[float] = None
    price_currency: str = "DZD"
    image_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductImageUpdate(BaseModel):
    image_url: Optional[str] = Field(None, max_length=5_000_000)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    lead_time_days: Optional[int] = Field(None, ge=0, le=365)
    safety_stock: Optional[int] = Field(None, ge=0)
    supplier_id: Optional[int] = None
    unit_price: Optional[float] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    price_currency: Optional[str] = Field(None, max_length=10)
    image_url: Optional[str] = Field(None, max_length=5_000_000)


class SaleCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class SaleOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    sold_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PredictRequest(BaseModel):
    product_id: int = Field(..., gt=0)
    horizon: int = Field(default=30, ge=1, le=365)


class PredictResponse(BaseModel):
    probability: float = Field(..., ge=0.0, le=1.0)
    lower: float = Field(..., ge=0.0, le=1.0)
    upper: float = Field(..., ge=0.0, le=1.0)
    trials_used: Optional[int] = None
    trials_limit: Optional[int] = None


class SubscribeResponse(BaseModel):
    subscribed: bool
    message: str


class InventoryUpdate(BaseModel):
    quantity: int = Field(..., ge=0)


class InventoryOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    kind: str
    severity: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationCount(BaseModel):
    unread: int
    total: int


class SupplierCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    lead_time_days: int = Field(default=7, ge=0, le=365)


class SupplierOut(BaseModel):
    id: int
    name: str
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    lead_time_days: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StockMovementOut(BaseModel):
    id: int
    product_id: int
    quantity_before: int
    quantity_after: int
    change: int
    reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LotCreate(BaseModel):
    product_id: int
    batch_code: Optional[str] = None
    expiry_date: Optional[datetime] = None
    received_at: Optional[datetime] = None
    quantity_total: int = 0
    quantity_available: Optional[int] = None
    supplier_lot_ref: Optional[str] = None


class LotOut(BaseModel):
    id: int
    product_id: int
    batch_code: Optional[str] = None
    expiry_date: Optional[datetime] = None
    received_at: datetime
    quantity_total: int
    quantity_available: int
    supplier_lot_ref: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LotUpdate(BaseModel):
    batch_code: Optional[str] = None
    expiry_date: Optional[datetime] = None
    received_at: Optional[datetime] = None
    quantity_total: Optional[int] = None
    quantity_available: Optional[int] = None
    supplier_lot_ref: Optional[str] = None
