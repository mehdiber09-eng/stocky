"""
Génère une paire de clés VAPID pour les push notifications.
Usage : python -m app.scripts.gen_vapid

Copier les clés dans les variables d'environnement :
  VAPID_PUBLIC_KEY=...
  VAPID_PRIVATE_KEY=...
"""
from py_vapid import Vapid

v = Vapid()
v.generate_keys()
print("VAPID_PUBLIC_KEY =", v.public_key.decode() if isinstance(v.public_key, bytes) else v.public_key)
print("VAPID_PRIVATE_KEY=", v.private_key.decode() if isinstance(v.private_key, bytes) else v.private_key)
print("\nAjouter ces valeurs dans infra/.env.backend ou Railway → Variables")
