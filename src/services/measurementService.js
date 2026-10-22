import { supabase } from '../supabaseClient.js';
import { getCurrentProfile } from '../utils/auth.js';
import { normalizeNumericFields } from '../utils/data.js';
import { isDemoClientId, getDemoClientById } from './feedbackService.js';

/**
 * Campos numéricos de las medidas que se normalizan antes de insertar.
 */
const NUMERIC_FIELDS = ['weight', 'chest', 'waist', 'hip'];

/**
 * Servicio de acceso a datos de las medidas corporales (`measurement`).
 */
export const measurementService = {
    /**
     * Obtiene las medidas del perfil actual, ordenadas por fecha ascendente.
     *
     * @returns {Promise<Array>} Lista de medidas.
     */
    async getAll() {
        const profile = await getCurrentProfile();

        if (isDemoClientId(profile.id)) {
            const demo = getDemoClientById(profile.id);
            return [...(demo?.measurements || [])].sort(
                (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
        }

        const { data, error } = await supabase
            .from('measurement')
            .select('*')
            .eq('profile_id', profile.id)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * Crea una medida completa para el perfil actual.
     *
     * @param {Object} measurementData - Datos de la medida.
     */
    async create(measurementData) {
        const profile = await getCurrentProfile();
        if (isDemoClientId(profile.id)) return;

        const payload = normalizeNumericFields(
            { ...measurementData, profile_id: profile.id },
            NUMERIC_FIELDS
        );

        const { error } = await supabase.from('measurement').insert(payload);
        if (error) throw new Error(error.message);
    },

    /**
     * Crea una medida solo con el peso del perfil actual.
     *
     * @param {string|number} weight - Peso en kg.
     */
    async createWeightOnly(weight) {
        const profile = await getCurrentProfile();
        if (isDemoClientId(profile.id)) return;

        const payload = {
            profile_id: profile.id,
            weight: weight ? Number(weight) : null,
        };

        const { error } = await supabase.from('measurement').insert(payload);
        if (error) throw new Error(error.message);
    },
};
