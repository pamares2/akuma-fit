import { supabase } from '../supabaseClient.js';
import { getCurrentProfile } from '../utils/auth.js';
import { DEFAULT_RECIPES, DEFAULT_RECIPE_FOODS, DEFAULT_DIET_TAGS } from '../config/defaultRecipes.js';

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

let autoSeedPromise = null;

/**
 * Convierte la fila de Supabase en una receta con `ingredients` y `tags`,
 * quitando los embeds crudos `recipe_food` y `recipe_has_tag`.
 *
 * @param {Object} recipe - Fila de `recipe` con embeds.
 * @returns {Object} Receta con `ingredients` y `tags`.
 */
function mapRecipe(recipe) {
    if (recipe.ingredients && recipe.tags && !recipe.recipe_food) {
        return recipe;
    }

    const ingredients = (recipe.recipe_food || [])
        .filter(rel => rel.food)
        .map(rel => ({
            id: rel.id,
            food: rel.food,
            quantity_g: rel.quantity_g,
            notes: rel.notes,
        }));

    const tags = (recipe.recipe_has_tag || []).map(rel => rel.tag).filter(Boolean);

    const rest = { ...recipe };
    delete rest.recipe_food;
    delete rest.recipe_has_tag;
    return { ...rest, ingredients, tags };
}

function deduplicateRecipes(recipes) {
    const byName = new Map();
    for (const recipe of recipes) {
        const key = (recipe.name || '').trim().toLowerCase();
        if (!key) continue;
        const existing = byName.get(key);
        if (!existing || (existing.id < 0 && recipe.id > 0) || (recipe.ingredients?.length > (existing.ingredients?.length || 0))) {
            byName.set(key, recipe);
        }
    }
    return Array.from(byName.values());
}

function filterRecipesInMemory(recipes, filters = {}) {
    let result = [...recipes];

    if (filters.text) {
        const needle = filters.text.toLowerCase().trim();
        result = result.filter(
            r => r.name.toLowerCase().includes(needle)
                || (r.description && r.description.toLowerCase().includes(needle))
        );
    }

    if (filters.tagIds && filters.tagIds.length > 0) {
        result = result.filter(r =>
            (r.tags || []).some(tag => filters.tagIds.includes(tag.id))
        );
    }

    if (filters.tagName) {
        const tagNeedle = filters.tagName.toLowerCase().trim();
        result = result.filter(r =>
            (r.tags || []).some(tag => tag.name.toLowerCase() === tagNeedle)
        );
    }

    return result;
}

/**
 * Sincroniza las etiquetas de una receta: borra las actuales e inserta las
 * indicadas en `tagIds`.
 *
 * @param {number} recipeId - Id de la receta.
 * @param {number[]} tagIds - Ids de etiquetas.
 */
