import { supabase } from '../supabaseClient.js';
import { DEFAULT_RECIPES } from '../data/defaultRecipes.js';
import { recipeService } from './recipeService.js';
import { recipeServingMacros, deduplicateIngredients } from '../utils/dietMacros.js';

/**
 * Generador automático inteligente de dietas y planes de alimentación
 * basado en el sistema ANEF Dietas (Pasos 1 a 5), soportando:
 * - Reparto personalizado de 3 a 8 comidas con marcaje de Post-Entreno
 * - Macros por g/kg con Auto-Ajuste
 * - Generación con Recetas de dieta elaboradas o Alimentos por gramos
 * - Generación de Dieta Principal + Equivalencias / Alternativas 1 y 2
 */

const MEAL_TEMPLATES = {
    4: [
        {
            name: 'Desayuno',
            recipeCategory: 'Desayuno',
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
            recipeCategory: 'Comida',
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
            recipeCategory: 'Merienda',
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
            recipeCategory: 'Cena',
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
            recipeCategory: 'Desayuno',
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
            recipeCategory: 'Comida',
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
            recipeCategory: 'Cena',
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
            recipeCategory: 'Desayuno',
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
            recipeCategory: 'Media Mañana',
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
            recipeCategory: 'Comida',
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
            recipeCategory: 'Merienda',
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
            recipeCategory: 'Cena',
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

/**
 * Mapea un tipo de comida ANEF a la categoría del catálogo de recetas y
 * alimentos base equivalentes (con variantes para Equivalencia 1, 2 y 3).
 *
 * @param {string} mealType - Tipo de comida ANEF.
 * @param {number} [variantIndex=0] - Índice de variante (0=Principal, 1=Eq1, 2=Eq2).
 * @returns {Object} Configuración de categoría y alimentos para esa comida.
 */
function resolveMealFoodsByType(mealType = 'Comida', variantIndex = 0) {
    const t = mealType.toLowerCase();

    const variants = {
        desayuno: [
            {
                recipeCategory: 'Desayuno',
                carbFood: 'Copos de Avena Integrales',
                proteinFood: 'Clara de Huevo Pasteurizada',
                fatFood: 'Nueces Peladas',
                extraFood: 'Plátano',
            },
            {
                recipeCategory: 'Desayuno',
                carbFood: 'Pan Integral 100%',
                proteinFood: 'Huevo Entero Clase L',
                fatFood: 'Aguacate Hass',
                extraFood: 'Tomate de Ensalada',
            },
            {
                recipeCategory: 'Desayuno',
                carbFood: 'Copos de Avena Integrales',
                proteinFood: 'Yogur Griego Ligero 0%',
                fatFood: 'Almendras Naturales / Tostadas',
                extraFood: 'Arándanos Frescos',
            },
        ],
        almuerzo: [
            {
                recipeCategory: 'Media Mañana',
                carbFood: 'Pan Integral 100%',
                proteinFood: 'Fiambre de Pavo (>90% carne)',
                fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
                extraFood: 'Tomate de Ensalada',
            },
            {
                recipeCategory: 'Media Mañana',
                carbFood: 'Tortitas de Arroz Inflado',
                proteinFood: 'Queso Cottage',
                fatFood: 'Almendras Naturales / Tostadas',
                extraFood: 'Manzana (con piel)',
            },
            {
                recipeCategory: 'Desayuno',
                carbFood: 'Copos de Avena Integrales',
                proteinFood: 'Queso Fresco Batido 0% M.G.',
                fatFood: 'Nueces Peladas',
                extraFood: 'Fresas Frescas',
            },
        ],
        comida: [
            {
                recipeCategory: 'Comida',
                carbFood: 'Arroz Blanco Cocido',
                proteinFood: 'Pechuga de Pollo',
                fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
                extraFood: 'Brócoli al Vapor / Crudo',
            },
            {
                recipeCategory: 'Comida',
                carbFood: 'Pasta Integral',
                proteinFood: 'Ternera Magra (Filete/Solomillo)',
                fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
                extraFood: 'Pimiento Rojo',
            },
            {
                recipeCategory: 'Comida',
                carbFood: 'Garbanzos Cocidos',
                proteinFood: 'Atún Claro al Natural',
                fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
                extraFood: 'Tomate de Ensalada',
            },
        ],
        merienda: [
            {
                recipeCategory: 'Merienda',
                carbFood: 'Tortitas de Arroz Inflado',
                proteinFood: 'Queso Fresco Batido 0% M.G.',
                fatFood: 'Mantequilla de Cacahuete 100%',
                extraFood: 'Plátano',
            },
            {
                recipeCategory: 'Merienda',
                carbFood: 'Copos de Avena Integrales',
                proteinFood: 'Yogur Griego Ligero 0%',
                fatFood: 'Nueces Peladas',
                extraFood: 'Fresas Frescas',
            },
            {
                recipeCategory: 'Media Mañana',
                carbFood: 'Pan Integral 100%',
                proteinFood: 'Fiambre de Pavo (>90% carne)',
                fatFood: 'Aguacate Hass',
                extraFood: 'Manzana (con piel)',
            },
        ],
        post: [
            {
                recipeCategory: 'Post-Entreno',
                carbFood: 'Plátano',
                proteinFood: 'Proteína Whey en Polvo (Concentrado)',
                fatFood: 'Almendras Naturales / Tostadas',
                extraFood: 'Copos de Avena Integrales',
            },
            {
                recipeCategory: 'Post-Entreno',
                carbFood: 'Tortitas de Arroz Inflado',
                proteinFood: 'Clara de Huevo Pasteurizada',
                fatFood: 'Mantequilla de Cacahuete 100%',
                extraFood: 'Plátano',
            },
            {
                recipeCategory: 'Merienda',
                carbFood: 'Copos de Avena Integrales',
                proteinFood: 'Queso Fresco Batido 0% M.G.',
                fatFood: 'Nueces Peladas',
                extraFood: 'Plátano',
            },
        ],
        cena: [
            {
                recipeCategory: 'Cena',
                carbFood: 'Patata Cocida / Asada',
                proteinFood: 'Salmón Fresco',
                fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
                extraFood: 'Espinacas Frescas',
            },
            {
                recipeCategory: 'Cena',
                carbFood: 'Boniato / Batata Asada',
                proteinFood: 'Merluza Fresca / Congelada',
                fatFood: 'Aceite de Oliva Virgen Extra (AOVE)',
                extraFood: 'Espárragos Verdes',
            },
            {
                recipeCategory: 'Cena',
                carbFood: 'Patata Cocida / Asada',
                proteinFood: 'Pechuga de Pavo',
                fatFood: 'Aguacate Hass',
                extraFood: 'Calabacín con Piel',
            },
        ],
    };

    let group = variants.comida;
    if (t.includes('desayuno')) group = variants.desayuno;
    else if (t.includes('almuerzo') || t.includes('mañana') || t.includes('pre-entreno')) group = variants.almuerzo;
    else if (t.includes('post')) group = variants.post;
    else if (t.includes('merienda') || t.includes('picoteo')) group = variants.merienda;
    else if (t.includes('cena') || t.includes('resop') || t.includes('noche')) group = variants.cena;

    return group[variantIndex % group.length];
}

/**
 * Selecciona una receta idónea para una categoría de comida, rotando según el
 * índice de variante para ofrecer la Dieta Principal y sus Equivalencias 1 y 2.
 *
 * @param {Array<Object>} allRecipes - Catálogo de recetas disponibles.
 * @param {string} category - Categoría buscada (`Desayuno`, `Comida`, `Cena`, etc.).
 * @param {number} variantOffset - Desplazamiento para variar la receta.
 * @returns {Object|null} Receta seleccionada.
 */
function pickRecipeForCategory(allRecipes, category, variantOffset = 0) {
    const catLower = (category || '').toLowerCase();
    let candidates = allRecipes.filter(r => {
        if (r.category?.toLowerCase() === catLower) return true;
        return (r.tags || []).some(t => t.name?.toLowerCase() === catLower);
    });

    if (candidates.length === 0 && (catLower === 'media mañana' || catLower === 'post-entreno')) {
        candidates = allRecipes.filter(r =>
            ['desayuno', 'merienda', 'media mañana', 'post-entreno'].includes(r.category?.toLowerCase())
        );
    }

    if (candidates.length > 0) {
        return candidates[variantOffset % candidates.length];
    }

    if (allRecipes.length > 0) {
        return allRecipes[variantOffset % allRecipes.length];
    }

    return null;
}

export const dietGeneratorService = {
    /**
     * Genera un día completo con comidas (con recetas elaboradas o alimentos
     * por gramos) ajustadas a los macros indicados o al reparto específico de
     * comidas del Paso 4 de ANEF Dietas.
     *
     * @param {number} planId - Id del plan de alimentación.
     * @param {Object} options - Parámetros de generación.
     * @param {number} options.calories - Calorías objetivo totales (Kcal).
     * @param {number} options.protein - Gramos de proteína objetivo.
     * @param {number} options.carbs - Gramos de carbohidratos objetivo.
     * @param {number} options.fat - Gramos de grasa objetivo.
     * @param {number} [options.mealsCount=4] - Número de comidas (3 a 8).
     * @param {'recipes'|'foods'} [options.mode='recipes'] - Modo de generación ('recipes' o 'foods').
     * @param {string} [options.dayLabel] - Nombre del día.
     * @param {Array<Object>} [options.customMeals] - Comidas calculadas en el Paso 4 de ANEF.
     * @param {number} [options.variantIndex=0] - Índice de variante (0=Principal, 1=Equivalencia 1, 2=Equivalencia 2).
     * @returns {Promise<Object>} Día creado con todas las comidas e ítems.
     */
    async generateDay(planId, {
        calories,
        protein,
        carbs,
        fat,
        mealsCount = 4,
        mode = 'recipes',
        dayLabel,
        customMeals = null,
        variantIndex = 0,
    }) {
        if (!planId) throw new Error('Se requiere el ID del plan de alimentación.');
        if (!calories || !protein || !carbs || !fat) {
            throw new Error('Debes indicar las Calorías (kcal), Proteínas (g), Carbohidratos (g) y Grasas (g) objetivo.');
        }

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
            for (const [name, food] of foodMap.entries()) {
                if (name.includes(clean) || clean.includes(name)) return food;
            }
            return allFoods[0];
        };

        const { data: existingDays } = await supabase
            .from('meal_plan_day')
            .select('day_order')
            .eq('meal_plan_id', planId)
            .order('day_order', { ascending: false })
            .limit(1);

        const nextOrder = (existingDays?.[0]?.day_order || 0) + 1;
        const finalLabel = dayLabel || `Día ${nextOrder} (${Math.round(calories)} kcal)`;

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

        let availableRecipes = DEFAULT_RECIPES;
        if (mode === 'recipes') {
            try {
                availableRecipes = await recipeService.getAll();
            } catch {
                availableRecipes = DEFAULT_RECIPES;
            }
        }

        const mealsToGenerate = Array.isArray(customMeals) && customMeals.length > 0
            ? customMeals.map((m, idx) => {
                const foodCfg = resolveMealFoodsByType(m.type || m.name || `Comida ${idx + 1}`, variantIndex);
                const slotLabel = m.isPostWorkout && !String(m.type).toLowerCase().includes('post')
                    ? `${m.type} (Post-Entreno)`
                    : (m.type || `Comida ${idx + 1}`);
                return {
                    name: slotLabel,
                    recipeCategory: m.isPostWorkout ? 'Post-Entreno' : foodCfg.recipeCategory,
                    mealCalorieTarget: m.kcal || (calories * ((m.pct || (100 / customMeals.length)) / 100)),
                    mealProteinTarget: m.proteinGrams || (protein * ((m.pct || (100 / customMeals.length)) / 100)),
                    mealCarbTarget: m.carbsGrams || (carbs * ((m.pct || (100 / customMeals.length)) / 100)),
                    mealFatTarget: m.fatGrams || (fat * ((m.pct || (100 / customMeals.length)) / 100)),
                    ...foodCfg,
                };
            })
            : (MEAL_TEMPLATES[mealsCount] || MEAL_TEMPLATES[4]).map((t) => ({
                ...t,
                mealCalorieTarget: calories * ((t.proteinShare + t.carbShare + t.fatShare) / 3),
                mealProteinTarget: protein * t.proteinShare,
                mealCarbTarget: carbs * t.carbShare,
                mealFatTarget: fat * t.fatShare,
            }));

        for (let sIdx = 0; sIdx < mealsToGenerate.length; sIdx += 1) {
            const mealConfig = mealsToGenerate[sIdx];

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

            let recipeInserted = false;

            if (mode === 'recipes') {
                const candidateRecipe = pickRecipeForCategory(
                    availableRecipes,
                    mealConfig.recipeCategory,
                    variantIndex + sIdx
                );

                if (candidateRecipe) {
                    candidateRecipe.ingredients = deduplicateIngredients(candidateRecipe.ingredients || []);
                    try {
                        const persistedRecipe = await recipeService.ensurePersisted(candidateRecipe);
                        const baseMacros = recipeServingMacros(candidateRecipe);
                        const baseKcal = baseMacros.calories || 450;
                        const rawServings = mealConfig.mealCalorieTarget / baseKcal;
                        const adjustedServings = Math.max(0.5, Math.min(3.5, Math.round(rawServings * 10) / 10));

                        const { error: recipeItemError } = await supabase
                            .from('meal_plan_item')
                            .insert({
                                slot_id: slot.id,
                                item_order: 1,
                                recipe_id: persistedRecipe.id,
                                servings: adjustedServings,
                                notes: `Objetivo comida: ${Math.round(mealConfig.mealCalorieTarget)} kcal · P ${Math.round(mealConfig.mealProteinTarget)}g · C ${Math.round(mealConfig.mealCarbTarget)}g · G ${Math.round(mealConfig.mealFatTarget)}g`,
                            });

                        if (!recipeItemError) {
                            recipeInserted = true;
                        }
                    } catch (err) {
                        console.warn(`Fallback a alimentos en ${mealConfig.name}:`, err.message);
                    }
                }
            }

            if (!recipeInserted) {
                const carbFood = findFood(mealConfig.carbFood);
                const proteinFood = findFood(mealConfig.proteinFood);
                const fatFood = findFood(mealConfig.fatFood);
                const extraFood = mealConfig.extraFood ? findFood(mealConfig.extraFood) : null;

                const itemsToInsert = [];
                let itemOrder = 1;

                const carbRatio = (carbFood.carbs || 30) / 100;
                const carbGrams = Math.round(Math.max(25, Math.min(450, (mealConfig.mealCarbTarget * 0.78) / carbRatio)));
                itemsToInsert.push({
                    slot_id: slot.id,
                    item_order: itemOrder++,
                    food_id: carbFood.id,
                    quantity_g: carbGrams,
                    notes: 'Hidrato principal (peso en crudo/preparado según tabla)',
                });

                const proteinRatio = (proteinFood.protein || 20) / 100;
                const proteinGrams = Math.round(Math.max(35, Math.min(350, mealConfig.mealProteinTarget / proteinRatio)));
                itemsToInsert.push({
                    slot_id: slot.id,
                    item_order: itemOrder++,
                    food_id: proteinFood.id,
                    quantity_g: proteinGrams,
                    notes: 'Proteína de alto valor biológico',
                });

                const fatRatio = (fatFood.fat || 50) / 100;
                const fatGrams = Math.round(Math.max(5, Math.min(60, mealConfig.mealFatTarget / fatRatio)));
                itemsToInsert.push({
                    slot_id: slot.id,
                    item_order: itemOrder++,
                    food_id: fatFood.id,
                    quantity_g: fatGrams,
                    notes: 'Grasa saludable',
                });

                if (extraFood) {
                    itemsToInsert.push({
                        slot_id: slot.id,
                        item_order: itemOrder,
                        food_id: extraFood.id,
                        quantity_g: 120,
                        notes: 'Fibra, vitaminas y minerales',
                    });
                }

                const { error: itemsError } = await supabase
                    .from('meal_plan_item')
                    .insert(itemsToInsert);

                if (itemsError) throw new Error(`Error al insertar alimentos de ${mealConfig.name}: ${itemsError.message}`);
            }
        }

        return newDay;
    },

    /**
     * Genera la dieta completa personalizada de un cliente siguiendo los 5
     * pasos de ANEF Dietas, creando la Dieta Principal y, opcionalmente, las
     * hojas de Equivalencia / Alternativa 1 y 2.
     *
     * @param {number} planId - Id del plan de alimentación.
     * @param {Object} config - Configuración calculada en los Pasos 1 a 4.
     * @returns {Promise<Array<Object>>} Días generados.
     */
    async generateAnefCompleteDiet(planId, {
        targetCalories,
        step3Macros,
        step4Meals,
        mode = 'recipes',
        includeEquivalences = true,
    }) {
        const { data: currentDays } = await supabase
            .from('meal_plan_day')
            .select('id, label, meal_plan_slot(id)')
            .eq('meal_plan_id', planId);

        for (const day of currentDays || []) {
            if (!day.meal_plan_slot || day.meal_plan_slot.length === 0) {
                await supabase.from('meal_plan_day').delete().eq('id', day.id);
            }
        }

        const baseOptions = {
            calories: Math.round(targetCalories),
            protein: Math.round(step3Macros.proteinGrams),
            carbs: Math.round(step3Macros.carbsGrams),
            fat: Math.round(step3Macros.fatGrams),
            mealsCount: step4Meals.length,
            mode,
            customMeals: step4Meals,
        };

        const generatedDays = [];

        const mainDay = await this.generateDay(planId, {
            ...baseOptions,
            dayLabel: `Dieta Principal (${Math.round(targetCalories)} kcal)`,
            variantIndex: 0,
        });
        generatedDays.push(mainDay);

        if (includeEquivalences) {
            const eq1 = await this.generateDay(planId, {
                ...baseOptions,
                dayLabel: `Equivalencia / Alternativa 1 (${Math.round(targetCalories)} kcal)`,
                variantIndex: 1,
            });
            generatedDays.push(eq1);

            const eq2 = await this.generateDay(planId, {
                ...baseOptions,
                dayLabel: `Equivalencia / Alternativa 2 (${Math.round(targetCalories)} kcal)`,
                variantIndex: 2,
            });
            generatedDays.push(eq2);
        }

        return generatedDays;
    },
};
