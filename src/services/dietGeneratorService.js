import { supabase } from '../supabaseClient.js';

/**
 * Generador automático inteligente de dietas y planes de alimentación
 * a partir de macros objetivo (Kcal, Proteínas, Carbohidratos y Grasas).
 */

/**
 * Plantillas nutricionales equilibradas para deportistas por momento del día.
 */
const MEAL_TEMPLATES = {
    4: [
        {
            name: 'Desayuno',
            proteinShare: 0.28,
            carbShare: 0.32,
            fatShare: 0.25,
            carbFood: 'Copos de Avena Integrales',
            proteinFood: 'Huevo Entero Clase L',
            proteinSecondary: 'Clara de Huevo Pasteurizada',
            fatFood: 'Nueces Peladas',
            extraFood: 'Plátano',
        },
        {
            name: 'Almuerzo / Comida',
            proteinShare: 0.35,
            carbShare: 0.38,
            fatShare: 0.30,
            carbFood: 'Arroz Blanco Cocido',
            proteinFood: 'Pechuga de Pollo',
            fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
            extraFood: 'Brócoli al Vapor / Crudo',
        },
        {
            name: 'Merienda',
            proteinShare: 0.15,
            carbShare: 0.15,
            fatShare: 0.20,
            carbFood: 'Tortitas de Arroz Inflado',
            proteinFood: 'Queso Fresco Batido 0% M.G.',
            fatFood: 'Mantequilla de Cacahuete 100%',
            extraFood: 'Manzana (con piel)',
        },
        {
            name: 'Cena',
            proteinShare: 0.22,
            carbShare: 0.15,
            fatShare: 0.25,
            carbFood: 'Patata Cocida / Asada',
            proteinFood: 'Salmón Fresco',
            fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
            extraFood: 'Espinacas Frescas',
        },
    ],
    3: [
        {
            name: 'Desayuno',
            proteinShare: 0.30,
            carbShare: 0.35,
            fatShare: 0.30,
            carbFood: 'Copos de Avena Integrales',
            proteinFood: 'Huevo Entero Clase L',
            proteinSecondary: 'Clara de Huevo Pasteurizada',
            fatFood: 'Nueces Peladas',
            extraFood: 'Plátano',
        },
        {
            name: 'Comida',
            proteinShare: 0.40,
            carbShare: 0.45,
            fatShare: 0.40,
            carbFood: 'Arroz Blanco Cocido',
            proteinFood: 'Pechuga de Pollo',
            fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
            extraFood: 'Brócoli al Vapor / Crudo',
        },
        {
            name: 'Cena',
            proteinShare: 0.30,
            carbShare: 0.20,
            fatShare: 0.30,
            carbFood: 'Patata Cocida / Asada',
            proteinFood: 'Salmón Fresco',
            fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
            extraFood: 'Espinacas Frescas',
        },
    ],
    5: [
        {
            name: 'Desayuno',
            proteinShare: 0.22,
            carbShare: 0.25,
            fatShare: 0.20,
            carbFood: 'Copos de Avena Integrales',
            proteinFood: 'Huevo Entero Clase L',
            proteinSecondary: 'Clara de Huevo Pasteurizada',
            fatFood: 'Almendras Naturales / Tostadas',
            extraFood: 'Fresas Frescas',
        },
        {
            name: 'Media Mañana',
            proteinShare: 0.12,
            carbShare: 0.15,
            fatShare: 0.15,
            carbFood: 'Pan Integral 100%',
            proteinFood: 'Fiambre de Pavo (>90% carne)',
            fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
            extraFood: 'Tomate de Ensalada',
        },
        {
            name: 'Comida',
            proteinShare: 0.32,
            carbShare: 0.32,
            fatShare: 0.30,
            carbFood: 'Arroz Blanco Cocido',
            proteinFood: 'Ternera Magra (Filete/Solomillo)',
            fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
            extraFood: 'Brócoli al Vapor / Crudo',
        },
        {
            name: 'Merienda',
            proteinShare: 0.12,
            carbShare: 0.15,
            fatShare: 0.15,
            carbFood: 'Tortitas de Arroz Inflado',
            proteinFood: 'Yogur Griego Ligero 0%',
            fatFood: 'Mantequilla de Cacahuete 100%',
            extraFood: 'Plátano',
        },
        {
            name: 'Cena',
            proteinShare: 0.22,
            carbShare: 0.13,
            fatShare: 0.20,
            carbFood: 'Boniato / Batata Asada',
            proteinFood: 'Merluza Fresca / Congelada',
            fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
            extraFood: 'Espárragos Verdes',
        },
    ],
};

