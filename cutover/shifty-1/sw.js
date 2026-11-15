/* SHIFTY-1's last service worker. SHIFTY-1 moved into ON SHIFT; this replaces the app's offline cache with the small
 * "we moved" page, so installed copies stop serving the old app.
 *
 * It follows the old worker's contract: it WAITS until the player taps "New version ready" in the old app (which sends
 * SKIP_WAITING) or until every old tab is closed, so nothing is swapped out from under a run in progress.
 */
const CACHE = 'shifty1-moved-2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/favicon-32.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  // each file on its own: a missing icon must never stop this worker from replacing the old one
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(FILES.map((f) => cache.add(new Request(f, { cache: 'reload' })).catch(() => {})))));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('shifty1-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Network first (so a later change to this page is seen at once); the cached copy only when offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (!new URL(req.url).pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith(
    fetch(req).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./') : Response.error()))),
  );
});
