import { DEFAULT_RECIPES } from './defaultRecipes.js';
import { DEMO_CHAT_CLIENTS, isDemoClientId } from '../services/feedbackService.js';

const DEMO_PLAN_ASSIGNMENTS_KEY = 'akuma_demo_plan_assignments_v1';
const DEMO_CUSTOM_ROUTINES_KEY = 'akuma_demo_custom_routines_v1';
const DEMO_CALENDAR_EVENTS_KEY = 'akuma_demo_calendar_events_v1';

function readDemoAssignmentsMap() {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    try {
        const raw = window.localStorage.getItem(DEMO_PLAN_ASSIGNMENTS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function writeDemoAssignmentsMap(map) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(DEMO_PLAN_ASSIGNMENTS_KEY, JSON.stringify(map));
    } catch {
        // Ignore storage errors
    }
}

/**
 * Registra la asignación de un plan real o demo a un cliente de prueba.
 */
export function assignDemoPlan(planId, clientId) {
    if (!isDemoClientId(clientId)) return;
    const map = readDemoAssignmentsMap();
    const key = String(planId);
    const list = Array.isArray(map[key]) ? map[key] : [];
    if (!list.includes(clientId)) {
        map[key] = [...list, clientId];
        writeDemoAssignmentsMap(map);
    }
}

/**
 * Elimina la asignación de un plan a un cliente de prueba.
 */
export function unassignDemoPlan(planId, clientId) {
    if (!isDemoClientId(clientId)) return;
    const map = readDemoAssignmentsMap();
    const key = String(planId);
    if (!Array.isArray(map[key])) return;
    map[key] = map[key].filter(id => id !== clientId);
    writeDemoAssignmentsMap(map);
}

/**
 * Devuelve los objetos de perfil demo asignados a un plan concreto.
 */
export function getAssignedDemoClientsForPlan(planId) {
    const map = readDemoAssignmentsMap();
    const clientIds = map[String(planId)] || [];
    return clientIds
        .map(id => DEMO_CHAT_CLIENTS.find(c => c.id === id))
        .filter(Boolean)
        .map(c => ({
            id: c.id,
            name: c.name,
            surname: c.surname,
            isDemo: true,
        }));
}

/**
 * Devuelve los IDs de planes reales que el entrenador haya asignado a un cliente de prueba.
 */
export function getAssignedPlanIdsForDemoClient(clientId) {
    const map = readDemoAssignmentsMap();
    const planIds = [];
    for (const [planId, clients] of Object.entries(map)) {
        if (Array.isArray(clients) && clients.includes(clientId)) {
            const numId = Number(planId);
            if (!Number.isNaN(numId)) {
                planIds.push(numId);
            }
        }
    }
    return planIds;
}

function findRecipe(id) {
    return DEFAULT_RECIPES.find(r => r.id === id) || DEFAULT_RECIPES[0];
}

/**
 * Construye el plan nutricional ANEF completo por defecto asignado a cada cliente de prueba,
 * con Dieta Principal + Equivalencia 1, recetas detalladas, ingredientes en gramos e instrucciones.
 */
export function buildDefaultDemoMealPlan(clientId) {
    if (clientId === 'demo-client-2') {
        return {
            id: 'demo-anef-plan-laura',
            title: 'Plan Nutricional ANEF — Recomposición y Glúteo (Laura Gómez)',
            description: 'Objetivo ANEF: 2100 kcal | 145g Proteína (28%) • 235g Carbohidratos (45%) • 63g Grasas (27%). Incluye Dieta Principal y Equivalencia 1.',
            created_at: '2026-10-10T09:00:00.000Z',
            updated_at: '2026-10-18T11:30:00.000Z',
            tags: [
                { id: 'tag-anef-1', name: 'ANEF 2100 kcal', category: 'dieta' },
                { id: 'tag-anef-2', name: 'Recomposición', category: 'dieta' },
            ],
            days: [
                {
                    id: 'laura-day-1',
                    name: 'Dieta Principal',
                    day_order: 1,
                    notes: 'Distribución ANEF en 5 tomas para maximizar rendimiento en entrenos de tren inferior. Hidratación mínima: 2.5L de agua al día.',
                    slots: [
                        {
                            id: 'laura-slot-1',
                            meal_name: 'Desayuno (08:00)',
                            slot_order: 1,
                            notes: '380 kcal aprox. Rico en proteína y fibra.',
                            items: [
                                { id: 'laura-item-1', item_order: 1, quantity: 1, custom_label: null, notes: 'Preparar con canela al gusto', recipe: findRecipe('default-recipe-2'), food: null }
                            ]
                        },
                        {
                            id: 'laura-slot-2',
                            meal_name: 'Media Mañana (11:30)',
                            slot_order: 2,
                            notes: 'Snack saciante alto en proteína.',
                            items: [
                                { id: 'laura-item-2', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-6'), food: null }
                            ]
                        },
                        {
                            id: 'laura-slot-3',
                            meal_name: 'Comida (14:30)',
                            slot_order: 3,
                            notes: 'Comida principal rica en carbohidratos complejos.',
                            items: [
                                { id: 'laura-item-3', item_order: 1, quantity: 1, custom_label: null, notes: 'Pesar el boniato y el pavo en crudo', recipe: findRecipe('default-recipe-10'), food: null }
                            ]
                        },
                        {
                            id: 'laura-slot-4',
                            meal_name: 'Merienda / Pre-Entreno (17:30)',
                            slot_order: 4,
                            notes: 'Tomar 60-90 min antes de entrenar pierna/glúteo.',
                            items: [
                                { id: 'laura-item-4', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-12'), food: null }
                            ]
                        },
                        {
                            id: 'laura-slot-5',
                            meal_name: 'Cena (21:15)',
                            slot_order: 5,
                            notes: 'Cena rica en Omega-3 y micronutrientes para recuperación.',
                            items: [
                                { id: 'laura-item-5', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-13'), food: null }
                            ]
                        },
                    ],
                },
                {
                    id: 'laura-day-2',
                    name: 'Equivalencia / Alternativa 1',
                    day_order: 2,
                    notes: 'Opciones 100% equivalentes en calorías y macronutrientes ANEF para variar durante la semana.',
                    slots: [
                        {
                            id: 'laura-slot-6',
                            meal_name: 'Desayuno (08:00)',
                            slot_order: 1,
                            notes: 'Opción salada equivalente.',
                            items: [
                                { id: 'laura-item-6', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-3'), food: null }
                            ]
                        },
                        {
                            id: 'laura-slot-7',
                            meal_name: 'Media Mañana (11:30)',
                            slot_order: 2,
                            notes: 'Opción batido rápido.',
                            items: [
                                { id: 'laura-item-7', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-5'), food: null }
                            ]
                        },
                        {
                            id: 'laura-slot-8',
                            meal_name: 'Comida (14:30)',
                            slot_order: 3,
                            notes: 'Opción pasta integral boloñesa.',
                            items: [
                                { id: 'laura-item-8', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-8'), food: null }
                            ]
                        },
                        {
                            id: 'laura-slot-9',
                            meal_name: 'Merienda (17:30)',
                            slot_order: 4,
                            notes: 'Opción con tortitas de arroz y crema de cacahuete.',
                            items: [
                                { id: 'laura-item-9', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-11'), food: null }
                            ]
                        },
                        {
                            id: 'laura-slot-10',
                            meal_name: 'Cena (21:15)',
                            slot_order: 5,
                            notes: 'Opción pescado blanco.',
                            items: [
                                { id: 'laura-item-10', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-14'), food: null }
                            ]
                        },
                    ],
                },
            ],
        };
    }

    // Por defecto: Carlos Pérez (demo-client-1)
    return {
        id: 'demo-anef-plan-carlos',
        title: 'Plan Nutricional ANEF — Definición Atlética 2250 kcal (Carlos Pérez)',
        description: 'Objetivo ANEF: 2250 kcal | 175g Proteína (31%) • 225g Carbohidratos (40%) • 65g Grasas (26%). Incluye Dieta Principal y Equivalencia 1.',
        created_at: '2026-10-08T10:00:00.000Z',
        updated_at: '2026-10-19T09:15:00.000Z',
        tags: [
            { id: 'tag-anef-c1', name: 'ANEF 2250 kcal', category: 'dieta' },
            { id: 'tag-anef-c2', name: 'Definición', category: 'dieta' },
            { id: 'tag-anef-c3', name: 'Alta Proteína', category: 'dieta' },
        ],
        days: [
            {
                id: 'carlos-day-1',
                name: 'Dieta Principal',
                day_order: 1,
                notes: 'Plan ANEF ajustado tras el último check-in (-50g patata en cena y +1 tortita de arroz pre-entreno). Beber 3L de agua diarios.',
                slots: [
                    {
                        id: 'carlos-slot-1',
                        meal_name: 'Desayuno (07:30)',
                        slot_order: 1,
                        notes: 'Alto en proteína y energía sostenida para toda la mañana.',
                        items: [
                            { id: 'carlos-item-1', item_order: 1, quantity: 1, custom_label: null, notes: 'Acompañar con café solo o infusión', recipe: findRecipe('default-recipe-1'), food: null }
                        ]
                    },
                    {
                        id: 'carlos-slot-2',
                        meal_name: 'Media Mañana (11:00)',
                        slot_order: 2,
                        notes: 'Tentempié rápido en el trabajo.',
                        items: [
                            { id: 'carlos-item-2', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-6'), food: null }
                        ]
                    },
                    {
                        id: 'carlos-slot-3',
                        meal_name: 'Comida (14:30)',
                        slot_order: 3,
                        notes: 'Comida principal limpia y saciante.',
                        items: [
                            { id: 'carlos-item-3', item_order: 1, quantity: 1, custom_label: null, notes: '10g de AOVE en crudo al emplatar', recipe: findRecipe('default-recipe-7'), food: null }
                        ]
                    },
                    {
                        id: 'carlos-slot-4',
                        meal_name: 'Merienda / Pre-Entreno (17:45)',
                        slot_order: 4,
                        notes: 'Tomar 45 min antes de ir al gimnasio (+1 tortita extra añadida esta semana).',
                        items: [
                            { id: 'carlos-item-4', item_order: 1, quantity: 1, custom_label: null, notes: 'Añadir 1 tortita de arroz extra los días de pierna', recipe: findRecipe('default-recipe-11'), food: null }
                        ]
                    },
                    {
                        id: 'carlos-slot-5',
                        meal_name: 'Cena (21:30)',
                        slot_order: 5,
                        notes: 'Cena ligera alta en proteína para optimizar el descanso nocturno.',
                        items: [
                            { id: 'carlos-item-5', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-14'), food: null }
                        ]
                    },
                ],
            },
            {
                id: 'carlos-day-2',
                name: 'Equivalencia / Alternativa 1',
                day_order: 2,
                notes: 'Alternativa isocalórica ANEF (2250 kcal) para intercambiar cualquier toma sin alterar tus macros semanales.',
                slots: [
                    {
                        id: 'carlos-slot-6',
                        meal_name: 'Desayuno (07:30)',
                        slot_order: 1,
                        notes: 'Opción rápida sin cocinar.',
                        items: [
                            { id: 'carlos-item-6', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-4'), food: null }
                        ]
                    },
                    {
                        id: 'carlos-slot-7',
                        meal_name: 'Media Mañana / Post-Entreno (11:00)',
                        slot_order: 2,
                        notes: 'Batido completo si entrenas por la mañana.',
                        items: [
                            { id: 'carlos-item-7', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-5'), food: null }
                        ]
                    },
                    {
                        id: 'carlos-slot-8',
                        meal_name: 'Comida (14:30)',
                        slot_order: 3,
                        notes: 'Opción legumbre + pescado azul.',
                        items: [
                            { id: 'carlos-item-8', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-9'), food: null }
                        ]
                    },
                    {
                        id: 'carlos-slot-9',
                        meal_name: 'Merienda (17:45)',
                        slot_order: 4,
                        notes: 'Pudin proteico ligero.',
                        items: [
                            { id: 'carlos-item-9', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-12'), food: null }
                        ]
                    },
                    {
                        id: 'carlos-slot-10',
                        meal_name: 'Cena (21:30)',
                        slot_order: 5,
                        notes: 'Salteado alto en proteína y bajo en carbohidratos.',
                        items: [
                            { id: 'carlos-item-10', item_order: 1, quantity: 1, custom_label: null, notes: null, recipe: findRecipe('default-recipe-16'), food: null }
                        ]
                    },
                ],
            },
        ],
    };
}

function readCustomDemoRoutinesMap() {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    try {
        const raw = window.localStorage.getItem(DEMO_CUSTOM_ROUTINES_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function writeCustomDemoRoutinesMap(map) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(DEMO_CUSTOM_ROUTINES_KEY, JSON.stringify(map));
    } catch {
        // Ignore storage errors
    }
}

/**
 * Guarda una rutina creada por el coach y asignada a un cliente de prueba.
 */
export function saveCustomDemoRoutine(clientId, routine) {
    if (!isDemoClientId(clientId)) return null;
    if (routine.id) {
        return updateCustomDemoRoutine(clientId, routine.id, routine);
    }
    const map = readCustomDemoRoutinesMap();
    const list = Array.isArray(map[clientId]) ? map[clientId] : [];
    const created = {
        id: `demo-routine-custom-${Date.now()}`,
        title: routine.title,
        coach_comment: routine.coach_comment || routine.coachComment || '',
        created_at: new Date().toISOString(),
        exercises: (routine.exercises || []).map((ex, idx) => ({
            id: ex.id || `ex-custom-${idx + 1}`,
            exercise_name: ex.exercise_name || ex.name || `Ejercicio ${idx + 1}`,
            category: ex.category || 'Fuerza',
            description: ex.description || '',
            comments: ex.comments || '',
            sets: (ex.sets || []).map((s, sIdx) => ({
                id: s.id || `set-custom-${idx + 1}-${sIdx + 1}`,
                order: s.order || sIdx + 1,
                reps: String(s.reps ?? '10'),
                kg: String(s.kg ?? '20'),
                rir: String(s.rir ?? ''),
                type: s.type || 'Normal',
                rest_time: s.rest_time || '90s',
            })),
        })),
    };
    map[clientId] = [created, ...list];
    writeCustomDemoRoutinesMap(map);
    return created;
}

/**
 * Actualiza una rutina (título, comentario del coach, ejercicios, kilos, repeticiones y RIR)
 * para progresar al cliente de prueba.
 */
export function updateCustomDemoRoutine(clientId, routineId, routineData) {
    if (!isDemoClientId(clientId)) return null;
    const map = readCustomDemoRoutinesMap();
    const list = Array.isArray(map[clientId]) ? [...map[clientId]] : [];

    const updated = {
        id: routineId,
        title: routineData.title,
        coach_comment: routineData.coach_comment ?? routineData.coachComment ?? '',
        created_at: routineData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        exercises: (routineData.exercises || []).map((ex, idx) => ({
            id: ex.id || `ex-custom-${idx + 1}`,
            exercise_name: ex.exercise_name || ex.name || `Ejercicio ${idx + 1}`,
            category: ex.category || 'Fuerza',
            description: ex.description || '',
            comments: ex.comments || '',
            sets: (ex.sets || []).map((s, sIdx) => ({
                id: s.id || `set-custom-${idx + 1}-${sIdx + 1}`,
                order: s.order || sIdx + 1,
                reps: String(s.reps ?? ''),
                kg: String(s.kg ?? ''),
                rir: String(s.rir ?? ''),
                type: s.type || 'Normal',
                rest_time: s.rest_time || '90s',
            })),
        })),
    };

    const existingIdx = list.findIndex(r => String(r.id) === String(routineId));
    if (existingIdx >= 0) {
        list[existingIdx] = updated;
    } else {
        list.unshift(updated);
    }
    map[clientId] = list;
    writeCustomDemoRoutinesMap(map);
    return updated;
}

/**
 * Elimina una rutina personalizada o predefinida de un cliente de prueba.
 */
export function removeCustomDemoRoutine(clientId, routineId) {
    if (!isDemoClientId(clientId)) return;
    const map = readCustomDemoRoutinesMap();
    const list = Array.isArray(map[clientId]) ? [...map[clientId]] : [];
    const filtered = list.filter(r => String(r.id) !== String(routineId));
    filtered.push({ id: routineId, _deleted: true });
    map[clientId] = filtered;
    writeCustomDemoRoutinesMap(map);
}

/**
 * Rutinas de entrenamiento preasignadas para los clientes de prueba + las creadas/editadas por el coach.
 */
export function buildDefaultDemoRoutines(clientId) {
    const customMap = readCustomDemoRoutinesMap();
    const customRoutines = Array.isArray(customMap[clientId]) ? customMap[clientId] : [];

    const defaultRoutines = clientId === 'demo-client-2' ? [
            {
                id: 'demo-routine-laura-1',
                title: 'Día 1 — Énfasis Glúteo e Isquios (Fuerza)',
                coach_comment: 'Controlar fase excéntrica (3 seg bajada) en Hip Thrust y Peso Muerto Rumano. Dejar 1 repetición en recámara (RIR 1).',
                created_at: '2026-10-05T10:00:00.000Z',
                exercises: [
                    {
                        id: 'ex-laura-1',
                        exercise_name: 'Hip Thrust con Barra',
                        category: 'Pierna / Glúteo',
                        description: 'Empuje de cadera con espalda alta apoyada en banco y pausa de 1s arriba.',
                        comments: 'Mantener barbilla pegada al pecho y retroversión pélvica arriba.',
                        sets: [
                            { id: 's-l1', order: 1, reps: '10', kg: '80', type: 'Calentamiento', rest_time: '90s' },
                            { id: 's-l2', order: 2, reps: '8', kg: '95', type: 'Efectiva', rest_time: '120s' },
                            { id: 's-l3', order: 3, reps: '8', kg: '95', type: 'Efectiva', rest_time: '120s' },
                        ]
                    },
                    {
                        id: 'ex-laura-2',
                        exercise_name: 'Peso Muerto Rumano con Mancuernas',
                        category: 'Pierna / Isquios',
                        description: 'Bisagra de cadera manteniendo mancuernas pegadas a las piernas.',
                        comments: 'Bajar hasta media espinilla sintiendo el estiramiento.',
                        sets: [
                            { id: 's-l4', order: 1, reps: '10', kg: '24', type: 'Efectiva', rest_time: '90s' },
                            { id: 's-l5', order: 2, reps: '10', kg: '24', type: 'Efectiva', rest_time: '90s' },
                            { id: 's-l6', order: 3, reps: '12', kg: '22', type: 'Efectiva', rest_time: '90s' },
                        ]
                    },
                    {
                        id: 'ex-laura-3',
                        exercise_name: 'Sentadilla Búlgara en Multipower',
                        category: 'Pierna / Glúteo',
                        description: 'Zancada unilateral con pie trasero elevado e inclinación ligera del torso.',
                        comments: 'Foco en empujar con el talón de la pierna delantera.',
                        sets: [
                            { id: 's-l7', order: 1, reps: '10', kg: '40', type: 'Efectiva', rest_time: '90s' },
                            { id: 's-l8', order: 2, reps: '10', kg: '40', type: 'Efectiva', rest_time: '90s' },
                        ]
                    }
                ]
            },
            {
                id: 'demo-routine-laura-2',
                title: 'Día 2 — Tren Superior Estético + Core',
                coach_comment: 'Priorizar técnica limpia y conexión mente-músculo en espalda y hombros.',
                created_at: '2026-10-05T10:05:00.000Z',
                exercises: [
                    {
                        id: 'ex-laura-4',
                        exercise_name: 'Jalón al Pecho Agarre Neutro',
                        category: 'Espalda',
                        description: 'Tracción vertical llevando los codos hacia la cadera.',
                        sets: [
                            { id: 's-l9', order: 1, reps: '12', kg: '40', type: 'Efectiva', rest_time: '90s' },
                            { id: 's-l10', order: 2, reps: '10', kg: '45', type: 'Efectiva', rest_time: '90s' },
                            { id: 's-l11', order: 3, reps: '10', kg: '45', type: 'Efectiva', rest_time: '90s' },
                        ]
                    },
                    {
                        id: 'ex-laura-5',
                        exercise_name: 'Elevaciones Laterales con Mancuernas',
                        category: 'Hombro',
                        description: 'Abducción de hombro controlada sin impulso.',
                        sets: [
                            { id: 's-l12', order: 1, reps: '15', kg: '6', type: 'Efectiva', rest_time: '60s' },
                            { id: 's-l13', order: 2, reps: '15', kg: '6', type: 'Efectiva', rest_time: '60s' },
                            { id: 's-l14', order: 3, reps: '15', kg: '6', type: 'Efectiva', rest_time: '60s' },
                        ]
                    }
                ]
            }
        ] : [
            {
                id: 'demo-routine-carlos-1',
                title: 'Día A — Torso Hipertrofia (Pecho + Espalda)',
                coach_comment: 'Mantener cargas pesadas a RIR 1-2 para preservar toda la masa muscular durante la fase de definición.',
                created_at: '2026-10-04T10:00:00.000Z',
                exercises: [
                    {
                        id: 'ex-carlos-1',
                        exercise_name: 'Press Banca Inclinado con Mancuernas',
                        category: 'Pecho',
                        description: 'Banco a 30 grados. Bajada controlada de 2 segundos y empuje explosivo.',
                        comments: 'Codos a 45° para proteger el hombro derecho.',
                        sets: [
                            { id: 's-c1', order: 1, reps: '10', kg: '30', type: 'Calentamiento', rest_time: '90s' },
                            { id: 's-c2', order: 2, reps: '8', kg: '36', type: 'Efectiva', rest_time: '120s' },
                            { id: 's-c3', order: 3, reps: '8', kg: '36', type: 'Efectiva', rest_time: '120s' },
                        ]
                    },
                    {
                        id: 'ex-carlos-2',
                        exercise_name: 'Remo con Barra Prono (Pendlay)',
                        category: 'Espalda',
                        description: 'Tracción horizontal explosiva hacia la boca del estómago.',
                        comments: 'Mantener core firme y espalda neutra.',
                        sets: [
                            { id: 's-c4', order: 1, reps: '8', kg: '80', type: 'Efectiva', rest_time: '120s' },
                            { id: 's-c5', order: 2, reps: '8', kg: '85', type: 'Efectiva', rest_time: '120s' },
                            { id: 's-c6', order: 3, reps: '8', kg: '85', type: 'Efectiva', rest_time: '120s' },
                        ]
                    },
                    {
                        id: 'ex-carlos-3',
                        exercise_name: 'Dominadas Lastradas / Peso Corporal',
                        category: 'Espalda',
                        description: 'Rango completo pasando la barbilla por encima de la barra.',
                        sets: [
                            { id: 's-c7', order: 1, reps: '10', kg: '10', type: 'Efectiva', rest_time: '90s' },
                            { id: 's-c8', order: 2, reps: '9', kg: '10', type: 'Efectiva', rest_time: '90s' },
                            { id: 's-c9', order: 3, reps: '8', kg: '10', type: 'Efectiva', rest_time: '90s' },
                        ]
                    }
                ]
            },
            {
                id: 'demo-routine-carlos-2',
                title: 'Día B — Pierna Completa + Core',
                coach_comment: 'Hidratarte bien antes de empezar y tomar la tortita de arroz extra 45 min antes.',
                created_at: '2026-10-04T10:10:00.000Z',
                exercises: [
                    {
                        id: 'ex-carlos-4',
                        exercise_name: 'Sentadilla Hack / Prensa 45°',
                        category: 'Pierna',
                        description: 'Profundidad máxima sin despegar el sacro del respaldo.',
                        sets: [
                            { id: 's-c10', order: 1, reps: '10', kg: '160', type: 'Efectiva', rest_time: '120s' },
                            { id: 's-c11', order: 2, reps: '8', kg: '180', type: 'Efectiva', rest_time: '120s' },
                            { id: 's-c12', order: 3, reps: '8', kg: '180', type: 'Efectiva', rest_time: '120s' },
                        ]
                    },
                    {
                        id: 'ex-carlos-5',
                        exercise_name: 'Curl Femoral Sentado',
                        category: 'Pierna',
                        description: 'Pausa de 1 segundo en máxima contracción.',
                        sets: [
                            { id: 's-c13', order: 1, reps: '12', kg: '65', type: 'Efectiva', rest_time: '90s' },
                            { id: 's-c14', order: 2, reps: '12', kg: '65', type: 'Efectiva', rest_time: '90s' },
                            { id: 's-c15', order: 3, reps: '10', kg: '70', type: 'Efectiva', rest_time: '90s' },
                        ]
                    }
                ]
            }
        ];

    const activeCustomRoutines = customRoutines.filter(r => !r._deleted);
    const deletedIds = new Set(customRoutines.filter(r => r._deleted).map(r => String(r.id)));

    const mergedDefaults = defaultRoutines
        .filter(def => !deletedIds.has(String(def.id)))
        .map(def => {
            const override = activeCustomRoutines.find(c => String(c.id) === String(def.id));
            return override || def;
        });

    const extraCustomRoutines = activeCustomRoutines.filter(
        c => !defaultRoutines.some(d => String(d.id) === String(c.id))
    );

    return [...extraCustomRoutines, ...mergedDefaults];
}

/**
 * Busca una rutina de prueba por su ID.
 */
export function getDemoRoutineById(routineId) {
    const allDemoRoutines = [
        ...buildDefaultDemoRoutines('demo-client-1'),
        ...buildDefaultDemoRoutines('demo-client-2'),
    ];
    return allDemoRoutines.find(r => String(r.id) === String(routineId)) || null;
}

/**
 * Genera una imagen SVG en Data URI para las fotos corporales de progreso de los clientes de prueba.
 */
function buildProgressPhotoSvg({ clientName, dateLabel, positionLabel, weightLabel, waistLabel, accentColor }) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="620" viewBox="0 0 480 620">
        <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#141821"/>
                <stop offset="100%" stop-color="#1e2433"/>
            </linearGradient>
        </defs>
        <rect width="480" height="620" rx="20" fill="url(#bg)"/>
        <rect x="16" y="16" width="448" height="588" rx="16" fill="none" stroke="${accentColor}" stroke-opacity="0.35" stroke-width="2"/>
        <text x="36" y="54" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="700">${clientName}</text>
        <text x="36" y="80" fill="${accentColor}" font-family="system-ui, sans-serif" font-size="15" font-weight="600">${positionLabel} • ${dateLabel}</text>
        <!-- Silueta anatómica de referencia -->
        <g transform="translate(175, 115)" fill="${accentColor}" fill-opacity="0.22" stroke="${accentColor}" stroke-width="2.5">
            <circle cx="65" cy="36" r="26"/>
            <path d="M25,82 C25,70 105,70 105,82 L115,185 L92,185 L88,115 L84,215 L46,215 L42,115 L38,185 L15,185 Z" stroke-linejoin="round"/>
            <path d="M46,218 L84,218 L88,350 L68,350 L65,255 L62,350 L42,350 Z" stroke-linejoin="round"/>
        </g>
        <rect x="36" y="505" width="408" height="72" rx="12" fill="#0f131a" stroke="#2d3548" stroke-width="1"/>
        <text x="56" y="535" fill="#9aa0a6" font-family="system-ui, sans-serif" font-size="13">PESO REGISTRADO</text>
        <text x="56" y="560" fill="#ffffff" font-family="system-ui, sans-serif" font-size="18" font-weight="700">${weightLabel}</text>
        <text x="250" y="535" fill="#9aa0a6" font-family="system-ui, sans-serif" font-size="13">CINTURA / CADERA</text>
        <text x="250" y="560" fill="${accentColor}" font-family="system-ui, sans-serif" font-size="18" font-weight="700">${waistLabel}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Devuelve las fotos corporales Antes/Después de los clientes de prueba para la vista de Reportes.
 */
export function getDemoClientPhotos(clientId) {
    if (clientId === 'demo-client-2') {
        return [
            {
                id: 'demo-photo-l1',
                profile_id: 'demo-client-2',
                taken_at: '2026-09-03',
                position: 'front',
                storage_path: buildProgressPhotoSvg({
                    clientName: 'Laura Gómez',
                    dateLabel: '03 Sep 2026 (Inicio)',
                    positionLabel: 'Frontal',
                    weightLabel: '61.2 kg',
                    waistLabel: 'Cadera: 95.0 cm',
                    accentColor: '#60a5fa',
                }),
            },
            {
                id: 'demo-photo-l2',
                profile_id: 'demo-client-2',
                taken_at: '2026-09-03',
                position: 'left',
                storage_path: buildProgressPhotoSvg({
                    clientName: 'Laura Gómez',
                    dateLabel: '03 Sep 2026 (Inicio)',
                    positionLabel: 'Lateral Izquierdo',
                    weightLabel: '61.2 kg',
                    waistLabel: 'Cadera: 95.0 cm',
                    accentColor: '#60a5fa',
                }),
            },
            {
                id: 'demo-photo-l3',
                profile_id: 'demo-client-2',
                taken_at: '2026-10-16',
                position: 'front',
                storage_path: buildProgressPhotoSvg({
                    clientName: 'Laura Gómez',
                    dateLabel: '16 Oct 2026 (Actual)',
                    positionLabel: 'Frontal',
                    weightLabel: '62.3 kg (+1.1 kg)',
                    waistLabel: 'Cadera: 97.5 cm (+2.5 cm)',
                    accentColor: '#10b981',
                }),
            },
            {
                id: 'demo-photo-l4',
                profile_id: 'demo-client-2',
                taken_at: '2026-10-16',
                position: 'left',
                storage_path: buildProgressPhotoSvg({
                    clientName: 'Laura Gómez',
                    dateLabel: '16 Oct 2026 (Actual)',
                    positionLabel: 'Lateral Izquierdo',
                    weightLabel: '62.3 kg (+1.1 kg)',
                    waistLabel: 'Cadera: 97.5 cm (+2.5 cm)',
                    accentColor: '#10b981',
                }),
            },
        ];
    }

    return [
        {
            id: 'demo-photo-c1',
            profile_id: 'demo-client-1',
            taken_at: '2026-09-01',
            position: 'front',
            storage_path: buildProgressPhotoSvg({
                clientName: 'Carlos Pérez',
                dateLabel: '01 Sep 2026 (Inicio)',
                positionLabel: 'Frontal',
                weightLabel: '84.4 kg',
                waistLabel: 'Cintura: 88.0 cm',
                accentColor: '#f59e0b',
            }),
        },
        {
            id: 'demo-photo-c2',
            profile_id: 'demo-client-1',
            taken_at: '2026-09-01',
            position: 'back',
            storage_path: buildProgressPhotoSvg({
                clientName: 'Carlos Pérez',
                dateLabel: '01 Sep 2026 (Inicio)',
                positionLabel: 'Dorsal',
                weightLabel: '84.4 kg',
                waistLabel: 'Cintura: 88.0 cm',
                accentColor: '#f59e0b',
            }),
        },
        {
            id: 'demo-photo-c3',
            profile_id: 'demo-client-1',
            taken_at: '2026-10-15',
            position: 'front',
            storage_path: buildProgressPhotoSvg({
                clientName: 'Carlos Pérez',
                dateLabel: '15 Oct 2026 (Actual)',
                positionLabel: 'Frontal',
                weightLabel: '81.8 kg (-2.6 kg)',
                waistLabel: 'Cintura: 83.5 cm (-4.5 cm)',
                accentColor: '#10b981',
            }),
        },
        {
            id: 'demo-photo-c4',
            profile_id: 'demo-client-1',
            taken_at: '2026-10-15',
            position: 'back',
            storage_path: buildProgressPhotoSvg({
                clientName: 'Carlos Pérez',
                dateLabel: '15 Oct 2026 (Actual)',
                positionLabel: 'Dorsal',
                weightLabel: '81.8 kg (-2.6 kg)',
                waistLabel: 'Cintura: 83.5 cm (-4.5 cm)',
                accentColor: '#10b981',
            }),
        },
    ];
}

// ============================================================================
// CALENDARIO PARA CLIENTES DE PRUEBA (Carlos Pérez y Laura Gómez)
// ============================================================================

const DEFAULT_DEMO_CALENDAR_STORE = {
    'demo-client-1': {
        events: [
            {
                id: 900001,
                profile_id: 'demo-client-1',
                event_type: 'training',
                title: 'Entreno: Torso Hipertrofia A',
                description: 'Sesión de pecho y espalda pesada (RIR 1-2).',
                dtstart: '2026-01-01',
                start_time: '18:30',
                freq: 'weekly',
                recurrence_interval: 1,
                byday: 1, // Lunes
                bymonthday: null,
                bymonth: null,
                count: null,
                until: null,
                routine_id: 'demo-routine-carlos-1',
                routine: { id: 'demo-routine-carlos-1', title: 'Día A — Torso Hipertrofia (Pecho + Espalda)' },
                active: true,
            },
            {
                id: 900002,
                profile_id: 'demo-client-1',
                event_type: 'training',
                title: 'Entreno: Pierna Completa + Core B',
                description: 'Tomar 1 tortita de arroz extra 45 min antes.',
                dtstart: '2026-01-01',
                start_time: '18:30',
                freq: 'weekly',
                recurrence_interval: 1,
                byday: 3, // Miércoles
                bymonthday: null,
                bymonth: null,
                count: null,
                until: null,
                routine_id: 'demo-routine-carlos-2',
                routine: { id: 'demo-routine-carlos-2', title: 'Día B — Pierna Completa + Core' },
                active: true,
            },
            {
                id: 900003,
                profile_id: 'demo-client-1',
                event_type: 'training',
                title: 'Entreno: Torso Hipertrofia A',
                description: 'Segunda sesión semanal de torso.',
                dtstart: '2026-01-01',
                start_time: '18:00',
                freq: 'weekly',
                recurrence_interval: 1,
                byday: 5, // Viernes
                bymonthday: null,
                bymonth: null,
                count: null,
                until: null,
                routine_id: 'demo-routine-carlos-1',
                routine: { id: 'demo-routine-carlos-1', title: 'Día A — Torso Hipertrofia (Pecho + Espalda)' },
                active: true,
            },
            {
                id: 900004,
                profile_id: 'demo-client-1',
                event_type: 'photos',
                title: 'Fotos Corporales de Revisión',
                description: 'Subir fotos en ayunas (Frontal, Perfil y Espalda) con buena luz.',
                dtstart: '2026-01-01',
                start_time: '08:30',
                freq: 'monthly',
                recurrence_interval: 1,
                byday: null,
                bymonthday: 15,
                bymonth: null,
                count: null,
                until: null,
                routine_id: null,
                routine: null,
                active: true,
            },
        ],
        exceptions: [],
    },
    'demo-client-2': {
        events: [
            {
                id: 900011,
                profile_id: 'demo-client-2',
                event_type: 'training',
                title: 'Entreno: Énfasis Glúteo e Isquios',
                description: 'Hip Thrust + Peso Muerto Rumano + Sentadilla Búlgara.',
                dtstart: '2026-01-01',
                start_time: '19:00',
                freq: 'weekly',
                recurrence_interval: 1,
                byday: 2, // Martes
                bymonthday: null,
                bymonth: null,
                count: null,
                until: null,
                routine_id: 'demo-routine-laura-1',
                routine: { id: 'demo-routine-laura-1', title: 'Día 1 — Énfasis Glúteo e Isquios (Fuerza)' },
                active: true,
            },
            {
                id: 900012,
                profile_id: 'demo-client-2',
                event_type: 'training',
                title: 'Entreno: Tren Superior Estético + Core',
                description: 'Espalda, hombros y trabajo abdominal.',
                dtstart: '2026-01-01',
                start_time: '19:00',
                freq: 'weekly',
                recurrence_interval: 1,
                byday: 4, // Jueves
                bymonthday: null,
                bymonth: null,
                count: null,
                until: null,
                routine_id: 'demo-routine-laura-2',
                routine: { id: 'demo-routine-laura-2', title: 'Día 2 — Tren Superior Estético + Core' },
                active: true,
            },
            {
                id: 900013,
                profile_id: 'demo-client-2',
                event_type: 'training',
                title: 'Entreno: Glúteo e Isquios (Sesión 2)',
                description: 'Foco en progresión de cargas en Hip Thrust.',
                dtstart: '2026-01-01',
                start_time: '11:00',
                freq: 'weekly',
                recurrence_interval: 1,
                byday: 6, // Sábado
                bymonthday: null,
                bymonth: null,
                count: null,
                until: null,
                routine_id: 'demo-routine-laura-1',
                routine: { id: 'demo-routine-laura-1', title: 'Día 1 — Énfasis Glúteo e Isquios (Fuerza)' },
                active: true,
            },
            {
                id: 900014,
                profile_id: 'demo-client-2',
                event_type: 'photos',
                title: 'Fotos de Progreso Mensual',
                description: 'Fotos comparativas de recomposición corporal.',
                dtstart: '2026-01-01',
                start_time: '09:00',
                freq: 'monthly',
                recurrence_interval: 1,
                byday: null,
                bymonthday: 16,
                bymonth: null,
                count: null,
                until: null,
                routine_id: null,
                routine: null,
                active: true,
            },
        ],
        exceptions: [],
    },
};

function readDemoCalendarStore() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return JSON.parse(JSON.stringify(DEFAULT_DEMO_CALENDAR_STORE));
    }
    try {
        const raw = window.localStorage.getItem(DEMO_CALENDAR_EVENTS_KEY);
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DEMO_CALENDAR_STORE));
        const parsed = JSON.parse(raw);
        return {
            'demo-client-1': parsed['demo-client-1'] || JSON.parse(JSON.stringify(DEFAULT_DEMO_CALENDAR_STORE['demo-client-1'])),
            'demo-client-2': parsed['demo-client-2'] || JSON.parse(JSON.stringify(DEFAULT_DEMO_CALENDAR_STORE['demo-client-2'])),
        };
    } catch {
        return JSON.parse(JSON.stringify(DEFAULT_DEMO_CALENDAR_STORE));
    }
}

function writeDemoCalendarStore(store) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(DEMO_CALENDAR_EVENTS_KEY, JSON.stringify(store));
    } catch {
        // Ignore storage errors
    }
}

export function isDemoEventId(eventId) {
    const num = Number(eventId);
    return !Number.isNaN(num) && num >= 900000;
}

export function getDemoCalendarData(clientId) {
    const store = readDemoCalendarStore();
    const clientData = store[clientId] || { events: [], exceptions: [] };
    return {
        events: (clientData.events || []).filter(e => e.active !== false),
        exceptions: clientData.exceptions || [],
    };
}

export function createDemoCalendarEvent(data) {
    const store = readDemoCalendarStore();
    const clientId = data.profileId;
    if (!store[clientId]) {
        store[clientId] = { events: [], exceptions: [] };
    }
    const routineObj = data.routineId ? getDemoRoutineById(data.routineId) : null;
    const newEvent = {
        id: 900000 + Math.floor(Math.random() * 90000) + Date.now() % 10000,
        profile_id: clientId,
        event_type: data.eventType,
        title: data.title,
        description: data.description || null,
        dtstart: data.dtstart,
        start_time: data.startTime || null,
        freq: data.freq || null,
        recurrence_interval: Number(data.interval) || 1,
        byday: data.byday ? Number(data.byday) : null,
        bymonthday: data.bymonthday ? Number(data.bymonthday) : null,
        bymonth: data.bymonth ? Number(data.bymonth) : null,
        count: data.count ? Number(data.count) : null,
        until: data.until || null,
        routine_id: data.routineId || null,
        routine: routineObj ? { id: routineObj.id, title: routineObj.title } : null,
        active: true,
    };
    store[clientId].events.push(newEvent);
    writeDemoCalendarStore(store);
    return newEvent;
}

export function updateDemoCalendarEvent(eventId, patch) {
    const store = readDemoCalendarStore();
    for (const clientId of Object.keys(store)) {
        const idx = store[clientId].events.findIndex(e => Number(e.id) === Number(eventId));
        if (idx !== -1) {
            const current = store[clientId].events[idx];
            store[clientId].events[idx] = {
                ...current,
                title: patch.title !== undefined ? patch.title : current.title,
                description: patch.description !== undefined ? patch.description : current.description,
                start_time: patch.startTime !== undefined ? patch.startTime : current.start_time,
                until: patch.until !== undefined ? patch.until : current.until,
            };
            writeDemoCalendarStore(store);
            return;
        }
    }
}

export function removeDemoCalendarEvent(eventId) {
    const store = readDemoCalendarStore();
    for (const clientId of Object.keys(store)) {
        const idx = store[clientId].events.findIndex(e => Number(e.id) === Number(eventId));
        if (idx !== -1) {
            store[clientId].events[idx].active = false;
            writeDemoCalendarStore(store);
            return;
        }
    }
}

export function cancelDemoCalendarOccurrence(eventId, date) {
    const store = readDemoCalendarStore();
    for (const clientId of Object.keys(store)) {
        if (store[clientId].events.some(e => Number(e.id) === Number(eventId))) {
            store[clientId].exceptions = (store[clientId].exceptions || []).filter(
                ex => !(Number(ex.event_id) === Number(eventId) && ex.recurrence_id === date)
            );
            store[clientId].exceptions.push({
                event_id: Number(eventId),
                recurrence_id: date,
                status: 'cancelled',
            });
            writeDemoCalendarStore(store);
            return;
        }
    }
}

export function modifyDemoCalendarOccurrence(eventId, date, fields) {
    const store = readDemoCalendarStore();
    for (const clientId of Object.keys(store)) {
        if (store[clientId].events.some(e => Number(e.id) === Number(eventId))) {
            store[clientId].exceptions = (store[clientId].exceptions || []).filter(
                ex => !(Number(ex.event_id) === Number(eventId) && ex.recurrence_id === date)
            );
            store[clientId].exceptions.push({
                event_id: Number(eventId),
                recurrence_id: date,
                status: 'modified',
                title: fields.title ?? null,
                description: fields.description ?? null,
                new_start_time: fields.startTime ?? null,
                new_date: fields.newDate ?? null,
            });
            writeDemoCalendarStore(store);
            return;
        }
    }
}
