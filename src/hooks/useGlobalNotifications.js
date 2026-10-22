import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { sendSystemNotification, requestNotificationPermission } from '../utils/notificationService.js';
import { isDemoClientId } from '../services/feedbackService.js';

/**
 * Hook global de notificaciones en tiempo real para Akuma Fit.
 * Permanece activo en todo momento mientras el usuario está en la app
 * (Dashboard, Nutrición, Rutinas, etc. o con la app minimizada en segundo plano).
 *
 * @param {Object} params - Parámetros del usuario actual.
 * @param {string} params.userRole - Rol ('coach' o 'client').
 * @param {string|number} params.profileId - Id del perfil actual.
 * @param {string|null} params.impersonatedClientId - Id del cliente impersonado si aplica.
 */
export function useGlobalNotifications({ userRole, profileId, impersonatedClientId }) {
    const location = useLocation();
    const navigate = useNavigate();

    const [permissionStatus, setPermissionStatus] = useState(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            return Notification.permission;
        }
        return 'denied';
    });

    const [showBanner, setShowBanner] = useState(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return false;
        if (Notification.permission === 'granted') return false;
        const dismissed = sessionStorage.getItem('akuma_notif_banner_dismissed');
        return !dismissed;
    });

    const [incomingToast, setIncomingToast] = useState(null);
    const toastTimerRef = useRef(null);

    // Escuchar cambios de permiso si el navegador lo soporta
    useEffect(() => {
        if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions.query) {
            let activeStatus = null;
            const onChange = () => {
                if (activeStatus) {
                    setPermissionStatus(activeStatus.state === 'granted' ? 'granted' : activeStatus.state);
                }
            };
            navigator.permissions.query({ name: 'notifications' }).then((status) => {
                activeStatus = status;
                status.addEventListener('change', onChange);
            }).catch(() => {});

            return () => {
                if (activeStatus) {
                    activeStatus.removeEventListener('change', onChange);
                }
            };
        }
    }, []);

    const handleEnableNotifications = async () => {
        const res = await requestNotificationPermission();
        setPermissionStatus(res);
        if (res === 'granted') {
            setShowBanner(false);
            sessionStorage.removeItem('akuma_notif_banner_dismissed');
        }
    };

    const handleDismissBanner = () => {
        setShowBanner(false);
        sessionStorage.setItem('akuma_notif_banner_dismissed', 'true');
    };

    // Función que evalúa y dispara la notificación si procede
    const handleIncomingMessage = useCallback((payload, clientTargetId) => {
        if (!payload || !payload.text) return;

        const isCoach = userRole === 'coach';
        const isClient = userRole === 'client';
        const currentClientId = String(impersonatedClientId || profileId || '');
        const targetId = String(clientTargetId || '');

        let shouldNotify = false;
        let notificationTitle = '💬 Mensaje nuevo en Akuma Fit';

        // Caso 1: El usuario actual es el entrenador y el mensaje proviene de un cliente
        if (isCoach && payload.authorRole === 'client') {
            shouldNotify = true;
            notificationTitle = `💬 ${payload.authorName || 'Cliente'}:`;
        }

        // Caso 2: El usuario actual es un cliente (o vista de cliente Laura/Carlos) y el mensaje viene del entrenador
        if (isClient && payload.authorRole === 'coach') {
            if (!targetId || targetId === currentClientId || targetId === 'all') {
                shouldNotify = true;
                notificationTitle = `💬 ${payload.authorName || 'Tu Entrenador'}:`;
            }
        }

        if (!shouldNotify) return;

        // Comprobar si la app está minimizada / en segundo plano
        const isAppHidden = typeof document !== 'undefined' && (document.hidden || document.visibilityState !== 'visible');
        // Comprobar si el usuario no está en la pantalla de chat
        const isOutsideChat = !location.pathname.includes('/app/feedback-chat') && !location.pathname.includes('/app/chat');

        // Disparar notificación nativa en pantalla mediante Service Worker
        sendSystemNotification(notificationTitle, {
            body: payload.text,
            tag: `msg-${payload.rowId || Date.now()}`,
            url: '/app/feedback-chat',
        });

        // Si la ventana está en primer plano pero en otra sección, mostrar toast flotante
        if (!isAppHidden && isOutsideChat) {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            setIncomingToast({
                title: notificationTitle,
                text: payload.text,
                url: '/app/feedback-chat',
            });
            toastTimerRef.current = setTimeout(() => {
                setIncomingToast(null);
            }, 6000);
        }
    }, [userRole, profileId, impersonatedClientId, location.pathname]);

    // Suscripción permanente mientras el usuario está en el layout de la app
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1. Evento DOM local
        const onDomEvent = (event) => {
            if (event.detail) {
                handleIncomingMessage(event.detail.payload, event.detail.clientProfileId);
            }
        };
        window.addEventListener('akuma_feedback_live_event', onDomEvent);

        // 2. BroadcastChannel
        let bc = null;
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                bc = new BroadcastChannel('akuma_feedback_live_sync');
                bc.onmessage = (event) => {
                    if (event.data) {
                        handleIncomingMessage(event.data.payload, event.data.clientProfileId);
                    }
                };
            }
        } catch {
            // no-op
        }

        // 3. Supabase Realtime Broadcast Hub permanente
        let sbChannel = null;
        try {
            if (supabase && typeof supabase.channel === 'function') {
                sbChannel = supabase.channel('akuma-global-live-hub', {
                    config: { broadcast: { ack: false } },
                });

                sbChannel.on('broadcast', { event: 'new_chat_message' }, ({ payload }) => {
                    if (payload) {
                        handleIncomingMessage(payload.payload, payload.clientProfileId);
                    }
                });

                // Si es usuario real en Supabase, escuchar cambios de tabla
                const isDemo = isDemoClientId(String(impersonatedClientId || profileId));
                if (!isDemo && profileId && typeof profileId === 'number') {
                    sbChannel.on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'calendar_event',
                        },
                        (eventPayload) => {
                            try {
                                const row = eventPayload.new;
                                if (row && row.description) {
                                    const parsed = JSON.parse(row.description);
                                    if (parsed && parsed.kind === 'message') {
                                        handleIncomingMessage(parsed, row.profile_id);
                                    }
                                }
                            } catch {
                                // no-op
                            }
                        }
                    );
                }

                sbChannel.subscribe();
            }
        } catch {
            // no-op
        }

        return () => {
            window.removeEventListener('akuma_feedback_live_event', onDomEvent);
            if (bc) {
                try {
                    bc.close();
                } catch {
                    // no-op
                }
            }
            if (sbChannel) {
                try {
                    supabase.removeChannel(sbChannel);
                } catch {
                    // no-op
                }
            }
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, [handleIncomingMessage, impersonatedClientId, profileId]);

    return {
        permissionStatus,
        showBanner,
        incomingToast,
        dismissToast: () => setIncomingToast(null),
        enableNotifications: handleEnableNotifications,
        dismissBanner: handleDismissBanner,
        goToChat: () => {
            setIncomingToast(null);
            navigate('/app/feedback-chat');
        },
    };
}
