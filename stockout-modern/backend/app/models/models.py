from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, func, Index
from sqlalchemy.orm import relationship
from app.models.db import Base
from datetime import datetime, timezone


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_subscribed = Column(Boolean, default=False, nullable=False)
    alert_threshold = Column(Float, default=0.5, nullable=False, server_default="0.5")
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    user = relationship("User")


class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    lead_time_days = Column(Integer, default=7, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    owner = relationship("User")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=False)
    lead_time_days = Column(Integer, default=7, nullable=False)
    safety_stock = Column(Integer, default=0, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    unit_price = Column(Float, nullable=True)
    cost_price = Column(Float, nullable=True)
    price_currency = Column(String(10), nullable=False, default="DZD", server_default="DZD")
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    owner = relationship("User")
    supplier = relationship("Supplier", foreign_keys=[supplier_id])
    __table_args__ = (
        Index("ix_products_owner_sku", "owner_id", "sku", unique=True),
    )


class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    sold_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    product = relationship("Product")
    __table_args__ = (
        Index("ix_sales_owner_sold_at", "owner_id", "sold_at"),
    )


class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), unique=True, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    product = relationship("Product")


class PredictionLog(Base):
    __tablename__ = "prediction_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    horizon = Column(Integer, nullable=False)
    predicted_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    probability = Column(Float, nullable=False)
    lower = Column(Float, nullable=True)
    upper = Column(Float, nullable=True)

    __table_args__ = (
        Index("ix_predlogs_user_predicted", "user_id", "predicted_at"),
    )


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    kind = Column(String(40), nullable=False)  # 'stockout_risk', 'low_stock', 'system'
    severity = Column(String(20), nullable=False, default="info")  # info, warning, critical
    title = Column(String(255), nullable=False)
    message = Column(String(1000), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    product = relationship("Product")


class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    change = Column(Integer, nullable=False)  # positif = entrée, négatif = sortie
    reason = Column(String(100), nullable=False, default="manual")  # manual, sale, adjustment, reorder
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    product = relationship("Product")


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    endpoint = Column(String(2048), nullable=False, unique=True)
    p256dh = Column(String(512), nullable=False)
    auth = Column(String(256), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User")
