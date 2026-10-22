import { FiGrid, FiUsers, FiClipboard, FiTrendingUp, FiCheckCircle, FiActivity, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import { GiWeightLiftingUp, GiFruitBowl, GiWeightScale, GiCookingPot, GiMeal } from 'react-icons/gi';

/**
 * Mapa centralizado de iconos del menú. Cada entrada de `menuConfig.json`
 * referencia una de estas claves (string) y aquí se resuelve a un icono
 * vectorial de `react-icons`, consistente en tamaño, grosor y color con el
 * resto de la interfaz.
 */
const ICON_MAP = {
    dashboard: FiGrid,
    clients: FiUsers,
    feedback: FiMessageSquare,
    exercises: GiWeightLiftingUp,
    nutrition: GiFruitBowl,
    plans: FiClipboard,
    reports: FiTrendingUp,
    progress: FiTrendingUp,
    checkin: FiCheckCircle,
    session: FiActivity,
    recipes: GiCookingPot,
    diet: GiMeal,
    'weight-log': GiWeightScale,
    calendar: FiCalendar,
};

export default ICON_MAP;
