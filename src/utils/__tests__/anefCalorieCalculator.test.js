import { describe, it, expect } from 'vitest';
import {
    WORK_ACTIVITY_LEVELS,
    EXERCISE_LEVELS,
    DEVIATION_CASES,
    DIET_GOALS,
    ANEF_MEAL_TYPES,
    ANEF_REFERENCE_TABLE,
    ANEF_PRACTICAL_GUIDELINES,
    calculateBMR,
    calculateActivityFactor,
    calculateBMIAndCunBae,
    calculateTargetCalories,
    getRecommendedMacrosPerKg,
    calculateStep3Macros,
    buildDefaultMeals,
    calculateStep4Distribution,
    mapClientToAnefData,
} from '../anefCalorieCalculator.js';

describe('Constantes y Tablas ANEF', () => {
    it('exporta niveles de actividad laboral válidos', () => {
        expect(Array.isArray(WORK_ACTIVITY_LEVELS)).toBe(true);
        expect(WORK_ACTIVITY_LEVELS.length).toBe(7);
        expect(WORK_ACTIVITY_LEVELS[1].id).toBe('oficina');
        expect(WORK_ACTIVITY_LEVELS[1].factor).toBe(1.3);
    });

    it('exporta niveles de ejercicio con factores acordes a ANEF', () => {
        expect(Array.isArray(EXERCISE_LEVELS)).toBe(true);
        expect(EXERCISE_LEVELS.length).toBe(9);
        expect(EXERCISE_LEVELS[0].id).toBe('none');
        expect(EXERCISE_LEVELS[3].id).toBe('intense_1h');
        expect(EXERCISE_LEVELS[3].factor).toBe(1.2);
    });

    it('exporta casos de desviación y objetivos dietéticos', () => {
        expect(DEVIATION_CASES.length).toBe(9);
        expect(DIET_GOALS.length).toBe(9);
        const def = DIET_GOALS.find(g => g.id === 'definicion');
        expect(def.pctChange).toBe(-15);
        expect(def.group).toBe('definicion');
    });

    it('exporta tipos de comida y pautas prácticas oficiales', () => {
        expect(ANEF_MEAL_TYPES).toContain('Desayuno');
        expect(ANEF_MEAL_TYPES).toContain('Post-Entreno');
        expect(ANEF_REFERENCE_TABLE.Baja.definicion.p).toBe(2.0);
        expect(ANEF_PRACTICAL_GUIDELINES.length).toBeGreaterThan(5);
    });
});

describe('calculateBMR (Mifflin-St Jeor)', () => {
    it('calcula correctamente el BMR para un hombre', () => {
        // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
        const bmr = calculateBMR({ sex: 'Hombre', weight: 80, height: 180, age: 30 });
        expect(bmr).toBe(1780);
    });

    it('calcula correctamente el BMR para una mujer (-161)', () => {
        // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 -> 1330
        const bmr = calculateBMR({ sex: 'Mujer', weight: 60, height: 165, age: 28 });
        expect(bmr).toBe(1330);
    });

    it('acepta formatos en inglés como female', () => {
        const bmr = calculateBMR({ sex: 'female', weight: 60, height: 165, age: 28 });
        expect(bmr).toBe(1330);
    });
});

describe('calculateActivityFactor', () => {
    it('combina actividad laboral y ejercicio con fórmula ANEF: work + (exercise - 1)', () => {
        // Oficina (1.3) + intense_1h (1.2) -> 1.3 + 0.2 = 1.5
        const result = calculateActivityFactor('oficina', 'intense_1h');
        expect(result.factor).toBe(1.5);
        expect(result.scaleLabel).toBe('MEDIA');
    });

    it('asigna escala BAJA a oficinista sin ejercicio', () => {
        const result = calculateActivityFactor('oficina', 'none');
        expect(result.factor).toBe(1.3);
        expect(result.scaleLabel).toBe('BAJA');
    });

    it('asigna escala INSANE a trabajo físico extremo con alto volumen de entrenamiento', () => {
        // 1.8 + (1.8 - 1) = 2.6
        const result = calculateActivityFactor('fisico_extra', 'intense_4h');
        expect(result.factor).toBe(2.6);
        expect(result.scaleLabel).toBe('INSANE');
    });

    it('permite coerción aritmética mediante valueOf', () => {
        const result = calculateActivityFactor('oficina', 'intense_1h');
        expect(Number(result)).toBe(1.5);
        expect(result * 10).toBe(15);
    });
});

describe('calculateBMIAndCunBae', () => {
    it('calcula BMI y estima porcentaje graso CUN-BAE', () => {
        const result = calculateBMIAndCunBae({ sex: 'Hombre', weight: 75, height: 175, age: 30 });
        expect(result.bmi).toBe(24.5);
        expect(result.bodyFatPct).toBeGreaterThan(10);
        expect(result.bodyFatPct).toBeLessThan(25);
        expect(result.category).toBe('Normopeso');
    });

    it('detecta categoría de sobrepeso y mayor grasa en mujer con mismo IMC', () => {
        const result = calculateBMIAndCunBae({ sex: 'Mujer', weight: 75, height: 160, age: 40 });
        expect(result.bmi).toBe(29.3);
        expect(result.category).toBe('Sobrepeso');
        expect(result.bodyFatPct).toBeGreaterThan(30);
    });
});

