/**
 * Motor de cálculos nutricionales ANEF Dietas para Akuma Fit.
 *
 * Implementa el protocolo paso a paso de prescripción calórica y de macronutrientes:
 * - Paso 1: Metabolismo Basal (Mifflin-St Jeor) y Factores de Actividad laboral + deportiva.
 * - Paso 2: Ajuste de Casos de Desviación, Porcentaje Graso (CUN-BAE) y Objetivos de Dieta.
 * - Paso 3: Prescripción de Macronutrientes (Proteínas, Grasas, Hidratos) y Auto-Ajuste ANEF.
 * - Paso 4: Distribución de comidas y sincronización peri-entreno.
 * - Pautas prácticas y equivalencias oficiales ANEF.
 * - Mapeo automático de perfiles de clientes de Akuma Fit.
 */

// ---------------------------------------------------------------------------
// 1. CONSTANTES Y TABLAS OFICIALES ANEF
// ---------------------------------------------------------------------------

export const WORK_ACTIVITY_LEVELS = [
    { id: 'inactiva', label: 'Inactiva / Reposo', detail: 'Inactiva total, encamado', factor: 1.2, scaleName: 'INACTIVA' },
    { id: 'oficina', label: 'Oficina / Sedentaria', detail: 'Oficinista, sentado o poca actividad', factor: 1.3, scaleName: 'BAJA' },
    { id: 'andando', label: 'Andando / Ligera', detail: 'Comercial, dependiente de pie activo', factor: 1.4, scaleName: 'LIGERA' },
    { id: 'fisico_ligero', label: 'Trabajo físico ligero', detail: 'Ritmo activo, mecánico, técnico activo', factor: 1.5, scaleName: 'MEDIA' },
    { id: 'fisico_medio', label: 'Trabajo físico medio', detail: 'Montaje físico, trabajo duro constante', factor: 1.6, scaleName: 'ALTA' },
    { id: 'fisico_intenso', label: 'Trabajo físico intenso', detail: 'Obrero de trabajo físico pesado', factor: 1.7, scaleName: 'MUY ALTA' },
    { id: 'fisico_extra', label: 'Trabajo físico muy intenso + horas extra', detail: 'Alto grado físico laboral', factor: 1.8, scaleName: 'ALTO GRADO' },
];

export const EXERCISE_LEVELS = [
    { id: 'none', label: 'No practica ejercicio', factor: 1.0 },
    { id: 'rest', label: 'Día de descanso', factor: 1.03 },
    { id: 'light_1h', label: '1 hora suave', factor: 1.1 },
    { id: 'intense_1h', label: '1 hora intensa', factor: 1.2 },
    { id: 'intense_1_5h', label: '1 hora y media intensa', factor: 1.3 },
    { id: 'intense_2h', label: '2 horas intensas', factor: 1.4 },
    { id: 'intense_3h', label: '3 horas intensas', factor: 1.6 },
    { id: 'intense_4h', label: '4 horas intensas', factor: 1.8 },
    { id: 'intense_5h', label: '5 horas intensas', factor: 2.0 },
];

export const DEVIATION_CASES = [
    { id: 'normal', label: 'Sin anomalías (Peso ideal)', factor: 1.0 },
    { id: 'algo_graso', label: 'Algo graso (Sobrepeso ligero)', factor: 0.985 },
    { id: 'graso', label: 'Graso (Sobrepeso medio)', factor: 0.97 },
    { id: 'muy_graso', label: 'Muy graso', factor: 0.95 },
    { id: 'obesidad', label: 'Alto grado obesidad', factor: 0.92 },
    { id: 'bajo_graso', label: 'Bajo porcentaje graso', factor: 1.05 },
    { id: 'muy_bajo_graso', label: 'Muy bajo porcentaje graso', factor: 1.08 },
    { id: 'musculado', label: 'Musculado (+masa muscular)', factor: 1.05 },
    { id: 'muy_musculado', label: 'Muy musculado', factor: 1.1 },
];

