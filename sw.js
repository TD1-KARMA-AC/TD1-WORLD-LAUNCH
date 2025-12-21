// TD1.WORLD Service Worker
// Offline support and advanced caching

const CACHE_NAME = 'td1-world-v1';
const RUNTIME_CACHE = 'td1-runtime-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/css/enhanced-styles.css',
    '/js/enhanced-features.js',
    '/js/ai-chat-widget.js',
    '/PRODUCTS_INDEX.html',
    '/ABOUT.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('Some assets failed to cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => caches.delete(name))
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;
    
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            return fetch(event.request).then((response) => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                
                // Clone the response
                const responseToCache = response.clone();
                
                // Cache in runtime cache
                caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                
                return response;
            }).catch(() => {
                // Offline fallback
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-forms') {
        event.waitUntil(syncForms());
    }
});

async function syncForms() {
    // Sync any pending form submissions
    const pending = await getPendingForms();
    for (const form of pending) {
        try {
            await fetch('/api/contact', {
                method: 'POST',
                body: JSON.stringify(form.data)
            });
            await removePendingForm(form.id);
        } catch (error) {
            console.error('Failed to sync form:', error);
        }
    }
}

async function getPendingForms() {
    // Get from IndexedDB or localStorage
    return JSON.parse(localStorage.getItem('td1_pending_forms') || '[]');
}

async function removePendingForm(id) {
    const forms = await getPendingForms();
    const filtered = forms.filter(f => f.id !== id);
    localStorage.setItem('td1_pending_forms', JSON.stringify(filtered));
}

