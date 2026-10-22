import { useState, useEffect } from 'react';
import { FiDownload, FiShare, FiPlusSquare, FiX, FiCheck } from 'react-icons/fi';

export default function InstallPwaModal() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    });
    const [showGuide, setShowGuide] = useState(false);

    const isIos = typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInAppBrowser = typeof window !== 'undefined' && (() => {
        const ua = window.navigator.userAgent.toLowerCase();
        return ua.includes('instagram') || ua.includes('whatsapp') || ua.includes('fbav') || ua.includes('fban') || ua.includes('telegram');
    })();

    useEffect(() => {
        if (isInstalled) return;

        // Capturar el evento estándar de instalación para Android Chrome y PCs
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            setShowGuide(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isInstalled]);

    if (isInstalled) return null;

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Android Chrome / Edge / Desktop Chrome
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
            setDeferredPrompt(null);
        } else {
            // iOS o navegador sin evento automático -> Mostrar guía paso a paso
            setShowGuide(true);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={handleInstallClick}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #e63946, #c1121f)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(230, 57, 70, 0.4)',
                    minHeight: '34px',
                    whiteSpace: 'nowrap',
                }}
                title="Instalar Akuma Fit como aplicación en tu móvil o portátil"
                aria-label="Instalar Akuma Fit como aplicación"
            >
                <FiDownload size={14} />
                <span>Instalar App</span>
            </button>

            {showGuide && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.82)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99999,
                        padding: '1.25rem',
                    }}
                    onClick={() => setShowGuide(false)}
                >
                    <div
                        style={{
                            background: '#181b22',
                            border: '1px solid rgba(230, 57, 70, 0.4)',
                            borderRadius: '18px',
                            maxWidth: '440px',
                            width: '100%',
                            padding: '1.5rem',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                            color: '#ffffff',
                            position: 'relative',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setShowGuide(false)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'transparent',
                                border: 'none',
                                color: '#9aa0a6',
                                cursor: 'pointer',
                                fontSize: '1.3rem',
                            }}
                            aria-label="Cerrar"
                        >
                            <FiX />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'var(--color-primary, #e63946)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.3rem',
                                color: '#fff',
                            }}>
                                <FiDownload />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Instalar Akuma Fit</h3>
                                <span style={{ fontSize: '0.8rem', color: '#9aa0a6' }}>App ligera sin ocupar memoria</span>
                            </div>
                        </div>

                        {isInAppBrowser && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid #ef4444',
                                borderRadius: '10px',
                                padding: '0.75rem',
                                marginBottom: '1rem',
                                fontSize: '0.85rem',
                                lineHeight: '1.4',
                            }}>
                                ⚠️ Estás abriendo la web desde WhatsApp/Instagram. Toca los 3 puntos arriba a la derecha y elige <strong>"Abrir en Chrome"</strong> o <strong>"Abrir en Safari"</strong> para poder instalar la app.
                            </div>
                        )}

                        {isIos ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                <p style={{ margin: 0 }}>Sigue estos 2 pasos en <strong>Safari</strong> de tu iPhone:</p>
                                
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '10px' }}>
                                    <div style={{ background: '#262c38', padding: '0.4rem', borderRadius: '8px', color: '#60a5fa' }}>
                                        <FiShare size={20} />
                                    </div>
                                    <div>
                                        <strong>1. Pulsa el botón Compartir</strong>
                                        <div style={{ fontSize: '0.8rem', color: '#9aa0a6', marginTop: '2px' }}>
                                            Es el icono del cuadrado con la flecha hacia arriba situado en la barra inferior de Safari.
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '10px' }}>
                                    <div style={{ background: '#262c38', padding: '0.4rem', borderRadius: '8px', color: '#10b981' }}>
                                        <FiPlusSquare size={20} />
                                    </div>
                                    <div>
                                        <strong>2. Elige "Añadir a la pantalla de inicio"</strong>
                                        <div style={{ fontSize: '0.8rem', color: '#9aa0a6', marginTop: '2px' }}>
                                            Baja un poco en el menú desplegable y pulsa <em>"Añadir a pantalla de inicio"</em> y luego <em>"Añadir"</em> arriba a la derecha.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                <p style={{ margin: 0 }}>Para instalar en tu móvil Android o portátil:</p>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '10px' }}>
                                    <div style={{ background: '#262c38', padding: '0.4rem', borderRadius: '8px', color: '#f59e0b' }}>
                                        <FiCheck size={20} />
                                    </div>
                                    <div>
                                        <strong>En Google Chrome:</strong>
                                        <div style={{ fontSize: '0.8rem', color: '#9aa0a6', marginTop: '2px' }}>
                                            Toca los <strong>3 puntos ⋮</strong> arriba a la derecha en Chrome y pulsa <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '10px' }}>
                                    <div style={{ background: '#262c38', padding: '0.4rem', borderRadius: '8px', color: '#60a5fa' }}>
                                        <FiDownload size={20} />
                                    </div>
                                    <div>
                                        <strong>En Portátil (Windows / Mac):</strong>
                                        <div style={{ fontSize: '0.8rem', color: '#9aa0a6', marginTop: '2px' }}>
                                            Haz clic en el icono de monitor con flecha o el <strong>+</strong> que aparece a la derecha de la barra de direcciones de Chrome o Edge.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setShowGuide(false)}
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem', borderRadius: '10px' }}
                        >
                            ¡Entendido!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
