/* 離線快取 Service Worker（本機鏡像用）
 * 目的：手機常常「卡讀取」是因為每次都要重新下載 14 MB。
 * 這裡把 assets/ 與 h/ 底下的東西放進 Cache Storage，之後直接從本機快取回，
 * 只有 index.html 走「網路優先」，確保更新時能拿到新版本。
 *
 * 版本規則：改版時把 CACHE 的版號 +1（update.mjs 會自動做）。
 */
const CACHE = 'xianjingro-v16-foldleft';
const RUNTIME = CACHE + '-rt';
const HTML_TIMEOUT = 8000;

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE && k !== RUNTIME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function isAsset(url) {
  return /\/(assets|h)\//.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // index.html：網路優先（8 秒沒回應就用快取）
  if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME);
        try {
          const ctl = new AbortController();
          const timer = setTimeout(() => ctl.abort(), HTML_TIMEOUT);
          const res = await fetch(req, { signal: ctl.signal, cache: 'no-store' });
          clearTimeout(timer);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          const hit = (await cache.match(req)) || (await caches.match(req));
          if (hit) return hit;
          throw e;
        }
      })()
    );
    return;
  }

  // assets/ 與 h/：快取優先（第一次上網抓，之後都吃本機）
  if (isAsset(url)) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res && res.ok && (res.type === 'basic' || res.type === 'default')) {
          const cache = await caches.open(CACHE);
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      })()
    );
  }
});
