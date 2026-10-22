import { supabase } from '../supabaseClient.js';
import { buildCompletions, fromISODate } from '../utils/calendar.js';
import { isDemoClientId, getDemoClientById } from './feedbackService.js';
import {
    isDemoEventId,
    getDemoCalendarData,
    createDemoCalendarEvent,
    updateDemoCalendarEvent,
    removeDemoCalendarEvent,
    cancelDemoCalendarOccurrence,
    modifyDemoCalendarOccurrence,
    getDemoClientPhotos,
} from '../data/demoClientPlans.js';

/**
 * Servicio de acceso a datos del módulo de eventos/calendario.
 *
 * Trabaja con dos entidades:
 * - `calendar_event`: el evento "maestro" que contiene la regla de recurrencia
 *   (RRULE) o es un evento único (`freq` nulo).
 * - `calendar_event_exception`: excepciones por ocurrencia (EXDATE /
 *   RECURRENCE-ID), que cancelan o modifican una instancia concreta de una serie.
 *
 * Los métodos reciben/ devuelven objetos en camelCase en la capa de UI y se
 * mapean a las columnas snake_case de Supabase.
 */

/** Selección de maestros incluyendo la rutina embebida (título). */
const EVENT_SELECT = '*, routine(id, title)';

/** Convierte un valor de formulario a número o `null` si está vacío. */
const toNumber = (value) => (value === '' || value === undefined || value === null ? null : Number(value));

/**
 * Mapea el payload camelCase de creación a las columnas de `calendar_event`.
 */
const buildMasterPayload = (data) => ({
    profile_id: data.profileId,
    created_by: data.createdBy,
    event_type: data.eventType,
    title: data.title,
    description: data.description || null,
    dtstart: data.dtstart,
    start_time: data.startTime || null,
    freq: data.freq || null,
    recurrence_interval: toNumber(data.interval) || 1,
    byday: toNumber(data.byday),
    bymonthday: toNumber(data.bymonthday),
    bymonth: toNumber(data.bymonth),
    count: toNumber(data.count),
    until: data.until || null,
    routine_id: data.routineId || null,
});

/** Mapea claves camelCase (parciales) a columnas para `update`. */
const MASTER_FIELD_MAP = {
    title: 'title',
    description: 'description',
    startTime: 'start_time',
    dtstart: 'dtstart',
    freq: 'freq',
    interval: 'recurrence_interval',
    byday: 'byday',
    bymonthday: 'bymonthday',
    bymonth: 'bymonth',
    count: 'count',
    until: 'until',
    routineId: 'routine_id',
};

