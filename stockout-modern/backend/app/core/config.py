import os
import secrets
from typing import List
from pydantic import BaseSettings, validator


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@db:5432/stockdb",
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))
    FREE_TRIALS_LIMIT: int = int(os.getenv("FREE_TRIALS_LIMIT", "5"))
    APP_ENV: str = os.getenv("APP_ENV", "development")

    # CORS
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    # Optional regex to match dynamic origins (e.g. Vercel preview deployments)
    CORS_ORIGIN_REGEX: str = os.getenv("CORS_ORIGIN_REGEX", "")

    # Comma-separated emails with unlimited predictions (bypass free trial limit)
    SUPERUSER_EMAILS: str = os.getenv("SUPERUSER_EMAILS", "mehdiber09@gmail.com")

    # Payment — Chargily (Algeria: Dahabia, CIB, Visa)
    CHARGILY_API_KEY: str = os.getenv("CHARGILY_API_KEY", "")
    CHARGILY_SECRET: str = os.getenv("CHARGILY_SECRET", "")

    # Payment — PayPal
    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_SECRET: str = os.getenv("PAYPAL_SECRET", "")
    PAYPAL_SANDBOX: bool = os.getenv("PAYPAL_SANDBOX", "true").lower() == "true"

    # URLs (needed for payment redirects)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")

    # Subscription price
    PRICE_DZD: int = int(os.getenv("PRICE_DZD", "900"))
    PRICE_USD: float = float(os.getenv("PRICE_USD", "9.0"))

    @property
    def superuser_emails_set(self) -> set:
        return {e.strip().lower() for e in self.SUPERUSER_EMAILS.split(",") if e.strip()}

    # Email alerts (optional)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    ALERT_THRESHOLD: float = float(os.getenv("ALERT_THRESHOLD", "0.5"))

    @validator("SECRET_KEY")
    def validate_secret_key(cls, v, values):
        env = values.get("APP_ENV", os.getenv("APP_ENV", "development"))
        weak = {"dev-secret-key", "dev-secret-key-change-me", "change-me-to-a-strong-random-key-in-production", "secret"}
        if env == "production" and (v in weak or len(v) < 32):
            raise ValueError(
                "SECRET_KEY trop faible pour APP_ENV=production. "
                "Génère une clé forte (min 32 caractères) avec : "
                "python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
