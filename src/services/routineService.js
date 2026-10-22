import { supabase } from '../supabaseClient.js';
import { DEMO_CHAT_CLIENTS, isDemoClientId } from './feedbackService.js';
import {
    buildDefaultDemoRoutines,
    saveCustomDemoRoutine,
    updateCustomDemoRoutine,
    removeCustomDemoRoutine,
    getDemoRoutineById,
} from '../data/demoClientPlans.js';

const ROUTINE_WITH_EXERCISES_SELECT = `
    *,
    routine_has_exercise_template(
        position,
        exercise_template(
            *,
            exercise_template_has_set_template(
                set_template(*)
            )
        )
    )
`;

const ROUTINES_BY_CLIENT_SELECT = `
    *,
    profile_has_routine!inner(profile),
    routine_has_exercise_template(
        position,
        exercise_template(
            *,
            exercise_template_has_set_template(
                set_template(*)
            )
        )
    )
`;

/**
 * Convierte la fila de Supabase en una rutina con su lista de ejercicios
 * (`exercises`) ordenados por posición, cada uno con sus `sets` ordenados.
 *
 * @param {Object} routine - Fila de `routine` con embeds.
 * @returns {Object} Rutina con `exercises`.
 */
function mapRoutineExercises(routine) {
    const exercises = (routine.routine_has_exercise_template || [])
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map(rel => rel.exercise_template)
        .filter(Boolean)
        .map(exercise => {
            const sets = (exercise.exercise_template_has_set_template || [])
                .map(rel => rel.set_template)
                .filter(Boolean)
                .sort((a, b) => a.order - b.order);

            const exerciseRest = { ...exercise };
            delete exerciseRest.exercise_template_has_set_template;
            return { ...exerciseRest, sets };
        });

    const routineRest = { ...routine };
    delete routineRest.profile_has_routine;
    delete routineRest.routine_has_exercise_template;
    return { ...routineRest, exercises };
}

/**
 * Servicio de acceso a datos de las rutinas de entrenamiento (`routine`).
 */
