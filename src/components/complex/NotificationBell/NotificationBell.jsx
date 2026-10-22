import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiMessageSquare, FiClipboard, FiCheckCircle } from 'react-icons/fi';
import { requestNotificationPermission } from '../../../utils/notificationService.js';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [pushStatus, setPushStatus] = useState(
        typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
    );
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRequestPush = async () => {
        const res = await requestNotificationPermission();
        setPushStatus(res);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                title="Notificaciones y avisos"
                style={{
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                }}
            >
                <FiBell size={18} />
                <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: 'var(--color-primary, #e63946)',
                    boxShadow: '0 0 6px var(--color-primary, #e63946)',
                }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '44px',
                    width: '320px',
                    background: 'var(--color-bg-secondary, #181b20)',
                    border: '1px solid var(--color-border, #282c34)',
                    borderRadius: '14px',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <div style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>Notificaciones y Alertas</span>
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>● Activo</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Aviso 1: Chat 1:1 */}
                        <div
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/app/feedback-chat');
                            }}
                            style={{
                                padding: '0.8rem 1rem',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                            }}
                        >
                            <div style={{ color: 'var(--color-primary, #e63946)', marginTop: '2px' }}>
                                <FiMessageSquare size={16} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                                    Chat 1 a 1 en directo
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#9aa0a6', marginTop: '0.15rem' }}>
                                    Comunicación instantánea con tu entrenador.
                                </div>
                            </div>
                        </div>

                        {/* Aviso 2: Check-In Semanal */}
                        <div
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/app/checkin/new');
                            }}
                            style={{
                                padding: '0.8rem 1rem',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                            }}
                        >
                            <div style={{ color: '#10b981', marginTop: '2px' }}>
                                <FiClipboard size={16} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                                    Check-In Semanal
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#9aa0a6', marginTop: '0.15rem' }}>
                                    Registra tu peso en ayunas y tus fotos de progreso.
                                </div>
                            </div>
                        </div>

                        {/* Control de Notificaciones Push Nativas */}
                        <div style={{ padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.2)' }}>
                            {pushStatus === 'granted' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                                    <FiCheckCircle size={14} />
                                    <span>Notificaciones Web Push activadas en tu dispositivo</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleRequestPush}
                                    style={{
                                        width: '100%',
                                        padding: '0.45rem',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'var(--color-primary, #e63946)',
                                        color: '#fff',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    🔔 Activar notificaciones en el móvil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
