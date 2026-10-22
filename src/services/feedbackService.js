import { supabase } from '../supabaseClient.js';
import { getCurrentProfile } from '../utils/auth.js';

const FEEDBACK_MARKER_TITLE = '__AKUMA_FEEDBACK__';
const FEEDBACK_DTSTART = '2000-01-01';
const DEMO_STORAGE_KEY = 'akuma_demo_feedback_chats_v2';

/**
 * Categorías / temas disponibles para etiquetar cada mensaje del chat 1 a 1.
 */
export const FEEDBACK_TOPICS = [
    { id: 'general', label: 'General', icon: '💬', color: '#60a5fa' },
    { id: 'dieta', label: 'Dieta ANEF', icon: '🥗', color: '#10b981' },
    { id: 'entreno', label: 'Entrenamiento', icon: '🏋️', color: '#f59e0b' },
    { id: 'checkin', label: 'Check-In', icon: '📋', color: '#a78bfa' },
    { id: 'ajuste', label: 'Ajuste Semanal', icon: '🎯', color: '#f87171' },
];

/**
 * Plantillas rápidas personalizadas 1 a 1 para el entrenador.
 *
 * @param {string} clientFirstName - Nombre de pila del cliente.
 * @returns {Array<{id: string, label: string, topic: string, text: string}>}
 */
export function getCoachQuickTemplates(clientFirstName = 'campeón/a') {
    const name = clientFirstName || 'atleta';
    return [
        {
            id: 'weekly_praise',
            label: '👏 Gran semana',
            topic: 'checkin',
            text: `¡Hola ${name}! Acabo de revisar tu seguimiento semanal. Muy buen trabajo manteniendo la adherencia. Seguimos con el mismo plan esta semana, ¡a por todas!`,
        },
        {
            id: 'diet_adjust',
            label: '🥗 Ajuste Dieta ANEF',
            topic: 'dieta',
            text: `Hola ${name}, he ajustado tus macros en la Dieta ANEF según tu último peso. Revisa las nuevas cantidades en gramos y recuerda usar las equivalencias si te apetece variar.`,
        },
        {
            id: 'training_overload',
            label: '🏋️ Subir cargas',
            topic: 'entreno',
            text: `¡Buenas ${name}! En la sesión de hoy intenta subir entre 2.5 kg y 5 kg en el ejercicio básico manteniendo RIR 1-2 y cuidando la técnica. Cuéntame qué tal las sensaciones al terminar.`,
        },
        {
            id: 'hunger_energy',
            label: '⚡ Energía y descanso',
            topic: 'ajuste',
            text: `Hola ${name}, ¿cómo vas de energía, hambre y descanso estos días? Si notas fatiga alta ajustamos el volumen o metemos una comida libre controlada.`,
        },
        {
            id: 'checkin_reminder',
            label: '📋 Recordatorio Check-In',
            topic: 'checkin',
            text: `¡Hola ${name}! Recuerda subir hoy tu Check-In semanal y tu peso en ayunas para que pueda revisarlo y planificar tus ajustes de la próxima semana.`,
        },
    ];
}

/**
 * Plantillas rápidas para el cliente al escribir a su entrenador.
 */
export const CLIENT_QUICK_TEMPLATES = [
    {
        id: 'client_workout_done',
        label: '💪 Entreno completado',
        topic: 'entreno',
        text: '¡Entreno de hoy completado! Muy buenas sensaciones y pude mejorar las marcas de la semana pasada.',
    },
    {
        id: 'client_diet_question',
        label: '🥗 Duda con la dieta',
        topic: 'dieta',
        text: 'Hola coach, tengo una duda con una comida de la dieta de hoy: ¿puedo intercambiar el primer plato por una de las equivalencias?',
    },
    {
        id: 'client_checkin_sent',
        label: '📋 Check-In enviado',
        topic: 'checkin',
        text: '¡Hola! Ya he subido mi Check-In semanal y mi peso actualizado en ayunas para cuando puedas revisarlo.',
    },
    {
        id: 'client_fatigue',
        label: '😴 Fatiga / Molestia',
        topic: 'ajuste',
        text: 'Buenas coach, estos últimos días he dormido algo peor y noto más fatiga acumulada. ¿Mantenemos pesos o bajamos un poco la intensidad hoy?',
    },
];

/**
 * Dos clientes completos de prueba 1 a 1 integrados en toda la app (Clientes,
 * Check-Ins, Chat 1:1 y Calculadora de Dieta ANEF).
 */