export const eventService = {
    /**
     * Devuelve los maestros activos de un cliente y sus excepciones.
     *
     * @param {number|string} profileId - Id del perfil del cliente.
     * @returns {Promise<{events: Array<Object>, exceptions: Array<Object>}>}
     */
    async getByClient(profileId) {
        if (isDemoClientId(profileId)) {
            return getDemoCalendarData(profileId);
        }

        const { data: events, error } = await supabase
            .from('calendar_event')
            .select(EVENT_SELECT)
            .eq('profile_id', profileId)
            .eq('active', true)
            .order('dtstart', { ascending: true });

        if (error) throw new Error(error.message);

        const masters = events || [];
        const ids = masters.map((e) => e.id);

        let exceptions = [];
        if (ids.length > 0) {
            const { data: exData, error: exError } = await supabase
                .from('calendar_event_exception')
                .select('*')
                .in('event_id', ids);

            if (exError) throw new Error(exError.message);
            exceptions = exData || [];
        }

        return { events: masters, exceptions };
    },

    /**
     * Devuelve el estado "hecho" de las tareas de un cliente en un rango de
     * fechas, agrupado por semana/mes/rutina (ver `buildCompletions`).
     *
     * @param {number|string} profileId - Id del perfil del cliente.
     * @param {{from: string, to: string}} range - Rango ISO a consultar.
     * @returns {Promise<Object>} Resultado de `buildCompletions`.
     */
    async getCompletions(profileId, { from, to }) {
        if (isDemoClientId(profileId)) {
            const demo = getDemoClientById(profileId);
            const measurements = demo?.measurements || [];
            const checkIns = demo?.checkIns || [];
            const photos = getDemoClientPhotos(profileId);
            return buildCompletions({ measurements, checkIns, photos, sessions: [] });
        }

        const fromDate = fromISODate(from);
        const toDate = fromISODate(to);
        toDate.setHours(23, 59, 59, 999);

        const fromIso = fromDate.toISOString();
        const toIso = toDate.toISOString();

        const [
            { data: measurements, error: mErr },
            { data: checkIns, error: cErr },
            { data: photos, error: pErr },
            { data: sessions, error: sErr },
        ] = await Promise.all([
            supabase
                .from('measurement')
                .select('created_at')
                .eq('profile_id', profileId)
                .gte('created_at', fromIso)
                .lte('created_at', toIso),
            supabase
                .from('check_in')
                .select('created_at')
                .eq('profile_id', profileId)
                .gte('created_at', fromIso)
                .lte('created_at', toIso),
            supabase
                .from('body_photo')
                .select('taken_at')
                .eq('profile_id', profileId)
                .gte('taken_at', from)
                .lte('taken_at', to),
            supabase
                .from('training_session')
                .select('routine_id, started_at')
                .eq('profile_id', profileId)
                .eq('status', 'completed')
                .gte('started_at', fromIso)
                .lte('started_at', toIso),
        ]);

        if (mErr || cErr || pErr || sErr) {
            throw new Error((mErr || cErr || pErr || sErr).message);
        }

        return buildCompletions({ measurements, checkIns, photos, sessions });
    },

    /**
     * Crea un maestro de evento (único o recurrente).
     *
     * @param {Object} data - Datos camelCase del evento.
     * @returns {Promise<Object>} Fila creada.
     */
    async create(data) {
        if (isDemoClientId(data.profileId)) {
            return createDemoCalendarEvent(data);
        }

        const { data: created, error } = await supabase
            .from('calendar_event')
            .insert(buildMasterPayload(data))
            .select()
            .single();

        if (error) throw new Error(error.message);
        return created;
    },

    /**
     * Actualiza parcialmente un maestro. Solo mapea los campos reconocidos en
     * {@link MASTER_FIELD_MAP} y presentes en `patch`.
     *
     * @param {number} id - Id del maestro.
     * @param {Object} patch - Campos a actualizar (camelCase).
     */
    async update(id, patch) {
        if (isDemoEventId(id)) {
            updateDemoCalendarEvent(id, patch);
            return;
        }

        const payload = {};
        Object.entries(patch).forEach(([key, value]) => {
            if (MASTER_FIELD_MAP[key] && value !== undefined) {
                payload[MASTER_FIELD_MAP[key]] = value;
            }
        });

        const { error } = await supabase
            .from('calendar_event')
            .update(payload)
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    /**
     * Desactiva un maestro (soft delete de toda la serie).
     *
     * @param {number} id - Id del maestro.
     */
    async remove(id) {
        if (isDemoEventId(id)) {
            removeDemoCalendarEvent(id);
            return;
        }

        const { error } = await supabase
            .from('calendar_event')
            .update({ active: false })
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    /**
     * Cancela una ocurrencia concreta de una serie (EXDATE).
     *
     * @param {number} eventId - Id del maestro.
     * @param {string} date - Fecha ISO de la ocurrencia.
     */
    async cancelOccurrence(eventId, date) {
        if (isDemoEventId(eventId)) {
            cancelDemoCalendarOccurrence(eventId, date);
            return;
        }

        const { error } = await supabase
            .from('calendar_event_exception')
            .upsert(
                { event_id: eventId, recurrence_id: date, status: 'cancelled' },
                { onConflict: 'event_id,recurrence_id' }
            );

        if (error) throw new Error(error.message);
    },

    /**
     * Modifica una ocurrencia concreta de una serie (RECURRENCE-ID override).
     *
     * @param {number} eventId - Id del maestro.
     * @param {string} date - Fecha ISO de la ocurrencia.
     * @param {Object} fields - Campos sobrescritos (`title`, `description`,
     *   `startTime`, `newDate`).
     */
    async modifyOccurrence(eventId, date, fields) {
        if (isDemoEventId(eventId)) {
            modifyDemoCalendarOccurrence(eventId, date, fields);
            return;
        }

        const { error } = await supabase
            .from('calendar_event_exception')
            .upsert(
                {
                    event_id: eventId,
                    recurrence_id: date,
                    status: 'modified',
                    title: fields.title ?? null,
                    description: fields.description ?? null,
                    new_start_time: fields.startTime ?? null,
                    new_date: fields.newDate ?? null,
                },
                { onConflict: 'event_id,recurrence_id' }
            );

        if (error) throw new Error(error.message);
    },

    /**
     * Parte una serie en dos ("esta y las siguientes"): corta el maestro
     * original con `until` justo antes de `fromDate` y crea un maestro nuevo a
     * partir de esa fecha con los cambios. Lo hace de forma atómica mediante
     * la función Postgres `split_calendar_event`.
     *
     * @param {Object} original - Maestro original (incluye sus columnas).
     * @param {string} fromDate - Fecha ISO de la ocurrencia de corte.
     * @param {Object} changes - Cambios a aplicar a la nueva serie (camelCase).
     * @returns {Promise<number>} Id del nuevo maestro.
     */
    async splitSeries(original, fromDate, changes) {
        if (isDemoEventId(original.id)) {
            updateDemoCalendarEvent(original.id, { until: fromDate });
            const created = createDemoCalendarEvent({
                profileId: original.profile_id,
                eventType: original.event_type,
                title: changes.title ?? original.title,
                description: changes.description ?? original.description,
                startTime: changes.startTime !== undefined ? changes.startTime : original.start_time,
                freq: changes.freq ?? original.freq,
                interval: changes.interval ?? original.recurrence_interval ?? 1,
                byday: changes.byday ?? original.byday,
                bymonthday: changes.bymonthday ?? original.bymonthday,
                bymonth: changes.bymonth ?? original.bymonth,
                count: changes.count ?? original.count,
                until: changes.until ?? original.until,
                dtstart: fromDate,
                routineId: changes.routineId ?? original.routine_id,
            });
            return created.id;
        }

        const { data, error } = await supabase
            .rpc('split_calendar_event', {
                p_event_id: original.id,
                p_from_date: fromDate,
                p_title: changes.title ?? original.title,
                p_description: changes.description ?? original.description,
                p_start_time: changes.startTime !== undefined ? changes.startTime : original.start_time,
                p_freq: changes.freq ?? original.freq,
                p_interval: changes.interval ?? original.recurrence_interval ?? 1,
                p_byday: changes.byday ?? original.byday,
                p_bymonthday: changes.bymonthday ?? original.bymonthday,
                p_bymonth: changes.bymonth ?? original.bymonth,
                p_count: changes.count ?? original.count,
                p_until: changes.until ?? original.until,
                p_routine_id: changes.routineId ?? original.routine_id,
            });

        if (error) throw new Error(error.message);
        return data;
    },
};
