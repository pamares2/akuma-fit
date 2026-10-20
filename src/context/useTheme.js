import { useContext } from 'react';
import { ThemeContext } from './themeContextInstance.js';

export function useTheme() {
    return useContext(ThemeContext);
}
