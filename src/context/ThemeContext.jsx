import { useState, useEffect } from 'react';
import { ThemeContext, ANIME_THEMES } from './themeContextInstance.js';

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem('akuma_anime_theme');
        return ANIME_THEMES[saved] ? saved : 'dragon-ball';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('akuma_anime_theme', theme);
    }, [theme]);

    const setTheme = (newTheme) => {
        if (ANIME_THEMES[newTheme]) {
            setThemeState(newTheme);
        }
    };

    const value = {
        theme,
        setTheme,
        currentThemeInfo: ANIME_THEMES[theme] || ANIME_THEMES['dragon-ball'],
        themesList: Object.values(ANIME_THEMES),
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