describe('calculateTargetCalories (Pasos 1 y 2)', () => {
    it('calcula calorías de mantenimiento base', () => {
        const result = calculateTargetCalories({
            sex: 'Hombre',
            weight: 80,
            height: 180,
            age: 30,
            workActivityId: 'oficina',
            exerciseId: 'intense_1h',
            deviationId: 'normal',
            goalId: 'mantenimiento',
        });

        // BMR = 1780, Activity = 1.5 -> TDEE = 2670
        expect(result.bmr).toBe(1780);
        expect(result.activityFactor).toBe(1.5);
        expect(result.activityScaleLabel).toBe('MEDIA');
        expect(result.tdee).toBe(2670);
        expect(result.targetCalories).toBe(2670);
    });

    it('aplica déficit en definición (-15%)', () => {
        const result = calculateTargetCalories({
            sex: 'Hombre',
            weight: 80,
            height: 180,
            age: 30,
            workActivityId: 'oficina',
            exerciseId: 'intense_1h',
            deviationId: 'normal',
            goalId: 'definicion',
        });

        // 2670 * 0.85 = 2269.5 -> 2270
        expect(result.goalPctChange).toBe(-15);
        expect(result.targetCalories).toBe(2270);
    });

    it('aplica superávit en hipertrofia (+20%) y ajuste manual', () => {
        const result = calculateTargetCalories({
            sex: 'Hombre',
            weight: 80,
            height: 180,
            age: 30,
            workActivityId: 'oficina',
            exerciseId: 'intense_1h',
            deviationId: 'normal',
            goalId: 'hipertrofia',
            manualAdjustment: 100,
        });

        // 2670 * 1.20 = 3204 + 100 = 3304
        expect(result.targetCalories).toBe(3304);
    });
});

describe('getRecommendedMacrosPerKg (Paso 3)', () => {
    it('recomienda macros para actividad media y definición', () => {
        const rec = getRecommendedMacrosPerKg({ activityFactor: 1.5, goalId: 'definicion' });
        expect(rec.proteinPerKg).toBe(2.2);
        expect(rec.fatPerKg).toBe(0.8);
        expect(rec.fiberGrams).toBe(30);
    });

    it('usa el tier Musculado si se especifica caso de desviación musculado', () => {
        const rec = getRecommendedMacrosPerKg({
            activityFactor: 1.4,
            goalId: 'definicion',
            deviationId: 'musculado',
        });
        expect(rec.proteinPerKg).toBe(2.3);
        expect(rec.fatPerKg).toBe(0.9);
    });
});

describe('calculateStep3Macros (Auto-Ajuste ANEF)', () => {
    it('cuadra carbohidratos en autoAdjust="carbs"', () => {
        const result = calculateStep3Macros({
            targetCalories: 2500,
            weight: 70,
            proteinPerKg: 2.0, // 140g = 560 kcal
            fatPerKg: 1.0, // 70g = 630 kcal
            autoAdjust: 'carbs',
        });

        // Kcal restantes para carbs: 2500 - 560 - 630 = 1310 kcal -> 1310 / 4 = 327.5 -> 328g
        expect(result.proteinGrams).toBe(140);
        expect(result.fatGrams).toBe(70);
        expect(result.carbsGrams).toBe(328);
        expect(result.totalKcal).toBe(140 * 4 + 328 * 4 + 70 * 9);
        expect(result.isNegativeAdjustment).toBe(false);
        expect(result.proteinPct + result.carbsPct + result.fatPct).toBeGreaterThanOrEqual(99);
    });

    it('cuadra proteína en autoAdjust="protein"', () => {
        const result = calculateStep3Macros({
            targetCalories: 2400,
            weight: 80,
            carbsPerKg: 3.0, // 240g = 960 kcal
            fatPerKg: 0.8, // 64g = 576 kcal
            autoAdjust: 'protein',
        });

        // Kcal restantes: 2400 - 960 - 576 = 864 kcal -> 216g proteína
        expect(result.carbsGrams).toBe(240);
        expect(result.fatGrams).toBe(64);
        expect(result.proteinGrams).toBe(216);
    });

    it('marca isNegativeAdjustment en caso de calorías insuficientes', () => {
        const result = calculateStep3Macros({
            targetCalories: 1000,
            weight: 80,
            proteinPerKg: 2.5, // 200g = 800 kcal
            fatPerKg: 1.0, // 80g = 720 kcal
            autoAdjust: 'carbs',
        });

        expect(result.isNegativeAdjustment).toBe(true);
        expect(result.carbsGrams).toBe(0);
    });
});

