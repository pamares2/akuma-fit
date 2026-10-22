import { DEFAULT_RECIPES } from './defaultRecipes.js';
import { DEMO_CHAT_CLIENTS } from '../services/feedbackService.js';

const DEMO_PLAN_ASSIGNMENTS_KEY = 'akuma_demo_client_meal_plans_v1';

function loadAssignments() {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    try {
        const raw = window.localStorage.getItem(DEMO_PLAN_ASSIGNMENTS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveAssignments(store) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(DEMO_PLAN_ASSIGNMENTS_KEY, JSON.stringify(store));
    } catch {
        // Ignorar errores de almacenamiento
    }
}

export function assignDemoPlan(clientId, planId) {
    const store = loadAssignments();
    const key = String(clientId);
    const list = store[key] || [];
    if (!list.includes(Number(planId))) {
        store[key] = [Number(planId), ...list];
        saveAssignments(store);
    }
}

export function unassignDemoPlan(clientId, planId) {
    const store = loadAssignments();
    const key = String(clientId);
    store[key] = (store[key] || []).filter(id => Number(id) !== Number(planId));
    saveAssignments(store);
}

export function getAssignedPlanIdsForDemoClient(clientId) {
    const store = loadAssignments();
    return store[String(clientId)] || [];
}

export function getAssignedDemoClientsForPlan(planId) {
    const store = loadAssignments();
    const matched = [];
    for (const demoClient of DEMO_CHAT_CLIENTS) {
        const ids = store[demoClient.id] || [];
        if (ids.includes(Number(planId))) {
            matched.push({
                id: demoClient.id,
                name: demoClient.name,
                surname: demoClient.surname,
                isDemo: true,
            });
        }
    }
    return matched;
}

function pickRecipe(index, fallbackIndex = 0) {
    return DEFAULT_RECIPES[index] || DEFAULT_RECIPES[fallbackIndex] || DEFAULT_RECIPES[0];
}

/**
 * Construye el plan de dieta ANEF completo preasignado para cada cliente de prueba,
 * con Dieta Principal y Equivalencia 1, usando las recetas de `DEFAULT_RECIPES`.
 *
 * @param {string} clientId - `'demo-client-1'` o `'demo-client-2'`
 * @returns {Object} Plan completo compatible con `Nutrition.jsx`
 */
export function buildDefaultDemoMealPlan(clientId) {
    if (String(clientId) === 'demo-client-2') {
        const rDesayuno = pickRecipe(0);
        const rMediaManana = pickRecipe(4);
        const rComida = pickRecipe(7, 6);
        const rMerienda = pickRecipe(10, 8);
        const rCena = pickRecipe(12, 11);

        const rEqDesayuno = pickRecipe(1, 0);
        const rEqComida = pickRecipe(8, 6);
        const rEqCena = pickRecipe(13, 12);

        return {
            id: 'demo-anef-plan-laura',
            title: 'Dieta ANEF — Laura Gómez (Volumen · 2380 kcal)',
            description: 'Cliente: Laura Gómez (Mujer, 26 años, 61.2 kg, 165 cm) | Cálculo ANEF: TMB 1368 kcal · Factor actividad 1.55 · GET 2120 kcal · Objetivo Volumen (+12%) → 2380 kcal/día | Macros: P 135g (2.2g/kg) · HC 315g (5.1g/kg) · G 64g (1.05g/kg) · Fibra 30g',
            target_calories: 2380,
            target_protein: 135,
            target_carbs: 315,
            target_fat: 64,
            days: [
                {
                    id: 'demo-day-laura-1',
                    day_order: 1,
                    label: 'Dieta Principal (2380 kcal)',
                    slots: [
                        {
                            id: 'demo-slot-l-1',
                            slot_order: 1,
                            label: 'Comida 1 · Desayuno (20% · 476 kcal)',
                            items: [
                                { id: 'demo-item-l-1', item_order: 1, servings: 1.1, notes: 'Receta ANEF ajustada a 476 kcal', recipe: rDesayuno },
                            ],
                        },
                        {
                            id: 'demo-slot-l-2',
                            slot_order: 2,
                            label: 'Comida 2 · Media Mañana (10% · 238 kcal)',
                            items: [
                                { id: 'demo-item-l-2', item_order: 1, servings: 0.7, notes: 'Tentempié pre-entreno ligero', recipe: rMediaManana },
                            ],
                        },
                        {
                            id: 'demo-slot-l-3',
                            slot_order: 3,
                            label: 'Comida 3 · Comida Principal (25% · 595 kcal)',
                            items: [
                                { id: 'demo-item-l-3', item_order: 1, servings: 1.1, notes: 'Pesos en crudo salvo indicación', recipe: rComida },
                            ],
                        },
                        {
                            id: 'demo-slot-l-4',
                            slot_order: 4,
                            label: 'Comida 4 · Post-Entreno ★ (30% · 714 kcal)',
                            items: [
                                { id: 'demo-item-l-4', item_order: 1, servings: 1.3, notes: 'Comida prioritaria de recarga muscular', recipe: rMerienda },
                            ],
                        },
                        {
                            id: 'demo-slot-l-5',
                            slot_order: 5,
                            label: 'Comida 5 · Cena (15% · 357 kcal)',
                            items: [
                                { id: 'demo-item-l-5', item_order: 1, servings: 0.9, notes: 'Cena rica en omega-3 y proteína', recipe: rCena },
                            ],
                        },
                    ],
                },
                {
                    id: 'demo-day-laura-2',
                    day_order: 2,
                    label: 'Equivalencia / Alternativa 1 (2380 kcal)',
                    slots: [
                        {
                            id: 'demo-slot-l-6',
                            slot_order: 1,
                            label: 'Comida 1 · Desayuno Equivalente (20% · 476 kcal)',
                            items: [
                                { id: 'demo-item-l-6', item_order: 1, servings: 1.1, notes: 'Opción equivalente de desayuno', recipe: rEqDesayuno },
                            ],
                        },
                        {
                            id: 'demo-slot-l-7',
                            slot_order: 2,
                            label: 'Comida 2 · Comida Equivalente (35% · 833 kcal)',
                            items: [
                                { id: 'demo-item-l-7', item_order: 1, servings: 1.3, notes: 'Opción equivalente de mediodía', recipe: rEqComida },
                            ],
                        },
                        {
                            id: 'demo-slot-l-8',
                            slot_order: 3,
                            label: 'Comida 3 · Cena Equivalente (45% · 1071 kcal)',
                            items: [
                                { id: 'demo-item-l-8', item_order: 1, servings: 1.2, notes: 'Opción equivalente de cena', recipe: rEqCena },
                            ],
                        },
                    ],
                },
            ],
        };
    }

    // Por defecto: Carlos Pérez ('demo-client-1')
    const rDesayuno = pickRecipe(2, 0);
    const rComida = pickRecipe(6, 0);
    const rMerienda = pickRecipe(5, 4);
    const rCena = pickRecipe(14, 12);

    const rEqDesayuno = pickRecipe(0);
    const rEqComida = pickRecipe(9, 6);
    const rEqCena = pickRecipe(15, 12);

    return {
        id: 'demo-anef-plan-carlos',
        title: 'Dieta ANEF — Carlos Pérez (Definición · 2150 kcal)',
        description: 'Cliente: Carlos Pérez (Hombre, 29 años, 78.4 kg, 178 cm) | Cálculo ANEF: TMB 1775 kcal · Factor actividad 1.50 · GET 2662 kcal · Objetivo Definición (-19%) → 2150 kcal/día | Macros: P 172g (2.2g/kg) · HC 218g (2.8g/kg) · G 66g (0.85g/kg) · Sin lactosa',
        target_calories: 2150,
        target_protein: 172,
        target_carbs: 218,
        target_fat: 66,
        days: [
            {
                id: 'demo-day-carlos-1',
                day_order: 1,
                label: 'Dieta Principal (2150 kcal)',
                slots: [
                    {
                        id: 'demo-slot-c-1',
                        slot_order: 1,
                        label: 'Comida 1 · Desayuno (20% · 430 kcal)',
                        items: [
                            { id: 'demo-item-c-1', item_order: 1, servings: 1.0, notes: 'Sin lactosa · Pesos en crudo', recipe: rDesayuno },
                        ],
                    },
                    {
                        id: 'demo-slot-c-2',
                        slot_order: 2,
                        label: 'Comida 2 · Comida Principal (35% · 752 kcal)',
                        items: [
                            { id: 'demo-item-c-2', item_order: 1, servings: 1.2, notes: 'Comida principal alta en proteína', recipe: rComida },
                        ],
                    },
                    {
                        id: 'demo-slot-c-3',
                        slot_order: 3,
                        label: 'Comida 3 · Merienda Post-Entreno ★ (30% · 645 kcal)',
                        items: [
                            { id: 'demo-item-c-3', item_order: 1, servings: 1.1, notes: 'Prioridad post-entreno (30% kcal)', recipe: rMerienda },
                        ],
                    },
                    {
                        id: 'demo-slot-c-4',
                        slot_order: 4,
                        label: 'Comida 4 · Cena Ligera (15% · 323 kcal)',
                        items: [
                            { id: 'demo-item-c-4', item_order: 1, servings: 0.9, notes: 'Cena saciante baja en hidratos', recipe: rCena },
                        ],
                    },
                ],
            },
            {
                id: 'demo-day-carlos-2',
                day_order: 2,
                label: 'Equivalencia / Alternativa 1 (2150 kcal)',
                slots: [
                    {
                        id: 'demo-slot-c-5',
                        slot_order: 1,
                        label: 'Comida 1 · Desayuno Equivalente (20% · 430 kcal)',
                        items: [
                            { id: 'demo-item-c-5', item_order: 1, servings: 1.0, notes: 'Alternativa de desayuno', recipe: rEqDesayuno },
                        ],
                    },
                    {
                        id: 'demo-slot-c-6',
                        slot_order: 2,
                        label: 'Comida 2 · Comida Equivalente (35% · 752 kcal)',
                        items: [
                            { id: 'demo-item-c-6', item_order: 1, servings: 1.2, notes: 'Alternativa de comida', recipe: rEqComida },
                        ],
                    },
                    {
                        id: 'demo-slot-c-7',
                        slot_order: 3,
                        label: 'Comida 3 · Cena Equivalente (45% · 968 kcal)',
                        items: [
                            { id: 'demo-item-c-7', item_order: 1, servings: 1.1, notes: 'Alternativa de cena', recipe: rEqCena },
                        ],
                    },
                ],
            },
        ],
    };
}

/**
 * Construye la rutina asignada por defecto para cada cliente de prueba.
 */
export function buildDefaultDemoRoutines(clientId) {
    if (String(clientId) === 'demo-client-2') {
        return [
            {
                id: 'demo-routine-laura-1',
                title: 'Full Body + Énfasis Glúteo/Pierna (Hipertrofia)',
                coach_comment: 'Controla el tempo excéntrico (2-3 seg) y mantén RIR 1-2 en Hip Thrust y Sentadilla.',
                exercises: [
                    {
                        id: 'demo-ex-l-1',
                        exercise_name: 'Hip Thrust con Barra Olímpica',
                        category: 'Pierna / Glúteo',
                        description: 'Pausa de 1 segundo arriba apretando glúteo, barbilla recogida.',
                        comments: 'Subir 2.5 kg si completas las 4 series de 10 reps.',
                        sets: [
                            { id: 1, order: 1, reps: 10, kg: 95, rir: 2 },
                            { id: 2, order: 2, reps: 10, kg: 95, rir: 2 },
                            { id: 3, order: 3, reps: 10, kg: 95, rir: 1 },
                            { id: 4, order: 4, reps: 8, kg: 97.5, rir: 1 },
                        ],
                    },
                    {
                        id: 'demo-ex-l-2',
                        exercise_name: 'Peso Muerto Rumano con Mancuernas o Barra',
                        category: 'Femoral / Glúteo',
                        description: 'Bisagra de cadera manteniendo la barra pegada a las tibias.',
                        comments: 'RIR 2 controlado.',
                        sets: [
                            { id: 5, order: 1, reps: 10, kg: 65, rir: 2 },
                            { id: 6, order: 2, reps: 10, kg: 65, rir: 2 },
                            { id: 7, order: 3, reps: 10, kg: 67.5, rir: 1 },
                        ],
                    },
                ],
            },
        ];
    }

    return [
        {
            id: 'demo-routine-carlos-1',
            title: 'Torso / Pierna Hipertrofia 4 días (Definición)',
            coach_comment: 'Mantener cargas altas en básicos para preservar toda la masa muscular durante el déficit.',
            exercises: [
                {
                    id: 'demo-ex-c-1',
                    exercise_name: 'Press Banca Plano con Barra',
                    category: 'Pecho',
                    description: 'Retracción escapular firme, bajada controlada al esternón.',
                    comments: 'Mantener 85 kg en series efectivas a RIR 1-2.',
                    sets: [
                        { id: 10, order: 1, reps: 8, kg: 85, rir: 2 },
                        { id: 11, order: 2, reps: 8, kg: 85, rir: 2 },
                        { id: 12, order: 3, reps: 7, kg: 85, rir: 1 },
                    ],
                },
                {
                    id: 'demo-ex-c-2',
                    exercise_name: 'Dominadas Lastradas / Jalón al Pecho',
                    category: 'Espalda',
                    description: 'Tracción llevando los codos hacia la cadera.',
                    comments: 'Rango completo de movimiento.',
                    sets: [
                        { id: 13, order: 1, reps: 10, kg: 75, rir: 2 },
                        { id: 14, order: 2, reps: 10, kg: 75, rir: 1 },
                        { id: 15, order: 3, reps: 9, kg: 75, rir: 1 },
                    ],
                },
            ],
        },
    ];
}
