import { supabase } from '../supabaseClient.js';
import { feedbackService } from './feedbackService.js';

/**
 * Servicio de acceso a datos para la vista de check-ins y feedback del coach.
 */
export const coachCheckInService = {
    /**
     * Obtiene la lista de clientes (perfiles con rol `client`).
     *
     * @returns {Promise<Array>} Lista de clientes.
     */
    async getClients() {
        const { data, error } = await supabase
            .from('profile')
            .select('id, name, surname, user_id')
            .eq('role', 'client')
            .order('name');

        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * Obtiene los check-ins de un cliente enriquecidos con el feedback del entrenador
     * y las respuestas del cliente.
     *
     * @param {number} clientProfileId - Id del perfil del cliente.
     * @returns {Promise<Array>} Lista de check-ins del cliente.
     */
    async getClientCheckIns(clientProfileId) {
        const { data, error } = await supabase
            .from('check_in')
            .select('*')
            .eq('profile_id', clientProfileId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return feedbackService.enrichCheckIns(clientProfileId, data || []);
    },

    /**
     * Guarda el feedback del entrenador en un check-in concreto del cliente.
     *
     * @param {number} clientProfileId - Id del perfil del cliente.
     * @param {number} checkInId - Id del check-in.
     * @param {string} feedbackText - Texto del feedback.
     * @returns {Promise<Object>} Feedback guardado.
     */
    async saveCheckInFeedback(clientProfileId, checkInId, feedbackText) {
        return feedbackService.saveCoachCheckInFeedback(clientProfileId, checkInId, feedbackText);
    },
};
