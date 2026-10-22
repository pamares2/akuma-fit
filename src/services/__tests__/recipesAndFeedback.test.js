import { describe, it, expect } from 'vitest';
import { DEFAULT_RECIPES, DEFAULT_RECIPE_FOODS, DEFAULT_DIET_TAGS } from '../../config/defaultRecipes.js';
import { recipeTotalMacros, recipeServingMacros, formatMacros } from '../../utils/dietMacros.js';
import {
    feedbackService,
    FEEDBACK_TOPICS,
    DEMO_CHAT_CLIENTS,
    getCoachQuickTemplates,
} from '../feedbackService.js';

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

describe('Chat y Feedback 1 a 1 Personalizado (feedbackService)', () => {
    it('expone temas y plantillas personalizadas con el nombre del cliente', () => {
        expect(FEEDBACK_TOPICS.length).toBeGreaterThanOrEqual(4);
        const templates = getCoachQuickTemplates('Carlos');
        expect(templates.length).toBeGreaterThanOrEqual(4);
        expect(templates.some(t => t.text.includes('Carlos'))).toBe(true);
    });

    it('permite leer y enviar mensajes 1 a 1 en clientes demo interactivos', async () => {
        const demoClient = DEMO_CHAT_CLIENTS[0];
        const initial = await feedbackService.getFeedbackForClient(demoClient.id);
        expect(initial.messages.length).toBeGreaterThanOrEqual(1);

        const sent = await feedbackService.sendMessage(
            demoClient.id,
            'Ajustamos +15g de carbohidratos en el post-entreno.',
            { topic: 'dieta', overrideRole: 'coach' }
        );
        expect(sent.text).toContain('Ajustamos +15g');
        expect(sent.topic).toBe('dieta');

        const updated = await feedbackService.getFeedbackForClient(demoClient.id);
        expect(updated.messages.length).toBe(initial.messages.length + 1);
    });
});
