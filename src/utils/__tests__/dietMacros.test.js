import { describe, it, expect } from 'vitest';
import {
    emptyMacros,
    sumMacros,
    foodMacros,
    recipeTotalMacros,
    recipeServingMacros,
    itemMacros,
    slotMacros,
    dayMacros,
    formatMacros,
    deduplicateIngredients,
} from '../dietMacros.js';

const FOOD = { calories: 200, protein: 20, carbs: 10, fat: 5, fiber: 2 };

describe('emptyMacros', () => {
    it('devuelve macros a cero', () => {
        expect(emptyMacros()).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    });

    it('devuelve una copia nueva en cada llamada', () => {
        const a = emptyMacros();
        a.calories = 999;
        expect(emptyMacros().calories).toBe(0);
    });
});

describe('sumMacros', () => {
    it('suma una lista de macros', () => {
        const result = sumMacros([
            { calories: 100, protein: 10, carbs: 5, fat: 2, fiber: 1 },
            { calories: 200, protein: 20, carbs: 10, fat: 4, fiber: 2 },
        ]);
        expect(result).toEqual({ calories: 300, protein: 30, carbs: 15, fat: 6, fiber: 3 });
    });

    it('tolera entradas nulas o incompletas', () => {
        const result = sumMacros([null, { calories: 100 }, undefined]);
        expect(result.calories).toBe(100);
        expect(result.protein).toBe(0);
    });
});

describe('foodMacros', () => {
    it('escala los macros según la cantidad en gramos', () => {
        expect(foodMacros(FOOD, 250)).toEqual({ calories: 500, protein: 50, carbs: 25, fat: 12.5, fiber: 5 });
    });

    it('devuelve macros vacíos sin alimento o sin cantidad', () => {
        expect(foodMacros(null, 100)).toEqual(emptyMacros());
        expect(foodMacros(FOOD, 0)).toEqual(emptyMacros());
    });
});

describe('recipeTotalMacros', () => {
    it('suma los ingredientes mapeados', () => {
        const recipe = {
            ingredients: [
                { food: FOOD, quantity_g: 100 },
                { food: FOOD, quantity_g: 200 },
            ],
        };
        expect(recipeTotalMacros(recipe).calories).toBe(600);
    });

    it('acepta el embed crudo de Supabase (recipe_food)', () => {
        const recipe = { recipe_food: [{ food: FOOD, quantity_g: 100 }] };
        expect(recipeTotalMacros(recipe).calories).toBe(200);
    });
});

describe('recipeServingMacros', () => {
    const recipe = { servings: 2, ingredients: [{ food: FOOD, quantity_g: 100 }] };

    it('divide el total entre las raciones', () => {
        expect(recipeServingMacros(recipe).calories).toBe(100);
    });

    it('asume 1 ración si servings es 0 o ausente', () => {
        expect(recipeServingMacros({ ...recipe, servings: 0 }).calories).toBe(200);
    });
});

describe('itemMacros', () => {
    it('calcula macros de un ítem con alimento', () => {
        expect(itemMacros({ food: FOOD, quantity_g: 100 }).calories).toBe(200);
    });

    it('calcula macros de un ítem con receta', () => {
        const item = {
            servings: 2,
            recipe: { servings: 2, ingredients: [{ food: FOOD, quantity_g: 200 }] },
        };
        expect(itemMacros(item).calories).toBe(400);
    });

    it('devuelve macros vacíos para un ítem sin food ni recipe', () => {
        expect(itemMacros({})).toEqual(emptyMacros());
    });
});

describe('slotMacros y dayMacros', () => {
    const slot = { items: [{ food: FOOD, quantity_g: 100 }, { food: FOOD, quantity_g: 100 }] };

    it('slotMacros suma los ítems de la comida', () => {
        expect(slotMacros(slot).calories).toBe(400);
    });

    it('dayMacros suma las comidas del día', () => {
        expect(dayMacros({ slots: [slot, slot] }).calories).toBe(800);
    });

    it('toleran slots/items ausentes', () => {
        expect(dayMacros({}).calories).toBe(0);
        expect(slotMacros({}).calories).toBe(0);
    });
});

describe('formatMacros', () => {
    it('formatea con una cifra decimal', () => {
        expect(formatMacros({ calories: 520.4, protein: 32.45, carbs: 55, fat: 18 }))
            .toBe('520 kcal · P 32.5 g · C 55 g · F 18 g');
    });

    it('devuelve guion largo si no hay macros', () => {
        expect(formatMacros(null)).toBe('—');
    });
});

describe('deduplicateIngredients', () => {
    it('elimina ingredientes duplicados por food.id', () => {
        const raw = [
            { food_id: 1, food: { id: 1, name: 'Avena' }, quantity_g: 60 },
            { food_id: 2, food: { id: 2, name: 'Claras' }, quantity_g: 180 },
            { food_id: 1, food: { id: 1, name: 'Avena' }, quantity_g: 60 },
        ];
        const result = deduplicateIngredients(raw);
        expect(result).toHaveLength(2);
        expect(result.map(i => i.food_id)).toEqual([1, 2]);
    });

    it('elimina duplicados por nombre de alimento normalizado si no hay id', () => {
        const raw = [
            { food: { name: '  Copos de Avena Integrales  ' }, quantity_g: 50 },
            { food: { name: 'copos de avena integrales' }, quantity_g: 50 },
            { food: { name: 'Plátano' }, quantity_g: 100 },
        ];
        const result = deduplicateIngredients(raw);
        expect(result).toHaveLength(2);
        expect(result[0].food.name).toBe('  Copos de Avena Integrales  ');
        expect(result[1].food.name).toBe('Plátano');
    });

    it('retorna array vacío ante entradas nulas o vacías', () => {
        expect(deduplicateIngredients(null)).toEqual([]);
        expect(deduplicateIngredients(undefined)).toEqual([]);
        expect(deduplicateIngredients([])).toEqual([]);
    });

    it('evita cálculo duplicado de calorías en recipeTotalMacros cuando hay filas duplicadas', () => {
        const foodAvena = { id: 10, name: 'Avena', calories: 370, protein: 13, carbs: 60, fat: 7 };
        const foodClaras = { id: 11, name: 'Claras', calories: 50, protein: 11, carbs: 1, fat: 0 };
        const recipeWithDups = {
            name: 'Tortitas de avena',
            ingredients: [
                { food: foodAvena, food_id: 10, quantity_g: 100 },
                { food: foodClaras, food_id: 11, quantity_g: 100 },
                // Duplicados
                { food: foodAvena, food_id: 10, quantity_g: 100 },
                { food: foodClaras, food_id: 11, quantity_g: 100 },
            ],
        };
        const total = recipeTotalMacros(recipeWithDups);
        // Debe ser 370 + 50 = 420 kcal, NO 840 kcal
        expect(total.calories).toBe(420);
    });
});
