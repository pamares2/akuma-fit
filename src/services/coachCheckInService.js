import { supabase } from '../supabaseClient.js';
import {
    feedbackService,
    DEMO_CHAT_CLIENTS,
    isDemoClientId,
    getDemoClientById,
} from './feedbackService.js';

/**
 * Servicio de acceso a datos para la vista de check-ins y feedback del coach.
 */
export const coachCheckInService = {
    /**
     * Obtiene la lista de clientes (perfiles con rol `client` + los 2 clientes de prueba).
     *
     * @returns {Promise<Array>} Lista de clientes.
     */
    async getClients() {
        let realClients = [];
        try {
            const { data, error } = await supabase
                .from('profile')
                .select('id, name, surname, user_id')
                .eq('role', 'client')
                .order('name');

            if (!error && data) {
                realClients = data;
            }
        } catch {
            realClients = [];
        }

        const demoClients = DEMO_CHAT_CLIENTS.map(c => ({
            id: c.id,
            name: c.name,
            surname: c.surname,
            user_id: c.id,
            isDemo: true,
        }));

        return [...realClients, ...demoClients];
    },

    /**
     * Obtiene los check-ins de un cliente enriquecidos con el feedback del entrenador
     * y las respuestas del cliente.
     *
     * @param {number|string} clientProfileId - Id del perfil del cliente.
     * @returns {Promise<Array>} Lista de check-ins del cliente.
     */
    async getClientCheckIns(clientProfileId) {
        if (isDemoClientId(clientProfileId)) {
            const demo = getDemoClientById(clientProfileId);
            const demoCheckIns = demo?.checkIns || [];
            return feedbackService.enrichCheckIns(clientProfileId, demoCheckIns);
        }

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
     * @param {number|string} clientProfileId - Id del perfil del cliente.
     * @param {number} checkInId - Id del check-in.
     * @param {string} feedbackText - Texto del feedback.
     * @returns {Promise<Object>} Feedback guardado.
     */
    async saveCheckInFeedback(clientProfileId, checkInId, feedbackText) {
        return feedbackService.saveCoachCheckInFeedback(clientProfileId, checkInId, feedbackText);
    },
};
