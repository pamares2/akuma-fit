import { supabase, publicSupabase } from '../supabaseClient.js';

/**
 * Servicio de acceso a datos de las etiquetas (`tag`) y sus relaciones con
 * ejercicios.
 */
export const tagService = {
    /**
     * Obtiene todas las etiquetas, ordenadas por nombre.
     *
     * @returns {Promise<Array>} Lista de etiquetas.
     */
    async getAll() {
        let { data, error } = await supabase
            .from('tag')
            .select('*')
            .order('name');

        if (error || !data || data.length === 0) {
            const pubRes = await publicSupabase
                .from('tag')
                .select('*')
                .order('name');
            if (!pubRes.error && pubRes.data && pubRes.data.length > 0) {
                data = pubRes.data;
                error = null;
            }
        }

        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * Crea una etiqueta (o devuelve la existente si ya hay una con el mismo
     * nombre).
     *
     * @param {string} name - Nombre de la etiqueta.
     * @param {string|null} [category] - Categoría de la etiqueta.
     * @returns {Promise<Object>} Etiqueta creada o existente.
     */
    async create(name, category = null) {
        const { data, error } = await supabase
            .from('tag')
            .insert({ name, category })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                const { data: existing } = await supabase
                    .from('tag')
                    .select('*')
                    .eq('name', name)
                    .single();
                return existing;
            }
            throw new Error(error.message);
        }
        return data;
    },

    /**
     * Obtiene las etiquetas asociadas a un ejercicio.
     *
     * @param {number} exerciseId - Id del ejercicio.
     * @returns {Promise<Array>} Lista de etiquetas.
     */
    async getByExercise(exerciseId) {
        let { data, error } = await supabase
            .from('exercise_template_has_tag')
            .select(`
                tag:tag (
                    id,
                    name,
                    category
                )
            `)
            .eq('exercise_template', exerciseId);

        if (error || !data || data.length === 0) {
            const pubRes = await publicSupabase
                .from('exercise_template_has_tag')
                .select(`
                    tag:tag (
                        id,
                        name,
                        category
                    )
                `)
                .eq('exercise_template', exerciseId);
            if (!pubRes.error && pubRes.data) {
                data = pubRes.data;
                error = null;
            }
        }

        if (error) throw new Error(error.message);
        return data?.map(item => item.tag).filter(Boolean) || [];
    },

    /**
     * Asocia una etiqueta a un ejercicio (ignora duplicados).
     *
     * @param {number} exerciseId - Id del ejercicio.
     * @param {number} tagId - Id de la etiqueta.
     */
    async addTagToExercise(exerciseId, tagId) {
        const { error } = await supabase
            .from('exercise_template_has_tag')
            .insert({
                exercise_template: exerciseId,
                tag: tagId,
            });

        if (error && error.code !== '23505') {
            throw new Error(error.message);
        }
    },

    /**
     * Desasocia una etiqueta de un ejercicio.
     *
     * @param {number} exerciseId - Id del ejercicio.
     * @param {number} tagId - Id de la etiqueta.
     */
    async removeTagFromExercise(exerciseId, tagId) {
        const { error } = await supabase
            .from('exercise_template_has_tag')
            .delete()
            .eq('exercise_template', exerciseId)
            .eq('tag', tagId);

        if (error) throw new Error(error.message);
    },
};
