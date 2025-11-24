// BAK UP Service Worker for PWA
const CACHE_NAME = 'bakup-v2'; // Updated version to force cache refresh
const urlsToCache = [
  '/manifest.json'
];

// Install service worker and skip waiting
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing new version');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force immediate activation
  );
});

// Activate immediately and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating new version');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// Network-first strategy for HTML and API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Network-first for HTML files and API calls
  if (request.headers.get('accept')?.includes('text/html') || url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }
  
  // Cache-first for static assets (JS, CSS, images)
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          // Cache the fetched resource
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
  );
});
