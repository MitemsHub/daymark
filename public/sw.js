// Daymark service worker: a small offline layer, no dependencies.
//
// Strategy:
//   - navigations: network first, fall back to cache, then to the cached
//     home page. The app is a calculator; the last seen pages stay usable
//     with no connection.
//   - static assets (/_next/*, icons, fonts): cache first, refresh in the
//     background (stale-while-revalidate).
//   - everything else: network only.
//
// The base path is derived from the registration scope, so the same file
// works at the site root and under /daymark on GitHub Pages.
//
// Bump CACHE_VERSION whenever the shell changes shape.

const CACHE_VERSION = "daymark-v2";
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const SHELL = [
  `${BASE}/`,
  `${BASE}/week`,
  `${BASE}/icon.svg`,
  `${BASE}/icon-192.png`,
  `${BASE}/icon-512.png`,
  `${BASE}/manifest.webmanifest`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network first, cache second.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match(`${BASE}/`))
        ),
    );
    return;
  }

  // Same-origin static assets: cache first, refresh behind the response.
  const path = url.pathname.startsWith(BASE) ? url.pathname.slice(BASE.length) : url.pathname;
  if (path.startsWith("/_next/") || path.match(/\.(png|svg|ico|woff2?|css|js)$/)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        const refresh = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => hit);
        return hit || refresh;
      }),
    );
  }
});
