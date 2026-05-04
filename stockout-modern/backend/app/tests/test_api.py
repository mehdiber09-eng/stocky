import pytest
from httpx import AsyncClient
from app.main import app

BASE = "http://test"


@pytest.fixture
def anyio_backend():
    return "asyncio"


async def _register(ac: AsyncClient, email: str, password: str = "secret123") -> str:
    r = await ac.post("/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text
    return r.json()["access_token"]


@pytest.mark.anyio
async def test_health():
    async with AsyncClient(app=app, base_url=BASE) as ac:
        r = await ac.get("/health/")
    assert r.status_code in (200, 503)


@pytest.mark.anyio
async def test_register_and_login():
    async with AsyncClient(app=app, base_url=BASE) as ac:
        r = await ac.post("/auth/register", json={"email": "test@example.com", "password": "secret123"})
        assert r.status_code == 201
        assert "access_token" in r.json()

        r2 = await ac.post("/auth/token", json={"email": "test@example.com", "password": "secret123"})
        assert r2.status_code == 200

        r3 = await ac.post("/auth/token", json={"email": "test@example.com", "password": "wrong"})
        assert r3.status_code == 401


@pytest.mark.anyio
async def test_register_duplicate_email():
    async with AsyncClient(app=app, base_url=BASE) as ac:
        payload = {"email": "dup@example.com", "password": "secret123"}
        await ac.post("/auth/register", json=payload)
        r = await ac.post("/auth/register", json=payload)
        assert r.status_code == 400


@pytest.mark.anyio
async def test_predict_requires_auth():
    async with AsyncClient(app=app, base_url=BASE) as ac:
        r = await ac.post("/predict/", json={"product_id": 1, "horizon": 30})
        assert r.status_code == 401


@pytest.mark.anyio
async def test_products_require_auth():
    async with AsyncClient(app=app, base_url=BASE) as ac:
        r = await ac.get("/products/")
        assert r.status_code == 401


@pytest.mark.anyio
async def test_multitenant_isolation():
    """Un user ne doit pas voir / supprimer les produits d'un autre."""
    async with AsyncClient(app=app, base_url=BASE) as ac:
        token_a = await _register(ac, "alice@example.com")
        token_b = await _register(ac, "bob@example.com")

        # Alice crée un produit
        r = await ac.post(
            "/products/",
            json={"name": "P1", "sku": "ALICE-001", "lead_time_days": 7, "safety_stock": 0},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert r.status_code == 201
        pid = r.json()["id"]

        # Bob ne voit pas les produits d'Alice
        r2 = await ac.get("/products/", headers={"Authorization": f"Bearer {token_b}"})
        assert r2.status_code == 200
        assert all(p["id"] != pid for p in r2.json())

        # Bob ne peut pas accéder au produit d'Alice
        r3 = await ac.get(f"/products/{pid}", headers={"Authorization": f"Bearer {token_b}"})
        assert r3.status_code == 404

        # Bob ne peut pas supprimer le produit d'Alice
        r4 = await ac.delete(f"/products/{pid}", headers={"Authorization": f"Bearer {token_b}"})
        assert r4.status_code == 404


@pytest.mark.anyio
async def test_notifications_isolation():
    """Les notifications sont par utilisateur."""
    async with AsyncClient(app=app, base_url=BASE) as ac:
        token = await _register(ac, "notif@example.com")
        r = await ac.get("/notifications/count", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json() == {"unread": 0, "total": 0}

        r2 = await ac.get("/notifications/", headers={"Authorization": f"Bearer {token}"})
        assert r2.status_code == 200
        assert r2.json() == []
