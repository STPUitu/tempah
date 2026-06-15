const CACHE_NAME = 'stpu-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './Index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Strategi: network-first untuk request ke Apps Script (data sentiasa terkini),
// cache-first untuk shell statik (HTML/CSS/JS/icon) supaya app boleh dibuka offline.
self.addEventListener('fetch', function(event) {
  const url = event.request.url;

  if (url.indexOf('script.google.com') !== -1) {
    // Jangan cache panggilan API/semakan - sentiasa ambil data terkini.
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(
          JSON.stringify({ ok: false, error: 'offline' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }).catch(function() {
      return caches.match('./index.html');
    })
  );
});
