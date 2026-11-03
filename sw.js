/* Service worker : met tout en cache pour un fonctionnement hors ligne,
   et récupère les mises à jour dès qu'une connexion est disponible. */

const VERSION = 'protocoles-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Stratégie : on répond immédiatement depuis le cache (donc hors ligne),
   et on rafraîchit le cache en arrière-plan si le réseau répond. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request)
        .then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            caches.open(VERSION).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
