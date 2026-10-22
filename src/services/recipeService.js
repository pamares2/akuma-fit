import { supabase } from '../supabaseClient.js';
import { getCurrentProfile } from '../utils/auth.js';
import { DEFAULT_RECIPES } from '../data/defaultRecipes.js';

const RECIPE_SELECT = `
    *,
    recipe_food(
        id,
        quantity_g,
        notes,
        food(*)
    ),
    recipe_has_tag(
        tag(id, name, category)
    )
`;

/**
 * Busca en el catálogo por defecto una receta equivalente por nombre.
 *
 * @param {string} name - Nombre de la receta.
 * @returns {Object|undefined} Receta del catálogo por defecto si coincide.
 */
function findDefaultByName(name) {
    if (!name) return undefined;
    const clean = name.toLowerCase().trim();
    return DEFAULT_RECIPES.find(r => r.name.toLowerCase().trim() === clean);
}

/**
 * Convierte la fila de Supabase en una receta con `ingredients` y `tags`,
 * quitando los embeds crudos `recipe_food` y `recipe_has_tag` y enriqueciendo
 * con metadatos del catálogo base cuando proceda.
 *
 * @param {Object} recipe - Fila de `recipe` con embeds.
 * @returns {Object} Receta con `ingredients`, `tags` y `category`.
 */
function mapRecipe(recipe) {
    const defaultMatch = findDefaultByName(recipe.name);

    const dbIngredients = (recipe.recipe_food || [])
        .filter(rel => rel.food)
        .map(rel => ({
            id: rel.id,
            food: rel.food,
            quantity_g: rel.quantity_g,
            notes: rel.notes,
        }));

    const ingredients = dbIngredients.length > 0
        ? dbIngredients
        : (defaultMatch?.ingredients || []);

    const dbTags = (recipe.recipe_has_tag || []).map(rel => rel.tag).filter(Boolean);
    const tags = dbTags.length > 0 ? dbTags : (defaultMatch?.tags || []);

    const rest = { ...recipe };
    delete rest.recipe_food;
    delete rest.recipe_has_tag;

    return {
        ...rest,
        category: rest.category || defaultMatch?.category || tags[0]?.name || 'Comida',
        instructions: rest.instructions || defaultMatch?.instructions || '',
        description: rest.description || defaultMatch?.description || '',
        preparation_time: rest.preparation_time ?? defaultMatch?.preparation_time ?? 15,
        ingredients,
        tags,
    };
}

/**
 * Filtra una lista de recetas en memoria según texto, categoría y etiquetas.
 *
 * @param {Array<Object>} recipes - Recetas a filtrar.
 * @param {Object} [filters] - Filtros (`text`, `category`, `tagIds`).
 * @returns {Array<Object>} Recetas filtradas.
 */
function filterRecipesInMemory(recipes, filters = {}) {
    let result = recipes;

    if (filters.category && filters.category !== 'Todas') {
        const catLower = filters.category.toLowerCase();
        result = result.filter(recipe => {
            if (recipe.category && recipe.category.toLowerCase() === catLower) return true;
            return (recipe.tags || []).some(tag => tag.name?.toLowerCase() === catLower);
        });
    }

    if (filters.text) {
        const q = filters.text.toLowerCase().trim();
        result = result.filter(recipe => {
            const matchName = recipe.name?.toLowerCase().includes(q);
            const matchDesc = recipe.description?.toLowerCase().includes(q);
            const matchCat = recipe.category?.toLowerCase().includes(q);
            const matchIngredient = (recipe.ingredients || []).some(
                ing => ing.food?.name?.toLowerCase().includes(q)
            );
            return matchName || matchDesc || matchCat || matchIngredient;
        });
    }

    if (filters.tagIds && filters.tagIds.length > 0) {
        result = result.filter(recipe =>
            (recipe.tags || []).some(tag => filters.tagIds.includes(tag.id))
        );
    }

    return result;
}