export const DEMO_CHAT_CLIENTS = [
    {
        id: 'demo-client-1',
        isDemo: true,
        name: 'Carlos',
        surname: 'Pérez',
        fullName: 'Carlos Pérez',
        gender: 'Hombre',
        sex: 'Hombre',
        birthdate: '1997-04-15',
        age: 29,
        weight: 78.4,
        height: 178,
        goal: 'Pérdida de grasa / Definición',
        restrictions: 'Sin lactosa',
        routineName: 'Torso / Pierna Hipertrofia 4 días',
        dietName: 'Dieta ANEF — Definición (2150 kcal)',
        dietAdherence: '90%',
        trainingAdherence: '100%',
        restQuality: 8,
        energyLevel: 8,
        assessment: {
            id: 9001,
            profile_id: 'demo-client-1',
            height: 178,
            initial_weight: 81.2,
            goals: 'Pérdida de grasa y definición muscular manteniendo fuerza en básicos',
            main_goal: 'Pérdida de grasa / Definición',
            current_level: 'Intermedio (3 años entrenando fuerza)',
            training_freq: '4 días por semana (1h intensa)',
            where: 'Gimnasio comercial completo',
            equipment: 'Barras olímpicas, mancuernas, poleas y máquinas',
            current_injuries: 'Ligera molestia en hombro derecho en press trasnuca',
            disease: 'Ninguna',
            medical_restrictions: 'Ninguna',
            current_diet: '4 comidas al día, trabajo de oficina sedentario',
            food_restrictions: 'Sin lactosa',
            created_at: '2026-09-25T10:00:00.000Z',
        },
        measurements: [
            { id: 8001, profile_id: 'demo-client-1', weight: 78.4, weight_kg: 78.4, body_fat: 14.2, created_at: '2026-10-20T08:00:00.000Z' },
            { id: 8002, profile_id: 'demo-client-1', weight: 79.1, weight_kg: 79.1, body_fat: 14.8, created_at: '2026-10-13T08:00:00.000Z' },
            { id: 8003, profile_id: 'demo-client-1', weight: 79.9, weight_kg: 79.9, body_fat: 15.4, created_at: '2026-10-06T08:00:00.000Z' },
        ],
        checkIns: [
            {
                id: 7001,
                profile_id: 'demo-client-1',
                created_at: '2026-10-20T18:30:00.000Z',
                how_do_you_feel: 'Con mucha energía en los entrenos y bajando cintura cada semana.',
                diet_adherence: '90-100%',
                training_adherence: '100%',
                rest_quality: 8,
                energy_level: 8,
                hunger_level: 3,
                gym_performance: 5,
                comments: 'El reparto post-entreno de la dieta ANEF me sienta genial.',
                coach_feedback: '¡Semana de 10 Carlos! Has bajado 0.7 kg manteniendo toda la fuerza. Seguimos en 2150 kcal.',
            },
            {
                id: 7002,
                profile_id: 'demo-client-1',
                created_at: '2026-10-13T18:30:00.000Z',
                how_do_you_feel: 'Buenas sensaciones, algo de agujetas en femoral.',
                diet_adherence: '80-90%',
                training_adherence: '100%',
                rest_quality: 7,
                energy_level: 8,
                hunger_level: 4,
                gym_performance: 4,
                comments: 'El sábado tuve una cena familiar pero cuadré macros durante el día.',
                coach_feedback: 'Muy bien gestionada esa cena libre. Mantén los 2 litros de agua diarios.',
            },
            {
                id: 7003,
                profile_id: 'demo-client-1',
                created_at: '2026-10-06T18:30:00.000Z',
                how_do_you_feel: 'Adaptándome al nuevo bloque de torso-pierna.',
                diet_adherence: '90-100%',
                training_adherence: '90-100%',
                rest_quality: 8,
                energy_level: 7,
                hunger_level: 3,
                gym_performance: 4,
                comments: 'Todo bien con las recetas sin lactosa.',
                coach_feedback: 'Buen arranque de mes Carlos, prioriza la técnica en sentadilla.',
            },
        ],
    },
    {
        id: 'demo-client-2',
        isDemo: true,
        name: 'Laura',
        surname: 'Gómez',
        fullName: 'Laura Gómez',
        gender: 'Mujer',
        sex: 'Mujer',
        birthdate: '2000-08-22',
        age: 26,
        weight: 61.2,
        height: 165,
        goal: 'Ganancia muscular / Volumen limpio',
        restrictions: 'Ninguna',
        routineName: 'Full Body + Énfasis Glúteo/Pierna',
        dietName: 'Dieta ANEF — Volumen (2380 kcal)',
        dietAdherence: '100%',
        trainingAdherence: '100%',
        restQuality: 9,
        energyLevel: 9,
        assessment: {
            id: 9002,
            profile_id: 'demo-client-2',
            height: 165,
            initial_weight: 59.8,
            goals: 'Ganancia de masa muscular (superávit controlado / volumen limpio) y mejorar marcas en tren inferior',
            main_goal: 'Ganancia muscular / Volumen',
            current_level: 'Avanzada (4 años entrenando)',
            training_freq: '5 días por semana (entreno intenso)',
            where: 'Gimnasio completo',
            equipment: 'Completo (peso libre, discos, máquinas y bandas)',
            current_injuries: '',
            disease: '',
            medical_restrictions: '',
            current_diet: '5 comidas al día, estilo de vida activo',
            food_restrictions: 'Ninguna',
            created_at: '2026-09-20T11:30:00.000Z',
        },
        measurements: [
            { id: 8101, profile_id: 'demo-client-2', weight: 61.2, weight_kg: 61.2, body_fat: 19.5, created_at: '2026-10-21T08:15:00.000Z' },
            { id: 8102, profile_id: 'demo-client-2', weight: 60.8, weight_kg: 60.8, body_fat: 19.4, created_at: '2026-10-14T08:15:00.000Z' },
            { id: 8103, profile_id: 'demo-client-2', weight: 60.3, weight_kg: 60.3, body_fat: 19.2, created_at: '2026-10-07T08:15:00.000Z' },
        ],
        checkIns: [
            {
                id: 7101,
                profile_id: 'demo-client-2',
                created_at: '2026-10-21T19:00:00.000Z',
                how_do_you_feel: 'Súper fuerte entrenando, mejorando cargas en Hip Thrust y Sentadilla.',
                diet_adherence: '90-100%',
                training_adherence: '100%',
                rest_quality: 9,
                energy_level: 9,
                hunger_level: 2,
                gym_performance: 5,
                comments: 'Las tortitas de avena del desayuno y el salmón por la noche me encantan.',
                coach_feedback: '¡Enhorabuena Laura! Subida de peso súper limpia (+0.4 kg) y récord personal en Hip Thrust.',
            },
            {
                id: 7102,
                profile_id: 'demo-client-2',
                created_at: '2026-10-14T19:00:00.000Z',
                how_do_you_feel: 'Muy buena recuperación entre sesiones.',
                diet_adherence: '90-100%',
                training_adherence: '100%',
                rest_quality: 8,
                energy_level: 9,
                hunger_level: 3,
                gym_performance: 5,
                comments: 'Llegando sin problema a los 5ratos de comida.',
                coach_feedback: 'Sigue así Laura, la próxima semana subimos 2.5 kg en peso muerto rumano.',
            },
            {
                id: 7103,
                profile_id: 'demo-client-2',
                created_at: '2026-10-07T19:00:00.000Z',
                how_do_you_feel: 'Motivada con el inicio de volumen.',
                diet_adherence: '90-100%',
                training_adherence: '100%',
                rest_quality: 8,
                energy_level: 8,
                hunger_level: 2,
                gym_performance: 4,
                comments: 'Sin molestias articulares.',
                coach_feedback: 'Excelente primera semana del bloque de hipertrofia.',
            },
        ],
    },
];

