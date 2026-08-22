/**
 * KayBiT Snake Detector - Progressive Web App Service Worker
 * Provides resilient offline caching for historical detection alerts,
 * camera configuration settings, and static application shell.
 */

const CACHE_VERSION = "kaybit-pwa-v1.2";
const STATIC_CACHE = `kaybit-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `kaybit-runtime-${CACHE_VERSION}`;
const API_DATA_CACHE = `kaybit-api-data-${CACHE_VERSION}`;
const IMAGE_CACHE = `kaybit-images-${CACHE_VERSION}`;

// Pre-cached core app shell assets
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg"
];

// Installation event: Pre-cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[Service Worker] Pre-caching application shell");
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[Service Worker] Some precache assets failed:", err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activation event: Cleanup obsolete caches
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE, API_DATA_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log("[Service Worker] Deleting obsolete cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event: Apply tiered caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (handled by client IndexedDB queue)
  if (request.method !== "GET") {
    return;
  }

  // Strategy 1: API Endpoints (Alerts, Edge Camera Config, System Status, Notifications)
  // Network-First with Cache Fallback to guarantee fresh data online and seamless offline access.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(API_DATA_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log(`[Service Worker] Network offline. Serving cached API data for: ${url.pathname}`);
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            // Append header to notify client app of offline cached origin
            const headers = new Headers(cachedResponse.headers);
            headers.set("X-KayBiT-Source", "sw-cache-offline");
            return new Response(await cachedResponse.blob(), {
              status: 200,
              statusText: "OK (Offline Cached)",
              headers
            });
          }

          // Fallback mock JSON structures for critical endpoints if cache is empty
          if (url.pathname.includes("/api/alerts")) {
            return new Response(JSON.stringify([]), {
              headers: { "Content-Type": "application/json", "X-KayBiT-Source": "sw-offline-empty" }
            });
          }
          if (url.pathname.includes("/api/status")) {
            return new Response(JSON.stringify({
              status: "offline_cached",
              activeAlertsCount: 0,
              totalDetections: 0,
              fcmStatus: "offline_queued"
            }), {
              headers: { "Content-Type": "application/json", "X-KayBiT-Source": "sw-offline-empty" }
            });
          }

          return new Response(JSON.stringify({ offline: true, error: "Offline mode active" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        })
    );
    return;
  }

  // Strategy 2: External Images (Unsplash photos, diagrams)
  // Cache-First with Network Fallback
  if (request.destination === "image" || url.hostname.includes("images.unsplash.com") || url.pathname.endsWith(".svg") || url.pathname.endsWith(".png")) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          // If offline and image not in cache, return fallback svg icon
          const iconCached = await caches.match("/icon.svg");
          if (iconCached) return iconCached;
          return new Response("", { status: 404 });
        }
      })
    );
    return;
  }

  // Strategy 3: App Shell Navigation (HTML documents)
  // Network-First with Fallback to precached index.html
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match("/index.html");
          if (fallback) return fallback;
          return new Response("Offline - KayBiT PWA Shell", {
            headers: { "Content-Type": "text/html" }
          });
        })
    );
    return;
  }

  // Strategy 4: JS, CSS, fonts, and other static assets
  // Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for client messages (e.g., skipWaiting, cache inspections)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});