export const DIET_GOALS = [
    { id: 'restriccion_severa', label: 'Restricción severa (-25%)', pctChange: -25, group: 'bajada' },
    { id: 'bajada_peso', label: 'Bajada de peso (-20%)', pctChange: -20, group: 'bajada' },
    { id: 'definicion', label: 'Definición (-15%)', pctChange: -15, group: 'definicion' },
    { id: 'bajada_ligera', label: 'Bajada ligera (-10%)', pctChange: -10, group: 'bajada' },
    { id: 'mantenimiento', label: 'Mantenimiento (0%)', pctChange: 0, group: 'mantenimiento' },
    { id: 'aumento_ligero', label: 'Aumento ligero (+10%)', pctChange: 10, group: 'aumento' },
    { id: 'aumento_peso', label: 'Aumento de peso (+15%)', pctChange: 15, group: 'aumento' },
    { id: 'hipertrofia', label: 'Hipertrofia (+20%)', pctChange: 20, group: 'hipertrofia' },
    { id: 'carga_hc', label: 'Carga de Carbohidratos (+25%)', pctChange: 25, group: 'hipertrofia' },
];

export const ANEF_MEAL_TYPES = [
    'Desayuno',
    'Almuerzo',
    'Segundo Almuerzo',
    'Comida',
    'Merienda',
    'Segunda Merienda',
    'Pre-Entreno',
    'Post-Entreno',
    'Cena',
    'Resopón',
    'Media-Noche',
    'Picoteo',
];

export const ANEF_REFERENCE_TABLE = {
    Baja: {
        bajada: { p: 1.7, f: 0.7 },
        definicion: { p: 2.0, f: 0.7 },
        mantenimiento: { p: 1.2, f: 1.0 },
        aumento: { p: 1.6, f: 1.0 },
        hipertrofia: { p: 1.9, f: 1.0 },
    },
    Media: {
        bajada: { p: 2.0, f: 0.8 },
        definicion: { p: 2.2, f: 0.8 },
        mantenimiento: { p: 1.5, f: 1.0 },
        aumento: { p: 1.7, f: 1.0 },
        hipertrofia: { p: 2.0, f: 1.0 },
    },
    Alta: {
        bajada: { p: 2.2, f: 0.9 },
        definicion: { p: 2.2, f: 0.9 },
        mantenimiento: { p: 1.7, f: 1.0 },
        aumento: { p: 1.8, f: 1.1 },
        hipertrofia: { p: 2.0, f: 1.1 },
    },
    Musculado: {
        bajada: { p: 2.3, f: 0.9 },
        definicion: { p: 2.3, f: 0.9 },
        mantenimiento: { p: 1.7, f: 1.0 },
        aumento: { p: 2.0, f: 1.2 },
        hipertrofia: { p: 2.1, f: 1.2 },
    },
};

export const ANEF_PRACTICAL_GUIDELINES = [
    'Consumo de agua: Beber un vaso de agua antes de cada comida para favorecer la digestión y saciedad.',
    'Hidratación diaria: Mantener una ingesta mínima de 1.5 a 2 litros de agua al día (o 1 litro por cada 25-30 kg de peso corporal).',
    'Pesaje de alimentos: Todos los alimentos deben pesarse en crudo y en limpio (sin cáscaras, huesos ni mermas), salvo indicación expresa.',
    'Equivalencias de Hidratos de Carbono (porción equivalente de 10g de carbohidratos netos): 10g arroz = 10g pasta = 10g cereales integrales (avena) = 15g pan integral = 15g legumbres secas = 40g patata o boniato.',
    'Equivalencias Proteicas (porción equivalente a 2g de proteína pura): 10g pechuga de pollo/pavo = 10g ternera magra = 12g pescado blanco o azul = 15g huevo entero o claras.',
    'Medidas caseras de grasas: 1 cucharada sopera de Aceite de Oliva Virgen Extra (AOVE) equivale a 10g (~88-90 kcal). 1 cucharadita de postre equivale a 5g (~45 kcal).',
    'Medidas caseras de huevos: 1 huevo entero clase L equivale aproximadamente a 60g (12g proteína/100g, ~7.5g proteína por huevo). 1 clara pasteurizada estándar equivale a ~30-33g (3.5g proteína).',
    'Verduras libres: Las verduras de hoja verde (lechuga, espinacas, canónigos, rúcula) y pepino tienen impacto calórico mínimo y pueden consumirse para saciedad.',
    'Sincronización nutricional: Concentrar la mayor proporción de hidratos de carbono en el desayuno, pre-entreno y post-entreno para optimizar la síntesis de glucógeno y recuperación.',
];

