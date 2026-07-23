const CACHE_NAME = "spotify3-v3";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
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
  const url = new URL(event.request.url);

  // Skip caching for Capacitor native protocol
  if (url.protocol === "capacitor:" || url.protocol === "capacitor-js:") {
    event.respondWith(
      fetch(event.request).catch(() => new Response("Offline", { status: 503 }))
    );
    return;
  }

  // Skip caching for API requests - always go to network
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => new Response("API unavailable", { status: 503 }))
    );
    return;
  }

  // Skip caching for data: and blob: URLs
  if (url.protocol === "data:" || url.protocol === "blob:") {
    return;
  }

  // Skip caching for Vite HMR WebSocket
  if (url.pathname === "/" && event.request.headers.get("upgrade") === "websocket") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
