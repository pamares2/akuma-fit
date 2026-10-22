import { supabase } from '../supabaseClient.js';
import { getCurrentProfile } from '../utils/auth.js';
import { DEFAULT_RECIPES } from '../data/defaultRecipes.js';
import { recipeService } from './recipeService.js';
import { deduplicateIngredients } from '../utils/dietMacros.js';
import { DEMO_CHAT_CLIENTS, isDemoClientId, getDemoClientById } from './feedbackService.js';
import { assignDemoPlan, unassignDemoPlan, getAssignedPlanIdsForDemoClient, getAssignedDemoClientsForPlan, buildDefaultDemoMealPlan } from '../data/demoClientPlans.js';

/**
 * Selección completa de un plan: días -> comidas -> ítems (con alimento o
 * receta e ingredientes).
 */
const PLAN_FULL_SELECT = `
    *,
    meal_plan_day(
        *,
        meal_plan_slot(
            *,
            meal_plan_item(
                *,
                food(*),
                recipe(*, recipe_food(id, quantity_g, notes, food(*)))
            )
        )
    )
`;

/**
 * Normaliza una receta embebida dentro de un ítem de plan, asegurando que
 * siempre disponga de `ingredients`, `instructions` y `description`.
 *
 * @param {Object|null} recipe - Receta embebida.
 * @returns {Object|null} Receta enriquecida.
 */
function normalizeEmbeddedRecipe(recipe) {
    if (!recipe) return null;

    const cleanName = recipe.name?.toLowerCase().trim();
    const defaultMatch = cleanName
        ? DEFAULT_RECIPES.find(r => r.name.toLowerCase().trim() === cleanName)
        : null;

    const rawDbIngredients = (recipe.recipe_food || [])
        .filter(rel => rel && rel.food)
        .map(rel => ({
            id: rel.id,
            food: rel.food,
            food_id: rel.food_id || rel.food?.id,
            quantity_g: rel.quantity_g,
            notes: rel.notes,
        }));

    const dbIngredients = deduplicateIngredients(rawDbIngredients);

    // Si había filas duplicadas en la BD para la receta, limpiar en segundo plano
    if (recipe.id && rawDbIngredients.length > dbIngredients.length) {
        const seenFoodIds = new Set();
        const duplicateRowIds = [];
        for (const row of recipe.recipe_food || []) {
            const fid = row.food_id || row.food?.id;
            if (fid != null) {
                if (seenFoodIds.has(fid)) {
                    if (row.id) duplicateRowIds.push(row.id);
                } else {
                    seenFoodIds.add(fid);
                }
            }
        }
        if (duplicateRowIds.length > 0) {
            supabase
                .from('recipe_food')
                .delete()
                .in('id', duplicateRowIds)
                .then(() => {})
                .catch(() => {});
        }
    }

    const defaultIngredients = deduplicateIngredients(defaultMatch?.ingredients || []);
    const ingredients = dbIngredients.length > 0
        ? dbIngredients
        : defaultIngredients;

    return {
        ...recipe,
        category: recipe.category || defaultMatch?.category || 'Comida',
        description: recipe.description || defaultMatch?.description || '',
        instructions: recipe.instructions || defaultMatch?.instructions || '',
        preparation_time: recipe.preparation_time ?? defaultMatch?.preparation_time ?? 15,
        ingredients,
    };
}

/**
 * Valor temporal de orden para intercambiar dos filas sin violar la
 * restricción unique (padre, orden).
 */
const TEMP_ORDER = -1;

/**
 * Convierte la fila de Supabase en un plan con `days` (cada uno con `slots` e
 * `items`), quitando los embeds crudos.
 *
 * @param {Object} plan - Fila de `meal_plan` con embeds.
 * @returns {Object} Plan con `days`.
 */
function mapPlan(plan) {
    const days = (plan.meal_plan_day || []).map(day => {
        const slots = (day.meal_plan_slot || []).map(slot => {
            const items = (slot.meal_plan_item || []).map(item => ({
                ...item,
                recipe: normalizeEmbeddedRecipe(item.recipe),
            }));
            const slotRest = { ...slot };
            delete slotRest.meal_plan_item;
            return { ...slotRest, items };
        });

        const dayRest = { ...day };
        delete dayRest.meal_plan_slot;
        return { ...dayRest, slots };
    });

    const planRest = { ...plan };
    delete planRest.meal_plan_day;
    return { ...planRest, days };
}