// ---------------------------------------------------------------------------
// 2. HELPERS INTERNOS
// ---------------------------------------------------------------------------

function isFemale(sex) {
    if (!sex) return false;
    const s = String(sex).toLowerCase().trim();
    return s === 'mujer' || s === 'female' || s === 'femenino' || s === 'f';
}

function getActivityScaleLabel(factor) {
    if (factor <= 1.2) return 'INACTIVA';
    if (factor <= 1.35) return 'BAJA';
    if (factor <= 1.45) return 'LIGERA';
    if (factor <= 1.55) return 'MEDIA';
    if (factor <= 1.65) return 'ALTA';
    if (factor <= 1.75) return 'MUY ALTA';
    if (factor <= 1.85) return 'ALTO GRADO';
    if (factor <= 2.05) return 'EXTREMA';
    if (factor <= 2.35) return 'FREAK';
    return 'INSANE';
}

// ---------------------------------------------------------------------------
// 3. FUNCIONES DE CÁLCULO
// ---------------------------------------------------------------------------

/**
 * Calcula la Tasa Metabólica Basal (BMR) mediante la fórmula de Mifflin-St Jeor.
 *
 * @param {Object} params
 * @param {string} params.sex - 'Hombre' o 'Mujer' ('male' / 'female').
 * @param {number} params.weight - Peso corporal en kg.
 * @param {number} params.height - Altura en cm.
 * @param {number} params.age - Edad en años.
 * @returns {number} BMR en kcal/día redondeado al entero más cercano.
 */
export function calculateBMR({ sex, weight, height, age }) {
    const w = Number(weight) || 70;
    const h = Number(height) || 170;
    const a = Number(age) || 30;
    const sexAdjustment = isFemale(sex) ? -161 : 5;

    return Math.round(10 * w + 6.25 * h - 5 * a + sexAdjustment);
}

/**
 * Calcula el factor de actividad física total combinando la actividad laboral
 * y el entrenamiento según el algoritmo ANEF: `workFactor + (exerciseFactor - 1)`.
 *
 * @param {string} workActivityId - Id de WORK_ACTIVITY_LEVELS.
 * @param {string} exerciseId - Id de EXERCISE_LEVELS.
 * @returns {{ factor: number, scaleLabel: string, valueOf: Function, toString: Function }}
 */
export function calculateActivityFactor(workActivityId, exerciseId) {
    const work = WORK_ACTIVITY_LEVELS.find(w => w.id === workActivityId) || WORK_ACTIVITY_LEVELS[1];
    const exercise = EXERCISE_LEVELS.find(e => e.id === exerciseId) || EXERCISE_LEVELS[0];

    const rawFactor = work.factor + (exercise.factor - 1);
    const factor = Math.round(rawFactor * 100) / 100;
    const scaleLabel = getActivityScaleLabel(factor);

    return {
        factor,
        scaleLabel,
        valueOf() {
            return factor;
        },
        toString() {
            return String(factor);
        },
    };
}

/**
 * Calcula el Índice de Masa Corporal (BMI) y el porcentaje de grasa corporal
 * estimado mediante la ecuación CUN-BAE (Clínica Universidad de Navarra - Body Adiposity Estimator).
 *
 * @param {Object} params
 * @param {string} params.sex - Sexo del usuario.
 * @param {number} params.weight - Peso en kg.
 * @param {number} params.height - Altura en cm.
 * @param {number} params.age - Edad en años.
 * @returns {{ bmi: number, bodyFatPct: number, category: string }}
 */
