const CACHE_NAME = 'shmiloku-v3';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/game.js',
    './js/renderer.js',
    './js/storage.js',
    './js/i18n.js',
    './js/puzzle-data.js',
    './js/sw-register.js',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Network-first for ALL resources (always serve latest)
    e.respondWith(
        fetch(e.request)
            .then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                return response;
            })
            .catch(() => caches.match(e.request))
    );
});
