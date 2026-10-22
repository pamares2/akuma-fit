import { describe, it, expect, vi } from 'vitest';
import { DEFAULT_RECIPES, RECIPE_CATEGORIES } from '../../data/defaultRecipes.js';
import { recipeServingMacros, recipeTotalMacros } from '../../utils/dietMacros.js';

vi.mock('../../supabaseClient.js', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
                })),
            })),
        })),
    },
}));

import { recipeService } from '../recipeService.js';

describe('Catálogo integrado de recetas y recipeService', () => {
    it('incluye al menos 16 recetas completas con ingredientes, instrucciones y macros válidos', () => {
        expect(DEFAULT_RECIPES.length).toBeGreaterThanOrEqual(16);
        expect(RECIPE_CATEGORIES).toContain('Desayuno');
        expect(RECIPE_CATEGORIES).toContain('Comida');
        expect(RECIPE_CATEGORIES).toContain('Cena');

        for (const recipe of DEFAULT_RECIPES) {
            expect(recipe.name).toBeTruthy();
            expect(recipe.instructions).toBeTruthy();
            expect(recipe.ingredients.length).toBeGreaterThan(0);

            const total = recipeTotalMacros(recipe);
            const serving = recipeServingMacros(recipe);
            expect(total.calories).toBeGreaterThan(100);
            expect(serving.protein).toBeGreaterThan(5);
        }
    });

    it('recipeService.getAll devuelve las recetas integradas y permite filtrar por categoría y texto', async () => {
        const all = await recipeService.getAll();
        expect(all.length).toBeGreaterThanOrEqual(16);

        const breakfasts = await recipeService.getAll({ category: 'Desayuno' });
        expect(breakfasts.length).toBeGreaterThanOrEqual(3);
        expect(breakfasts.every(r => r.category === 'Desayuno')).toBe(true);

        const byIngredient = await recipeService.getAll({ text: 'salmón' });
        expect(byIngredient.length).toBeGreaterThanOrEqual(1);
    });

    it('recipeService.getById resuelve recetas del catálogo por defecto', async () => {
        const first = DEFAULT_RECIPES[0];
        const loaded = await recipeService.getById(first.id);
        expect(loaded.name).toBe(first.name);
        expect(loaded.ingredients.length).toBe(first.ingredients.length);
    });
});
