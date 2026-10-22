import { describe, it, expect } from 'vitest';
import { DEFAULT_RECIPES, DEFAULT_RECIPE_FOODS, DEFAULT_DIET_TAGS } from '../../config/defaultRecipes.js';
import { recipeTotalMacros, recipeServingMacros, formatMacros } from '../../utils/dietMacros.js';

describe('Catálogo de Recetas Fitness (defaultRecipes)', () => {
    it('incluye al menos 12 recetas completas con ingredientes y pasos de preparación', () => {
        expect(DEFAULT_RECIPES.length).toBeGreaterThanOrEqual(12);
        expect(DEFAULT_RECIPE_FOODS.length).toBeGreaterThanOrEqual(25);
        expect(DEFAULT_DIET_TAGS.length).toBeGreaterThanOrEqual(8);

        for (const recipe of DEFAULT_RECIPES) {
            expect(recipe.name).toBeTruthy();
            expect(recipe.description).toBeTruthy();
            expect(recipe.instructions).toBeTruthy();
            expect(recipe.servings).toBeGreaterThanOrEqual(1);
            expect(recipe.ingredients.length).toBeGreaterThanOrEqual(3);
            expect(recipe.tags.length).toBeGreaterThanOrEqual(1);
        }
    });

    it('calcula macros realistas (> 200 kcal y > 20g proteína) para cada receta fitness', () => {
        for (const recipe of DEFAULT_RECIPES) {
            const total = recipeTotalMacros(recipe);
            const perServing = recipeServingMacros(recipe);
            const formatted = formatMacros(perServing);

            expect(total.calories).toBeGreaterThan(200);
            expect(perServing.protein).toBeGreaterThan(20);
            expect(formatted).toContain('kcal');
            expect(formatted).toContain('P ');
        }
    });
});
