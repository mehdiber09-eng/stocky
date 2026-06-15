import os
from typing import List
from pydantic import model_validator
from pydantic_settings import BaseSettings


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
    CORS_ORIGIN_REGEX: str = os.getenv("CORS_ORIGIN_REGEX", "")

    # Emails superadmin (bypass limite d'essais gratuits)
    SUPERUSER_EMAILS: str = os.getenv("SUPERUSER_EMAILS", "mehdiber09@gmail.com")

    # Payment — Chargily (Algérie: Dahabia, CIB)
    CHARGILY_API_KEY: str = os.getenv("CHARGILY_API_KEY", "")
    CHARGILY_SECRET: str = os.getenv("CHARGILY_SECRET", "")

    # Payment — PayPal
    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_SECRET: str = os.getenv("PAYPAL_SECRET", "")
    PAYPAL_SANDBOX: bool = os.getenv("PAYPAL_SANDBOX", "true").lower() == "true"

    # Payment — Stripe (card payments)
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    # Optional webhook signing secret for Stripe events
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    # URLs (redirections paiement + liens email)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://www.mstockpredictor.com")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "https://api.mstockpredictor.com")

    # Tarifs abonnement
    PRICE_DZD: int = int(os.getenv("PRICE_DZD", "1500"))
    PRICE_USD: float = float(os.getenv("PRICE_USD", "15.0"))
    PRICE_EUR: float = float(os.getenv("PRICE_EUR", "14.0"))

    # Email — SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "")
    ALERT_THRESHOLD: float = float(os.getenv("ALERT_THRESHOLD", "0.5"))

    # OAuth — Google
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    # OAuth — Apple
    APPLE_CLIENT_ID: str = os.getenv("APPLE_CLIENT_ID", "")
    APPLE_TEAM_ID: str = os.getenv("APPLE_TEAM_ID", "")
    APPLE_KEY_ID: str = os.getenv("APPLE_KEY_ID", "")
    APPLE_PRIVATE_KEY: str = os.getenv("APPLE_PRIVATE_KEY", "")

    # Web Push VAPID — générer avec : python -m app.scripts.gen_vapid
    # VAPID_PRIVATE_KEY doit rester secret (ne jamais committer)
    VAPID_PUBLIC_KEY: str = os.getenv("VAPID_PUBLIC_KEY", "")
    VAPID_PRIVATE_KEY: str = os.getenv("VAPID_PRIVATE_KEY", "")
    VAPID_MAILTO: str = os.getenv("VAPID_MAILTO", "mailto:support@stocky.app")

    @property
    def superuser_emails_set(self) -> set:
        return {e.strip().lower() for e in self.SUPERUSER_EMAILS.split(",") if e.strip()}

    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def push_enabled(self) -> bool:
        return bool(self.VAPID_PUBLIC_KEY and self.VAPID_PRIVATE_KEY)

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.APP_ENV == "production":
            weak = {
                "dev-secret-key",
                "dev-secret-key-change-me",
                "change-me-to-a-strong-random-key-in-production",
                "secret",
            }
            if self.SECRET_KEY in weak or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "SECRET_KEY trop faible pour APP_ENV=production. "
                    "Génère une clé forte (min 32 car.) : "
                    "python -c \"import secrets; print(secrets.token_urlsafe(48))\""
                )
        return self

    model_config = {"env_file": ".env"}


settings = Settings()
