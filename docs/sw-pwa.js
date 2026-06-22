// Tab Keeper - Progressive Web App Service Worker
// Enables PWA functionality when installed as a standalone app

const CACHE_NAME = 'tab-keeper-v2.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/options.html',
  '/popup.html',
  '/background.js',
  '/popup.js',
  '/options.js',
  '/content.js',
  '/manifest.webmanifest',
  '/icons/icon16.png',
  '/icons/icon48.png',
  '/icons/icon128.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[Tab Keeper PWA] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Tab Keeper PWA] Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[Tab Keeper PWA] Installation complete, skipping waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[Tab Keeper PWA] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Tab Keeper PWA] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Tab Keeper PWA] Activation complete, claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension:// requests (when running as extension)
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Tab Keeper PWA] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        console.log('[Tab Keeper PWA] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response for caching
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('[Tab Keeper PWA] Fetch failed:', error);
            // Return offline page or error
            return new Response('Tab Keeper is offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Tab Keeper PWA] Skip waiting requested');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '2.0.0', cacheName: CACHE_NAME });
  }
});

// Handle background sync (for future auto-login retries)
self.addEventListener('sync', (event) => {
  console.log('[Tab Keeper PWA] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-tabs') {
    event.waitUntil(
      // Future: Sync tab state with server
      Promise.resolve().then(() => {
        console.log('[Tab Keeper PWA] Tab sync complete');
      })
    );
  }
});

// Handle push notifications (for future alerts)
self.addEventListener('push', (event) => {
  console.log('[Tab Keeper PWA] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Tab Keeper notification',
    icon: '/icons/icon192.png',
    badge: '/icons/icon48.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Tab Keeper', options)
  );
});

console.log('[Tab Keeper PWA] Service worker loaded');
