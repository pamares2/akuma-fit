import { supabase } from '../supabaseClient.js';
import { getCurrentProfile } from '../utils/auth.js';

const FEEDBACK_MARKER_TITLE = '__AKUMA_FEEDBACK__';
const FEEDBACK_DTSTART = '2000-01-01';

/**
 * Parsea de forma segura el JSON almacenado en `description`.
 *
 * @param {string} raw - Cadena JSON.
 * @param {Object} fallbackRow - Fila original de `calendar_event`.
 * @returns {Object|null} Objeto de feedback normalizado.
 */
function parseFeedbackRow(raw, fallbackRow) {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return {
            rowId: fallbackRow.id,
            profileId: fallbackRow.profile_id,
            createdBy: fallbackRow.created_by,
            kind: parsed.kind || 'message',
            checkInId: parsed.checkInId ? Number(parsed.checkInId) : null,
            authorRole: parsed.authorRole || 'coach',
            authorName: parsed.authorName || (parsed.authorRole === 'coach' ? 'Entrenador' : 'Cliente'),
            text: (parsed.text || '').trim(),
            createdAt: parsed.createdAt || fallbackRow.created_at,
            updatedAt: parsed.updatedAt || parsed.createdAt || fallbackRow.created_at,
        };
    } catch {
        return null;
    }
}

/**
 * Servicio de comunicación y feedback bidireccional entre Entrenador (Coach) y Cliente.
 *
 * Persiste tanto el feedback estructurado de cada Check-In como el hilo de
 * mensajes directos de seguimiento entre entrenador y atleta en Supabase.
 */