/**
 * Mensajes iniciales por defecto para los 2 clientes de prueba.
 */
function getInitialDemoMessages() {
    const now = Date.now();
    const hour = 3600 * 1000;
    return {
        'demo-client-1': [
            {
                rowId: 'demo-msg-101',
                profileId: 'demo-client-1',
                kind: 'message',
                topic: 'dieta',
                authorRole: 'coach',
                authorName: 'Entrenador',
                text: '¡Hola Carlos! Ya tienes lista tu nueva Dieta ANEF de Definición ajustada a tus 78.4 kg (2150 kcal con 2.2g/kg de proteína). He tenido en cuenta tu intolerancia a la lactosa en todas las recetas.',
                createdAt: new Date(now - 26 * hour).toISOString(),
                updatedAt: new Date(now - 26 * hour).toISOString(),
            },
            {
                rowId: 'demo-msg-102',
                profileId: 'demo-client-1',
                kind: 'message',
                topic: 'dieta',
                authorRole: 'client',
                authorName: 'Carlos Pérez',
                text: '¡Brutal coach! Ayer probé el pollo con arroz y brócoli y la tortilla de claras con aguacate para cenar. Me quedé súper saciado. ¿El día de pierna puedo meter el batido post-entreno?',
                createdAt: new Date(now - 5 * hour).toISOString(),
                updatedAt: new Date(now - 5 * hour).toISOString(),
            },
            {
                rowId: 'demo-msg-103',
                profileId: 'demo-client-1',
                kind: 'message',
                topic: 'entreno',
                authorRole: 'coach',
                authorName: 'Entrenador',
                text: '¡Sí, exacto! Los días de pierna usa la Equivalencia 1 en la merienda post-entreno que concentra el 30% de las calorías justo después de entrenar.',
                createdAt: new Date(now - 2 * hour).toISOString(),
                updatedAt: new Date(now - 2 * hour).toISOString(),
            },
        ],
        'demo-client-2': [
            {
                rowId: 'demo-msg-201',
                profileId: 'demo-client-2',
                kind: 'checkin_feedback',
                topic: 'checkin',
                authorRole: 'coach',
                authorName: 'Entrenador',
                text: '¡Enhorabuena Laura! Has subido +0.4 kg limpios este mes mejorando repeticiones en sentadilla y hip thrust. Mantenemos las 2380 kcal una semana más.',
                createdAt: new Date(now - 18 * hour).toISOString(),
                updatedAt: new Date(now - 18 * hour).toISOString(),
            },
            {
                rowId: 'demo-msg-202',
                profileId: 'demo-client-2',
                kind: 'message',
                topic: 'entreno',
                authorRole: 'client',
                authorName: 'Laura Gómez',
                text: '¡Muchas gracias! Hoy saqué 4x10 con 95 kg en Hip Thrust sintiendo muchísimo el glúteo. Mañana subo el nuevo check-in sin falta 💪',
                createdAt: new Date(now - 3 * hour).toISOString(),
                updatedAt: new Date(now - 3 * hour).toISOString(),
            },
        ],
    };
}

