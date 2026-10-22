import { supabase } from '../supabaseClient.js';
import { getCurrentProfile } from '../utils/auth.js';
import { normalizeNumericFields } from '../utils/data.js';
import { feedbackService, isDemoClientId, getDemoClientById } from './feedbackService.js';

/**
 * Campos numéricos del check-in que se normalizan antes de insertar.
 */
const NUMERIC_FIELDS = ['hunger_level', 'rest_quality', 'gym_performance', 'energy_level'];

/**
 * Servicio de acceso a datos de los check-ins (`check_in`) del usuario actual.
 */
export const checkInService = {
    /**
     * Obtiene los check-ins del perfil actual enriquecidos con el feedback
     * del entrenador, ordenados por fecha descendente.
     *
     * @returns {Promise<Array>} Lista de check-ins.
     */
    async getAll() {
        const profile = await getCurrentProfile();

        if (isDemoClientId(profile.id)) {
            const demo = getDemoClientById(profile.id);
            return feedbackService.enrichCheckIns(profile.id, demo?.checkIns || []);
        }

        const { data, error } = await supabase
            .from('check_in')
            .select('*')
            .eq('profile_id', profile.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return feedbackService.enrichCheckIns(profile.id, data || []);
    },

    /**
     * Crea un check-in para el perfil actual, normalizando sus campos numéricos.
     *
     * @param {Object} checkInData - Datos del check-in.
     */
    async create(checkInData) {
        const profile = await getCurrentProfile();
        if (isDemoClientId(profile.id)) {
            const demo = getDemoClientById(profile.id);
            if (demo) {
                demo.checkIns = [
                    {
                        id: Date.now(),
                        profile_id: profile.id,
                        created_at: new Date().toISOString(),
                        ...normalizeNumericFields(checkInData, NUMERIC_FIELDS),
                    },
                    ...(demo.checkIns || []),
                ];
            }
            return;
        }

        const payload = normalizeNumericFields(
            { ...checkInData, profile_id: profile.id },
            NUMERIC_FIELDS
        );

        const { error } = await supabase.from('check_in').insert(payload);
        if (error) throw new Error(error.message);
    },

    /**
     * Obtiene el historial completo de mensajes de feedback entre el cliente actual y su entrenador.
     *
     * @returns {Promise<Array>} Lista de mensajes de feedback.
     */
    async getFeedbackMessages() {
        const profile = await getCurrentProfile();
        const { messages } = await feedbackService.getFeedbackForClient(profile.id);
        return messages;
    },

    /**
     * Envía un mensaje o duda directa del cliente a su entrenador.
     *
     * @param {string} text - Mensaje del cliente.
     * @returns {Promise<Object>} Mensaje enviado.
     */
    async sendFeedbackToCoach(text) {
        const profile = await getCurrentProfile();
        return feedbackService.sendMessage(profile.id, text, { overrideRole: 'client' });
    },

    /**
     * Envía una respuesta del cliente al feedback de un check-in concreto.
     *
     * @param {number} checkInId - Id del check-in.
     * @param {string} text - Respuesta del cliente.
     * @returns {Promise<Object>} Respuesta enviada.
     */
    async replyToCheckInFeedback(checkInId, text) {
        const profile = await getCurrentProfile();
        if (isDemoClientId(profile.id)) {
            return feedbackService.sendMessage(profile.id, text, {
                topic: 'checkin',
                overrideRole: 'client',
            });
        }
        return feedbackService.saveClientCheckInReply(checkInId, text);
    },
};
