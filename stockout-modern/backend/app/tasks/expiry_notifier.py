"""Background task pour notifier des lots expirant bientôt."""
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.db import engine, AsyncSessionLocal
from app.models import models
from app.core.config import settings

logger = logging.getLogger(__name__)


async def check_expiring_lots():
    """
    Vérifier les lots expirant dans EXPIRY_ALERT_DAYS jours.
    Créer une notification pour chaque utilisateur.
    Lancée une fois par jour (via background task).
    """
    try:
        async with AsyncSessionLocal() as db:
            now = datetime.now(timezone.utc)
            alert_cutoff = now + timedelta(days=settings.EXPIRY_ALERT_DAYS)

            # Trouver tous les lots expirant bientôt (pas encore notifiés pour ce cycle)
            stmt = select(models.Lot).where(
                models.Lot.expiry_date != None,
                models.Lot.expiry_date <= alert_cutoff,
                models.Lot.expiry_date > now,  # Pas déjà périmés
            )
            result = await db.execute(stmt)
            expiring_lots = result.scalars().all()

            logger.info(f"Found {len(expiring_lots)} lots expiring soon")

            # Grouper par utilisateur et créer notification
            lots_by_user = {}
            for lot in expiring_lots:
                if lot.owner_id not in lots_by_user:
                    lots_by_user[lot.owner_id] = []
                lots_by_user[lot.owner_id].append(lot)

            for user_id, user_lots in lots_by_user.items():
                # Vérifier s'il existe déjà une notification pour ce jour
                today = now.replace(hour=0, minute=0, second=0, microsecond=0)
                existing = await db.execute(
                    select(models.Notification).where(
                        models.Notification.user_id == user_id,
                        models.Notification.kind == "expiry",
                        models.Notification.created_at >= today,
                    )
                )
                if existing.scalars().first():
                    logger.info(f"Notification already sent to user {user_id} today")
                    continue

                # Créer une notification consolidée
                days_until = (min(lot.expiry_date for lot in user_lots) - now).days
                severity = "critical" if days_until <= 7 else "warning"

                notif = models.Notification(
                    user_id=user_id,
                    kind="expiry",
                    severity=severity,
                    title=f"{len(user_lots)} lot(s) à écouler",
                    message=f"{len(user_lots)} lot(s) expire(nt) dans {days_until} jour(s) ou moins",
                )
                db.add(notif)
                logger.info(f"Created expiry notification for user {user_id}")

            await db.commit()

    except Exception as e:
        logger.error(f"Error in check_expiring_lots: {e}", exc_info=True)


async def start_expiry_checker():
    """
    Démarrer une tâche de fond qui vérifie les expirations toutes les 24h.
    Lancée au startup de l'app via lifespan.
    """
    asyncio.create_task(_expiry_loop())


async def _expiry_loop():
    """Boucle infinie qui exécute check_expiring_lots toutes les 24h."""
    while True:
        try:
            await check_expiring_lots()
            # Attendre 24h avant la prochaine vérification
            await asyncio.sleep(86400)  # 24h * 3600s
        except asyncio.CancelledError:
            logger.info("Expiry checker task cancelled")
            break
        except Exception as e:
            logger.error(f"Unexpected error in expiry loop: {e}", exc_info=True)
            # Attendre 1h avant de réessayer en cas d'erreur
            await asyncio.sleep(3600)
