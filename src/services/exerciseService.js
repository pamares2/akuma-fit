import { supabase } from '../supabaseClient.js';
import { getCurrentProfile } from '../utils/auth.js';

const BUCKET_NAME = 'exercise-video';

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
        const { data, error } = await supabase
            .from('exercise_template')
            .select(`
                *,
                exercise_template_has_tag (
                    tag:tag (
                        id,
                        name,
                        category
                    )
                )
            `)
            .order('exercise_name');

        if (error) throw new Error(error.message);

        return data?.map(exercise => ({
            ...exercise,
            tags: exercise.exercise_template_has_tag?.map(item => item.tag).filter(Boolean) || [],
        })) || [];
    },

    /**
     * Obtiene un ejercicio por id con sus etiquetas.
     *
     * @param {number} exerciseId - Id del ejercicio.
     * @returns {Promise<Object>} Ejercicio.
     */
    async getById(exerciseId) {
        const { data, error } = await supabase
            .from('exercise_template')
            .select(`
                *,
                exercise_template_has_tag (
                    tag:tag (
                        id,
                        name,
                        category
                    )
                )
            `)
            .eq('id', exerciseId)
            .single();

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
        let query = supabase
            .from('exercise_template')
            .select(`
                *,
                exercise_template_has_tag (
                    tag:tag (
                        id,
                        name,
                        category
                    )
                )
            `)
            .order('exercise_name');

        if (filters.text) {
            query = query.or(`exercise_name.ilike.%${filters.text}%,description.ilike.%${filters.text}%`);
        }

        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        if (filters.tags && filters.tags.length > 0) {
            query = query.in('exercise_template_has_tag.tag', filters.tags);
        }

        let { data, error } = await query;

        // Fallback robusto si la consulta anidada con tags fallara
        if (error) {
            console.warn('Reintentando consulta directa sin tags:', error);
            let fallbackQuery = supabase
                .from('exercise_template')
                .select('*')
                .order('exercise_name');

            if (filters.text) {
                fallbackQuery = fallbackQuery.or(`exercise_name.ilike.%${filters.text}%,description.ilike.%${filters.text}%`);
            }
            if (filters.category) {
                fallbackQuery = fallbackQuery.eq('category', filters.category);
            }

            const fallbackRes = await fallbackQuery;
            if (!fallbackRes.error && fallbackRes.data) {
                return fallbackRes.data.map(exercise => ({
                    ...exercise,
                    tags: [],
                }));
            }
            throw new Error(error.message);
        }

        return data?.map(exercise => ({
            ...exercise,
            tags: exercise.exercise_template_has_tag?.map(item => item.tag).filter(Boolean) || [],
        })) || [];
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
