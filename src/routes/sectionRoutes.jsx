/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import Spinner from '../components/primitives/Spinner/Spinner.jsx';
import { useAuth } from '../context/useAuth.js';

const CoachDashboard = lazy(() => import('../views/Dashboard/CoachDashboard.jsx'));
const ClientDashboard = lazy(() => import('../views/Dashboard/ClientDashboard.jsx'));

function DashboardRouter() {
    const { userRole } = useAuth();
    return userRole === 'coach' ? <CoachDashboard /> : <ClientDashboard />;
}
const CheckIn = lazy(() => import('../views/CheckIn/CheckIn.jsx'));
const NewCheckIn = lazy(() => import('../views/CheckIn/NewCheckIn.jsx'));
const Progress = lazy(() => import('../views/Progress/Progress.jsx'));
const NewWeightLog = lazy(() => import('../views/Progress/NewWeightLog.jsx'));
const ProgressBodyPhotos = lazy(() => import('../views/Progress/ProgressBodyPhotos.jsx'));
const CoachCheckIns = lazy(() => import('../views/CoachCheckIns/CoachCheckIns.jsx'));
const Reports = lazy(() => import('../views/Reports/Reports.jsx'));
const Clients = lazy(() => import('../views/Clients/Clients.jsx'));
const CreateRoutine = lazy(() => import('../views/CreateRoutine/CreateRoutine.jsx'));
const Exercises = lazy(() => import('../views/Exercises/Exercises.jsx'));
const ExerciseForm = lazy(() => import('../views/Exercises/ExerciseForm.jsx'));
const MyPlan = lazy(() => import('../views/MyPlan/MyPlan.jsx'));
const Session = lazy(() => import('../views/Session/Session.jsx'));
const Foods = lazy(() => import('../views/Foods/Foods.jsx'));
const FoodFormPage = lazy(() => import('../views/Foods/FoodFormPage.jsx'));
const Recipes = lazy(() => import('../views/Recipes/Recipes.jsx'));
const RecipeForm = lazy(() => import('../views/Recipes/RecipeForm.jsx'));
const MealPlans = lazy(() => import('../views/MealPlans/MealPlans.jsx'));
const MealPlanEditor = lazy(() => import('../views/MealPlans/MealPlanEditor.jsx'));
const Nutrition = lazy(() => import('../views/Nutrition/Nutrition.jsx'));
const Calendar = lazy(() => import('../views/Calendar/Calendar.jsx'));
const EventCreator = lazy(() => import('../views/Calendar/EventCreator.jsx'));

/**
 * Envuelve un elemento cargado con `React.lazy` en un `Suspense` con un
 * fallback consistente (spinner), para que la carga de secciones bajo demanda
 * (code-splitting) no quede en blanco mientras se descarga el chunk.
 *
 * @param {React.ReactNode} element - Elemento perezoso a envolver.
 * @returns {React.ReactNode} Elemento envuelto en `Suspense`.
 */
function withSuspense(element) {
    return <Suspense fallback={<Spinner />}>{element}</Suspense>;
}

/**
 * Fuente única de verdad del contenido de cada sección del menú.
 * `menuConfig.json` define label/icon/orden por rol; aquí se define qué se
 * renderiza para cada id de sección (rutas relativas a `/app`).
 *
 * Cada entrada es una lista de rutas: la primera es la "principal" (a la que
 * apunta el enlace del sidebar); el resto son sub-vistas propias de esa
 * sección. Las vistas se cargan con `React.lazy` para dividir el bundle por
 * sección.
 */
export const SECTION_ROUTES = {
    dashboard: [
        { path: 'dashboard', element: withSuspense(<DashboardRouter />) },
    ],
    checkin: [
        { path: 'checkin', element: withSuspense(<CheckIn />) },
        { path: 'checkin/new', element: withSuspense(<NewCheckIn />) },
    ],
    progress: [
        { path: 'progress', element: withSuspense(<Progress />) },
        { path: 'progress/weight', element: withSuspense(<NewWeightLog />) },
        { path: 'progress/photos', element: withSuspense(<ProgressBodyPhotos />) },
    ],
    'client-checkins': [
        { path: 'client-checkins', element: withSuspense(<CoachCheckIns />) },
    ],
    reportes: [
        { path: 'reportes', element: withSuspense(<Reports />) },
    ],
    clients: [
        { path: 'clients', element: withSuspense(<Clients />) },
    ],
    exercises: [
        { path: 'exercises', element: withSuspense(<Exercises />) },
        { path: 'exercises/new', element: withSuspense(<ExerciseForm />) },
        { path: 'exercises/:id/edit', element: withSuspense(<ExerciseForm />) },
    ],
    alimentos: [
        { path: 'alimentos', element: withSuspense(<Foods />) },
        { path: 'alimentos/new', element: withSuspense(<FoodFormPage />) },
        { path: 'alimentos/:id/edit', element: withSuspense(<FoodFormPage />) },
    ],
    recetas: [
        { path: 'recetas', element: withSuspense(<Recipes />) },
        { path: 'recetas/new', element: withSuspense(<RecipeForm />) },
        { path: 'recetas/:id/edit', element: withSuspense(<RecipeForm />) },
    ],
    dietas: [
        { path: 'dietas', element: withSuspense(<MealPlans />) },
        { path: 'dietas/new', element: withSuspense(<MealPlanEditor />) },
        { path: 'dietas/:id/edit', element: withSuspense(<MealPlanEditor />) },
    ],
    plans: [
        { path: 'plans', element: withSuspense(<CreateRoutine />) },
    ],
    'my-plan': [
        { path: 'my-plan', element: withSuspense(<MyPlan />) },
    ],
    session: [
        { path: 'session', element: withSuspense(<Session />) },
    ],
    nutrition: [
        { path: 'nutrition', element: withSuspense(<Nutrition />) },
    ],
    calendario: [
        { path: 'calendario', element: withSuspense(<Calendar />) },
        { path: 'calendario/nuevo', element: withSuspense(<EventCreator />) },
    ],
};

/**
 * Todas las rutas (aplanadas) de todas las secciones, para generar el
 * <Routes> en App.
 */
export const ALL_SECTION_ROUTES = Object.values(SECTION_ROUTES).flat();
