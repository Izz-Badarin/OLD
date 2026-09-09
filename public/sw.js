/* CNC Cabinet Designer Pro — offline service worker.
   Precaches the single-file build so the app works with no internet. */
/* Version bump = FORCED fresh precache. Bump this (v1 → v2 → …) whenever a
   new build must replace a stale cached copy across all browsers. */
const CACHE = "cnc-cabinet-designer-v3";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // stale-while-revalidate: answer instantly from the cache, but refresh
      // the cache entry in the background so the NEXT visit serves the newest
      // build. This is what makes "update the app" actually reach the user —
      // without it the old index.html is served forever.
      if (cached) {
        fetch(event.request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(event.request, copy));
            }
          })
          .catch(() => {});
        return cached;
      }
      return fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => cached || Response.error());
    })
  );
});