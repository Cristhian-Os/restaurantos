// RestaurantOS Service Worker v5
const CACHE = 'ros-v5'
const OFFLINE_URL = '/index.html'

// Install: cachear solo el HTML de entrada
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  )
})

// Activate: borrar cachés viejos y tomar control inmediato
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// Fetch: CRÍTICO — siempre responder, nunca dejar petición colgada
self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Ignorar requests que no son HTTP/HTTPS (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return

  // Ignorar peticiones a Supabase y APIs externas — ir directo a la red
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('fonts.') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/realtime/')
  ) return  // ← dejar que el browser maneje estas requests normal

  // Navegación (cargar la app): intentar red, fallback al index.html cacheado
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          // Actualizar el caché del index.html si la red responde
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(OFFLINE_URL, clone))
          }
          return res
        })
        .catch(() =>
          caches.match(OFFLINE_URL).then(cached =>
            cached ?? new Response('<h1>Sin conexión</h1>', {
              headers: { 'Content-Type': 'text/html' }
            })
          )
        )
    )
    return
  }

  // Todo lo demás (JS, CSS, imágenes, fuentes locales): red directa
  // NO interceptamos — el browser las maneja normalmente
  // Esto evita el bug donde el SW deja requests sin respuesta
})

// Mensajes desde la app
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