export function calculateBMIAndCunBae({ sex, weight, height, age }) {
    const w = Number(weight) || 70;
    const h = Number(height) || 170;
    const a = Number(age) || 30;

    const heightInMeters = h / 100;
    const bmiRaw = w / (heightInMeters * heightInMeters);
    const bmi = Math.round(bmiRaw * 10) / 10;

    // CUN-BAE: sex = 0 para hombres, 1 para mujeres
    const sexVal = isFemale(sex) ? 1 : 0;
    const bfRaw = -44.988
        + (0.503 * a)
        + (10.689 * sexVal)
        + (3.172 * bmi)
        - (0.026 * bmi * bmi)
        + (0.181 * bmi * sexVal)
        - (0.02 * bmi * a)
        - (0.005 * bmi * bmi * sexVal)
        + (0.00021 * bmi * bmi * a);

    const bodyFatPct = Math.max(3, Math.min(65, Math.round(bfRaw * 10) / 10));

    let category;
    if (bmi < 18.5) category = 'Bajo peso';
    else if (bmi < 25) category = 'Normopeso';
    else if (bmi < 30) category = 'Sobrepeso';
    else if (bmi < 35) category = 'Obesidad Grado I';
    else if (bmi < 40) category = 'Obesidad Grado II';
    else category = 'Obesidad Grado III';

    return { bmi, bodyFatPct, category };
}

/**
 * Calcula las calorías objetivo aplicando los Pasos 1 y 2 de ANEF:
 * BMR -> TDEE (x actividad) -> Ajuste por Caso de Desviación -> Ajuste por Objetivo -> Ajuste Manual.
 *
 * @param {Object} params
 * @returns {Object} Desglose completo de gasto y calorías diana.
 */
export function calculateTargetCalories({
    sex,
    weight,
    height,
    age,
    workActivityId,
    exerciseId,
    deviationId = 'normal',
    goalId = 'mantenimiento',
    manualAdjustment = 0,
}) {
    const bmr = calculateBMR({ sex, weight, height, age });
    const activity = calculateActivityFactor(workActivityId, exerciseId);
    const activityFactor = activity.factor;
    const activityScaleLabel = activity.scaleLabel;

    const tdee = Math.round(bmr * activityFactor);

    const deviation = DEVIATION_CASES.find(d => d.id === deviationId) || DEVIATION_CASES[0];
    const deviationFactor = deviation.factor;

    const goal = DIET_GOALS.find(g => g.id === goalId) || DIET_GOALS[4];
    const goalPctChange = goal.pctChange;

    const adjustedBase = tdee * deviationFactor;
    const targetCalories = Math.max(
        800,
        Math.round(adjustedBase * (1 + goalPctChange / 100) + Number(manualAdjustment || 0))
    );

    const { bmi, bodyFatPct } = calculateBMIAndCunBae({ sex, weight, height, age });

    return {
        bmr,
        activityFactor,
        activityScaleLabel,
        tdee,
        deviationFactor,
        goalPctChange,
        targetCalories,
        bmi,
        bodyFatPct,
    };
}

/**
 * Obtiene las recomendaciones de g/kg de proteína y grasa según la tabla ANEF Paso 3.
 *
 * @param {Object} params
 * @param {number} params.activityFactor - Factor de actividad total.
 * @param {string} params.goalId - Id del objetivo nutricional.
 * @param {string} [params.deviationId] - Id de caso de desviación (para detectar 'musculado').
 * @returns {{ proteinPerKg: number, fatPerKg: number, fiberGrams: number }}
 */
export function getRecommendedMacrosPerKg({ activityFactor, goalId, deviationId = 'normal' }) {
    let tierKey;
    if (deviationId === 'musculado' || deviationId === 'muy_musculado') {
        tierKey = 'Musculado';
    } else if (activityFactor <= 1.4) {
        tierKey = 'Baja';
    } else if (activityFactor <= 1.6) {
        tierKey = 'Media';
    } else {
        tierKey = 'Alta';
    }

    const tier = ANEF_REFERENCE_TABLE[tierKey] || ANEF_REFERENCE_TABLE.Media;

    const goal = DIET_GOALS.find(g => g.id === goalId) || DIET_GOALS[4];
    let goalKey;
    if (goal.group === 'bajada') {
        goalKey = 'bajada';
    } else if (goal.id === 'definicion') {
        goalKey = 'definicion';
    } else if (goal.group === 'aumento') {
        goalKey = 'aumento';
    } else if (goal.group === 'hipertrofia') {
        goalKey = 'hipertrofia';
    } else {
        goalKey = 'mantenimiento';
    }

    const rec = tier[goalKey] || tier.mantenimiento;

    return {
        proteinPerKg: rec.p,
        fatPerKg: rec.f,
        fiberGrams: 30,
    };
}

