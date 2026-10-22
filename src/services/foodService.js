import { supabase, publicSupabase } from '../supabaseClient.js';
import { getCurrentProfile } from '../utils/auth.js';
import { DEFAULT_RECIPE_FOODS } from '../config/defaultRecipes.js';

const FOOD_SELECT = '*, food_has_tag(tag(id, name, category))';

/**
 * Campos numéricos del alimento que se normalizan antes de insertar.
 */
const NUMERIC_FIELDS = ['calories', 'protein', 'carbs', 'fat', 'fiber'];

/**
 * Convierte la fila de Supabase en un alimento con su lista de etiquetas
 * (`tags`), quitando el embed crudo `food_has_tag`.
 *
 * @param {Object} food - Fila de `food` con `food_has_tag`.
 * @returns {Object} Alimento con `tags`.
 */
function mapFood(food) {
    const tags = food.tags || (food.food_has_tag || []).map(rel => rel.tag).filter(Boolean);
    const rest = { ...food };
    delete rest.food_has_tag;
    return { ...rest, tags };
}

function deduplicateFoods(foods) {
    const byName = new Map();
    for (const food of foods) {
        const key = (food.name || '').trim().toLowerCase();
        if (!key) continue;
        const existing = byName.get(key);
        if (!existing || (existing.id < 0 && food.id > 0)) {
            byName.set(key, food);
        }
    }
    return Array.from(byName.values());
}

/**
 * Construye el payload de inserción/actualización de un alimento a partir de
 * sus datos en camelCase.
 *
 * @param {Object} foodData - Datos del alimento.
 * @param {number} [createdBy] - Id del creador (solo en creación).
 * @returns {Object} Payload para Supabase.
 */
function buildPayload(foodData, createdBy) {
    return {
        name: foodData.name,
        brand: foodData.brand || null,
        calories: foodData.calories ?? null,
        protein: foodData.protein ?? null,
        carbs: foodData.carbs ?? null,
        fat: foodData.fat ?? null,
        fiber: foodData.fiber ?? null,
        serving_size: foodData.serving_size || null,
        ...(createdBy ? { created_by: createdBy } : {}),
    };
}

/**
 * Sincroniza las etiquetas de un alimento: borra las actuales e inserta las
 * indicadas en `tagIds`.
 *
 * @param {number} foodId - Id del alimento.
 * @param {number[]} tagIds - Ids de etiquetas.
 */
async function syncFoodTags(foodId, tagIds) {
    const { error: deleteError } = await supabase
        .from('food_has_tag')
        .delete()
        .eq('food_id', foodId);

    if (deleteError) throw new Error(deleteError.message);

    if (tagIds.length > 0) {
        const { error: insertError } = await supabase
            .from('food_has_tag')
            .insert(tagIds.map(tagId => ({ food_id: foodId, tag_id: tagId })));

        if (insertError) throw new Error(insertError.message);
    }
}

/**
 * Servicio de acceso a datos de los alimentos (`food`) y sus etiquetas.
 */
export const foodService = {
    /**
     * Obtiene los alimentos con sus etiquetas, opcionalmente filtrados por
     * texto y etiquetas.
     *
     * @param {Object} [filters] - Filtros (`text`, `tagIds`).
     * @returns {Promise<Array>} Lista de alimentos.
     */
    async getAll(filters = {}) {
        let query = supabase
            .from('food')
            .select(FOOD_SELECT)
            .order('name');

        if (filters.text) {
            query = query.or(`name.ilike.%${filters.text}%,brand.ilike.%${filters.text}%`);
        }

        if (filters.tagIds && filters.tagIds.length > 0) {
            query = query.in('food_has_tag.tag', filters.tagIds);
        }

        let { data, error } = await query;

        if (error || !data || data.length === 0) {
            let pubQuery = publicSupabase.from('food').select(FOOD_SELECT).order('name');
            if (filters.text) {
                pubQuery = pubQuery.or(`name.ilike.%${filters.text}%,brand.ilike.%${filters.text}%`);
            }
            const pubRes = await pubQuery;
            if (!pubRes.error && pubRes.data && pubRes.data.length > 0) {
                data = pubRes.data;
                error = null;
            }
        }

        if (error) throw new Error(error.message);

        let mapped = deduplicateFoods((data || []).map(mapFood));

        if (mapped.length === 0) {
            mapped = DEFAULT_RECIPE_FOODS.map(f => ({ ...f, tags: [] }));
            if (filters.text) {
                const needle = filters.text.toLowerCase();
                mapped = mapped.filter(
                    f => f.name.toLowerCase().includes(needle)
                        || (f.brand && f.brand.toLowerCase().includes(needle))
                );
            }
        }

        return mapped;
    },

    /**
     * Obtiene un alimento por id con sus etiquetas.
     *
     * @param {number} foodId - Id del alimento.
     * @returns {Promise<Object>} Alimento.
     */
    async getById(foodId) {
        if (Number(foodId) < 0) {
            const fallback = DEFAULT_RECIPE_FOODS.find(f => f.id === Number(foodId));
            if (fallback) return { ...fallback, tags: [] };
        }

        const { data, error } = await supabase
            .from('food')
            .select(FOOD_SELECT)
            .eq('id', foodId)
            .single();

        if (error) throw new Error(error.message);
        return mapFood(data);
    },

    /**
     * Crea un alimento (opcionalmente con etiquetas) para el perfil actual.
     *
     * @param {Object} foodData - Datos del alimento.
     * @param {number[]} [tagIds] - Ids de etiquetas.
     * @returns {Promise<Object>} Alimento creado.
     */
    async create(foodData, tagIds = []) {
        const profile = await getCurrentProfile();

        const { data: food, error } = await supabase
            .from('food')
            .insert(buildPayload(foodData, profile.id))
            .select()
            .single();

        if (error) throw new Error(error.message);

        if (tagIds.length > 0) {
            await syncFoodTags(food.id, tagIds);
        }

        return food;
    },

    /**
     * Crea varios alimentos a la vez (importación masiva).
     *
     * @param {Array<Object>} items - Lista de alimentos a crear.
     */
    async createBulk(items) {
        const profile = await getCurrentProfile();

        const rows = items.map(item => buildPayload(item, profile.id));

        const { error } = await supabase.from('food').insert(rows);
        if (error) throw new Error(error.message);
    },

    /**
     * Actualiza un alimento y, si se indica, sus etiquetas.
     *
     * @param {number} foodId - Id del alimento.
     * @param {Object} foodData - Datos a actualizar.
     * @param {number[]} [tagIds] - Etiquetas a sincronizar.
     * @returns {Promise<Object>} Alimento actualizado.
     */
    async update(foodId, foodData, tagIds) {
        const { data, error } = await supabase
            .from('food')
            .update(buildPayload(foodData))
            .eq('id', foodId)
            .select()
            .single();

        if (error) throw new Error(error.message);

        if (tagIds !== undefined) {
            await syncFoodTags(foodId, tagIds);
        }

        return data;
    },

    /**
     * Elimina un alimento.
     *
     * @param {number} foodId - Id del alimento.
     */
    async delete(foodId) {
        const { error } = await supabase
            .from('food')
            .delete()
            .eq('id', foodId);

        if (error) throw new Error(error.message);
    },
};

export { NUMERIC_FIELDS as FOOD_NUMERIC_FIELDS };
