import { FiMenu, FiLogOut } from 'react-icons/fi';
import ThemeSelector from '../ThemeSelector/ThemeSelector.jsx';
import { useTheme } from '../../../context/useTheme.js';

/**
 * Cabecera de la app con selector de tema anime y control de sesión.
 *
 * @param {Object} props - Props del componente.
 * @param {() => void} props.onLogout - Callback de cierre de sesión.
 * @param {() => void} props.onMenuToggle - Callback para abrir/cerrar el menú.
 * @param {boolean} props.menuOpen - Si el menú lateral está abierto.
 */
function Header({ onLogout, onMenuToggle, menuOpen }) {
    const { currentThemeInfo } = useTheme();
    const ThemeIcon = currentThemeInfo.Icon;

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
            <div className="header-right">
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
