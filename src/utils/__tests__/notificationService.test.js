import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    requestNotificationPermission,
    sendSystemNotification,
} from '../notificationService.js';

describe('notificationService - Notificaciones y Alertas', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('devuelve denied si la API de Notification no existe', async () => {
        const original = window.Notification;
        delete window.Notification;

        const res = await requestNotificationPermission();
        expect(res).toBe('denied');

        window.Notification = original;
    });

    it('solicita permisos con Notification.requestPermission', async () => {
        window.Notification = {
            permission: 'default',
            requestPermission: vi.fn().mockResolvedValue('granted'),
        };

        const res = await requestNotificationPermission();
        expect(res).toBe('granted');
        expect(window.Notification.requestPermission).toHaveBeenCalled();
    });

    it('no lanza error al llamar a sendSystemNotification cuando permission es granted o denied', () => {
        window.Notification = class {
            static permission = 'denied';
        };

        expect(() => {
            sendSystemNotification('Prueba', { body: 'Test' });
        }).not.toThrow();
    });
});
