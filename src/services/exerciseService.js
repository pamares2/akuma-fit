import { supabase, publicSupabase } from '../supabaseClient.js';
import { getCurrentProfile } from '../utils/auth.js';

const BUCKET_NAME = 'exercise-video';

const EXERCISE_SELECT_WITH_TAGS = `
    *,
    exercise_template_has_tag (
        tag:tag (
            id,
            name,
            category
        )
    )
`;

function mapAndDeduplicateExercises(rows) {
    if (!rows || rows.length === 0) return [];

    const mapped = rows.map(exercise => ({
        ...exercise,
        tags: exercise.exercise_template_has_tag?.map(item => item.tag).filter(Boolean) || [],
    }));

    const byName = new Map();
    for (const ex of mapped) {
        const key = (ex.exercise_name || '').trim().toLowerCase();
        const existing = byName.get(key);
        if (!existing || (ex.tags.length > existing.tags.length)) {
            byName.set(key, ex);
        }
    }

    return Array.from(byName.values());
}

async function fetchExercisesFromClient(client, filters = {}, includeTags = true) {
    let query = client
        .from('exercise_template')
        .select(includeTags ? EXERCISE_SELECT_WITH_TAGS : '*')
        .order('exercise_name');

    if (filters.text) {
        query = query.or(`exercise_name.ilike.%${filters.text}%,description.ilike.%${filters.text}%`);
    }

    if (filters.category) {
        query = query.eq('category', filters.category);
    }

    return query;
}

/**
 * Servicio de acceso a datos de los ejercicios (`exercise_template`) y sus
 * etiquetas.
 */
export const exerciseService = {
    /**
     * Crea un ejercicio para el perfil actual.
     *
     * @param {Object} exerciseData - Datos del ejercicio.
     * @returns {Promise<Object>} Ejercicio creado.
     */
    async create(exerciseData) {
        const profile = await getCurrentProfile();

        const { data, error } = await supabase
            .from('exercise_template')
            .insert({
                exercise_name: exerciseData.name,
                description: exerciseData.description,
                comments: exerciseData.comments,
                category: exerciseData.category,
                creator: profile.id,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * Actualiza los datos de un ejercicio.
     *
     * @param {number} exerciseId - Id del ejercicio.
     * @param {Object} exerciseData - Datos a actualizar.
     * @returns {Promise<Object>} Ejercicio actualizado.
     */
    async update(exerciseId, exerciseData) {
        const { data, error } = await supabase
            .from('exercise_template')
            .update({
                exercise_name: exerciseData.name,
                description: exerciseData.description,
                comments: exerciseData.comments,
                category: exerciseData.category,
            })
            .eq('id', exerciseId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * Obtiene todos los ejercicios con sus etiquetas, ordenados por nombre.
     *
     * @returns {Promise<Array>} Lista de ejercicios.
     */
    async getAll() {
        return this.search({});
    },

    /**
     * Obtiene un ejercicio por id con sus etiquetas.
     *
     * @param {number} exerciseId - Id del ejercicio.
     * @returns {Promise<Object>} Ejercicio.
     */
    async getById(exerciseId) {
        let { data, error } = await supabase
            .from('exercise_template')
            .select(EXERCISE_SELECT_WITH_TAGS)
            .eq('id', exerciseId)
            .single();

        if (error || !data) {
            const pubRes = await publicSupabase
                .from('exercise_template')
                .select(EXERCISE_SELECT_WITH_TAGS)
                .eq('id', exerciseId)
                .single();
            if (!pubRes.error && pubRes.data) {
                data = pubRes.data;
                error = null;
            }
        }

        if (error) throw new Error(error.message);

        return {
            ...data,
            tags: data.exercise_template_has_tag?.map(item => item.tag).filter(Boolean) || [],
        };
    },

    /**
     * Busca ejercicios por texto, categoría y etiquetas.
     *
     * @param {Object} [filters] - Filtros (`text`, `category`, `tags`).
     * @returns {Promise<Array>} Lista de ejercicios filtrados.
     */
    async search(filters = {}) {
        let { data, error } = await fetchExercisesFromClient(supabase, filters, true);

        // Si las políticas RLS de usuario autenticado devuelven vacío o error,
        // consultar mediante el cliente público sin sesión (lectura global del catálogo)
        if (error || !data || data.length === 0) {
            const pubWithTags = await fetchExercisesFromClient(publicSupabase, filters, true);
            if (!pubWithTags.error && pubWithTags.data && pubWithTags.data.length > 0) {
                data = pubWithTags.data;
                error = null;
            }
        }

        // Fallback adicional sin relación anidada de tags si la tabla puente fallara
        if (error || !data) {
            const fallbackAuth = await fetchExercisesFromClient(supabase, filters, false);
            if (!fallbackAuth.error && fallbackAuth.data && fallbackAuth.data.length > 0) {
                data = fallbackAuth.data;
                error = null;
            } else {
                const fallbackPub = await fetchExercisesFromClient(publicSupabase, filters, false);
                if (!fallbackPub.error && fallbackPub.data) {
                    data = fallbackPub.data;
                    error = null;
                }
            }
        }

        if (error) throw new Error(error.message);

        let results = mapAndDeduplicateExercises(data);

        if (filters.tags && filters.tags.length > 0) {
            results = results.filter(ex =>
                ex.tags.some(tag => filters.tags.includes(tag.id))
            );
        }

        return results;
    },

    /**
     * Elimina un ejercicio.
     *
     * @param {number} exerciseId - Id del ejercicio.
     */
    async delete(exerciseId) {
        const { error } = await supabase
            .from('exercise_template')
            .delete()
            .eq('id', exerciseId);

        if (error) throw new Error(error.message);
    },
};

/**
 * Servicio de almacenamiento del vídeo de demostración de un ejercicio en el
 * bucket `exercise-video`.
 */
export const exerciseVideoService = {
    /**
     * Sube el vídeo de un ejercicio.
     *
     * @param {number} exerciseId - Id del ejercicio.
     * @param {File} file - Archivo de vídeo.
     * @returns {Promise<string>} Nombre del archivo subido.
     */
    async upload(exerciseId, file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${exerciseId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (uploadError) throw new Error(uploadError.message);

        return fileName;
    },

    /**
     * Obtiene la URL firmada del vídeo de un ejercicio, probando varias
     * extensiones.
     *
     * @param {number} exerciseId - Id del ejercicio.
     * @returns {Promise<string|null>} URL firmada o `null` si no hay vídeo.
     */
    async getSignedUrl(exerciseId) {
        const extensions = ['mp4', 'webm', 'mov', 'avi'];
        
        for (const ext of extensions) {
            const fileName = `${exerciseId}.${ext}`;
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(fileName, 3600);

            if (!error && data?.signedUrl) {
                return data.signedUrl;
            }
        }

        return null;
    },

    /**
     * Elimina el vídeo de un ejercicio del bucket.
     *
     * @param {number} exerciseId - Id del ejercicio.
     */
    async delete(exerciseId) {
        const { data: files, error: listError } = await supabase.storage
            .from(BUCKET_NAME)
            .list('', {
                search: `${exerciseId}.`,
            });

        if (listError) throw new Error(listError.message);

        if (!files || files.length === 0) {
            return;
        }

        const fileName = files[0].name;
        const { error: deleteError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([fileName]);

        if (deleteError) throw new Error(deleteError.message);
    },
};
