const CACHE = 'dis-v2'
const ASSETS = [
  '.',
  'index.html',
  'assets/raccoon-idle.png',
  'assets/raccoon-hype.png',
  'assets/raccoon-frontflip.png',
  'assets/raccoon-backflip.png',
  'assets/raccoon-sleep.png',
  'assets/fire-normal.png',
  'assets/fire-onfire.png',
  'assets/fire-broken.png',
]

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ))
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  )
})
