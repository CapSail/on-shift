/* ON SHIFT service worker. Generated into dist/sw.js by vite.config.ts (do not edit dist/sw.js).
 *
 * Offline-first: everything the game needs is precached at install, so a full shift plays in airplane mode.
 * A new build gets a new cache name. The new worker WAITS until the player taps "update available",
 * so an update never swaps the app out from under a shift in progress.
 */
const BUILD = '__BUILD__';
const CACHE = 'onshift-' + BUILD;
const FILES = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('onshift-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true, ignoreVary: true }).then((hit) => { // ignoreVary: module scripts send Origin, which servers may Vary on
      if (hit) return hit;
      if (req.mode === 'navigate') return caches.match('./', { ignoreSearch: true, ignoreVary: true }).then((r) => r || fetch(req));
      return fetch(req);
    }),
  );
});
