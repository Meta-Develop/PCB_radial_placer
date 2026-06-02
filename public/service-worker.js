const CACHE_VERSION = '2026-06-02-v2';
const APP_CACHE = `pcb-radial-placer-app-${CACHE_VERSION}`;
const ASSET_CACHE = `pcb-radial-placer-assets-${CACHE_VERSION}`;
const APP_SHELL_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './example-preview.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    cacheAppShell()
      .then(() => cacheCurrentBuildAssets())
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('pcb-radial-placer-'))
            .filter((cacheName) => cacheName !== APP_CACHE && cacheName !== ASSET_CACHE)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || url.pathname.endsWith('/service-worker.js')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isViteBuildAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isAppShellAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, APP_CACHE));
  }
});

function isViteBuildAsset(url) {
  return url.href.startsWith(self.registration.scope) && url.pathname.includes('/assets/');
}

function isAppShellAsset(url) {
  return APP_SHELL_URLS.some((path) => new URL(path, self.registration.scope).href === url.href);
}

function extractBuildAssetUrls(html, baseUrl) {
  const urls = new Set();
  const assetPattern = /\b(?:href|src)="([^"]*assets\/[^"]+)"/g;
  let match = assetPattern.exec(html);

  while (match) {
    const assetUrl = new URL(match[1], baseUrl);
    if (assetUrl.origin === self.location.origin && assetUrl.href.startsWith(self.registration.scope)) {
      urls.add(assetUrl.href);
    }
    match = assetPattern.exec(html);
  }

  return [...urls];
}

function isCacheable(response) {
  return response && response.status === 200 && (response.type === 'basic' || response.type === 'default');
}

async function cacheAppShell() {
  try {
    const cache = await caches.open(APP_CACHE);
    await Promise.allSettled(APP_SHELL_URLS.map((url) => cache.add(url)));
  } catch {
    // The service worker can still pass through online responses if app shell caching is unavailable.
  }
}

async function putCacheEntry(cache, request, response) {
  try {
    await cache.put(request, response);
  } catch {
    // Cache quota and private-browsing failures should not block a valid network response.
  }
}

async function cacheCurrentBuildAssets() {
  try {
    const indexResponse = await fetch('./index.html', { cache: 'reload' });
    if (!isCacheable(indexResponse)) {
      return;
    }

    const assetUrls = extractBuildAssetUrls(await indexResponse.clone().text(), indexResponse.url);
    if (assetUrls.length === 0) {
      return;
    }

    const assetCache = await caches.open(ASSET_CACHE);
    await Promise.allSettled(assetUrls.map((assetUrl) => assetCache.add(assetUrl)));
  } catch {
    // The app shell cache still supports offline fallback if build asset warmup fails.
  }
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      const cache = await caches.open(APP_CACHE);
      await putCacheEntry(cache, './index.html', response.clone());
    }
    return response;
  } catch {
    const cachedShell = await caches.match('./index.html');
    if (cachedShell) {
      return cachedShell;
    }

    const cachedRoot = await caches.match('./');
    if (cachedRoot) {
      return cachedRoot;
    }

    return new Response('PCB Radial Placer is offline and the app shell is not cached yet.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (isCacheable(networkResponse)) {
    const cache = await caches.open(ASSET_CACHE);
    await putCacheEntry(cache, request, networkResponse.clone());
  }
  return networkResponse;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (isCacheable(networkResponse)) {
        void putCacheEntry(cache, request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => undefined);

  return cachedResponse || (await networkResponsePromise) || Response.error();
}
