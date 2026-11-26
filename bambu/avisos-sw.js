self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
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
