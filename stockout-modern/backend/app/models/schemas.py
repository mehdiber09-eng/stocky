from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Minimum 6 characters")


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_subscribed: bool
    alert_threshold: float = 0.5
    created_at: datetime

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100, regex=r"^[A-Z0-9\-_]+$")
    lead_time_days: int = Field(default=7, ge=0, le=365)
    safety_stock: int = Field(default=0, ge=0)
    initial_stock: int = Field(default=0, ge=0, description="Quantité initiale en stock")

    @validator("sku")
    def sku_uppercase(cls, v):
        return v.upper()


class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    lead_time_days: int
    safety_stock: int
    supplier_id: Optional[int] = None
    created_at: datetime

    class Config:
        orm_mode = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    lead_time_days: Optional[int] = Field(None, ge=0, le=365)
    safety_stock: Optional[int] = Field(None, ge=0)
    supplier_id: Optional[int] = None


class SaleCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0, description="Must be a positive integer")


class SaleOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    sold_at: datetime

    class Config:
        orm_mode = True


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

    class Config:
        orm_mode = True


class NotificationOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    kind: str
    severity: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        orm_mode = True


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

    class Config:
        orm_mode = True


class StockMovementOut(BaseModel):
    id: int
    product_id: int
    quantity_before: int
    quantity_after: int
    change: int
    reason: str
    created_at: datetime

    class Config:
        orm_mode = True
