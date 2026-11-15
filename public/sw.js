/* HoopMind service worker — app shell + offline fallback + runtime cache. */
const VERSION = "v2";
const SHELL_CACHE = `hoopmind-shell-${VERSION}`;
const RUNTIME_CACHE = `hoopmind-runtime-${VERSION}`;

const SHELL_ASSETS = [
  "/",
  "/dashboard",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API responses (auth/data correctness).
  if (url.pathname.startsWith("/api/")) return;

  // Navigation: network-first; on failure serve cached page, then offline.html.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches
            .open(RUNTIME_CACHE)
            .then((cache) => cache.put(req, copy))
            .catch(() => undefined);
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return (
            cached ||
            (await caches.match("/dashboard")) ||
            (await caches.match("/offline.html")) ||
            Response.error()
          );
        }),
    );
    return;
  }

  // Static assets: cache-first with background refresh.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches
            .open(RUNTIME_CACHE)
            .then((cache) => cache.put(req, copy))
            .catch(() => undefined);
          return res;
        }),
    ),
  );
});
