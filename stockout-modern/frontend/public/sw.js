const CACHE = 'stocky-v2'

self.addEventListener('install', e => {
  // Force le nouveau SW à prendre le relais immédiatement
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const req = e.request
  const url = new URL(req.url)

  // Bypass complet pour les requêtes cross-origin (API backend, fonts Google, etc.)
  // Le navigateur les gère directement.
  if (url.origin !== self.location.origin) return

  // Bypass pour les méthodes non-GET (POST, PUT, DELETE...)
  if (req.method !== 'GET') return

  // Navigation (HTML) → toujours network-first, sinon écran blanc après deploy
  // (le HTML cached référence d'anciens JS hash qui n'existent plus)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req)
        .then(res => {
          // Met à jour le cache pour fallback offline
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put('/', clone)).catch(() => {})
          return res
        })
        .catch(() => caches.match('/').then(r => r || new Response('Offline', { status: 503 })))
    )
    return
  }

  // Assets versionnés (/assets/*-HASH.js, *.css) → cache-first (immutable)
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached
        return fetch(req)
          .then(res => {
            if (res && res.status === 200 && res.type === 'basic') {
              const clone = res.clone()
              caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {})
            }
            return res
          })
          .catch(() => new Response('Asset unavailable', { status: 503 }))
      })
    )
    return
  }

  // Autres ressources statiques (manifest, icons) → network avec fallback cache
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {})
        }
        return res
      })
      .catch(() => caches.match(req).then(r => r || new Response('Not available', { status: 503 })))
  )
})

// ── Push notifications ──────────────────────────────────────────────────────

self.addEventListener('push', e => {
  let data = { title: '🚨 Stocky', body: 'Alerte de stock', url: '/dashboard' }
  if (e.data) {
    try { data = { ...data, ...JSON.parse(e.data.text()) } } catch {}
  }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: 'stocky-alert',
      renotify: true,
      vibrate: [100, 50, 100],
      data: { url: data.url },
      actions: [
        { action: 'open', title: 'Voir le stock' },
        { action: 'dismiss', title: 'Ignorer' },
      ],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  if (e.action === 'dismiss') return
  const url = e.notification.data?.url || '/dashboard'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      return clients.openWindow(url)
    })
  )
})