export const feedbackService = {
    /**
     * Obtiene todo el feedback (respuestas a check-ins y mensajes de seguimiento)
     * de un cliente concreto.
     *
     * @param {number} clientProfileId - Id del perfil del cliente.
     * @returns {Promise<{byCheckInId: Object, messages: Array<Object>}>}
     */
    async getFeedbackForClient(clientProfileId) {
        if (!clientProfileId) {
            return { byCheckInId: {}, messages: [] };
        }

        const { data, error } = await supabase
            .from('calendar_event')
            .select('id, profile_id, created_by, title, description, created_at')
            .eq('profile_id', clientProfileId)
            .eq('active', false)
            .eq('title', FEEDBACK_MARKER_TITLE)
            .order('created_at', { ascending: true });

        if (error) {
            console.warn('Error cargando feedback:', error.message);
            return { byCheckInId: {}, messages: [] };
        }

        const entries = (data || [])
            .map(row => parseFeedbackRow(row.description, row))
            .filter(item => item && item.text);

        const byCheckInId = {};
        for (const entry of entries) {
            if (entry.kind === 'checkin_feedback' && entry.checkInId) {
                byCheckInId[entry.checkInId] = {
                    ...(byCheckInId[entry.checkInId] || {}),
                    rowId: entry.rowId,
                    checkInId: entry.checkInId,
                    coachFeedback: entry.text,
                    coachName: entry.authorName,
                    updatedAt: entry.updatedAt,
                };
            } else if (entry.kind === 'checkin_reply' && entry.checkInId) {
                byCheckInId[entry.checkInId] = {
                    ...(byCheckInId[entry.checkInId] || {}),
                    checkInId: entry.checkInId,
                    clientReply: entry.text,
                    clientName: entry.authorName,
                    clientReplyAt: entry.updatedAt,
                };
            }
        }

        return {
            byCheckInId,
            messages: entries,
        };
    },

    /**
     * Enriquece una lista de check-ins con los campos `coach_feedback`,
     * `coach_feedback_at` y `client_reply`.
     *
     * @param {number} clientProfileId - Id del perfil del cliente.
     * @param {Array<Object>} checkIns - Lista de check-ins.
     * @returns {Promise<Array<Object>>} Check-ins enriquecidos.
     */
    async enrichCheckIns(clientProfileId, checkIns) {
        if (!checkIns || checkIns.length === 0) return [];

        const { byCheckInId } = await this.getFeedbackForClient(clientProfileId);

        return checkIns.map(ci => {
            const fb = byCheckInId[ci.id] || {};
            return {
                ...ci,
                coach_feedback: fb.coachFeedback || ci.coach_feedback || null,
                coach_feedback_at: fb.updatedAt || ci.coach_feedback_at || null,
                coach_name: fb.coachName || 'Tu Entrenador',
                client_reply: fb.clientReply || null,
                client_reply_at: fb.clientReplyAt || null,
            };
        });
    },

    /**
     * Guarda o actualiza el feedback del entrenador sobre un check-in concreto.
     *
     * @param {number} clientProfileId - Id del perfil del cliente.
     * @param {number} checkInId - Id del check-in.
     * @param {string} text - Texto del feedback del entrenador.
     * @returns {Promise<Object>} Feedback guardado.
     */
    async saveCoachCheckInFeedback(clientProfileId, checkInId, text) {
        const cleanText = (text || '').trim();
        if (!cleanText) {
            throw new Error('Escribe un mensaje de feedback antes de guardar.');
        }

        const profile = await getCurrentProfile();
        const authorName = `${profile?.name || 'Entrenador'} ${profile?.surname || ''}`.trim();
        const now = new Date().toISOString();

        // Intentar actualizar columna nativa `coach_feedback` si existe en la BD
        await supabase
            .from('check_in')
            .update({ coach_feedback: cleanText })
            .eq('id', checkInId)
            .then(() => {})
            .catch(() => {});

        const { byCheckInId } = await this.getFeedbackForClient(clientProfileId);
        const existing = byCheckInId[Number(checkInId)];

        const payloadObj = {
            kind: 'checkin_feedback',
            checkInId: Number(checkInId),
            authorRole: 'coach',
            authorName,
            text: cleanText,
            createdAt: now,
            updatedAt: now,
        };

        if (existing?.rowId) {
            const { error } = await supabase
                .from('calendar_event')
                .update({ description: JSON.stringify(payloadObj) })
                .eq('id', existing.rowId);

            if (error) throw new Error(error.message);
            return payloadObj;
        }

        const { error } = await supabase
            .from('calendar_event')
            .insert({
                profile_id: Number(clientProfileId),
                created_by: profile.id,
                event_type: 'info',
                title: FEEDBACK_MARKER_TITLE,
                description: JSON.stringify(payloadObj),
                dtstart: FEEDBACK_DTSTART,
                active: false,
            });

        if (error) throw new Error(error.message);
        return payloadObj;
    },

    /**
     * Guarda la respuesta o comentario del cliente al feedback de un check-in.
     *
     * @param {number} checkInId - Id del check-in.
     * @param {string} text - Respuesta del cliente.
     * @returns {Promise<Object>} Respuesta guardada.
     */
    async saveClientCheckInReply(checkInId, text) {
        const cleanText = (text || '').trim();
        if (!cleanText) {
            throw new Error('Escribe tu respuesta antes de enviar.');
        }

        const profile = await getCurrentProfile();
        const authorName = `${profile?.name || 'Cliente'} ${profile?.surname || ''}`.trim();
        const now = new Date().toISOString();

        const payloadObj = {
            kind: 'checkin_reply',
            checkInId: Number(checkInId),
            authorRole: 'client',
            authorName,
            text: cleanText,
            createdAt: now,
            updatedAt: now,
        };

        const { error } = await supabase
            .from('calendar_event')
            .insert({
                profile_id: profile.id,
                created_by: profile.id,
                event_type: 'info',
                title: FEEDBACK_MARKER_TITLE,
                description: JSON.stringify(payloadObj),
                dtstart: FEEDBACK_DTSTART,
                active: false,
            });

        if (error) throw new Error(error.message);
        return payloadObj;
    },

    /**
     * Envía un mensaje en el canal de feedback directo entre Entrenador y Cliente.
     *
     * @param {number} clientProfileId - Id del perfil del cliente (si lo envía el cliente, su propio id).
     * @param {string} text - Contenido del mensaje.
     * @returns {Promise<Object>} Mensaje creado.
     */
    async sendMessage(clientProfileId, text) {
        const cleanText = (text || '').trim();
        if (!cleanText) {
            throw new Error('El mensaje no puede estar vacío.');
        }

        const profile = await getCurrentProfile();
        const targetProfileId = Number(clientProfileId || profile.id);
        const authorRole = profile.role === 'coach' ? 'coach' : 'client';
        const authorName = `${profile.name || ''} ${profile.surname || ''}`.trim()
            || (authorRole === 'coach' ? 'Entrenador' : 'Cliente');
        const now = new Date().toISOString();

        const payloadObj = {
            kind: 'message',
            checkInId: null,
            authorRole,
            authorName,
            text: cleanText,
            createdAt: now,
            updatedAt: now,
        };

        const { error } = await supabase
            .from('calendar_event')
            .insert({
                profile_id: targetProfileId,
                created_by: profile.id,
                event_type: 'info',
                title: FEEDBACK_MARKER_TITLE,
                description: JSON.stringify(payloadObj),
                dtstart: FEEDBACK_DTSTART,
                active: false,
            });

        if (error) throw new Error(error.message);
        return payloadObj;
    },
};
