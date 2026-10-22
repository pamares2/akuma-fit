import { supabase } from '../supabaseClient.js';
import { isDemoClientId } from './feedbackService.js';
import { getDemoRoutineById } from '../data/demoClientPlans.js';

function getDemoActiveSessionKey(profileId) {
    return `akuma_demo_active_session_${profileId}`;
}

function getDemoSessionKey(sessionId) {
    return `akuma_demo_session_${sessionId}`;
}

function readStorage(key) {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writeStorage(key, val) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        if (val === null) {
            window.localStorage.removeItem(key);
        } else {
            window.localStorage.setItem(key, JSON.stringify(val));
        }
    } catch {
        // Ignore storage errors
    }
}

/**
 * Servicio de acceso a datos de las sesiones de entrenamiento
 * (`training_session`).
 */
export const sessionService = {
    /**
     * Obtiene la sesión activa de un perfil, si existe.
     *
     * @param {number|string} profileId - Id del perfil.
     * @returns {Promise<Object|null>} Sesión activa o `null`.
     */
    async getActive(profileId) {
        if (isDemoClientId(profileId)) {
            const active = readStorage(getDemoActiveSessionKey(profileId));
            if (active && active.status === 'active') {
                return active;
            }
            return null;
        }

        const { data, error } = await supabase
            .from('training_session')
            .select('id, routine_id, started_at, routine(id, title)')
            .eq('profile_id', profileId)
            .eq('status', 'active')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return data || null;
    },

    /**
     * Crea una sesión de entrenamiento para un perfil y una rutina.
     *
     * @param {number|string} profileId - Id del perfil.
     * @param {Object} routine - Rutina (con `id`).
     * @returns {Promise<Object>} Sesión creada.
     */
    async create(profileId, routine) {
        if (isDemoClientId(profileId)) {
            const now = new Date().toISOString();
            const sessionId = `demo-session-${Date.now()}`;
            const fullRoutine = getDemoRoutineById(routine.id) || routine;

            const completedExercise = (fullRoutine.exercises || []).map((ex, exIdx) => ({
                id: `demo-comp-ex-${exIdx + 1}-${Date.now()}`,
                session_id: sessionId,
                exercise_template_id: ex.id,
                exercise_order: exIdx + 1,
                completed: false,
                completed_at: null,
                rpe: null,
                completed_set: (ex.sets || []).map((s, sIdx) => ({
                    id: `demo-comp-set-${exIdx + 1}-${sIdx + 1}-${Date.now()}`,
                    completed_exercise_id: `demo-comp-ex-${exIdx + 1}-${Date.now()}`,
                    set_order: s.order || (sIdx + 1),
                    reps_completed: s.reps || '',
                    kg_used: s.kg || '',
                    type: s.type || 'Normal',
                })),
            }));

            const session = {
                id: sessionId,
                profile_id: profileId,
                routine_id: fullRoutine.id,
                routine: { id: fullRoutine.id, title: fullRoutine.title },
                started_at: now,
                status: 'active',
                completed: false,
                completed_exercise: completedExercise,
            };

            writeStorage(getDemoSessionKey(sessionId), session);
            writeStorage(getDemoActiveSessionKey(profileId), session);

            return {
                id: session.id,
                routine_id: session.routine_id,
                started_at: session.started_at,
                routine: session.routine,
            };
        }

        const { data: session, error } = await supabase
            .rpc('create_training_session', {
                p_profile_id: profileId,
                p_routine_id: routine.id,
            })
            .select('id, routine_id, started_at')
            .single();

        if (error) throw new Error(error.message);
        return session;
    },

    /**
     * Carga una sesión completa con sus ejercicios y series completados.
     *
     * @param {number|string} sessionId - Id de la sesión.
     * @returns {Promise<Object|null>} Sesión completa o `null`.
     */
    async loadFull(sessionId) {
        if (String(sessionId).startsWith('demo-session-')) {
            const session = readStorage(getDemoSessionKey(sessionId));
            return session || null;
        }

        const { data, error } = await supabase
            .from('training_session')
            .select(`
                *,
                routine(id, title),
                completed_exercise(
                    *,
                    completed_set(*)
                )
            `)
            .eq('id', sessionId)
            .order('exercise_order', { referencedTable: 'completed_exercise' })
            .order('set_order', { referencedTable: 'completed_exercise.completed_set' })
            .maybeSingle();

        if (error) throw new Error(error.message);
        return data || null;
    },

    /**
     * Guarda (upsert) una serie completada de un ejercicio de la sesión.
     *
     * @param {number|string} completedExerciseId - Id del ejercicio completado.
     * @param {number} setOrder - Orden de la serie.
     * @param {Object} values - Valores (`reps`, `kg`, `type`).
     */
    async saveSet(completedExerciseId, setOrder, values) {
        if (String(completedExerciseId).startsWith('demo-comp-ex-')) {
            // Find in localStorage sessions
            if (typeof window !== 'undefined' && window.localStorage) {
                for (let i = 0; i < window.localStorage.length; i++) {
                    const k = window.localStorage.key(i);
                    if (k && k.startsWith('akuma_demo_session_')) {
                        const s = readStorage(k);
                        if (s && s.completed_exercise) {
                            const ex = s.completed_exercise.find(e => e.id === completedExerciseId);
                            if (ex) {
                                let set = ex.completed_set.find(item => item.set_order === setOrder);
                                if (!set) {
                                    set = { id: `demo-set-${Date.now()}`, set_order: setOrder };
                                    ex.completed_set.push(set);
                                }
                                set.reps_completed = values.reps;
                                set.kg_used = values.kg;
                                set.type = values.type;
                                writeStorage(k, s);
                                if (s.profile_id) {
                                    writeStorage(getDemoActiveSessionKey(s.profile_id), s);
                                }
                                return;
                            }
                        }
                    }
                }
            }
            return;
        }

        const { error } = await supabase
            .from('completed_set')
            .upsert({
                completed_exercise_id: completedExerciseId,
                set_order: setOrder,
                reps_completed: values.reps,
                kg_used: values.kg,
                type: values.type,
            }, { onConflict: 'completed_exercise_id,set_order' });

        if (error) throw new Error(error.message);
    },

    /**
     * Marca un ejercicio como completado (o no), registrando el RPE.
     *
     * @param {number|string} completedExerciseId - Id del ejercicio completado.
     * @param {boolean} completed - Estado de completado.
     * @param {number} [rpe] - Esfuerzo percibido (RPE).
     */
    async setExerciseCompleted(completedExerciseId, completed, rpe) {
        if (String(completedExerciseId).startsWith('demo-comp-ex-')) {
            if (typeof window !== 'undefined' && window.localStorage) {
                for (let i = 0; i < window.localStorage.length; i++) {
                    const k = window.localStorage.key(i);
                    if (k && k.startsWith('akuma_demo_session_')) {
                        const s = readStorage(k);
                        if (s && s.completed_exercise) {
                            const ex = s.completed_exercise.find(e => e.id === completedExerciseId);
                            if (ex) {
                                ex.completed = completed;
                                ex.completed_at = completed ? new Date().toISOString() : null;
                                if (rpe !== undefined) ex.rpe = rpe;
                                writeStorage(k, s);
                                if (s.profile_id) {
                                    writeStorage(getDemoActiveSessionKey(s.profile_id), s);
                                }
                                return;
                            }
                        }
                    }
                }
            }
            return;
        }

        const { error } = await supabase
            .from('completed_exercise')
            .update({
                completed,
                completed_at: completed ? new Date().toISOString() : null,
                ...(rpe !== undefined ? { rpe } : {}),
            })
            .eq('id', completedExerciseId);

        if (error) throw new Error(error.message);
    },

    /**
     * Finaliza una sesión, registrando el feedback (sensación y notas).
     *
     * @param {number|string} sessionId - Id de la sesión.
     * @param {Object} [feedback] - Feedback (`feeling`, `notes`).
     */
    async finish(sessionId, feedback = {}) {
        if (String(sessionId).startsWith('demo-session-')) {
            const s = readStorage(getDemoSessionKey(sessionId));
            if (s) {
                s.status = 'completed';
                s.completed = true;
                s.ended_at = new Date().toISOString();
                s.feeling = feedback.feeling ?? null;
                s.notes = feedback.notes ?? null;
                writeStorage(getDemoSessionKey(sessionId), s);
                if (s.profile_id) {
                    writeStorage(getDemoActiveSessionKey(s.profile_id), null);
                }
            }
            return;
        }

        const { error } = await supabase
            .from('training_session')
            .update({
                status: 'completed',
                completed: true,
                ended_at: new Date().toISOString(),
                feeling: feedback.feeling ?? null,
                notes: feedback.notes ?? null,
            })
            .eq('id', sessionId);

        if (error) throw new Error(error.message);
    },

    /**
     * Cancela una sesión.
     *
     * @param {number|string} sessionId - Id de la sesión.
     */
    async cancel(sessionId) {
        if (String(sessionId).startsWith('demo-session-')) {
            const s = readStorage(getDemoSessionKey(sessionId));
            if (s) {
                s.status = 'cancelled';
                s.ended_at = new Date().toISOString();
                writeStorage(getDemoSessionKey(sessionId), s);
                if (s.profile_id) {
                    writeStorage(getDemoActiveSessionKey(s.profile_id), null);
                }
            }
            return;
        }

        const { error } = await supabase
            .from('training_session')
            .update({
                status: 'cancelled',
                ended_at: new Date().toISOString(),
            })
            .eq('id', sessionId);

        if (error) throw new Error(error.message);
    },
};
