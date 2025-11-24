// BAK UP Service Worker - DISABLED CACHING
// This service worker is registered but does NO caching to prevent cache issues

const CACHE_NAME = 'bakup-v3-nocache';

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing (no-cache version)');
  self.skipWaiting(); // Activate immediately
});

// Activate and delete all old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating (no-cache version)');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Service Worker: Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-only strategy - NO CACHING AT ALL
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // If network fails, return a basic error response
        return new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});
