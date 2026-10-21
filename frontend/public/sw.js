// Минимальный service worker: сеть в приоритете, кэш — запасной вариант офлайн.
const CACHE = 'vibely-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET' || new URL(request.url).pathname.startsWith('/api/')) return
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && (request.url.startsWith(self.location.origin) || request.url.includes('fonts.g'))) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
        }
        return res
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match('/'))),
  )
})