describe('buildDefaultMeals (Paso 4)', () => {
    it('genera 4 comidas por defecto cuyos porcentajes suman 100%', () => {
        const meals = buildDefaultMeals(4);
        expect(meals.length).toBe(4);
        const sum = meals.reduce((acc, m) => acc + m.pct, 0);
        expect(sum).toBe(100);
    });

    it('genera 5 comidas respetando el rango clamped y suma 100%', () => {
        const meals = buildDefaultMeals(5);
        expect(meals.length).toBe(5);
        const sum = meals.reduce((acc, m) => acc + m.pct, 0);
        expect(sum).toBe(100);
    });

    it('otorga plus al post-entreno y pre-entreno manteniendo suma 100%', () => {
        const meals = buildDefaultMeals(4, 1); // Comida en index 1 es post-workout
        expect(meals[1].isPostWorkout).toBe(true);
        expect(meals[1].pct).toBeGreaterThan(35);
        const sum = meals.reduce((acc, m) => acc + m.pct, 0);
        expect(sum).toBe(100);
    });
});

describe('calculateStep4Distribution', () => {
    it('reparte macronutrientes de forma cuadrada entre comidas', () => {
        const meals = buildDefaultMeals(4);
        const step3 = {
            proteinGrams: 160,
            carbsGrams: 250,
            fatGrams: 60,
            fiberGrams: 30,
            totalKcal: 2180,
        };

        const distribution = calculateStep4Distribution({
            meals,
            targetCalories: 2180,
            step3Macros: step3,
        });

        expect(distribution.length).toBe(4);

        const sumP = distribution.reduce((acc, m) => acc + m.proteinGrams, 0);
        const sumC = distribution.reduce((acc, m) => acc + m.carbsGrams, 0);
        const sumF = distribution.reduce((acc, m) => acc + m.fatGrams, 0);
        const sumFib = distribution.reduce((acc, m) => acc + m.fiberGrams, 0);
        const sumKcal = distribution.reduce((acc, m) => acc + m.kcal, 0);

        expect(sumP).toBe(step3.proteinGrams);
        expect(sumC).toBe(step3.carbsGrams);
        expect(sumF).toBe(step3.fatGrams);
        expect(sumFib).toBe(step3.fiberGrams);
        expect(sumKcal).toBe(2180);
    });

    it('prioriza carbohidratos y reduce grasas en la comida post-entreno', () => {
        const meals = buildDefaultMeals(4, 2); // Merienda es post-workout
        const step3 = {
            proteinGrams: 160,
            carbsGrams: 240,
            fatGrams: 60,
            fiberGrams: 30,
            totalKcal: 2140,
        };

        const distribution = calculateStep4Distribution({
            meals,
            targetCalories: 2140,
            step3Macros: step3,
        });

        const postMeal = distribution[2];
        expect(postMeal.isPostWorkout).toBe(true);
        // Grasas reducidas significativamente
        expect(postMeal.fatGrams).toBeLessThan(15);
    });
});

describe('mapClientToAnefData', () => {
    it('mapea correctamente perfil, valoración y mediciones al estado ANEF', () => {
        const client = {
            name: 'Carlos',
            surname: 'Gómez',
            gender: 'Hombre',
            birthdate: '1994-06-15',
        };
        const assessment = {
            height: 182,
            daily_activity: 'Trabajo de oficina sentado la mayor parte del tiempo',
            training_freq: '4 días por semana',
            time_per_session: '1 hora intensa de pesas',
            goals: 'Definición muscular y bajar grasa corporal',
            food_restrictions: 'Intolerancia a la lactosa',
            current_diet: 'Dieta mediterránea flexible',
        };
        const measurements = [
            { weight: 82.5, created_at: '2026-10-10' },
            { weight: 83.2, created_at: '2026-09-25' },
        ];

        const mapped = mapClientToAnefData({ client, assessment, measurements });

        expect(mapped.clientName).toBe('Carlos Gómez');
        expect(mapped.sex).toBe('Hombre');
        expect(mapped.weight).toBe(82.5);
        expect(mapped.height).toBe(182);
        expect(mapped.workActivityId).toBe('oficina');
        expect(mapped.exerciseId).toBe('intense_1h');
        expect(mapped.goalId).toBe('definicion');
        expect(mapped.restrictions).toBe('Intolerancia a la lactosa');
        expect(mapped.currentDiet).toBe('Dieta mediterránea flexible');
    });

    it('proporciona valores por defecto robustos ante datos vacíos o nulos', () => {
        const mapped = mapClientToAnefData({ client: null, assessment: null, measurements: [] });

        expect(mapped.clientName).toBe('Cliente');
        expect(mapped.sex).toBe('Hombre');
        expect(mapped.weight).toBe(70);
        expect(mapped.height).toBe(170);
        expect(mapped.workActivityId).toBe('oficina');
        expect(mapped.exerciseId).toBe('intense_1h');
        expect(mapped.goalId).toBe('mantenimiento');
    });
});
