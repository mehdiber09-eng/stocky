from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL
engine = create_async_engine(DATABASE_URL, future=True, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def init_db():
    # Import models to register them with metadata
    from app.models import models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure columns added after initial deployment exist on existing DBs
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS alert_threshold FLOAT NOT NULL DEFAULT 0.5"
        ))
        await conn.execute(text(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL"
        ))
        await conn.execute(text(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price FLOAT"
        ))
        await conn.execute(text(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price FLOAT"
        ))
        await conn.execute(text(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS price_currency VARCHAR(10) NOT NULL DEFAULT 'DZD'"
        ))
        # Email verification + OAuth columns
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE"
        ))
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE"
        ))
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20)"
        ))
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255)"
        ))
        # password_hash devient nullable pour les comptes OAuth (sans mot de passe)
        await conn.execute(text(
            "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL"
        ))