/**
 * Calcula el reparto de macronutrientes del Paso 3 de ANEF aplicando Auto-Ajuste:
 * - Si `autoAdjust === 'carbs'`, fija proteína y grasa y cuadra el remanente calórico con carbohidratos.
 * - Si `autoAdjust === 'protein'`, fija carbohidratos y grasa y cuadra con proteína.
 * - Si `autoAdjust === 'fat'`, fija proteína y carbohidratos y cuadra con grasa.
 *
 * @param {Object} params
 * @returns {Object} Desglose detallado de macros, gramos, g/kg, kcal y porcentajes.
 */
export function calculateStep3Macros({
    targetCalories,
    weight,
    proteinPerKg,
    fatPerKg,
    carbsPerKg = 2.5,
    fiberGrams = 30,
    autoAdjust = 'carbs',
}) {
    const w = Number(weight) || 70;
    const targetKcal = Number(targetCalories) || 2000;

    let proteinGrams;
    let carbsGrams;
    let fatGrams;
    let isNegativeAdjustment;

    if (autoAdjust === 'protein') {
        carbsGrams = Math.round(w * Number(carbsPerKg));
        fatGrams = Math.round(w * Number(fatPerKg));
        const usedKcal = (carbsGrams * 4) + (fatGrams * 9);
        const remKcal = targetKcal - usedKcal;
        isNegativeAdjustment = remKcal < 0;
        proteinGrams = Math.max(0, Math.round(remKcal / 4));
    } else if (autoAdjust === 'fat') {
        proteinGrams = Math.round(w * Number(proteinPerKg));
        carbsGrams = Math.round(w * Number(carbsPerKg));
        const usedKcal = (proteinGrams * 4) + (carbsGrams * 4);
        const remKcal = targetKcal - usedKcal;
        isNegativeAdjustment = remKcal < 0;
        fatGrams = Math.max(0, Math.round(remKcal / 9));
    } else {
        // Por defecto 'carbs'
        proteinGrams = Math.round(w * Number(proteinPerKg));
        fatGrams = Math.round(w * Number(fatPerKg));
        const usedKcal = (proteinGrams * 4) + (fatGrams * 9);
        const remKcal = targetKcal - usedKcal;
        isNegativeAdjustment = remKcal < 0;
        carbsGrams = Math.max(0, Math.round(remKcal / 4));
    }

    const calculatedProteinPerKg = Math.round((proteinGrams / w) * 100) / 100;
    const calculatedCarbsPerKg = Math.round((carbsGrams / w) * 100) / 100;
    const calculatedFatPerKg = Math.round((fatGrams / w) * 100) / 100;

    const proteinKcal = proteinGrams * 4;
    const carbsKcal = carbsGrams * 4;
    const fatKcal = fatGrams * 9;
    const totalKcal = proteinKcal + carbsKcal + fatKcal;

    const proteinPct = totalKcal > 0 ? Math.round((proteinKcal / totalKcal) * 100) : 0;
    const carbsPct = totalKcal > 0 ? Math.round((carbsKcal / totalKcal) * 100) : 0;
    const fatPct = totalKcal > 0 ? Math.round((fatKcal / totalKcal) * 100) : 0;

    return {
        proteinGrams,
        carbsGrams,
        fatGrams,
        fiberGrams: Number(fiberGrams) || 30,
        proteinPerKg: calculatedProteinPerKg,
        carbsPerKg: calculatedCarbsPerKg,
        fatPerKg: calculatedFatPerKg,
        proteinKcal,
        carbsKcal,
        fatKcal,
        proteinPct,
        carbsPct,
        fatPct,
        totalKcal,
        isNegativeAdjustment,
    };
}

/**
 * Genera una plantilla de comidas predeterminada (de 3 a 8 comidas) con porcentajes
 * que suman exactamente 100.
 * Si se especifica `postWorkoutIndex`, otorga un ligero plus calórico al post-entreno
 * y pre-entreno acorde al Paso 2 de ANEF.
 *
 * @param {number} [mealsCount=4] - Número de comidas deseadas (3 a 8).
 * @param {number|null} [postWorkoutIndex=null] - Índice de la comida que es post-entreno.
 * @returns {Array<{ index: number, type: string, isPostWorkout: boolean, pct: number }>}
 */
