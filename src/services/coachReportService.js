import { supabase } from '../supabaseClient.js';
import {
    DEMO_CHAT_CLIENTS,
    isDemoClientId,
    getDemoClientById,
} from './feedbackService.js';

/**
 * Servicio de acceso a datos para los reportes del coach (clientes, medidas
 * y fotos).
 */
export const coachReportService = {
    /**
     * Obtiene la lista de clientes (incluyendo los 2 clientes de prueba).
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
     * Obtiene las medidas de un cliente, ordenadas por fecha ascendente.
     *
     * @param {number|string} profileId - Id del perfil del cliente.
     * @returns {Promise<Array>} Lista de medidas.
     */
    async getMeasurements(profileId) {
        if (isDemoClientId(profileId)) {
            const demo = getDemoClientById(profileId);
            const list = [...(demo?.measurements || [])];
            return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }

        const { data, error } = await supabase
            .from('measurement')
            .select('*')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * Obtiene las fotos corporales de un cliente, ordenadas por fecha descendente.
     *
     * @param {number|string} profileId - Id del perfil del cliente.
     * @returns {Promise<Array>} Lista de fotos.
     */
    async getPhotos(profileId) {
        if (isDemoClientId(profileId)) {
            return [];
        }

        const { data, error } = await supabase
            .from('body_photo')
            .select('*')
            .eq('profile_id', profileId)
            .order('taken_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data || [];
    },
};
