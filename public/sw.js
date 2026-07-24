const CACHE_NAME = "spotify3-v8";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.protocol === "capacitor:" || url.protocol === "capacitor-js:") {
    event.respondWith(
      fetch(event.request).catch(() => new Response("Offline", { status: 503 }))
    );
    return;
  }

  if (url.hostname !== self.location.hostname) return;
  if (url.protocol === "data:" || url.protocol === "blob:") return;
  if (event.request.headers.get("upgrade") === "websocket") return;

  const OFFLINE_RESPONSE = new Response("Offline", {
    status: 503,
    headers: { "Content-Type": "text/plain" },
  });

  // HTML: network-first
  if (event.request.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || OFFLINE_RESPONSE))
    );
    return;
  }

  // JS/CSS/images: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => OFFLINE_RESPONSE);
    })
  );
});
