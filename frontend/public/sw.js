// ─────────────────────────────────────────────────────────────────────────────
// DoseTracker Service Worker — v2
// ─────────────────────────────────────────────────────────────────────────────
// Strategy:
//   • Static assets (JS chunks, CSS, images) → Cache-First with background update
//   • HTML navigation  → Network-First with offline fallback to cached shell
//   • API calls        → NOT cached here (React Query handles in-memory caching;
//                        caching authenticated health data in SW is a privacy risk)
//
// Versioning: bump CACHE_VERSION on every deploy for instant cache invalidation.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'v2';
const CACHE_NAME = `dosetracker-${CACHE_VERSION}`;

// Core shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pill-icon.svg',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()) // activate immediately
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME) // delete ALL old cache versions
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') return;

  // Skip browser-extension and non-http(s) requests
  if (!request.url.startsWith('http')) return;

  // ── 1. API requests — BYPASS service worker entirely ─────────────────────
  // React Query provides in-memory caching for API data.
  // Caching authenticated /api/ responses in SW would serve stale health data
  // and expose sensitive information across sessions — a security risk.
  if (url.pathname.startsWith('/api/')) return;

  // ── 2. HTML navigation — Network-First ───────────────────────────────────
  // Always try to get fresh HTML shell. Fall back to cached version offline.
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // ── 3. Static assets (JS, CSS, images, fonts) — Cache-First ─────────────
  // These are content-hashed by Vite so old files are never served incorrectly.
  // Background-revalidate ensures the cache stays fresh.
  event.respondWith(
    caches.match(request).then((cached) => {
      // Return cache immediately (fast)
      if (cached) {
        // Background update — don't block the response
        fetch(request)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              caches.open(CACHE_NAME).then((c) => c.put(request, networkRes));
            }
          })
          .catch(() => { /* network unavailable — silent */ });
        return cached;
      }

      // Not in cache — fetch from network and cache for next time
      return fetch(request).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return networkRes;
      });
    })
  );
});

// ── Push / Notification Events ──────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'DoseTracker Reminder', body: "It's time for your scheduled medication." };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: '/pill-icon.svg',
    badge: '/pill-icon.svg',
    tag: 'dose-reminder',
    renotify: true,
    data: data.url || '/',
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data || '/');
    })
  );
});
