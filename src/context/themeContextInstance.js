import { createContext } from 'react';
import { GiDragonBalls, GiPirateFlag, GiShuriken, GiSpellBook } from 'react-icons/gi';

export const ANIME_THEMES = {
    'dragon-ball': {
        id: 'dragon-ball',
        name: 'Dragon Ball Z',
        shortName: 'Dragon Ball',
        subtitle: 'Ki Saiyajin',
        quote: '¡Supera tus límites! Más allá del Super Saiyajin.',
        Icon: GiDragonBalls,
        rank: 'Super Saiyajin',
        accentColor: '#f59e0b',
    },
    'one-piece': {
        id: 'one-piece',
        name: 'One Piece',
        shortName: 'One Piece',
        subtitle: 'Haki del Conquistador',
        quote: '¡Seré el Rey de los Piratas! Ningún entrenamiento me detendrá.',
        Icon: GiPirateFlag,
        rank: 'Rey de los Piratas',
        accentColor: '#ef4444',
    },
    'naruto': {
        id: 'naruto',
        name: 'Naruto Shippuden',
        shortName: 'Naruto',
        subtitle: 'Voluntad de Fuego',
        quote: '¡Mi camino ninja es no rendirme jamás! ¡Dattebayo!',
        Icon: GiShuriken,
        rank: 'Hokage',
        accentColor: '#f97316',
    },
    'black-clover': {
        id: 'black-clover',
        name: 'Black Clover',
        shortName: 'Black Clover',
        subtitle: 'Anti-Magia & Toros Negros',
        quote: '¡Mi magia es no rendirme! Supera tus límites, aquí y ahora.',
        Icon: GiSpellBook,
        rank: 'Caballero Mágico',
        accentColor: '#e11d48',
    },
};

export const ThemeContext = createContext({
    theme: 'dragon-ball',
    setTheme: () => {},
    currentThemeInfo: ANIME_THEMES['dragon-ball'],
    themesList: Object.values(ANIME_THEMES),
});
