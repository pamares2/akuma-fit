const EMPTY_MACROS = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

/**
 * Devuelve un objeto de macros con todos los valores a cero. Devuelve una
 * copia nueva en cada llamada para evitar mutaciones compartidas.
 *
 * @returns {{calories: number, protein: number, carbs: number, fat: number, fiber: number}} Macros a cero.
 */
export function emptyMacros() {
    return { ...EMPTY_MACROS };
}

/**
 * Suma una lista de objetos de macros en uno solo, tolerando entradas nulas
 * o incompletas (los valores ausentes se tratan como 0).
 *
 * @param {Array<Object|null>} macrosList - Lista de objetos de macros.
 * @returns {{calories: number, protein: number, carbs: number, fat: number, fiber: number}} Suma total.
 */
export function sumMacros(macrosList) {
    return macrosList.reduce((acc, macros) => ({
        calories: acc.calories + (macros?.calories || 0),
        protein: acc.protein + (macros?.protein || 0),
        carbs: acc.carbs + (macros?.carbs || 0),
        fat: acc.fat + (macros?.fat || 0),
        fiber: acc.fiber + (macros?.fiber || 0),
    }), { ...EMPTY_MACROS });
}

/**
 * Escala un objeto de macros multiplicando cada valor por un factor.
 *
 * @param {{calories: number, protein: number, carbs: number, fat: number, fiber: number}} macros - Macros a escalar.
 * @param {number} factor - Factor de escala.
 * @returns {{calories: number, protein: number, carbs: number, fat: number, fiber: number}} Macros escalados.
 */
function scaleMacros(macros, factor) {
    return {
        calories: macros.calories * factor,
        protein: macros.protein * factor,
        carbs: macros.carbs * factor,
        fat: macros.fat * factor,
        fiber: macros.fiber * factor,
    };
}

/**
 * Calcula los macros de un alimento para una cantidad en gramos. Los valores
 * de la tabla del alimento están expresados por 100 g.
 *
 * @param {Object|null} food - Alimento con campos `calories`, `protein`, `carbs`, `fat`, `fiber`.
 * @param {number} quantityG - Cantidad en gramos.
 * @returns {{calories: number, protein: number, carbs: number, fat: number, fiber: number}} Macros calculados.
 */
export function foodMacros(food, quantityG) {
    if (!food || !quantityG) return { ...EMPTY_MACROS };
    return scaleMacros({
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        fiber: food.fiber || 0,
    }, quantityG / 100);
}

/**
 * Elimina ingredientes duplicados de una receta para garantizar que cada alimento
 * aparezca una única vez, evitando que se muestren o calculen dos veces los gramos
 * y macronutrientes.
 *
 * Identifica duplicados por `food.id` (o `food_id`), o por nombre de alimento normalizado.
 *
 * @param {Array<Object>} [ingredients] - Lista cruda de ingredientes.
 * @returns {Array<Object>} Lista de ingredientes únicos sin duplicidades.
 */
export function deduplicateIngredients(ingredients) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) return [];

    const seen = new Set();
    const result = [];

    for (const ing of ingredients) {
        if (!ing) continue;
        const foodId = ing.food_id || ing.food?.id;
        const foodName = ing.food?.name
            ? String(ing.food.name).toLowerCase().trim()
            : (ing.name ? String(ing.name).toLowerCase().trim() : null);

        const key = foodId != null
            ? `id:${foodId}`
            : (foodName ? `name:${foodName}` : null);

        if (!key) {
            result.push(ing);
            continue;
        }

        if (!seen.has(key)) {
            seen.add(key);
            result.push(ing);
        }
    }

    return result;
}

/**
 * Calcula los macros totales de una receta sumando sus ingredientes. Acepta
 * tanto `recipe.ingredients` como el embed crudo `recipe.recipe_food` de
 * Supabase, deduplicando ingredientes para evitar cálculos dobles.
 *
 * @param {Object} recipe - Receta con ingredientes.
 * @returns {{calories: number, protein: number, carbs: number, fat: number, fiber: number}} Macros totales.
 */
export function recipeTotalMacros(recipe) {
    const raw = recipe?.ingredients
        || (recipe?.recipe_food || []).map(rel => rel);
    const ingredients = deduplicateIngredients(raw);

    return sumMacros(ingredients.map(ingredient => foodMacros(ingredient.food, ingredient.quantity_g)));
}

/**
 * Calcula los macros por ración de una receta, asumiendo 1 ración si
 * `servings` es 0 o está ausente.
 *
 * @param {Object} recipe - Receta.
 * @returns {{calories: number, protein: number, carbs: number, fat: number, fiber: number}} Macros por ración.
 */
export function recipeServingMacros(recipe) {
    const servings = recipe.servings && recipe.servings > 0 ? recipe.servings : 1;
    return scaleMacros(recipeTotalMacros(recipe), 1 / servings);
}

/**
 * Calcula los macros de un ítem de plan, ya sea con alimento (cantidad en
 * gramos) o con receta (número de raciones). Devuelve macros a cero si el
 * ítem no tiene ni `food` ni `recipe`.
 *
 * @param {Object} item - Ítem con `food` y `quantity_g`, o `recipe` y `servings`.
 * @returns {{calories: number, protein: number, carbs: number, fat: number, fiber: number}} Macros del ítem.
 */
export function itemMacros(item) {
    if (item.food) {
        return foodMacros(item.food, item.quantity_g);
    }

    if (item.recipe) {
        const servings = item.servings && item.servings > 0 ? item.servings : 1;
        return scaleMacros(recipeServingMacros(item.recipe), servings);
    }

    return { ...EMPTY_MACROS };
}

/**
 * Suma los macros de todos los ítems de una comida (slot).
 *
 * @param {Object} slot - Comida con una lista `items`.
 * @returns {{calories: number, protein: number, carbs: number, fat: number, fiber: number}} Macros de la comida.
 */
export function slotMacros(slot) {
    return sumMacros((slot.items || []).map(itemMacros));
}

/**
 * Suma los macros de todas las comidas (slots) de un día.
 *
 * @param {Object} day - Día con una lista `slots`.
 * @returns {{calories: number, protein: number, carbs: number, fat: number, fiber: number}} Macros del día.
 */
export function dayMacros(day) {
    return sumMacros((day.slots || []).map(slotMacros));
}

/**
 * Formatea un objeto de macros a una cadena legible
 * (`520 kcal · P 32.5 g · C 55 g · F 18 g`). Devuelve `—` si `macros` es nulo.
 *
 * @param {Object|null} macros - Macros a formatear.
 * @returns {string} Representación legible de los macros.
 */
export function formatMacros(macros) {
    if (!macros) return '—';

    const round = (value) => Math.round((value || 0) * 10) / 10;

    return `${Math.round(macros.calories || 0)} kcal · P ${round(macros.protein)} g`
        + ` · C ${round(macros.carbs)} g · F ${round(macros.fat)} g`;
}
