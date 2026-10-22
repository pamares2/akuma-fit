/**
 * Utilidades para generar la Lista de la Compra Semanal a partir de la Dieta ANEF.
 */

const CATEGORY_MAP = {
    // Proteínas
    pollo: 'Carnes, Pescados y Proteínas',
    pavo: 'Carnes, Pescados y Proteínas',
    ternera: 'Carnes, Pescados y Proteínas',
    atún: 'Carnes, Pescados y Proteínas',
    salmón: 'Carnes, Pescados y Proteínas',
    merluza: 'Carnes, Pescados y Proteínas',
    huevo: 'Lácteos y Huevos',
    clara: 'Lácteos y Huevos',
    whey: 'Suplementación y Proteínas',
    proteína: 'Suplementación y Proteínas',

    // Carbohidratos
    arroz: 'Cereales y Carbohidratos',
    avena: 'Cereales y Carbohidratos',
    pasta: 'Cereales y Carbohidratos',
    patata: 'Cereales y Carbohidratos',
    boniato: 'Cereales y Carbohidratos',
    batata: 'Cereales y Carbohidratos',
    pan: 'Cereales y Carbohidratos',
    tortitas: 'Cereales y Carbohidratos',
    garbanzos: 'Legumbres y Granos',
    lentejas: 'Legumbres y Granos',

    // Grasas
    aceite: 'Grasas y Aceites',
    aove: 'Grasas y Aceites',
    aguacate: 'Grasas y Frutas',
    cacahuete: 'Frutos Secos y Semillas',
    almendra: 'Frutos Secos y Semillas',
    nuez: 'Frutos Secos y Semillas',
    nueces: 'Frutos Secos y Semillas',

    // Frutas y Verduras
    plátano: 'Frutas y Verduras',
    fresa: 'Frutas y Verduras',
    arándano: 'Frutas y Verduras',
    tomate: 'Frutas y Verduras',
    brócoli: 'Frutas y Verduras',
    espinaca: 'Frutas y Verduras',
    espárrago: 'Frutas y Verduras',
    calabacín: 'Frutas y Verduras',
    pimiento: 'Frutas y Verduras',

    // Lácteos
    yogur: 'Lácteos y Huevos',
    cottage: 'Lácteos y Huevos',
    queso: 'Lácteos y Huevos',
    leche: 'Lácteos y Huevos',
};

function detectCategory(name) {
    const lower = (name || '').toLowerCase();
    for (const [key, category] of Object.entries(CATEGORY_MAP)) {
        if (lower.includes(key)) return category;
    }
    return 'Otros Alimentos';
}

/**
 * Genera la lista de la compra agregada a partir de un plan nutricional (Meal Plan).
 *
 * @param {Object} mealPlan - Plan nutricional con días (`days`), comidas (`slots`) e ingredientes (`items`).
 * @returns {Array<{category: string, items: Array<{name: string, totalGrams: number, unit: string}>}>}
 */
export function generateShoppingList(mealPlan) {
    if (!mealPlan || !mealPlan.days) return [];

    const aggregation = {};

    for (const day of mealPlan.days || []) {
        for (const slot of day.slots || []) {
            for (const item of slot.items || []) {
                if (item.food) {
                    const name = item.food.name || 'Alimento';
                    const grams = Number(item.quantity) || 100;
                    aggregation[name] = (aggregation[name] || 0) + grams;
                } else if (item.recipe && item.recipe.ingredients) {
                    const portions = Number(item.quantity) || 1;
                    for (const ing of item.recipe.ingredients) {
                        const name = ing.food?.name || ing.name || 'Ingrediente';
                        const grams = (Number(ing.quantity_g) || 100) * portions;
                        aggregation[name] = (aggregation[name] || 0) + grams;
                    }
                }
            }
        }
    }

    const categoriesMap = {};

    for (const [foodName, grams] of Object.entries(aggregation)) {
        const cat = detectCategory(foodName);
        if (!categoriesMap[cat]) {
            categoriesMap[cat] = [];
        }
        categoriesMap[cat].push({
            name: foodName,
            totalGrams: Math.round(grams),
            displayQuantity: grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${Math.round(grams)} g`,
        });
    }

    const sortedCategories = Object.keys(categoriesMap).sort().map((category) => ({
        category,
        items: categoriesMap[category].sort((a, b) => a.name.localeCompare(b.name)),
    }));

    return sortedCategories;
}

/**
 * Formatea la lista de la compra en texto plano para copiar a WhatsApp o Notas.
 */
export function formatShoppingListText(categories) {
    if (!categories || categories.length === 0) return 'Lista de la compra vacía.';

    let text = '🛒 LISTA DE LA COMPRA SEMANAL — AKUMA FIT 🛒\n\n';

    for (const cat of categories) {
        text += `📌 ${cat.category.toUpperCase()}:\n`;
        for (const item of cat.items) {
            text += `  [ ] ${item.name}: ${item.displayQuantity}\n`;
        }
        text += '\n';
    }

    text += 'Generado con Akuma Fit — Nutrición ANEF';
    return text;
}