function loadDemoStore() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return getInitialDemoMessages();
    }
    try {
        const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
        if (!raw) {
            const seed = getInitialDemoMessages();
            window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(raw);
    } catch {
        return getInitialDemoMessages();
    }
}

function saveDemoStore(store) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(store));
    } catch {
        // Ignorar errores de cuota en localStorage
    }
}

export function isDemoClientId(clientProfileId) {
    return typeof clientProfileId === 'string' && clientProfileId.startsWith('demo-client-');
}

export function getDemoClientById(clientProfileId) {
    return DEMO_CHAT_CLIENTS.find(c => String(c.id) === String(clientProfileId)) || null;
}

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
            topic: parsed.topic || (parsed.kind === 'checkin_feedback' || parsed.kind === 'checkin_reply' ? 'checkin' : 'general'),
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
 * Servicio de comunicación y feedback 1 a 1 bidireccional entre Entrenador (Coach) y Cliente.
 */
export const feedbackService = {
    /**
     * Obtiene todo el feedback (respuestas a check-ins y mensajes de seguimiento)
     * de un cliente concreto.
     *
     * @param {number|string} clientProfileId - Id del perfil del cliente.
     * @returns {Promise<{byCheckInId: Object, messages: Array<Object>}>}
     */
    async getFeedbackForClient(clientProfileId) {
        if (!clientProfileId) {
            return { byCheckInId: {}, messages: [] };
        }

        if (isDemoClientId(clientProfileId)) {
            const store = loadDemoStore();
            const demoMessages = store[clientProfileId] || [];
            const byCheckInId = {};
            for (const entry of demoMessages) {
                if (entry.kind === 'checkin_feedback' && entry.checkInId) {
                    byCheckInId[entry.checkInId] = {
                        checkInId: entry.checkInId,
                        coachFeedback: entry.text,
                        coachName: entry.authorName,
                        updatedAt: entry.updatedAt,
                    };
                }
            }
            return {
                byCheckInId,
                messages: demoMessages,
            };
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
     * @param {number|string} clientProfileId - Id del perfil del cliente.
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
     * @param {number|string} clientProfileId - Id del perfil del cliente.
     * @param {number} checkInId - Id del check-in.
     * @param {string} text - Texto del feedback del entrenador.
     * @returns {Promise<Object>} Feedback guardado.
     */
    async saveCoachCheckInFeedback(clientProfileId, checkInId, text) {
        const cleanText = (text || '').trim();
        if (!cleanText) {
            throw new Error('Escribe un mensaje de feedback antes de guardar.');
        }

        const now = new Date().toISOString();

        if (isDemoClientId(clientProfileId)) {
            const payloadObj = {
                rowId: `demo-ci-fb-${checkInId}`,
                profileId: clientProfileId,
                kind: 'checkin_feedback',
                topic: 'checkin',
                checkInId: Number(checkInId),
                authorRole: 'coach',
                authorName: 'Entrenador',
                text: cleanText,
                createdAt: now,
                updatedAt: now,
            };
            const store = loadDemoStore();
            const list = store[clientProfileId] || [];
            store[clientProfileId] = [...list, payloadObj];
            saveDemoStore(store);
            return payloadObj;
        }

        const profile = await getCurrentProfile();
        const authorName = `${profile?.name || 'Entrenador'} ${profile?.surname || ''}`.trim();

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
            topic: 'checkin',
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
            topic: 'checkin',
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
     * Envía un mensaje en el chat 1 a 1 entre Entrenador y Cliente.
     *
     * @param {number|string} clientProfileId - Id del perfil del cliente (si lo envía el cliente, su propio id).
     * @param {string} text - Contenido del mensaje.
     * @param {Object} [options] - Opciones adicionales (`topic`, `overrideRole`, `overrideAuthorName`).
     * @returns {Promise<Object>} Mensaje creado.
     */
    async sendMessage(clientProfileId, text, options = {}) {
        const cleanText = (text || '').trim();
        if (!cleanText) {
            throw new Error('El mensaje no puede estar vacío.');
        }

        const topic = options.topic || 'general';
        const now = new Date().toISOString();

        if (isDemoClientId(clientProfileId)) {
            const demoClient = getDemoClientById(clientProfileId);
            const authorRole = options.overrideRole || 'coach';
            const authorName = options.overrideAuthorName
                || (authorRole === 'coach' ? 'Entrenador' : (demoClient?.fullName || 'Cliente'));

            const demoMsg = {
                rowId: `demo-msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                profileId: clientProfileId,
                kind: 'message',
                topic,
                checkInId: null,
                authorRole,
                authorName,
                text: cleanText,
                createdAt: now,
                updatedAt: now,
            };

            const store = loadDemoStore();
            const currentList = store[clientProfileId] || [];
            store[clientProfileId] = [...currentList, demoMsg];
            saveDemoStore(store);
            return demoMsg;
        }

        const profile = await getCurrentProfile();
        const targetProfileId = Number(clientProfileId || profile.id);
        const authorRole = options.overrideRole || (profile.role === 'coach' ? 'coach' : 'client');
        const authorName = options.overrideAuthorName
            || `${profile.name || ''} ${profile.surname || ''}`.trim()
            || (authorRole === 'coach' ? 'Entrenador' : 'Cliente');

        const payloadObj = {
            kind: 'message',
            topic,
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

    /**
     * Obtiene la lista completa de conversaciones 1 a 1 para el Entrenador,
     * enriquecida con el último mensaje, contador de mensajes y contexto del cliente.
     *
     * @param {boolean} [includeDemo=true] - Si incluir los 2 clientes de prueba interactivos.
     * @returns {Promise<Array<Object>>} Lista de conversaciones ordenadas por actividad reciente.
     */
    async getCoachConversations(includeDemo = true) {
        let realClients;
        try {
            const { data: profiles } = await supabase
                .from('profile')
                .select('id, name, surname, weight_goal, height_cm, sex, birth_date')
                .eq('role', 'client')
                .order('name');

            realClients = profiles || [];
        } catch {
            realClients = [];
        }

        const conversations = [];

        if (realClients.length > 0) {
            const clientIds = realClients.map(c => c.id);

            const [eventsRes, checkInsRes, assessmentsRes, weightsRes, mealPlansRes, routinesRes] = await Promise.all([
                supabase
                    .from('calendar_event')
                    .select('id, profile_id, created_by, title, description, created_at')
                    .in('profile_id', clientIds)
                    .eq('active', false)
                    .eq('title', FEEDBACK_MARKER_TITLE)
                    .order('created_at', { ascending: true }),
                supabase
                    .from('check_in')
                    .select('id, profile_id, diet_adherence, training_adherence, rest_quality, energy_level, created_at')
                    .in('profile_id', clientIds)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('initial_assessment')
                    .select('profile_id, main_goal, food_restrictions, initial_weight')
                    .in('profile_id', clientIds),
                supabase
                    .from('weight_measurement')
                    .select('profile_id, weight_kg, measured_at')
                    .in('profile_id', clientIds)
                    .order('measured_at', { ascending: false }),
                supabase
                    .from('profile_has_meal_plan')
                    .select('profile_id, meal_plan:meal_plan_id(id, title, target_calories)')
                    .in('profile_id', clientIds),
                supabase
                    .from('profile_has_routine')
                    .select('profile_id, routine:routine_id(id, name)')
                    .in('profile_id', clientIds),
            ]);

            const allEvents = (eventsRes.data || [])
                .map(row => parseFeedbackRow(row.description, row))
                .filter(Boolean);

            for (const c of realClients) {
                const clientMsgs = allEvents.filter(m => Number(m.profileId) === Number(c.id));
                const lastMsg = clientMsgs.length > 0 ? clientMsgs[clientMsgs.length - 1] : null;
                const latestCheckIn = (checkInsRes.data || []).find(ci => Number(ci.profile_id) === Number(c.id)) || null;
                const assessment = (assessmentsRes.data || []).find(a => Number(a.profile_id) === Number(c.id)) || null;
                const latestWeight = (weightsRes.data || []).find(w => Number(w.profile_id) === Number(c.id)) || null;
                const assignedMealPlan = (mealPlansRes.data || []).find(mp => Number(mp.profile_id) === Number(c.id))?.meal_plan || null;
                const assignedRoutine = (routinesRes.data || []).find(rt => Number(rt.profile_id) === Number(c.id))?.routine || null;

                const fullName = `${c.name || ''} ${c.surname || ''}`.trim() || `Cliente #${c.id}`;
                const weightVal = latestWeight?.weight_kg ?? assessment?.initial_weight ?? c.weight_goal ?? null;

                conversations.push({
                    id: c.id,
                    isDemo: false,
                    name: c.name || 'Cliente',
                    surname: c.surname || '',
                    fullName,
                    goal: assessment?.main_goal || 'Acondicionamiento físico',
                    weight: weightVal,
                    height: c.height_cm || null,
                    sex: c.sex || null,
                    restrictions: assessment?.food_restrictions || 'Ninguna',
                    routineName: assignedRoutine?.name || 'Sin rutina asignada',
                    dietName: assignedMealPlan
                        ? `${assignedMealPlan.title}${assignedMealPlan.target_calories ? ` (${assignedMealPlan.target_calories} kcal)` : ''}`
                        : 'Sin dieta ANEF asignada',
                    dietPlanId: assignedMealPlan?.id || null,
                    dietAdherence: latestCheckIn?.diet_adherence || '—',
                    trainingAdherence: latestCheckIn?.training_adherence || '—',
                    restQuality: latestCheckIn?.rest_quality ?? '—',
                    energyLevel: latestCheckIn?.energy_level ?? '—',
                    messageCount: clientMsgs.length,
                    lastMessage: lastMsg,
                    needsReply: lastMsg ? lastMsg.authorRole === 'client' : false,
                });
            }
        }

        if (includeDemo || conversations.length === 0) {
            const demoStore = loadDemoStore();
            for (const demoClient of DEMO_CHAT_CLIENTS) {
                const msgs = demoStore[demoClient.id] || [];
                const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                conversations.push({
                    ...demoClient,
                    messageCount: msgs.length,
                    lastMessage: lastMsg,
                    needsReply: lastMsg ? lastMsg.authorRole === 'client' : false,
                });
            }
        }

        return conversations.sort((a, b) => {
            if (a.isDemo !== b.isDemo) return a.isDemo ? 1 : -1;
            const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    },

    /**
     * Suscribe en tiempo real a los mensajes nuevos de un cliente en Supabase.
     *
     * @param {number|string} clientProfileId - Id del perfil del cliente.
     * @param {() => void} onNewEvent - Callback al detectar un cambio.
     * @returns {() => void} Función para cancelar la suscripción.
     */
    subscribeToClientFeedback(clientProfileId, onNewEvent) {
        if (!clientProfileId || isDemoClientId(clientProfileId) || typeof supabase?.channel !== 'function') {
            return () => {};
        }

        try {
            const channel = supabase
                .channel(`feedback-chat-${clientProfileId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'calendar_event',
                        filter: `profile_id=eq.${clientProfileId}`,
                    },
                    () => {
                        if (onNewEvent) onNewEvent();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } catch {
            return () => {};
        }
    },
};
