// RestaurantOS SW v4 — MINIMALISTA
// NO cachea JS/CSS de la app (evita el ciclo de caché roto)
const V = 'ros-v4'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Solo interceptar navegación — todo lo demás va directo a la red
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    )
  }
  // JS, CSS, fuentes, imágenes → red directa, sin caché
})
