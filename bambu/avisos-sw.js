const ARCHIVOS = 'bambu-archivos-1'
const PAGINA = 'bambu-pagina-1'
const TOPE = 400
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  const quedan = [ARCHIVOS, PAGINA]
  for (const k of await caches.keys()) if (k.startsWith('bambu-') && !quedan.includes(k)) await caches.delete(k)
  await self.clients.claim()
})()))
const esArchivo = (url) => {
  const ruta = url.pathname.slice(new URL(self.registration.scope).pathname.length)
  return !ruta.startsWith('pose/') && (ruta.startsWith('assets/') || /\.(png|webp|svg|jpg|jpeg|woff2|ico)$/i.test(ruta))
}
async function recorta(cache) {
  const llaves = await cache.keys()
  for (const k of llaves.slice(0, Math.max(0, llaves.length - TOPE))) await cache.delete(k)
}
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin || !req.url.startsWith(self.registration.scope)) return
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(PAGINA)
      const guardada = await cache.match(self.registration.scope)
      const red = fetch(req).then(async (r) => { if (r.ok) await cache.put(self.registration.scope, r.clone()); return r })
      if (!guardada) return red.catch(() => Response.error())
      event.waitUntil(red.catch(() => undefined))
      const lenta = new Promise((ok) => setTimeout(() => ok(null), 1500))
      try {
        return (await Promise.race([red, lenta])) || guardada
      } catch {
        return guardada
      }
    })())
    return
  }
  if (!esArchivo(url)) return
  event.respondWith((async () => {
    const cache = await caches.open(ARCHIVOS)
    const guardado = await cache.match(req)
    if (guardado) return guardado
    const red = await fetch(req)
    if (red.ok && red.type === 'basic') { await cache.put(req, red.clone()); recorta(cache) }
    return red
  })())
})
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data ? event.data.text() : '' } }
  const base = self.registration.scope
  const destino = new URL(data.url || './', base)
  const url = destino.href.startsWith(base) ? destino.href : base
  event.waitUntil(self.registration.showNotification(data.title || 'Bambú', {
    body: data.body || '', tag: data.tag || 'bambu', icon: new URL('icon-192.png', base).href, badge: new URL('icon-192.png', base).href, data: { url },
  }))
})
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const base = self.registration.scope
  const pedido = event.notification.data && event.notification.data.url
  const url = typeof pedido === 'string' && pedido.startsWith(base) ? pedido : base
  event.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const abierta = ventanas.find((w) => w.url.startsWith(base))
    if (abierta) { await abierta.focus(); return abierta.navigate(url) }
    return self.clients.openWindow(url)
  })())
})
