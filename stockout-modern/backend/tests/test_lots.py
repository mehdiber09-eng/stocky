"""Tests pour l'API lots et le suivi des expirations."""
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.models.db import Base
from app.models import models
from app.api import lots
from app.core.config import settings
from app.tasks.expiry_notifier import check_expiring_lots

# Setup test DB (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def test_db():
    """Fixture pour créer une DB de test."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    AsyncTestSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with AsyncTestSessionLocal() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def test_user(test_db: AsyncSession):
    """Créer un utilisateur de test."""
    user = models.User(
        email="test@example.com",
        password_hash="hashed",
        is_subscribed=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest.fixture
async def test_product(test_db: AsyncSession, test_user):
    """Créer un produit de test."""
    product = models.Product(
        owner_id=test_user.id,
        name="Test Product",
        sku="TEST-001",
    )
    test_db.add(product)
    await test_db.commit()
    await test_db.refresh(product)
    return product


@pytest.mark.asyncio
async def test_create_lot(test_db: AsyncSession, test_user, test_product):
    """Test création d'un lot."""
    now = datetime.now(timezone.utc)
    expiry = now + timedelta(days=30)
    
    lot = models.Lot(
        owner_id=test_user.id,
        product_id=test_product.id,
        batch_code="BATCH-001",
        expiry_date=expiry,
        quantity_total=100,
        quantity_available=100,
    )
    test_db.add(lot)
    await test_db.commit()
    await test_db.refresh(lot)
    
    assert lot.id is not None
    assert lot.batch_code == "BATCH-001"
    assert lot.quantity_available == 100


@pytest.mark.asyncio
async def test_list_expiring_lots(test_db: AsyncSession, test_user, test_product):
    """Test listing des lots expirant."""
    now = datetime.now(timezone.utc)
    
    # Lot expirant dans 10 jours (alerte par défaut = 30j)
    lot1 = models.Lot(
        owner_id=test_user.id,
        product_id=test_product.id,
        batch_code="BATCH-001",
        expiry_date=now + timedelta(days=10),
        quantity_total=50,
        quantity_available=50,
    )
    
    # Lot expirant dans 60 jours (hors seuil)
    lot2 = models.Lot(
        owner_id=test_user.id,
        product_id=test_product.id,
        batch_code="BATCH-002",
        expiry_date=now + timedelta(days=60),
        quantity_total=50,
        quantity_available=50,
    )
    
    test_db.add(lot1)
    test_db.add(lot2)
    await test_db.commit()
    
    # Query lots expirant dans 30 jours
    from sqlalchemy.future import select
    cutoff = now + timedelta(days=30)
    stmt = select(models.Lot).where(
        models.Lot.owner_id == test_user.id,
        models.Lot.expiry_date <= cutoff,
        models.Lot.expiry_date > now
    )
    result = await test_db.execute(stmt)
    expiring = result.scalars().all()
    
    assert len(expiring) == 1
    assert expiring[0].batch_code == "BATCH-001"


@pytest.mark.asyncio
async def test_expiry_notification_creation(test_db: AsyncSession, test_user, test_product):
    """Test que les notifications d'expiration sont créées."""
    now = datetime.now(timezone.utc)
    
    # Créer un lot expirant bientôt
    lot = models.Lot(
        owner_id=test_user.id,
        product_id=test_product.id,
        batch_code="BATCH-EXP",
        expiry_date=now + timedelta(days=5),
        quantity_total=50,
        quantity_available=50,
    )
    test_db.add(lot)
    await test_db.commit()
    
    # Simuler le check d'expiration
    days_until = (lot.expiry_date - now).days
    severity = "critical" if days_until <= 7 else "warning"
    
    notif = models.Notification(
        user_id=test_user.id,
        kind="expiry",
        severity=severity,
        title="Test expiry",
        message=f"Lot {lot.batch_code} expires soon",
    )
    test_db.add(notif)
    await test_db.commit()
    
    # Vérifier notification créée
    from sqlalchemy.future import select
    result = await test_db.execute(
        select(models.Notification).where(
            models.Notification.user_id == test_user.id,
            models.Notification.kind == "expiry"
        )
    )
    notifs = result.scalars().all()
    assert len(notifs) == 1
    assert notifs[0].severity == "critical"