export function buildDefaultMeals(mealsCount = 4, postWorkoutIndex = null) {
    const count = Math.max(3, Math.min(8, Number(mealsCount) || 4));

    const presets = {
        3: [
            { type: 'Desayuno', pct: 30 },
            { type: 'Comida', pct: 40 },
            { type: 'Cena', pct: 30 },
        ],
        4: [
            { type: 'Desayuno', pct: 25 },
            { type: 'Comida', pct: 35 },
            { type: 'Merienda', pct: 15 },
            { type: 'Cena', pct: 25 },
        ],
        5: [
            { type: 'Desayuno', pct: 20 },
            { type: 'Almuerzo', pct: 15 },
            { type: 'Comida', pct: 35 },
            { type: 'Merienda', pct: 10 },
            { type: 'Cena', pct: 20 },
        ],
        6: [
            { type: 'Desayuno', pct: 20 },
            { type: 'Almuerzo', pct: 10 },
            { type: 'Comida', pct: 30 },
            { type: 'Merienda', pct: 10 },
            { type: 'Cena', pct: 20 },
            { type: 'Resopón', pct: 10 },
        ],
        7: [
            { type: 'Desayuno', pct: 15 },
            { type: 'Almuerzo', pct: 10 },
            { type: 'Comida', pct: 30 },
            { type: 'Merienda', pct: 10 },
            { type: 'Pre-Entreno', pct: 10 },
            { type: 'Cena', pct: 15 },
            { type: 'Resopón', pct: 10 },
        ],
        8: [
            { type: 'Desayuno', pct: 15 },
            { type: 'Almuerzo', pct: 10 },
            { type: 'Segundo Almuerzo', pct: 10 },
            { type: 'Comida', pct: 25 },
            { type: 'Merienda', pct: 10 },
            { type: 'Pre-Entreno', pct: 10 },
            { type: 'Cena', pct: 12 },
            { type: 'Resopón', pct: 8 },
        ],
    };

    const baseList = presets[count] || presets[4];
    const meals = baseList.map((m, idx) => ({
        index: idx,
        type: m.type,
        isPostWorkout: postWorkoutIndex !== null && idx === Number(postWorkoutIndex),
        pct: m.pct,
    }));

    if (postWorkoutIndex !== null && postWorkoutIndex >= 0 && postWorkoutIndex < meals.length) {
        // Aumentar post-entreno en 5% y pre-entreno en 3% si existe
        const postIdx = Number(postWorkoutIndex);
        const preIdx = postIdx > 0 ? postIdx - 1 : null;

        let bonusTaken = 0;
        meals[postIdx].pct += 5;
        bonusTaken += 5;

        if (preIdx !== null && preIdx !== postIdx) {
            meals[preIdx].pct += 3;
            bonusTaken += 3;
        }

        // Deducir proporcionalmente de las comidas restantes
        const otherIndices = meals
            .map((_, i) => i)
            .filter(i => i !== postIdx && i !== preIdx);

        if (otherIndices.length > 0) {
            const deductionEach = Math.floor(bonusTaken / otherIndices.length);
            let remDeduction = bonusTaken;

            otherIndices.forEach((i, k) => {
                const deduct = k === otherIndices.length - 1 ? remDeduction : deductionEach;
                meals[i].pct = Math.max(5, meals[i].pct - deduct);
                remDeduction -= deduct;
            });
        }
    }

    // Cuadrar para que la suma sea exactamente 100
    const sum = meals.reduce((acc, m) => acc + m.pct, 0);
    if (sum !== 100) {
        meals[0].pct += (100 - sum);
    }

    return meals;
}

/**
 * Calcula la distribución de macronutrientes y calorías por cada comida (Paso 4 de ANEF).
 * Prioriza hidratos de carbono y proteínas en la comida post-entreno reduciendo grasas,
 * manteniendo cuadrados los totales diarios.
 *
 * @param {Object} params
 * @param {Array<Object>} params.meals - Lista de comidas generadas o configuradas.
 * @param {number} params.targetCalories - Calorías diana totales.
 * @param {Object} params.step3Macros - Objeto de macros obtenido en el Paso 3.
 * @returns {Array<Object>} Lista de comidas con desglose exacto en gramos y calorías.
 */
