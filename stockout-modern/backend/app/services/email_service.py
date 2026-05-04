import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_alert_email(to_email: str, product_name: str, probability: float, horizon: int):
    """Send stockout risk alert email."""
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured — skipping email alert")
        return False

    risk_pct = round(probability * 100, 1)
    level = "🔴 ÉLEVÉ" if probability >= 0.7 else "🟡 MODÉRÉ"

    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background: #0f0f11; color: #e4e4e7; border-radius: 12px; overflow: hidden;">
      <div style="background: #4f46e5; padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 20px; color: white;">⚠️ Alerte Rupture de Stock</h1>
        <p style="margin: 4px 0 0; color: #c7d2fe; font-size: 14px;">StockSense — Notification automatique</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #a1a1aa; margin-bottom: 24px;">Une prédiction vient de détecter un risque significatif pour :</p>

        <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">{product_name}</p>
          <p style="margin: 0; color: #a1a1aa; font-size: 14px;">Risque sur {horizon} jours</p>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <div style="flex: 1; background: #18181b; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 28px; font-weight: 700; color: {'#ef4444' if probability >= 0.7 else '#f59e0b'};">{risk_pct}%</p>
            <p style="margin: 0; font-size: 12px; color: #71717a;">Probabilité de rupture</p>
          </div>
          <div style="flex: 1; background: #18181b; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #e4e4e7;">{level}</p>
            <p style="margin: 0; font-size: 12px; color: #71717a;">Niveau de risque</p>
          </div>
        </div>

        <p style="color: #71717a; font-size: 13px;">
          Recommandation : {'Commandez immédiatement.' if probability >= 0.7 else 'Surveillez de près et envisagez une commande préventive.'}
        </p>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #27272a;">
          <p style="color: #52525b; font-size: 12px; margin: 0;">
            Envoyé par StockSense · Vous recevez cet email car vous avez activé les alertes.
          </p>
        </div>
      </div>
    </div>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"⚠️ Risque rupture {risk_pct}% — {product_name}"
        msg["From"] = settings.SMTP_USER
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info(f"Alert email sent to {to_email} for {product_name}")
        return True
    except Exception as e:
        logger.error(f"Failed to send alert email: {e}")
        return False
