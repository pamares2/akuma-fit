/**
 * Servicio de Notificaciones Nativas y Alertas Web Push para Akuma Fit.
 */

/**
 * Solicita permiso de notificaciones al navegador o sistema operativo móvil.
 *
 * @returns {Promise<'granted'|'denied'|'default'>}
 */
export async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            sendSystemNotification('Akuma Fit Activo 🏋️', {
                body: 'Notificaciones activadas. Recibirás avisos de mensajes y check-ins.',
                tag: 'akuma-welcome',
            });
        }
        return permission;
    } catch {
        return 'denied';
    }
}

/**
 * Emite un sonido de notificación sutil mediante Web Audio API.
 */
export function playNotificationChime() {
    if (typeof window === 'undefined') return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Tono agradable tipo mensaje (F5 a A5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(698.46, ctx.currentTime); // F5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch {
        // Ignorar si el audio está bloqueado por interacción
    }
}

/**
 * Envía una notificación emergente nativa al dispositivo.
 *
 * @param {string} title - Título de la notificación.
 * @param {Object} [options] - Opciones (cuerpo, icono, etiqueta).
 */
export function sendSystemNotification(title, options = {}) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    playNotificationChime();

    if (navigator.vibrate) {
        try {
            navigator.vibrate([200, 100, 200]);
        } catch {
            // no-op
        }
    }

    const defaultOptions = {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        silent: false,
        ...options,
    };

    try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready
                .then((registration) => {
                    registration.showNotification(title, defaultOptions);
                })
                .catch(() => {
                    new Notification(title, defaultOptions);
                });
        } else {
            new Notification(title, defaultOptions);
        }
    } catch {
        // Fallback silencioso si falla el constructor
    }
}
