import { useTheme } from '../../../context/useTheme.js';

export default function ThemeSelector({ compact = false }) {
    const { theme, setTheme, themesList } = useTheme();

    return (
        <div className={`theme-switcher ${compact ? 'compact' : ''}`} role="group" aria-label="Selector de tema Anime">
            {themesList.map((t) => {
                const isActive = t.id === theme;
                const IconComponent = t.Icon;

                return (
                    <button
                        key={t.id}
                        type="button"
                        className={`theme-btn ${isActive ? 'active' : ''}`}
                        onClick={() => setTheme(t.id)}
                        title={`${t.name} - ${t.subtitle}`}
                    >
                        <IconComponent size={16} />
                        {!compact && <span className="theme-name">{t.shortName}</span>}
                    </button>
                );
            })}
        </div>
    );
}
