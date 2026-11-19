/* ON SHIFT service worker. Generated into dist/sw.js by vite.config.ts (do not edit dist/sw.js).
 *
 * Offline-first: everything the game needs is precached at install, so a full shift plays in airplane mode.
 * A new build gets a new cache name. The new worker WAITS until the player taps "update available",
 * so an update never swaps the app out from under a shift in progress.
 */
const BUILD = 'cbf3866832';
const CACHE = 'onshift-' + BUILD;
const FILES = ["./","./assets/ai-CNwjuR9W.js","./assets/card-D9v8IEzd.js","./assets/cissp-BMElFcww.js","./assets/index-Cj9Uklqb.js","./assets/index-DUSAYj68.css","./assets/jetbrains-mono-latin-400-normal-V6pRDFza.woff2","./assets/press-start-2p-latin-400-normal-_wFEWmAB.woff2","./assets/preview-Bk3FgJxz.js","./assets/preview-CFKSN2nH.js","./assets/scene-BYsWT2zL.js","./assets/soc-Dkk8f9zI.js","./assets/space-grotesk-latin-400-normal-CJ-V5oYT.woff2","./assets/space-grotesk-latin-700-normal-RjhwGPKo.woff2","./assets/speech-Csl5FRtg.js","./assets/store-y2UvKnQK.js","./assets/switcher-BGrZ0hx-.js","./icons/apple-touch-icon.png","./icons/favicon-32.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./index.html","./manifest.webmanifest"];

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
