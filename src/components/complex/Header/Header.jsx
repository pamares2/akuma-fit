import { useNavigate } from 'react-router-dom';
import { FiMenu, FiLogOut, FiUserCheck, FiCornerUpLeft } from 'react-icons/fi';
import ThemeSelector from '../ThemeSelector/ThemeSelector.jsx';
import { useTheme } from '../../../context/useTheme.js';
import { useAuth } from '../../../context/useAuth.js';
import { DEMO_CHAT_CLIENTS } from '../../../services/feedbackService.js';

/**
 * Cabecera de la app con selector de tema anime, selector de vista en vivo
 * ("Ver como Entrenador / Cliente de prueba") y control de sesión.
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
        <header className="header">
            <div className="header-left">
                <button
                    className="menu-toggle-btn"
                    onClick={onMenuToggle}
                    aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                >
                    <FiMenu size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ThemeIcon size={24} style={{ color: 'var(--color-primary)' }} />
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

            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                {canSwitchDemoView && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
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
                                    padding: '0.38rem 0.75rem',
                                    borderRadius: '999px',
                                    background: 'var(--color-primary, #e63946)',
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                                title="Salir de la vista de cliente y volver al panel de Entrenador"
                            >
                                <FiCornerUpLeft size={14} />
                                <span>Volver a Entrenador</span>
                            </button>
                        )}

                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            background: impersonatedClientId
                                ? 'rgba(16, 185, 129, 0.16)'
                                : 'rgba(255, 255, 255, 0.06)',
                            border: `1px solid ${impersonatedClientId ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255, 255, 255, 0.14)'}`,
                        }}>
                            <FiUserCheck
                                size={14}
                                style={{ color: impersonatedClientId ? '#10b981' : 'var(--color-primary, #e63946)' }}
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
                                }}
                            >
                                <option value="" style={{ background: '#181b20', color: '#fff' }}>
                                    🏋️ Vista: Entrenador (Coach)
                                </option>
                                {DEMO_CHAT_CLIENTS.map(client => (
                                    <option
                                        key={client.id}
                                        value={client.id}
                                        style={{ background: '#181b20', color: '#fff' }}
                                    >
                                        👤 Entrar como: {client.fullName} (Cliente)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <ThemeSelector />
                <button onClick={onLogout} className="logout-button" title="Cerrar sesión">
                    <FiLogOut size={16} />
                    <span className="button-text">Salir</span>
                </button>
            </div>
        </header>
    );
}

export default Header;
