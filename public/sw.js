// Service Worker con soporte de PWA instalable y notificaciones nativas push en pantalla
const CACHE_NAME = 'akuma-fit-v2';

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

// Receptor de mensajes desde la app (útil cuando la app está minimizada en móvil)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, options } = event.data;
        self.registration.showNotification(title || 'Akuma Fit', options || {});
    }
});

// Al pulsar la notificación emergente en la pantalla del móvil o PC, abrir y enfocar la app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/app/feedback-chat';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    client.focus();
                    if ('navigate' in client && targetUrl) {
                        client.navigate(targetUrl);
                    }
                    return;
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});

// Receptor de eventos Web Push nativos en segundo plano
self.addEventListener('push', (event) => {
    let payload = { title: 'Akuma Fit 💬', body: 'Tienes un nuevo mensaje del entrenador.' };
    try {
        if (event.data) {
            payload = event.data.json();
        }
    } catch {
        if (event.data) payload.body = event.data.text();
    }

    const options = {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192.png',
        badge: payload.badge || '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: payload.tag || `akuma-push-${Date.now()}`,
        data: { url: payload.url || '/app/feedback-chat' },
    };

    event.waitUntil(self.registration.showNotification(payload.title || 'Akuma Fit', options));
});
