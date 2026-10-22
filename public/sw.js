// Service Worker ligero para habilitar PWA instalable en iOS, Android, Windows y macOS
const CACHE_NAME = 'akuma-fit-v1';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Solo manejar peticiones GET que no sean de API o Supabase para garantizar datos frescos
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin.includes('supabase.co')) return;

    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
