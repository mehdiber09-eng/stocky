const CACHE = 'stocky-v1'
const PRECACHE = ['/', '/index.html']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  // Network-first for API calls
  if (url.pathname.includes('/api/') || url.port === '8000') {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ offline: true }), { headers: { 'Content-Type': 'application/json' } }))
    )
    return
  }
  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return res
      })
    })
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