export const routineService = {
    /**
     * Obtiene la lista de clientes (incluyendo los 2 clientes de prueba en primer lugar).
     *
     * @returns {Promise<Array>} Lista de clientes.
     */
    async getClients() {
        let realClients = [];
        try {
            const { data, error } = await supabase
                .from('profile')
                .select('id, name, surname')
                .eq('role', 'client')
                .order('name');
            if (!error && data) realClients = data;
        } catch {
            realClients = [];
        }

        const demoClients = DEMO_CHAT_CLIENTS.map(c => ({
            id: c.id,
            name: c.name,
            surname: c.surname,
            isDemo: true,
        }));

        return [...demoClients, ...realClients];
    },

    /**
     * Crea una rutina con su asignación a cliente, ejercicios y series.
     *
     * @param {Object} routineData - Datos de la rutina.
     * @returns {Promise<Object>} Rutina creada.
     */
    async create(routineData) {
        if (routineData.clientId && isDemoClientId(routineData.clientId)) {
            return saveCustomDemoRoutine(routineData.clientId, routineData);
        }

        const { data: routine, error: routineError } = await supabase
            .from('routine')
            .insert({
                title: routineData.title,
                coach_comment: routineData.coachComment,
                creator: routineData.creatorId,
            })
            .select()
            .single();

        if (routineError) throw new Error(routineError.message);

        if (routineData.clientId && !isDemoClientId(routineData.clientId)) {
            const { error: assignError } = await supabase
                .from('profile_has_routine')
                .insert({
                    profile: routineData.clientId,
                    routine: routine.id,
                });

            if (assignError) throw new Error(assignError.message);
        }

        const exercises = routineData.exercises || [];

        if (exercises.length > 0) {
            const { error: relationError } = await supabase
                .from('routine_has_exercise_template')
                .insert(exercises.map((exercise, index) => ({
                    routine: routine.id,
                    exercise_template: exercise.id,
                    position: index + 1,
                })));

            if (relationError) throw new Error(relationError.message);

            const exerciseIdsBySet = [];
            const setRows = exercises.flatMap(exercise =>
                (exercise.sets || []).map(set => {
                    exerciseIdsBySet.push(exercise.id);
                    return {
                        order: set.order,
                        reps: set.reps,
                        kg: set.kg,
                        type: set.type,
                    };
                })
            );

            if (setRows.length > 0) {
                const { data: createdSets, error: setError } = await supabase
                    .from('set_template')
                    .insert(setRows)
                    .select();

                if (setError) throw new Error(setError.message);

                const links = createdSets.map((setTemplate, index) => ({
                    exercise_template: exerciseIdsBySet[index],
                    set_template: setTemplate.id,
                }));

                const { error: linkError } = await supabase
                    .from('exercise_template_has_set_template')
                    .insert(links);

                if (linkError) throw new Error(linkError.message);
            }
        }

        return routine;
    },

    /**
     * Actualiza una rutina existente (título, comentario del coach, ejercicios y series progresadas).
     *
     * @param {number|string} routineId - Id de la rutina a actualizar.
     * @param {Object} routineData - Datos actualizados (title, coachComment, clientId, exercises).
     * @returns {Promise<Object>} Rutina actualizada.
     */
    async update(routineId, routineData) {
        if (String(routineId).startsWith('demo-') || (routineData.clientId && isDemoClientId(routineData.clientId))) {
            return updateCustomDemoRoutine(routineData.clientId, routineId, routineData);
        }

        // 1. Actualizar rutina
        const { data: routine, error: routineError } = await supabase
            .from('routine')
            .update({
                title: routineData.title,
                coach_comment: routineData.coachComment,
            })
            .eq('id', routineId)
            .select()
            .single();

        if (routineError) throw new Error(routineError.message);

        // 2. Si se especifica un cliente, actualizar relación
        if (routineData.clientId && !isDemoClientId(routineData.clientId)) {
            const { data: currentLinks } = await supabase
                .from('profile_has_routine')
                .select('id, profile')
                .eq('routine', routineId);

            const hasCurrent = (currentLinks || []).some(l => String(l.profile) === String(routineData.clientId));
            if (!hasCurrent) {
                await supabase
                    .from('profile_has_routine')
                    .delete()
                    .eq('routine', routineId);

                await supabase
                    .from('profile_has_routine')
                    .insert({
                        profile: routineData.clientId,
                        routine: routineId,
                    });
            }
        }

        // 3. Reemplazar ejercicios y series de la rutina
        const exercises = routineData.exercises || [];

        // Eliminar relaciones de ejercicios anteriores
        await supabase
            .from('routine_has_exercise_template')
            .delete()
            .eq('routine', routineId);

        if (exercises.length > 0) {
            const { error: relError } = await supabase
                .from('routine_has_exercise_template')
                .insert(exercises.map((exercise, index) => ({
                    routine: routineId,
                    exercise_template: exercise.id,
                    position: index + 1,
                })));

            if (relError) throw new Error(relError.message);

            const exerciseIdsBySet = [];
            const setRows = exercises.flatMap(exercise =>
                (exercise.sets || []).map(set => {
                    exerciseIdsBySet.push(exercise.id);
                    return {
                        order: set.order,
                        reps: String(set.reps || ''),
                        kg: set.kg != null ? String(set.kg) : null,
                        type: set.type || 'Normal',
                    };
                })
            );

            if (setRows.length > 0) {
                const { data: createdSets, error: setError } = await supabase
                    .from('set_template')
                    .insert(setRows)
                    .select();

                if (setError) throw new Error(setError.message);

                const links = createdSets.map((setTemplate, index) => ({
                    exercise_template: exerciseIdsBySet[index],
                    set_template: setTemplate.id,
                }));

                const { error: linkError } = await supabase
                    .from('exercise_template_has_set_template')
                    .insert(links);

                if (linkError) throw new Error(linkError.message);
            }
        }

        return routine;
    },

    /**
     * Elimina una rutina y sus relaciones asociadas.
     *
     * @param {number|string} routineId - Id de la rutina.
     * @param {number|string} [clientId] - Id del cliente si es de prueba.
     * @returns {Promise<boolean>}
     */
    async delete(routineId, clientId) {
        if (String(routineId).startsWith('demo-') || (clientId && isDemoClientId(clientId))) {
            removeCustomDemoRoutine(clientId, routineId);
            return true;
        }

        await supabase.from('profile_has_routine').delete().eq('routine', routineId);
        await supabase.from('routine_has_exercise_template').delete().eq('routine', routineId);
        const { error } = await supabase.from('routine').delete().eq('id', routineId);
        if (error) throw new Error(error.message);
        return true;
    },

    /**
     * Elimina una rutina personalizada de un cliente de prueba.
     */
    async removeDemoRoutine(clientId, routineId) {
        removeCustomDemoRoutine(clientId, routineId);
    },

    /**
     * Obtiene las rutinas asignadas a un cliente, con ejercicios y series.
     *
     * @param {number|string} clientId - Id del perfil del cliente.
     * @returns {Promise<Array>} Lista de rutinas.
     */
    async getByClient(clientId) {
        if (isDemoClientId(clientId)) {
            return buildDefaultDemoRoutines(clientId);
        }

        const { data: routines, error } = await supabase
            .from('routine')
            .select(ROUTINES_BY_CLIENT_SELECT)
            .eq('profile_has_routine.profile', clientId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return (routines || []).map(mapRoutineExercises);
    },

    /**
     * Obtiene una rutina por id con ejercicios y series.
     *
     * @param {number|string} routineId - Id de la rutina.
     * @returns {Promise<Object|null>} Rutina o `null` si no existe.
     */
    async getById(routineId) {
        if (String(routineId).startsWith('demo-routine-')) {
            return getDemoRoutineById(routineId);
        }

        const { data: routine, error } = await supabase
            .from('routine')
            .select(ROUTINE_WITH_EXERCISES_SELECT)
            .eq('id', routineId)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return routine ? mapRoutineExercises(routine) : null;
    },
};