export function calculateStep4Distribution({ meals, targetCalories, step3Macros }) {
    if (!meals || meals.length === 0) return [];

    const totalProtein = step3Macros?.proteinGrams || 0;
    const totalCarbs = step3Macros?.carbsGrams || 0;
    const totalFat = step3Macros?.fatGrams || 0;
    const totalFiber = step3Macros?.fiberGrams || 30;
    const totalKcalTarget = Number(targetCalories)
        || ((totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9));

    // Determinar factores de ponderación según sea o no peri-entreno
    const weights = meals.map(m => {
        const isPost = Boolean(m.isPostWorkout || m.type === 'Post-Entreno');
        return {
            carbWeight: isPost ? 1.25 * m.pct : 1.0 * m.pct,
            proteinWeight: isPost ? 1.10 * m.pct : 1.0 * m.pct,
            fatWeight: isPost ? 0.50 * m.pct : 1.0 * m.pct,
        };
    });

    const sumCarbWeights = weights.reduce((acc, w) => acc + w.carbWeight, 0) || 1;
    const sumProteinWeights = weights.reduce((acc, w) => acc + w.proteinWeight, 0) || 1;
    const sumFatWeights = weights.reduce((acc, w) => acc + w.fatWeight, 0) || 1;

    let accProtein = 0;
    let accCarbs = 0;
    let accFat = 0;
    let accFiber = 0;
    let accKcal = 0;

    const result = meals.map((m, idx) => {
        const isLast = idx === meals.length - 1;

        let pGrams;
        let cGrams;
        let fGrams;
        let fibGrams;
        let kcal;

        if (isLast) {
            pGrams = Math.max(0, totalProtein - accProtein);
            cGrams = Math.max(0, totalCarbs - accCarbs);
            fGrams = Math.max(0, totalFat - accFat);
            fibGrams = Math.max(0, totalFiber - accFiber);
            kcal = Math.max(0, totalKcalTarget - accKcal);
        } else {
            const pShare = weights[idx].proteinWeight / sumProteinWeights;
            const cShare = weights[idx].carbWeight / sumCarbWeights;
            const fShare = weights[idx].fatWeight / sumFatWeights;
            const generalShare = (m.pct || 0) / 100;

            pGrams = Math.round(totalProtein * pShare);
            cGrams = Math.round(totalCarbs * cShare);
            fGrams = Math.round(totalFat * fShare);
            fibGrams = Math.round(totalFiber * generalShare);
            kcal = Math.round(totalKcalTarget * generalShare);

            accProtein += pGrams;
            accCarbs += cGrams;
            accFat += fGrams;
            accFiber += fibGrams;
            accKcal += kcal;
        }

        return {
            ...m,
            kcal,
            proteinGrams: pGrams,
            carbsGrams: cGrams,
            fatGrams: fGrams,
            fiberGrams: fibGrams,
        };
    });

    return result;
}

/**
 * Mapea los datos de un cliente de Akuma Fit (perfil, valoración inicial y última medición)
 * al contrato de estado del asistente ANEF.
 *
 * @param {Object} params
 * @param {Object} params.client - Datos del perfil del cliente (name, surname, gender, birthdate).
 * @param {Object|null} params.assessment - Valoración inicial del cliente (initial_assessment).
 * @param {Array<Object>} [params.measurements=[]] - Historial de mediciones ordenado desc.
 * @returns {Object} Estado inicial formateado para el asistente nutricional ANEF.
 */
