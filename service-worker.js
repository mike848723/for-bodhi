const CACHE_NAME = "space-explorer-v1";

const APP_SHELL = [
    ".forbodhi/",
    "./forbodhi/index.html",
    "./forbodhi/styles.css",
    "./forbodhi/script.js",
    "./forbodhi/images/NASA-Logo-Large.jpg",
    "./forbodhi/images/nasa-worm-logo.png",
    "./forbodhi/manifest.json",
    "./forbodhi/app.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Service Worker: Caching App Shell");
            return cache.addAll(APP_SHELL);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log("[Service Worker] Removing old cache:", key);
                        return caches.delete(key);
                    })
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    const isApiCall = url.hostname === "api.nasa.gov";

    if (isApiCall) {
        event.respondWith(cacheFirst(event.request));
    } else
        event.respondWith(NetworkFirst(event.request));
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        console.log("[Service Worker] Network failed, tryting cache for:", request.url);
        const cached = await cache.match(request);
        if (cached) return cached;
        throw error;
    }
}    