/**
 * Obtiene el orden máximo actual de una tabla para un padre (para insertar una
 * nueva fila al final).
 *
 * @param {string} table - Tabla.
 * @param {string} parentColumn - Columna padre.
 * @param {number} parentId - Id del padre.
 * @param {string} orderColumn - Columna de orden.
 * @returns {Promise<number>} Orden máximo (0 si no hay filas).
 */
async function getMaxOrder(table, parentColumn, parentId, orderColumn) {
    const { data, error } = await supabase
        .from(table)
        .select(orderColumn)
        .eq(parentColumn, parentId)
        .order(orderColumn, { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? data[orderColumn] : 0;
}

/**
 * Renumera de 1 a N el orden de las filas de una tabla bajo un padre, para no
 * dejar huecos tras un borrado.
 *
 * @param {string} table - Tabla.
 * @param {string} parentColumn - Columna padre.
 * @param {number} parentId - Id del padre.
 * @param {string} orderColumn - Columna de orden.
 */
async function normalizeOrders(table, parentColumn, parentId, orderColumn) {
    const { data: rows, error } = await supabase
        .from(table)
        .select(`id, ${orderColumn}`)
        .eq(parentColumn, parentId)
        .order(orderColumn);

    if (error) throw new Error(error.message);

    for (let i = 0; i < rows.length; i += 1) {
        if (rows[i][orderColumn] !== i + 1) {
            const { error: updateError } = await supabase
                .from(table)
                .update({ [orderColumn]: i + 1 })
                .eq('id', rows[i].id);

            if (updateError) throw new Error(updateError.message);
        }
    }
}

/**
 * Mueve una fila una posición arriba (direction = -1) o abajo (+1),
 * intercambiando su orden con el vecino mediante un valor temporal.
 *
 * @param {string} table - Tabla.
 * @param {number} rowId - Id de la fila a mover.
 * @param {string} parentColumn - Columna padre.
 * @param {string} orderColumn - Columna de orden.
 * @param {number} direction - -1 (arriba) o +1 (abajo).
 */
async function moveRow(table, rowId, parentColumn, orderColumn, direction) {
    const { data: row, error: rowError } = await supabase
        .from(table)
        .select(`id, ${parentColumn}, ${orderColumn}`)
        .eq('id', rowId)
        .single();

    if (rowError) throw new Error(rowError.message);

    const { data: siblings, error: siblingsError } = await supabase
        .from(table)
        .select(`id, ${orderColumn}`)
        .eq(parentColumn, row[parentColumn])
        .order(orderColumn);

    if (siblingsError) throw new Error(siblingsError.message);

    const index = siblings.findIndex(sibling => sibling.id === rowId);
    const targetIndex = index + direction;

    if (index === -1 || targetIndex < 0 || targetIndex >= siblings.length) {
        return;
    }

    const target = siblings[targetIndex];

    const { error: stepOneError } = await supabase
        .from(table)
        .update({ [orderColumn]: TEMP_ORDER })
        .eq('id', row.id);

    if (stepOneError) throw new Error(stepOneError.message);

    const { error: stepTwoError } = await supabase
        .from(table)
        .update({ [orderColumn]: row[orderColumn] })
        .eq('id', target.id);

    if (stepTwoError) throw new Error(stepTwoError.message);

    const { error: stepThreeError } = await supabase
        .from(table)
        .update({ [orderColumn]: target[orderColumn] })
        .eq('id', row.id);

    if (stepThreeError) throw new Error(stepThreeError.message);
}

/**
 * Servicio de acceso a datos de los planes de dieta (`meal_plan`) y su
 * estructura días -> comidas -> ítems.
 */
export const mealPlanService = {
    /**
     * Obtiene la lista de clientes.
     *
     * @returns {Promise<Array>} Lista de clientes.
     */
    async getClients() {
        let realClients;
        try {
            const { data, error } = await supabase
                .from('profile')
                .select('id, name, surname, gender, birthdate')
                .eq('role', 'client')
                .order('name');

            realClients = (!error && data) ? data : [];
        } catch {
            realClients = [];
        }

        const demoClients = DEMO_CHAT_CLIENTS.map(c => ({
            id: c.id,
            name: c.name,
            surname: c.surname,
            gender: c.gender,
            birthdate: c.birthdate,
            isDemo: true,
        }));

        return [...realClients, ...demoClients];
    },

    /**
     * Obtiene el perfil nutricional completo de un cliente (datos de perfil,
     * valoración inicial y historial de mediciones de peso) para pre-rellenar
     * el calculador de dieta personalizada ANEF.
     *
     * @param {number} clientId - Id del perfil del cliente.
     * @returns {Promise<{client: Object, assessment: Object|null, measurements: Array}>}
     */
    async getClientNutritionalProfile(clientId) {
        if (isDemoClientId(clientId)) {
            const demo = getDemoClientById(clientId);
            return {
                client: demo ? { id: demo.id, name: demo.name, surname: demo.surname, gender: demo.gender, birthdate: demo.birthdate } : null,
                assessment: demo?.assessment || null,
                measurements: demo?.measurements || [],
            };
        }
        const [profileRes, assessmentRes, measurementsRes] = await Promise.all([
            supabase
                .from('profile')
                .select('id, name, surname, gender, birthdate')
                .eq('id', clientId)
                .maybeSingle(),
            supabase
                .from('initial_assessment')
                .select('*')
                .eq('profile_id', clientId)
                .maybeSingle(),
            supabase
                .from('measurement')
                .select('*')
                .eq('profile_id', clientId)
                .order('created_at', { ascending: false })
                .limit(5),
        ]);

        if (profileRes.error) throw new Error(profileRes.error.message);

        return {
            client: profileRes.data || null,
            assessment: assessmentRes.data || null,
            measurements: measurementsRes.data || [],
        };
    },

    /**
     * Obtiene los planes creados por el perfil actual, con número de días y
     * clientes asignados.
     *
     * @returns {Promise<Array>} Lista de planes.
     */
    async getAll() {
        await getCurrentProfile();

        const { data, error } = await supabase
            .from('meal_plan')
            .select('*, meal_plan_day(id), profile_has_meal_plan(profile(id, name, surname))')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return (data || []).map(plan => {
            const dayCount = plan.meal_plan_day?.length || 0;
            const clients = [
                ...(plan.profile_has_meal_plan || []).map(rel => rel.profile).filter(Boolean),
                ...getAssignedDemoClientsForPlan(plan.id)
            ];

            const rest = { ...plan };
            delete rest.meal_plan_day;
            delete rest.profile_has_meal_plan;
            return { ...rest, dayCount, clients };
        });
    },

    /**
     * Obtiene un plan completo por id, con días, comidas, ítems y clientes.
     *
     * @param {number} planId - Id del plan.
     * @returns {Promise<Object>} Plan completo.
     */
    async getById(planId) {
        const { data, error } = await supabase
            .from('meal_plan')
            .select(`${PLAN_FULL_SELECT}, profile_has_meal_plan(profile(id, name, surname))`)
            .eq('id', planId)
            .order('day_order', { referencedTable: 'meal_plan_day' })
            .order('slot_order', { referencedTable: 'meal_plan_day.meal_plan_slot' })
            .order('item_order', { referencedTable: 'meal_plan_day.meal_plan_slot.meal_plan_item' })
            .single();

        if (error) throw new Error(error.message);

        const clients = [
            ...(data.profile_has_meal_plan || []).map(rel => rel.profile).filter(Boolean),
            ...getAssignedDemoClientsForPlan(data.id)
        ];

        const rest = { ...data };
        delete rest.profile_has_meal_plan;
        return { ...mapPlan(rest), clients };
    },

    /**
     * Obtiene los planes asignados a un cliente.
     *
     * @param {number} clientId - Id del perfil del cliente.
     * @returns {Promise<Array>} Lista de planes.
     */
    async getByClient(clientId) {
        if (isDemoClientId(clientId)) {
            const assignedIds = getAssignedPlanIdsForDemoClient(clientId);
            let realAssignedPlans = [];
            if (assignedIds.length > 0) {
                try {
                    const { data: realData } = await supabase
                        .from('meal_plan')
                        .select(PLAN_FULL_SELECT)
                        .in('id', assignedIds)
                        .order('created_at', { ascending: false });
                    realAssignedPlans = (realData || []).map(mapPlan);
                } catch {
                    realAssignedPlans = [];
                }
            }
            return [...realAssignedPlans, buildDefaultDemoMealPlan(clientId)];
        }

        const { data, error } = await supabase
            .from('meal_plan')
            .select(`${PLAN_FULL_SELECT}, profile_has_meal_plan!inner(profile_id)`)
            .eq('profile_has_meal_plan.profile_id', clientId)
            .order('created_at', { ascending: false })
            .order('day_order', { referencedTable: 'meal_plan_day' })
            .order('slot_order', { referencedTable: 'meal_plan_day.meal_plan_slot' })
            .order('item_order', { referencedTable: 'meal_plan_day.meal_plan_slot.meal_plan_item' });

        if (error) throw new Error(error.message);
        return (data || []).map(mapPlan);
    },

    /**
     * Crea un plan con su primer día, devolviendo el plan creado.
     *
     * @param {Object} planData - Datos del plan.
     * @returns {Promise<Object>} Plan creado.
     */
    async create(planData) {
        const profile = await getCurrentProfile();

        const { data: plan, error } = await supabase
            .from('meal_plan')
            .insert({
                title: planData.title,
                description: planData.description || null,
                target_calories: planData.target_calories ?? null,
                target_protein: planData.target_protein ?? null,
                target_carbs: planData.target_carbs ?? null,
                target_fat: planData.target_fat ?? null,
                created_by: profile.id,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);

        const { error: dayError } = await supabase
            .from('meal_plan_day')
            .insert({ meal_plan_id: plan.id, day_order: 1, label: 'Día 1' });

        if (dayError) throw new Error(dayError.message);

        return plan;
    },

    /**
     * Actualiza los datos generales de un plan.
     *
     * @param {number} planId - Id del plan.
     * @param {Object} planData - Datos a actualizar.
     * @returns {Promise<Object>} Plan actualizado.
     */
    async update(planId, planData) {
        const { data, error } = await supabase
            .from('meal_plan')
            .update({
                title: planData.title,
                description: planData.description || null,
                target_calories: planData.target_calories ?? null,
                target_protein: planData.target_protein ?? null,
                target_carbs: planData.target_carbs ?? null,
                target_fat: planData.target_fat ?? null,
            })
            .eq('id', planId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * Elimina un plan.
     *
     * @param {number} planId - Id del plan.
     */
    async delete(planId) {
        const { error } = await supabase
            .from('meal_plan')
            .delete()
            .eq('id', planId);

        if (error) throw new Error(error.message);
    },

    /**
     * Asigna un plan a un cliente (ignora si ya está asignado).
     *
     * @param {number} clientId - Id del cliente.
     * @param {number} planId - Id del plan.
     */
    async assign(clientId, planId) {
        if (isDemoClientId(clientId)) { assignDemoPlan(clientId, planId); return; }
        const { error } = await supabase
            .from('profile_has_meal_plan')
            .insert({ profile_id: clientId, meal_plan_id: planId });

        if (error && error.code !== '23505') {
            throw new Error(error.message);
        }
    },

    /**
     * Desasigna un plan de un cliente.
     *
     * @param {number} clientId - Id del cliente.
     * @param {number} planId - Id del plan.
     */
    async unassign(clientId, planId) {
        if (isDemoClientId(clientId)) { unassignDemoPlan(clientId, planId); return; }
        const { error } = await supabase
            .from('profile_has_meal_plan')
            .delete()
            .eq('profile_id', clientId)
            .eq('meal_plan_id', planId);

        if (error) throw new Error(error.message);
    },

    /**
     * Añade un día al plan al final.
     *
     * @param {number} planId - Id del plan.
     * @param {string} [label] - Etiqueta del día.
     * @returns {Promise<Object>} Día creado.
     */
    async addDay(planId, label) {
        const maxOrder = await getMaxOrder('meal_plan_day', 'meal_plan_id', planId, 'day_order');

        const { data, error } = await supabase
            .from('meal_plan_day')
            .insert({
                meal_plan_id: planId,
                day_order: maxOrder + 1,
                label: label || `Día ${maxOrder + 1}`,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * Actualiza la etiqueta de un día.
     *
     * @param {number} dayId - Id del día.
     * @param {Object} fields - Campos (`label`).
     * @returns {Promise<Object>} Día actualizado.
     */
    async updateDay(dayId, fields) {
        const { data, error } = await supabase
            .from('meal_plan_day')
            .update({ label: fields.label })
            .eq('id', dayId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * Elimina un día y renumera los restantes.
     *
     * @param {number} dayId - Id del día.
     */
    async removeDay(dayId) {
        const { data: day, error: dayError } = await supabase
            .from('meal_plan_day')
            .select('id, meal_plan_id')
            .eq('id', dayId)
            .single();

        if (dayError) throw new Error(dayError.message);

        const { error } = await supabase
            .from('meal_plan_day')
            .delete()
            .eq('id', dayId);

        if (error) throw new Error(error.message);

        await normalizeOrders('meal_plan_day', 'meal_plan_id', day.meal_plan_id, 'day_order');
    },

    /**
     * Mueve un día una posición arriba o abajo.
     *
     * @param {number} dayId - Id del día.
     * @param {number} direction - -1 (arriba) o +1 (abajo).
     */
    async moveDay(dayId, direction) {
        await moveRow('meal_plan_day', dayId, 'meal_plan_id', 'day_order', direction);
    },

    /**
     * Duplica un día (con sus comidas e ítems) al final del plan.
     *
     * @param {number} dayId - Id del día a copiar.
     * @returns {Promise<Object>} Día copiado.
     */
    async copyDay(dayId) {
        const { data: day, error } = await supabase
            .from('meal_plan_day')
            .select('id, meal_plan_id, day_order, label, meal_plan_slot(*, meal_plan_item(*))')
            .eq('id', dayId)
            .order('slot_order', { referencedTable: 'meal_plan_slot' })
            .order('item_order', { referencedTable: 'meal_plan_slot.meal_plan_item' })
            .single();

        if (error) throw new Error(error.message);

        const maxOrder = await getMaxOrder('meal_plan_day', 'meal_plan_id', day.meal_plan_id, 'day_order');

        const { data: newDay, error: newDayError } = await supabase
            .from('meal_plan_day')
            .insert({
                meal_plan_id: day.meal_plan_id,
                day_order: maxOrder + 1,
                label: `${day.label || `Día ${day.day_order}`} (copia)`,
            })
            .select()
            .single();

        if (newDayError) throw new Error(newDayError.message);

        const slots = day.meal_plan_slot || [];

        if (slots.length === 0) {
            return newDay;
        }

        const { data: newSlots, error: slotsError } = await supabase
            .from('meal_plan_slot')
            .insert(slots.map(slot => ({
                day_id: newDay.id,
                slot_order: slot.slot_order,
                label: slot.label,
            })))
            .select();

        if (slotsError) throw new Error(slotsError.message);

        const itemRows = [];

        slots.forEach((slot, index) => {
            for (const item of slot.meal_plan_item || []) {
                itemRows.push({
                    slot_id: newSlots[index].id,
                    item_order: item.item_order,
                    recipe_id: item.recipe_id,
                    food_id: item.food_id,
                    quantity_g: item.quantity_g,
                    servings: item.servings,
                    notes: item.notes,
                });
            }
        });

        if (itemRows.length > 0) {
            const { error: itemsError } = await supabase
                .from('meal_plan_item')
                .insert(itemRows);

            if (itemsError) throw new Error(itemsError.message);
        }

        return newDay;
    },

    /**
     * Añade una comida (slot) a un día al final.
     *
     * @param {number} dayId - Id del día.
     * @param {string} [label] - Etiqueta de la comida.
     * @returns {Promise<Object>} Comida creada.
     */
    async addSlot(dayId, label) {
        const maxOrder = await getMaxOrder('meal_plan_slot', 'day_id', dayId, 'slot_order');

        const { data, error } = await supabase
            .from('meal_plan_slot')
            .insert({
                day_id: dayId,
                slot_order: maxOrder + 1,
                label: label || `Comida ${maxOrder + 1}`,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * Actualiza la etiqueta de una comida.
     *
     * @param {number} slotId - Id de la comida.
     * @param {Object} fields - Campos (`label`).
     * @returns {Promise<Object>} Comida actualizada.
     */
    async updateSlot(slotId, fields) {
        const { data, error } = await supabase
            .from('meal_plan_slot')
            .update({ label: fields.label })
            .eq('id', slotId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * Elimina una comida y renumera las restantes.
     *
     * @param {number} slotId - Id de la comida.
     */
    async removeSlot(slotId) {
        const { data: slot, error: slotError } = await supabase
            .from('meal_plan_slot')
            .select('id, day_id')
            .eq('id', slotId)
            .single();

        if (slotError) throw new Error(slotError.message);

        const { error } = await supabase
            .from('meal_plan_slot')
            .delete()
            .eq('id', slotId);

        if (error) throw new Error(error.message);

        await normalizeOrders('meal_plan_slot', 'day_id', slot.day_id, 'slot_order');
    },

    /**
     * Mueve una comida una posición arriba o abajo.
     *
     * @param {number} slotId - Id de la comida.
     * @param {number} direction - -1 (arriba) o +1 (abajo).
     */
    async moveSlot(slotId, direction) {
        await moveRow('meal_plan_slot', slotId, 'day_id', 'slot_order', direction);
    },

    /**
     * Añade un ítem (alimento o receta) a una comida.
     *
     * @param {number} slotId - Id de la comida.
     * @param {Object} itemData - Datos del ítem.
     * @returns {Promise<Object>} Ítem creado.
     */
    async addItem(slotId, itemData) {
        const maxOrder = await getMaxOrder('meal_plan_item', 'slot_id', slotId, 'item_order');

        let resolvedRecipeId = itemData.recipe_id ?? null;

        if (itemData.recipe) {
            const persisted = await recipeService.ensurePersisted(itemData.recipe);
            resolvedRecipeId = persisted.id;
        } else if (typeof resolvedRecipeId === 'string' && resolvedRecipeId.startsWith('default-')) {
            const defRecipe = DEFAULT_RECIPES.find(r => r.id === resolvedRecipeId);
            if (defRecipe) {
                const persisted = await recipeService.ensurePersisted(defRecipe);
                resolvedRecipeId = persisted.id;
            }
        }

        const { data, error } = await supabase
            .from('meal_plan_item')
            .insert({
                slot_id: slotId,
                item_order: maxOrder + 1,
                recipe_id: resolvedRecipeId,
                food_id: itemData.food_id ?? null,
                quantity_g: itemData.quantity_g ?? null,
                servings: itemData.servings ?? null,
                notes: itemData.notes || null,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * Actualiza la cantidad/raciones/notas de un ítem.
     *
     * @param {number} itemId - Id del ítem.
     * @param {Object} fields - Campos a actualizar.
     * @returns {Promise<Object>} Ítem actualizado.
     */
    async updateItem(itemId, fields) {
        const { data, error } = await supabase
            .from('meal_plan_item')
            .update({
                quantity_g: fields.quantity_g ?? null,
                servings: fields.servings ?? null,
                notes: fields.notes || null,
            })
            .eq('id', itemId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * Elimina un ítem y renumera los restantes.
     *
     * @param {number} itemId - Id del ítem.
     */
    async removeItem(itemId) {
        const { data: item, error: itemError } = await supabase
            .from('meal_plan_item')
            .select('id, slot_id')
            .eq('id', itemId)
            .single();

        if (itemError) throw new Error(itemError.message);

        const { error } = await supabase
            .from('meal_plan_item')
            .delete()
            .eq('id', itemId);

        if (error) throw new Error(error.message);

        await normalizeOrders('meal_plan_item', 'slot_id', item.slot_id, 'item_order');
    },

    /**
     * Mueve un ítem una posición arriba o abajo.
     *
     * @param {number} itemId - Id del ítem.
     * @param {number} direction - -1 (arriba) o +1 (abajo).
     */
    async moveItem(itemId, direction) {
        await moveRow('meal_plan_item', itemId, 'slot_id', 'item_order', direction);
    },
};