export const dietGeneratorService = {
    /**
     * Genera un día completo con comidas y alimentos ajustados a los macros indicados.
     *
     * @param {number} planId - Id del plan de alimentación.
     * @param {Object} options - Parámetros de generación.
     * @param {number} options.calories - Calorías objetivo totales (Kcal).
     * @param {number} options.protein - Gramos de proteína objetivo.
     * @param {number} options.carbs - Gramos de carbohidratos objetivo.
     * @param {number} options.fat - Gramos de grasa objetivo.
     * @param {number} [options.mealsCount=4] - Número de comidas (3, 4 o 5).
     * @param {string} [options.dayLabel] - Nombre del día.
     * @returns {Promise<Object>} Día creado con todas las comidas e ítems.
     */
    async generateDay(planId, { calories, protein, carbs, fat, mealsCount = 4, dayLabel }) {
        if (!planId) throw new Error('Se requiere el ID del plan de alimentación.');
        if (!calories || !protein || !carbs || !fat) {
            throw new Error('Debes indicar las Calorías (kcal), Proteínas (g), Carbohidratos (g) y Grasas (g) objetivo.');
        }

        // 1. Obtener alimentos de la base de datos
        const { data: allFoods, error: foodsError } = await supabase
            .from('food')
            .select('*');

        if (foodsError) throw new Error(`Error al leer los alimentos: ${foodsError.message}`);
        if (!allFoods || allFoods.length === 0) {
            throw new Error('No se han encontrado alimentos en la base de datos.');
        }

        const foodMap = new Map();
        for (const food of allFoods) {
            foodMap.set(food.name.toLowerCase().trim(), food);
        }

        const findFood = (searchName) => {
            const clean = searchName.toLowerCase().trim();
            if (foodMap.has(clean)) return foodMap.get(clean);
            // Búsqueda parcial si no coincide exacto
            for (const [name, food] of foodMap.entries()) {
                if (name.includes(clean) || clean.includes(name)) return food;
            }
            return allFoods[0];
        };

        const template = MEAL_TEMPLATES[mealsCount] || MEAL_TEMPLATES[4];

        // 2. Crear el día en Supabase
        const { data: existingDays } = await supabase
            .from('meal_plan_day')
            .select('day_order')
            .eq('meal_plan_id', planId)
            .order('day_order', { ascending: false })
            .limit(1);

        const nextOrder = (existingDays?.[0]?.day_order || 0) + 1;
        const finalLabel = dayLabel || `Día ${nextOrder} (${calories} kcal)`;

        const { data: newDay, error: dayError } = await supabase
            .from('meal_plan_day')
            .insert({
                meal_plan_id: planId,
                day_order: nextOrder,
                label: finalLabel,
            })
            .select()
            .single();

        if (dayError) throw new Error(`Error al crear el día: ${dayError.message}`);

        // 3. Crear cada una de las comidas (slots) y calcular las porciones
        for (let sIdx = 0; sIdx < template.length; sIdx += 1) {
            const mealConfig = template[sIdx];

            // Macros específicos asignados a esta comida
            const mealProteinTarget = protein * mealConfig.proteinShare;
            const mealCarbTarget = carbs * mealConfig.carbShare;
            const mealFatTarget = fat * mealConfig.fatShare;

            const { data: slot, error: slotError } = await supabase
                .from('meal_plan_slot')
                .insert({
                    day_id: newDay.id,
                    slot_order: sIdx + 1,
                    label: mealConfig.name,
                })
                .select()
                .single();

            if (slotError) throw new Error(`Error al crear la comida ${mealConfig.name}: ${slotError.message}`);

            // Obtener objetos de alimentos
            const carbFood = findFood(mealConfig.carbFood);
            const proteinFood = findFood(mealConfig.proteinFood);
            const fatFood = findFood(mealConfig.fatFood);
            const extraFood = mealConfig.extraFood ? findFood(mealConfig.extraFood) : null;

            const itemsToInsert = [];
            let itemOrder = 1;

            // Cálculo de gramos según densidad nutricional por 100g
            // 1. Fuente de Carbohidratos
            const carbRatio = (carbFood.carbs || 30) / 100;
            const carbGrams = Math.round(Math.max(30, Math.min(450, (mealCarbTarget * 0.75) / carbRatio)));
            itemsToInsert.push({
                slot_id: slot.id,
                item_order: itemOrder++,
                food_id: carbFood.id,
                quantity_g: carbGrams,
                notes: 'Fuente principal de energía',
            });

            // 2. Fuente de Proteína principal
            const proteinRatio = (proteinFood.protein || 20) / 100;
            const proteinGrams = Math.round(Math.max(40, Math.min(350, mealProteinTarget / proteinRatio)));
            itemsToInsert.push({
                slot_id: slot.id,
                item_order: itemOrder++,
                food_id: proteinFood.id,
                quantity_g: proteinGrams,
                notes: 'Proteína magra de alto valor biológico',
            });

            // 3. Fuente de Grasa saludable
            const fatRatio = (fatFood.fat || 50) / 100;
            const fatGrams = Math.round(Math.max(8, Math.min(60, mealFatTarget / fatRatio)));
            itemsToInsert.push({
                slot_id: slot.id,
                item_order: itemOrder++,
                food_id: fatFood.id,
                quantity_g: fatGrams,
                notes: 'Grasas cardiosaludables',
            });

            // 4. Vegetal / Fruta extra (micronutrientes y fibra)
            if (extraFood) {
                itemsToInsert.push({
                    slot_id: slot.id,
                    item_order: itemOrder++,
                    food_id: extraFood.id,
                    quantity_g: 120,
                    notes: 'Aporte de fibra y micronutrientes',
                });
            }

            // Insertar ítems calculados en la comida
            const { error: itemsError } = await supabase
                .from('meal_plan_item')
                .insert(itemsToInsert);

            if (itemsError) throw new Error(`Error al insertar alimentos de ${mealConfig.name}: ${itemsError.message}`);
        }

        return newDay;
    },
};