export function mapClientToAnefData({ client, assessment, measurements = [] }) {
    const clientName = [client?.name, client?.surname].filter(Boolean).join(' ') || 'Cliente';

    // Determinar sexo
    const rawSex = client?.gender || assessment?.gender || '';
    const sex = isFemale(rawSex) ? 'Mujer' : 'Hombre';

    // Determinar edad
    let age = 30;
    if (client?.birthdate) {
        const birthYear = new Date(client.birthdate).getFullYear();
        const currentYear = new Date().getFullYear();
        const computedAge = currentYear - birthYear;
        if (!isNaN(computedAge) && computedAge >= 10 && computedAge <= 110) {
            age = computedAge;
        }
    }

    // Determinar peso y altura
    const latestMeasurement = Array.isArray(measurements) && measurements.length > 0
        ? measurements[0]
        : null;

    const weight = Number(latestMeasurement?.weight || assessment?.weight || 70);
    const height = Number(assessment?.height || 170);

    // Mapear actividad laboral a partir de daily_activity
    const dailyActivityStr = String(assessment?.daily_activity || '').toLowerCase();
    let workActivityId;

    if (dailyActivityStr.includes('inactiv') || dailyActivityStr.includes('reposo')) {
        workActivityId = 'inactiva';
    } else if (dailyActivityStr.includes('andando') || dailyActivityStr.includes('ligera') || dailyActivityStr.includes('comercial')) {
        workActivityId = 'andando';
    } else if (dailyActivityStr.includes('extra') || dailyActivityStr.includes('muy intenso')) {
        workActivityId = 'fisico_extra';
    } else if (dailyActivityStr.includes('intenso') || dailyActivityStr.includes('pesado') || dailyActivityStr.includes('obrero')) {
        workActivityId = 'fisico_intenso';
    } else if (dailyActivityStr.includes('medio') || dailyActivityStr.includes('montaje')) {
        workActivityId = 'fisico_medio';
    } else if (dailyActivityStr.includes('activo') || dailyActivityStr.includes('ligero') || dailyActivityStr.includes('mecanico')) {
        workActivityId = 'fisico_ligero';
    } else {
        workActivityId = 'oficina';
    }

    // Mapear nivel de ejercicio a partir de time_per_session y training_freq
    const sessionStr = String(assessment?.time_per_session || '').toLowerCase();
    const freqStr = String(assessment?.training_freq || '').toLowerCase();
    let exerciseId;

    if (freqStr.includes('ningun') || freqStr.includes('no entrena') || sessionStr.includes('ningun')) {
        exerciseId = 'none';
    } else if (sessionStr.includes('5 hora') || sessionStr.includes('5h')) {
        exerciseId = 'intense_5h';
    } else if (sessionStr.includes('4 hora') || sessionStr.includes('4h')) {
        exerciseId = 'intense_4h';
    } else if (sessionStr.includes('3 hora') || sessionStr.includes('3h')) {
        exerciseId = 'intense_3h';
    } else if (sessionStr.includes('2 hora') || sessionStr.includes('2h')) {
        exerciseId = 'intense_2h';
    } else if (sessionStr.includes('1.5') || sessionStr.includes('media') || sessionStr.includes('90 min')) {
        exerciseId = 'intense_1_5h';
    } else if (sessionStr.includes('suave') || sessionStr.includes('ligero') || sessionStr.includes('30 min') || sessionStr.includes('45 min')) {
        exerciseId = 'light_1h';
    } else {
        exerciseId = 'intense_1h';
    }

    // Mapear objetivo dietético a partir de goals
    const goalsStr = String(assessment?.goals || '').toLowerCase();
    let goalId;

    if (goalsStr.includes('severa')) {
        goalId = 'restriccion_severa';
    } else if (goalsStr.includes('defin')) {
        goalId = 'definicion';
    } else if (goalsStr.includes('perder') || goalsStr.includes('grasa') || goalsStr.includes('adelgazar') || goalsStr.includes('bajar peso')) {
        goalId = 'bajada_peso';
    } else if (goalsStr.includes('ligera')) {
        goalId = 'bajada_ligera';
    } else if (goalsStr.includes('hipertrofia') || goalsStr.includes('masa muscular')) {
        goalId = 'hipertrofia';
    } else if (goalsStr.includes('carga')) {
        goalId = 'carga_hc';
    } else if (goalsStr.includes('aumento') || goalsStr.includes('ganar') || goalsStr.includes('subir peso')) {
        goalId = 'aumento_peso';
    } else {
        goalId = 'mantenimiento';
    }

    const deviationId = 'normal';
    const restrictions = assessment?.food_restrictions || assessment?.medical_restrictions || '';
    const currentDiet = assessment?.current_diet || '';

    return {
        clientName,
        sex,
        age,
        weight,
        height,
        workActivityId,
        exerciseId,
        goalId,
        deviationId,
        restrictions,
        currentDiet,
    };
}
