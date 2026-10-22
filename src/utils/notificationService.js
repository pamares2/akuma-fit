/**
 * Servicio de Notificaciones Nativas y Alertas Web Push para Akuma Fit.
 * Soporta dispositivos móviles (Android / iOS PWA) y escritorio (Windows / macOS / Chrome).
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
            await sendSystemNotification('Akuma Fit Activo 🏋️', {
                body: '¡Notificaciones activadas! Recibirás los mensajes del entrenador aunque tengas la app minimizada.',
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
 * Envía una notificación emergente nativa al dispositivo con soporte completo
 * para Service Worker (Android, iOS PWA, Chrome, Windows y macOS).
 *
 * @param {string} title - Título de la notificación.
 * @param {Object} [options] - Opciones (cuerpo, icono, etiqueta).
 * @returns {Promise<boolean>} True si se mostró con éxito.
 */
export async function sendSystemNotification(title, options = {}) {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;

    playNotificationChime();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
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
        requireInteraction: false,
        renotify: true,
        data: {
            url: options.url || '/app/feedback-chat',
            ...options.data,
        },
        ...options,
    };

    // 1. Prioridad: Service Worker (imprescindible en Android Chrome e iOS PWA para mostrar en pantalla)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
            // Intentar primero con el registro activo actual
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg && typeof reg.showNotification === 'function') {
                await reg.showNotification(title, defaultOptions);
                return true;
            }

            // O esperar a que el service worker esté listo
            if (navigator.serviceWorker.ready) {
                const readyReg = await navigator.serviceWorker.ready;
                if (readyReg && typeof readyReg.showNotification === 'function') {
                    await readyReg.showNotification(title, defaultOptions);
                    return true;
                }
            }

            // O enviar mensaje al controlador del Service Worker
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title,
                    options: defaultOptions,
                });
                return true;
            }
        } catch (swErr) {
            console.debug('Aviso ServiceWorker showNotification:', swErr);
        }
    }

    // 2. Fallback: Constructor Notification estándar (para navegadores de escritorio)
    try {
        new Notification(title, defaultOptions);
        return true;
    } catch {
        // En Android Chrome new Notification() lanza TypeError, ya manejado por Service Worker
        return false;
    }
}
