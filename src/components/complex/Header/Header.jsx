import { useNavigate } from 'react-router-dom';
import { FiMenu, FiLogOut, FiUserCheck, FiCornerUpLeft } from 'react-icons/fi';
import ThemeSelector from '../ThemeSelector/ThemeSelector.jsx';
import InstallPwaModal from '../InstallPwaModal/InstallPwaModal.jsx';
import NotificationBell from '../NotificationBell/NotificationBell.jsx';
import { useTheme } from '../../../context/useTheme.js';
import { useAuth } from '../../../context/useAuth.js';
import { DEMO_CHAT_CLIENTS } from '../../../services/feedbackService.js';

/**
 * Cabecera accesible y responsive de la app con selector de tema anime,
 * botón directo de instalación de la app PWA, selector de vista en vivo
 * ("Ver como Entrenador / Cliente de prueba") y control de sesión seguro.
 */
function Header({ onLogout, onMenuToggle, menuOpen }) {
    const navigate = useNavigate();
    const { currentThemeInfo } = useTheme();
    const {
        realUserRole,
        impersonatedClientId,
        switchClientView,
    } = useAuth();
    const ThemeIcon = currentThemeInfo.Icon;

    const handleRoleSelect = (e) => {
        const val = e.target.value;
        if (!val) {
            switchClientView(null);
            navigate('/app/clients');
        } else {
            switchClientView(val);
            navigate('/app/nutrition');
        }
    };

    const canSwitchDemoView = realUserRole === 'coach' || Boolean(impersonatedClientId);

    return (
        <header className="header" role="banner">
            <div className="header-left">
                <button
                    className="menu-toggle-btn"
                    onClick={onMenuToggle}
                    aria-label={menuOpen ? 'Cerrar menú lateral de navegación' : 'Abrir menú lateral de navegación'}
                    aria-expanded={menuOpen}
                >
                    <FiMenu size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ThemeIcon size={24} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                    <span style={{
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        letterSpacing: '0.05em',
                        color: 'var(--color-text)',
                        textTransform: 'uppercase',
                    }}>
                        Akuma <span style={{ color: 'var(--color-primary)' }}>Fit</span>
                    </span>
                </div>
            </div>

            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <InstallPwaModal />

                {canSwitchDemoView && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {impersonatedClientId && (
                            <button
                                type="button"
                                onClick={() => {
                                    switchClientView(null);
                                    navigate('/app/clients');
                                }}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '999px',
                                    background: 'var(--color-primary, #e63946)',
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    minHeight: '34px',
                                }}
                                title="Salir de la vista de cliente y volver al panel de Entrenador"
                                aria-label="Volver a la vista de Entrenador"
                            >
                                <FiCornerUpLeft size={14} aria-hidden="true" />
                                <span>Volver a Entrenador</span>
                            </button>
                        )}

                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            background: impersonatedClientId
                                ? 'rgba(16, 185, 129, 0.16)'
                                : 'rgba(255, 255, 255, 0.06)',
                            border: `1px solid ${impersonatedClientId ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255, 255, 255, 0.14)'}`,
                            minHeight: '34px',
                        }}>
                            <FiUserCheck
                                size={14}
                                style={{ color: impersonatedClientId ? '#10b981' : 'var(--color-primary, #e63946)' }}
                                aria-hidden="true"
                            />
                            <select
                                value={impersonatedClientId || ''}
                                onChange={handleRoleSelect}
                                aria-label="Cambiar vista entre Entrenador y Clientes de prueba"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    outline: 'none',
                                    maxWidth: '180px',
                                }}
                            >
                                <option value="" style={{ background: '#181b20', color: '#fff' }}>
                                    🏋️ Vista: Entrenador
                                </option>
                                {DEMO_CHAT_CLIENTS.map(client => (
                                    <option
                                        key={client.id}
                                        value={client.id}
                                        style={{ background: '#181b20', color: '#fff' }}
                                    >
                                        👤 Cliente: {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <NotificationBell />
                <ThemeSelector />
                <button
                    onClick={onLogout}
                    className="logout-button"
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión de Akuma Fit"
                    style={{ minHeight: '34px' }}
                >
                    <FiLogOut size={16} aria-hidden="true" />
                    <span className="button-text">Salir</span>
                </button>
            </div>
        </header>
    );
}

export default Header;
