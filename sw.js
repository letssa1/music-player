const CACHE = "music-player-v1";

const FILES = [
    "/",
    "/index.html",
    "/style.css",
    "/script.js",
    "/manifest.json"
];

// Install: cache all files
self.addEventListener("install", function(e) {
    e.waitUntil(
        caches.open(CACHE).then(function(cache) {
            return cache.addAll(FILES);
        })
    );
});

// Activate: clear old caches
self.addEventListener("activate", function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(k => k !== CACHE).map(k => caches.delete(k))
            );
        })
    );
});

// Fetch: serve from cache, fall back to network
self.addEventListener("fetch", function(e) {
    e.respondWith(
        caches.match(e.request).then(function(cached) {
            return cached || fetch(e.request);
        })
    );
});