/**
 * Sincroniza las etiquetas de una receta: borra las actuales e inserta las
 * indicadas en `tagIds`.
 *
 * @param {number} recipeId - Id de la receta.
 * @param {number[]} tagIds - Ids de etiquetas numéricos de BD.
 */
async function syncRecipeTags(recipeId, tagIds) {
    const validTagIds = (tagIds || []).filter(id => typeof id === 'number' || !Number.isNaN(Number(id)));

    const { error: deleteError } = await supabase
        .from('recipe_has_tag')
        .delete()
        .eq('recipe_id', recipeId);

    if (deleteError) {
        console.warn('No se pudieron limpiar tags de la receta:', deleteError.message);
        return;
    }

    if (validTagIds.length > 0) {
        const { error: insertError } = await supabase
            .from('recipe_has_tag')
            .insert(validTagIds.map(tagId => ({ recipe_id: recipeId, tag_id: Number(tagId) })));

        if (insertError) {
            console.warn('No se pudieron insertar tags de la receta:', insertError.message);
        }
    }
}

/**
 * Reemplaza los ingredientes de una receta por los indicados.
 *
 * @param {number} recipeId - Id de la receta.
 * @param {Array<Object>} ingredients - Ingredientes (`food_id`, `quantity_g`, `notes`).
 */
async function setIngredients(recipeId, ingredients) {
    const { error: deleteError } = await supabase
        .from('recipe_food')
        .delete()
        .eq('recipe_id', recipeId);

    if (deleteError) throw new Error(deleteError.message);

    const validIngredients = (ingredients || []).filter(ing => ing.food_id);

    if (validIngredients.length > 0) {
        const { error: insertError } = await supabase
            .from('recipe_food')
            .insert(validIngredients.map(ingredient => ({
                recipe_id: recipeId,
                food_id: ingredient.food_id,
                quantity_g: ingredient.quantity_g,
                notes: ingredient.notes || null,
            })));

        if (insertError) throw new Error(insertError.message);
    }
}

/**
 * Resuelve o crea en `public.food` los alimentos necesarios para una lista de
 * ingredientes del catálogo.
 *
 * @param {Array<Object>} ingredients - Ingredientes con objeto `food`.
 * @param {number|null} [profileId] - Id del perfil creador.
 * @returns {Promise<Array<{food_id: number, quantity_g: number, notes: string|null}>>}
 */
async function resolveIngredientFoodIds(ingredients, profileId = null) {
    const { data: allFoods } = await supabase.from('food').select('*');
    const foodMap = new Map();

    for (const f of allFoods || []) {
        foodMap.set(f.name.toLowerCase().trim(), f);
    }

    const resolved = [];

    for (const ing of ingredients || []) {
        if (ing.food_id && typeof ing.food_id === 'number') {
            resolved.push({
                food_id: ing.food_id,
                quantity_g: Number(ing.quantity_g) || 100,
                notes: ing.notes || null,
            });
            continue;
        }

        const foodObj = ing.food;
        if (!foodObj?.name) continue;

        const cleanName = foodObj.name.toLowerCase().trim();
        let match = foodMap.get(cleanName);

        if (!match) {
            for (const [key, candidate] of foodMap.entries()) {
                if (key.includes(cleanName) || cleanName.includes(key)) {
                    match = candidate;
                    break;
                }
            }
        }

        if (!match) {
            const { data: createdFood } = await supabase
                .from('food')
                .insert({
                    name: foodObj.name,
                    brand: foodObj.brand || 'Genérico',
                    calories: foodObj.calories ?? 100,
                    protein: foodObj.protein ?? 10,
                    carbs: foodObj.carbs ?? 10,
                    fat: foodObj.fat ?? 5,
                    fiber: foodObj.fiber ?? 0,
                    serving_size: foodObj.serving_size || '100g',
                    created_by: profileId,
                })
                .select()
                .maybeSingle();

            if (createdFood) {
                match = createdFood;
                foodMap.set(cleanName, createdFood);
            }
        }

        if (match?.id) {
            resolved.push({
                food_id: match.id,
                quantity_g: Number(ing.quantity_g) || 100,
                notes: ing.notes || null,
            });
        }
    }

    return resolved;
}

