import smtplib
import logging
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_via_resend_api(to_email: str, subject: str, html: str) -> bool:
    """
    Envoie un email via l'API HTTP Resend (port 443).
    Utilisé quand SMTP_PASSWORD ressemble à une clé Resend (commence par 're_').
    Plus fiable que SMTP : Railway et autres PaaS bloquent souvent les ports
    SMTP sortants (587, 465).
    """
    api_key = settings.SMTP_PASSWORD
    from_addr = settings.FROM_EMAIL or "noreply@resend.dev"
    try:
        with httpx.Client(timeout=10) as client:
            res = client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"from": from_addr, "to": [to_email], "subject": subject, "html": html},
            )
        if res.status_code in (200, 201, 202):
            logger.info(f"Email sent via Resend API to {to_email} ({subject[:40]})")
            return True
        logger.error(f"Resend API failed [{res.status_code}]: {res.text[:300]}")
        return False
    except Exception as e:
        logger.error(f"Resend API exception: {e}")
        return False


def _send_via_smtp(to_email: str, subject: str, html: str) -> bool:
    """SMTP classique (fallback si SMTP_PASSWORD ne ressemble pas à une clé Resend)."""
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.FROM_EMAIL or settings.SMTP_USER
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.FROM_EMAIL or settings.SMTP_USER, to_email, msg.as_string())
        logger.info(f"Email sent via SMTP to {to_email}")
        return True
    except Exception as e:
        logger.error(f"SMTP failed: {e}")
        return False


def _send_email(to_email: str, subject: str, html: str) -> bool:
    """Dispatcher : Resend API si la clé ressemble à 're_*', sinon SMTP."""
    pwd = settings.SMTP_PASSWORD or ""
    if pwd.startswith("re_"):
        return _send_via_resend_api(to_email, subject, html)
    if settings.SMTP_HOST and settings.SMTP_USER and pwd:
        return _send_via_smtp(to_email, subject, html)
    logger.warning(f"[DEV] No email backend configured. Email content for {to_email}:")
    logger.warning(f"  Subject: {subject}")
    return True  # ne bloque pas le flow en dev


# ── Templates HTML ──────────────────────────────────────────────────────────


def send_alert_email(to_email: str, product_name: str, probability: float, horizon: int):
    """Send stockout risk alert email."""
    risk_pct = round(probability * 100, 1)
    level = "🔴 ÉLEVÉ" if probability >= 0.7 else "🟡 MODÉRÉ"

    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background: #0f0f11; color: #e4e4e7; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg,#6366f1,#d946ef); padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 20px; color: white;">⚠️ Alerte Rupture de Stock</h1>
        <p style="margin: 4px 0 0; color: #e0e7ff; font-size: 14px;">Stocky — Notification automatique</p>
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
          <p style="color: #52525b; font-size: 12px; margin: 0;">Envoyé par Stocky · stocky.app</p>
        </div>
      </div>
    </div>
    """
    return _send_email(to_email, f"⚠️ Risque rupture {risk_pct}% — {product_name}", html)


def send_verification_email(to_email: str, verify_url: str):
    """Send email verification email after registration."""
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background: #0f0f11; color: #e4e4e7; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg,#6366f1,#d946ef); padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 22px; color: white;">📧 Confirme ton email</h1>
        <p style="margin: 4px 0 0; color: #e0e7ff; font-size: 14px;">Stocky — Bienvenue dans la famille</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #a1a1aa; margin-bottom: 24px;">
          Bienvenue sur Stocky ! Pour activer ton compte et commencer à anticiper tes ruptures de stock,
          confirme ton adresse email en cliquant sur le bouton ci-dessous.
        </p>
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="{verify_url}"
             style="display: inline-block; background: linear-gradient(135deg,#6366f1,#d946ef); color: white; text-decoration: none;
                    padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700;">
            Confirmer mon email →
          </a>
        </div>
        <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
            ⏱️ Ce lien est valable <strong style="color: #e4e4e7;">24 heures</strong>.
            Si tu n'as pas créé de compte Stocky, ignore cet email.
          </p>
        </div>
        <p style="color: #71717a; font-size: 12px;">
          Le bouton ne marche pas ? Copie ce lien dans ton navigateur :<br>
          <span style="color: #818cf8; word-break: break-all;">{verify_url}</span>
        </p>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #27272a;">
          <p style="color: #52525b; font-size: 12px; margin: 0;">Envoyé par Stocky · stocky.app</p>
        </div>
      </div>
    </div>
    """
    return _send_email(to_email, "📧 Confirme ton email — Stocky", html)


def send_reset_email(to_email: str, reset_url: str):
    """Send password reset email."""
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background: #0f0f11; color: #e4e4e7; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg,#6366f1,#d946ef); padding: 24px 32px;">
        <h1 style="margin: 0; font-size: 20px; color: white;">🔑 Réinitialisation de mot de passe</h1>
        <p style="margin: 4px 0 0; color: #e0e7ff; font-size: 14px;">Stocky — Sécurité du compte</p>
      </div>
      <div style="padding: 32px;">
        <p style="color: #a1a1aa; margin-bottom: 24px;">
          Tu as demandé la réinitialisation de ton mot de passe. Clique sur le bouton ci-dessous pour en définir un nouveau.
        </p>
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="{reset_url}"
             style="display: inline-block; background: linear-gradient(135deg,#6366f1,#d946ef); color: white; text-decoration: none;
                    padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700;">
            Réinitialiser mon mot de passe →
          </a>
        </div>
        <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
            ⏱️ Ce lien est valable <strong style="color: #e4e4e7;">30 minutes</strong> et ne peut être utilisé qu'une seule fois.
          </p>
        </div>
        <p style="color: #71717a; font-size: 13px;">
          Si tu n'es pas à l'origine de cette demande, ignore cet email — ton mot de passe ne sera pas modifié.
        </p>
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #27272a;">
          <p style="color: #52525b; font-size: 12px; margin: 0;">Envoyé par Stocky · stocky.app</p>
        </div>
      </div>
    </div>
    """
    return _send_email(to_email, "🔑 Réinitialisation mot de passe — Stocky", html)
