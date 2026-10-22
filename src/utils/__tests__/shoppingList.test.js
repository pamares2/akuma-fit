import { describe, it, expect } from 'vitest';
import { generateShoppingList, formatShoppingListText } from '../shoppingList.js';

describe('shoppingList - Generación de Lista de la Compra Semanal', () => {
    it('agrega correctamente alimentos individuales en días y comidas', () => {
        const dummyMealPlan = {
            days: [
                {
                    slots: [
                        {
                            items: [
                                { food: { name: 'Pechuga de Pollo' }, quantity: 200 },
                                { food: { name: 'Arroz Blanco' }, quantity: 100 },
                            ],
                        },
                    ],
                },
                {
                    slots: [
                        {
                            items: [
                                { food: { name: 'Pechuga de Pollo' }, quantity: 150 },
                                { food: { name: 'AOVE' }, quantity: 15 },
                            ],
                        },
                    ],
                },
            ],
        };

        const list = generateShoppingList(dummyMealPlan);
        expect(list.length).toBeGreaterThan(0);

        const proteinCat = list.find(c => c.category.includes('Carnes'));
        expect(proteinCat).toBeDefined();

        const pollo = proteinCat.items.find(i => i.name === 'Pechuga de Pollo');
        expect(pollo.totalGrams).toBe(350);
        expect(pollo.displayQuantity).toBe('350 g');
    });

    it('formatea texto para portapapeles con formato checklist', () => {
        const dummy = [
            {
                category: 'Carnes, Pescados y Proteínas',
                items: [{ name: 'Salmón', displayQuantity: '1.20 kg' }],
            },
        ];
        const text = formatShoppingListText(dummy);
        expect(text).toContain('LISTA DE LA COMPRA');
        expect(text).toContain('[ ] Salmón: 1.20 kg');
    });
});
