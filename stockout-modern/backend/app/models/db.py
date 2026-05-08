from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL
engine = create_async_engine(DATABASE_URL, future=True, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def init_db():
    """
    Initialise la DB :
    1. Crée les nouvelles tables (create_all idempotent)
    2. Applique les ALTER TABLE de migration en mode best-effort.
       Chaque ALTER est dans son propre try/except : si une migration
       échoue (ex: contrainte qu'on a pas anticipée), l'app continue
       quand même de démarrer plutôt que de crasher au boot.
    """
    import logging
    log = logging.getLogger(__name__)

    from app.models import models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS alert_threshold FLOAT NOT NULL DEFAULT 0.5",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price FLOAT",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price FLOAT",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS price_currency VARCHAR(10) NOT NULL DEFAULT 'DZD'",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255)",
        "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL",
        # Photos produits (base64 data URLs jusqu'à 500 KB)
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT",
    ]
    for sql in migrations:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(sql))
        except Exception as e:
            log.warning(f"Migration skipped ({sql[:60]}...): {e}")
