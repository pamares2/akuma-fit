import { useTheme } from '../../../context/useTheme.js';

export default function AnimeBanner() {
    const { currentThemeInfo } = useTheme();
    const Icon = currentThemeInfo.Icon;

    return (
        <div className="anime-banner">
            <div className="anime-banner-content">
                <div className="anime-banner-title">
                    <span>{currentThemeInfo.name}</span>
                    <span className="anime-badge">{currentThemeInfo.rank}</span>
                </div>
                <p className="anime-banner-quote">"{currentThemeInfo.quote}"</p>
            </div>
            <div className="anime-banner-icon">
                <Icon />
            </div>
        </div>
    );
}