async function syncRecipeTags(recipeId, tagIds) {
    const validTagIds = (tagIds || []).filter(id => Number(id) > 0);

    const { error: deleteError } = await supabase
        .from('recipe_has_tag')
        .delete()
        .eq('recipe_id', recipeId);

    if (deleteError) throw new Error(deleteError.message);

    if (validTagIds.length > 0) {
        const { error: insertError } = await supabase
            .from('recipe_has_tag')
            .insert(validTagIds.map(tagId => ({ recipe_id: recipeId, tag_id: tagId })));

        if (insertError) throw new Error(insertError.message);
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

    const validIngredients = (ingredients || []).filter(ing => Number(ing.food_id) > 0);

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
 * Garantiza que los alimentos y etiquetas base existan en Supabase e inserta
 * las recetas del catálogo fitness que aún no estén en `public.recipe`.
 *
 * @param {boolean} [forceAll=false] - Si es true, inserta cualquier receta del catálogo que falte aunque ya haya alguna creada.
 * @returns {Promise<number>} Número de recetas insertadas.
 */
async function seedCatalogRecipesInternal(forceAll = false) {
    try {
        const profile = await getCurrentProfile();
        if (!profile || profile.role !== 'coach') return 0;

        const { data: existingRecipes, error: recCheckErr } = await supabase
            .from('recipe')
            .select('id, name');

        if (recCheckErr) return 0;

        if (!forceAll && existingRecipes && existingRecipes.length > 0) {
            return 0;
        }

        const existingNames = new Set(
            (existingRecipes || []).map(r => (r.name || '').trim().toLowerCase())
        );

        const recipesToInsert = DEFAULT_RECIPES.filter(
            r => !existingNames.has(r.name.trim().toLowerCase())
        );

        if (recipesToInsert.length === 0) return 0;

        // 1. Asegurar etiquetas de dieta en `public.tag`
        const { data: allTags } = await supabase.from('tag').select('id, name, category');
        const tagMap = new Map();
        for (const t of allTags || []) {
            tagMap.set(t.name.trim().toLowerCase(), t);
        }

        for (const defaultTag of DEFAULT_DIET_TAGS) {
            const key = defaultTag.name.trim().toLowerCase();
            if (!tagMap.has(key)) {
                const { data: createdTag } = await supabase
                    .from('tag')
                    .insert({ name: defaultTag.name, category: 'dieta' })
                    .select('id, name, category')
                    .maybeSingle();
                if (createdTag) {
                    tagMap.set(key, createdTag);
                }
            }
        }

        // 2. Asegurar alimentos base en `public.food`
        const { data: allFoods } = await supabase.from('food').select('id, name');
        const foodMap = new Map();
        for (const f of allFoods || []) {
            foodMap.set(f.name.trim().toLowerCase(), f.id);
        }

        for (const defaultFood of DEFAULT_RECIPE_FOODS) {
            const key = defaultFood.name.trim().toLowerCase();
            if (!foodMap.has(key)) {
                const { data: createdFood } = await supabase
                    .from('food')
                    .insert({
                        name: defaultFood.name,
                        brand: defaultFood.brand,
                        calories: defaultFood.calories,
                        protein: defaultFood.protein,
                        carbs: defaultFood.carbs,
                        fat: defaultFood.fat,
                        fiber: defaultFood.fiber,
                        serving_size: defaultFood.serving_size,
                        created_by: profile.id,
                    })
                    .select('id, name')
                    .maybeSingle();
                if (createdFood) {
                    foodMap.set(key, createdFood.id);
                }
            }
        }

        // Helper para resolver food_id por nombre exacto o coincidencia parcial
        const resolveFoodId = (foodName) => {
            const clean = foodName.trim().toLowerCase();
            if (foodMap.has(clean)) return foodMap.get(clean);
            for (const [k, id] of foodMap.entries()) {
                if (k.includes(clean) || clean.includes(k)) return id;
            }
            return null;
        };

        // 3. Insertar cada receta con sus ingredientes y etiquetas
        let insertedCount = 0;
        for (const tpl of recipesToInsert) {
            const { data: createdRecipe, error: createErr } = await supabase
                .from('recipe')
                .insert({
                    name: tpl.name,
                    description: tpl.description,
                    instructions: tpl.instructions,
                    preparation_time: tpl.preparation_time,
                    servings: tpl.servings || 1,
                    created_by: profile.id,
                })
                .select('id')
                .single();

            if (createErr || !createdRecipe) continue;

            insertedCount += 1;

            const ingredientRows = [];
            for (const ing of tpl.ingredients || []) {
                const realFoodId = resolveFoodId(ing.food.name);
                if (realFoodId) {
                    ingredientRows.push({
                        recipe_id: createdRecipe.id,
                        food_id: realFoodId,
                        quantity_g: ing.quantity_g,
                        notes: ing.notes || null,
                    });
                }
            }

            if (ingredientRows.length > 0) {
                await supabase.from('recipe_food').insert(ingredientRows);
            }

            const tagRows = [];
            for (const tag of tpl.tags || []) {
                const realTag = tagMap.get(tag.name.trim().toLowerCase());
                if (realTag && realTag.id > 0) {
                    tagRows.push({
                        recipe_id: createdRecipe.id,
                        tag_id: realTag.id,
                    });
                }
            }

            if (tagRows.length > 0) {
                await supabase.from('recipe_has_tag').insert(tagRows);
            }
        }

        return insertedCount;
    } catch {
        return 0;
    }
}

/**
 * Servicio de acceso a datos de las recetas (`recipe`).
 */
export const recipeService = {
    /**
     * Obtiene las recetas con sus ingredientes y etiquetas, opcionalmente
     * filtradas por texto y etiquetas. Si la base de datos aún no tiene
     * recetas, las inicializa automáticamente con el catálogo fitness base.
     *
     * @param {Object} [filters] - Filtros (`text`, `tagIds`, `tagName`).
     * @returns {Promise<Array>} Lista de recetas.
     */
    async getAll(filters = {}) {
        let query = supabase
            .from('recipe')
            .select(RECIPE_SELECT)
            .order('name');

        if (filters.text) {
            query = query.ilike('name', `%${filters.text}%`);
        }

        if (filters.tagIds && filters.tagIds.length > 0) {
            query = query.in('recipe_has_tag.tag', filters.tagIds);
        }

        let { data, error } = await query;

        // Si aún no hay recetas en la BD, sembrar automáticamente el catálogo fitness una sola vez
        if (!error && (!data || data.length === 0) && !filters.text && (!filters.tagIds || filters.tagIds.length === 0)) {
            if (!autoSeedPromise) {
                autoSeedPromise = seedCatalogRecipesInternal(false).finally(() => {
                    autoSeedPromise = null;
                });
            }
            const seededCount = await autoSeedPromise;
            if (seededCount > 0) {
                const retry = await supabase.from('recipe').select(RECIPE_SELECT).order('name');
                if (!retry.error && retry.data) {
                    data = retry.data;
                }
            }
        }

        if (error) throw new Error(error.message);

        let recipes = deduplicateRecipes((data || []).map(mapRecipe));

        // Fallback en memoria si la tabla sigue vacía (p. ej. rol cliente o antes de sembrar)
        if (recipes.length === 0 && !filters.text && (!filters.tagIds || filters.tagIds.length === 0)) {
            recipes = [...DEFAULT_RECIPES];
        } else if (recipes.length === 0 && (filters.text || (filters.tagIds && filters.tagIds.length > 0))) {
            const { count } = await supabase.from('recipe').select('id', { count: 'exact', head: true });
            if (!count || count === 0) {
                recipes = filterRecipesInMemory(DEFAULT_RECIPES, filters);
            }
        }

        if (filters.tagName) {
            recipes = filterRecipesInMemory(recipes, { tagName: filters.tagName });
        }

        return recipes;
    },

    /**
     * Importa o restaura en Supabase todas las recetas del catálogo fitness
     * que no existan todavía en la base de datos.
     *
     * @returns {Promise<number>} Número de recetas añadidas.
     */
    async seedCatalogRecipes() {
        return seedCatalogRecipesInternal(true);
    },

    /**
     * Obtiene una receta por id con ingredientes y etiquetas.
     *
     * @param {number} recipeId - Id de la receta.
     * @returns {Promise<Object>} Receta.
     */
    async getById(recipeId) {
        if (Number(recipeId) < 0) {
            const fallback = DEFAULT_RECIPES.find(r => r.id === Number(recipeId));
            if (fallback) return fallback;
        }

        const { data, error } = await supabase
            .from('recipe')
            .select(RECIPE_SELECT)
            .eq('id', recipeId)
            .single();

        if (error) throw new Error(error.message);
        return mapRecipe(data);
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

        await setIngredients(recipe.id, recipeData.ingredients || []);

        if ((recipeData.tagIds || []).length > 0) {
            await syncRecipeTags(recipe.id, recipeData.tagIds);
        }

        return recipe;
    },

    /**
     * Actualiza una receta y, opcionalmente, sus ingredientes y etiquetas.
     *
     * @param {number} recipeId - Id de la receta.
     * @param {Object} recipeData - Datos a actualizar.
     * @returns {Promise<Object>} Receta actualizada.
     */
    async update(recipeId, recipeData) {
        if (Number(recipeId) < 0) {
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
            await setIngredients(recipeId, recipeData.ingredients);
        }

        if (recipeData.tagIds !== undefined) {
            await syncRecipeTags(recipeId, recipeData.tagIds);
        }

        return data;
    },

    /**
     * Elimina una receta.
     *
     * @param {number} recipeId - Id de la receta.
     */
    async delete(recipeId) {
        if (Number(recipeId) < 0) return;

        const { error } = await supabase
            .from('recipe')
            .delete()
            .eq('id', recipeId);

        if (error) throw new Error(error.message);
    },
};