/**
 * Servicio de acceso a datos de las recetas (`recipe`) con catálogo integrado
 * de recetas de dieta para el coach y sincronización automática con Supabase.
 */
export const recipeService = {
    /**
     * Obtiene las recetas con sus ingredientes y etiquetas, combinando las
     * recetas guardadas en Supabase con el catálogo nutricional integrado para
     * que el coach siempre disponga de todas las recetas de dieta.
     *
     * @param {Object} [filters] - Filtros (`text`, `category`, `tagIds`).
     * @returns {Promise<Array>} Lista de recetas.
     */
    async getAll(filters = {}) {
        let dbRecipes = [];

        try {
            let { data, error } = await supabase
                .from('recipe')
                .select(RECIPE_SELECT)
                .order('name');

            if (error) {
                const fallback = await supabase
                    .from('recipe')
                    .select('*, recipe_food(id, quantity_g, notes, food(*))')
                    .order('name');

                data = fallback.data;
            }

            if (data) {
                dbRecipes = data.map(mapRecipe);
            }
        } catch (err) {
            console.warn('Usando catálogo integrado de recetas:', err);
        }

        const existingNames = new Set(
            dbRecipes.map(r => r.name?.toLowerCase().trim()).filter(Boolean)
        );

        const catalogExtras = DEFAULT_RECIPES.filter(
            def => !existingNames.has(def.name.toLowerCase().trim())
        );

        const combined = [...dbRecipes, ...catalogExtras].sort((a, b) =>
            (a.name || '').localeCompare(b.name || '', 'es')
        );

        return filterRecipesInMemory(combined, filters);
    },

    /**
     * Obtiene una receta por id (numérico de Supabase o de catálogo `default-*`).
     *
     * @param {number|string} recipeId - Id de la receta.
     * @returns {Promise<Object>} Receta con ingredientes y etiquetas.
     */
    async getById(recipeId) {
        if (typeof recipeId === 'string' && recipeId.startsWith('default-')) {
            const found = DEFAULT_RECIPES.find(r => r.id === recipeId);
            if (found) return found;
        }

        const { data, error } = await supabase
            .from('recipe')
            .select(RECIPE_SELECT)
            .eq('id', recipeId)
            .single();

        if (error) {
            const fallbackDefault = DEFAULT_RECIPES.find(r => String(r.id) === String(recipeId));
            if (fallbackDefault) return fallbackDefault;
            throw new Error(error.message);
        }

        return mapRecipe(data);
    },

    /**
     * Garantiza que una receta del catálogo por defecto esté persistida en
     * Supabase (tabla `recipe` y `recipe_food`) antes de vincularla a un
     * `meal_plan_item` o editarla.
     *
     * @param {Object} recipe - Receta (de BD o del catálogo por defecto).
     * @returns {Promise<Object>} Receta con `id` numérico en base de datos.
     */
    async ensurePersisted(recipe) {
        if (!recipe) throw new Error('Receta inválida.');
        if (typeof recipe.id === 'number' && !recipe.isDefault) {
            return recipe;
        }

        const { data: existing } = await supabase
            .from('recipe')
            .select(RECIPE_SELECT)
            .ilike('name', recipe.name.trim())
            .limit(1)
            .maybeSingle();

        if (existing) {
            return mapRecipe(existing);
        }

        let profileId = null;
        try {
            const profile = await getCurrentProfile();
            profileId = profile?.id ?? null;
        } catch {
            // Sin sesión o perfil no requerido para catálogo base
        }

        const resolvedIngredients = await resolveIngredientFoodIds(recipe.ingredients, profileId);

        const { data: created, error } = await supabase
            .from('recipe')
            .insert({
                name: recipe.name,
                description: recipe.description || null,
                instructions: recipe.instructions || null,
                preparation_time: recipe.preparation_time ?? 15,
                servings: recipe.servings || 1,
                created_by: profileId,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        if (resolvedIngredients.length > 0) {
            await setIngredients(created.id, resolvedIngredients);
        }

        return this.getById(created.id);
    },

    /**
     * Sincroniza todas las recetas del catálogo base en la base de datos
     * Supabase para que queden almacenadas de forma permanente.
     *
     * @returns {Promise<number>} Número de recetas nuevas insertadas.
     */
    async seedCatalogToDatabase() {
        let insertedCount = 0;
        for (const defRecipe of DEFAULT_RECIPES) {
            try {
                const { data: existing } = await supabase
                    .from('recipe')
                    .select('id')
                    .ilike('name', defRecipe.name.trim())
                    .limit(1)
                    .maybeSingle();

                if (!existing) {
                    await this.ensurePersisted(defRecipe);
                    insertedCount += 1;
                }
            } catch (err) {
                console.warn(`Aviso al sincronizar receta "${defRecipe.name}":`, err.message);
            }
        }
        return insertedCount;
    },

    /**
     * Crea una receta con sus ingredientes y etiquetas.
     *
     * @param {Object} recipeData - Datos de la receta.
     * @returns {Promise<Object>} Receta creada.
     */
    async create(recipeData) {
        const profile = await getCurrentProfile();

        const { data: recipe, error } = await supabase
            .from('recipe')
            .insert({
                name: recipeData.name,
                description: recipeData.description || null,
                instructions: recipeData.instructions || null,
                preparation_time: recipeData.preparation_time ?? null,
                servings: recipeData.servings || 1,
                created_by: profile.id,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        const resolvedIngredients = await resolveIngredientFoodIds(
            recipeData.ingredients || [],
            profile.id
        );
        await setIngredients(recipe.id, resolvedIngredients);

        if ((recipeData.tagIds || []).length > 0) {
            await syncRecipeTags(recipe.id, recipeData.tagIds);
        }

        return recipe;
    },

    /**
     * Actualiza una receta y, opcionalmente, sus ingredientes y etiquetas.
     * Si la receta era del catálogo base (`default-*`), la persiste en BD.
     *
     * @param {number|string} recipeId - Id de la receta.
     * @param {Object} recipeData - Datos a actualizar.
     * @returns {Promise<Object>} Receta actualizada.
     */
    async update(recipeId, recipeData) {
        if (typeof recipeId === 'string' && recipeId.startsWith('default-')) {
            return this.create(recipeData);
        }

        const { data, error } = await supabase
            .from('recipe')
            .update({
                name: recipeData.name,
                description: recipeData.description || null,
                instructions: recipeData.instructions || null,
                preparation_time: recipeData.preparation_time ?? null,
                servings: recipeData.servings || 1,
            })
            .eq('id', recipeId)
            .select()
            .single();

        if (error) throw new Error(error.message);

        if (recipeData.ingredients !== undefined) {
            const resolvedIngredients = await resolveIngredientFoodIds(recipeData.ingredients);
            await setIngredients(recipeId, resolvedIngredients);
        }

        if (recipeData.tagIds !== undefined) {
            await syncRecipeTags(recipeId, recipeData.tagIds);
        }

        return data;
    },

    /**
     * Elimina una receta de la base de datos.
     *
     * @param {number|string} recipeId - Id de la receta.
     */
    async delete(recipeId) {
        if (typeof recipeId === 'string' && recipeId.startsWith('default-')) {
            throw new Error('Las recetas del catálogo base están integradas. Puedes editarlas para crear tu versión personalizada.');
        }

        const { error } = await supabase
            .from('recipe')
            .delete()
            .eq('id', recipeId);

        if (error) throw new Error(error.message);
    },
};
