from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
import time

from app.api import (
    auth,
    chat,
    products,
    sales,
    predict,
    subscribe,
    health,
    analytics,
    export,
    notifications,
    inventory,
    payments,
    suppliers,
    stock_history,
    scan_qr,
    simulate,
    system_status,
    push,
    oauth,
)
from app.core.config import settings
from app.models.db import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info(f"StockSense API démarrée (env={settings.APP_ENV})")
    yield


app = FastAPI(title="StockSense API", version="3.0.0", lifespan=lifespan)

# CORS pilotée par la variable d'environnement.
# allow_credentials doit être False quand on utilise allow_origins=["*"] (interdit par la spec CORS).
# On utilise un JWT en header Authorization, pas de cookies, donc credentials=False est sans impact.
_origins = settings.cors_origins_list
_allow_credentials = "*" not in _origins
_origin_regex = settings.CORS_ORIGIN_REGEX or None
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=_origin_regex,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"],
)


@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{(time.perf_counter() - start)*1000:.1f}ms"
    return response


app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(oauth.router, prefix="/auth/oauth", tags=["oauth"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(sales.router, prefix="/sales", tags=["sales"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
app.include_router(predict.router, prefix="/predict", tags=["predict"])
app.include_router(subscribe.router, prefix="/subscribe", tags=["subscribe"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(export.router, prefix="/export", tags=["export"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])
app.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
app.include_router(stock_history.router, prefix="/stock-history", tags=["stock-history"])
app.include_router(scan_qr.router, prefix="/scan_qr", tags=["scan-qr"])
app.include_router(simulate.router, prefix="/simulate", tags=["simulate"])
app.include_router(system_status.router, prefix="/system-status", tags=["system-status"])
app.include_router(push.router, prefix="/push", tags=["push"])


@app.get("/", tags=["meta"])
async def root():
    return {"name": "StockSense API", "version": "3.0.0", "env": settings.APP_ENV}
