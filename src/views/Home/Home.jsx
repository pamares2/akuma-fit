import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/complex/Header/Header.jsx';
import Sidebar from '../../components/complex/Sidebar/Sidebar.jsx';
import SessionBanner from '../../components/complex/SessionBanner/SessionBanner.jsx';
import { useAuth } from '../../context/useAuth.js';
import { useGlobalNotifications } from '../../hooks/useGlobalNotifications.js';
import menuConfig from '../../config/menuConfig.json';

/**
 * Layout de la app autenticada: cabecera + sidebar + <Outlet /> con la
 * sección activa, resuelta por react-router.
 * Integra escucha permanente de notificaciones en tiempo real en segundo plano.
 */
function AppLayout() {
    const { user, profileId, userRole, impersonatedClientId, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const {
        showBanner,
        incomingToast,
        enableNotifications,
        dismissBanner,
        dismissToast,
        goToChat,
    } = useGlobalNotifications({ userRole, profileId, impersonatedClientId });

    const menuItems = useMemo(() => menuConfig[userRole] || menuConfig.coach, [userRole]);

    const handleMenuToggle = () => setSidebarOpen((prev) => !prev);
    const handleSidebarClose = () => setSidebarOpen(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="home-wrapper">
            <Header
                onLogout={handleLogout}
                onMenuToggle={handleMenuToggle}
                menuOpen={sidebarOpen}
            />

            {/* Banner superior de activación de notificaciones en pantalla */}
            {showBanner && (
                <div style={{
                    background: 'linear-gradient(90deg, rgba(230,57,70,0.18), rgba(230,57,70,0.08))',
                    borderBottom: '1px solid rgba(230,57,70,0.3)',
                    padding: '0.65rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    fontSize: '0.85rem',
                    color: '#fff',
                    zIndex: 50,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>🔔</span>
                        <span>
                            <strong>Activa las notificaciones en pantalla:</strong> para recibir avisos de mensajes de tu entrenador y cronómetro aunque minimices la app en el móvil o PC.
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={enableNotifications}
                            style={{
                                background: 'var(--color-primary, #e63946)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.4rem 0.9rem',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(230,57,70,0.4)',
                            }}
                        >
                            Activar en este dispositivo
                        </button>
                        <button
                            type="button"
                            onClick={dismissBanner}
                            title="Cerrar aviso"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                padding: '0 0.3rem',
                                lineHeight: 1,
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Toast flotante en primer plano si llega un mensaje mientras navegas en otra sección */}
            {incomingToast && (
                <div
                    onClick={goToChat}
                    style={{
                        position: 'fixed',
                        top: '72px',
                        right: '20px',
                        maxWidth: '380px',
                        width: 'calc(100vw - 40px)',
                        background: 'var(--color-bg-secondary, #181b20)',
                        border: '1px solid var(--color-primary, #e63946)',
                        borderRadius: '12px',
                        boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
                        padding: '0.85rem 1rem',
                        zIndex: 9999,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                    }}
                >
                    <span style={{ fontSize: '1.4rem', marginTop: '-2px' }}>💬</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#fff' }}>
                            {incomingToast.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.2rem', lineHeight: 1.35 }}>
                            {incomingToast.text}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-primary, #e63946)', fontWeight: 700, marginTop: '0.35rem' }}>
                            Toca aquí para responder →
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            dismissToast();
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9aa0a6',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {!location.pathname.startsWith('/app/session') && <SessionBanner />}
            <div className="home-content">
                <Sidebar
                    items={menuItems}
                    isOpen={sidebarOpen}
                    onClose={handleSidebarClose}
                    userName={user}
                    profileId={profileId}
                />
                <main className="home-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AppLayout;
