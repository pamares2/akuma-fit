import { supabase } from '../supabaseClient.js';
import { DEMO_CHAT_CLIENTS } from './feedbackService.js';
import { isClientDeleted } from '../utils/deletedClients.js';

const ADHERENCE_MAP = {
    'Totalmente': 100,
    'Parcialmente': 50,
    'Nada': 0,
};

const calculateAdherence = (checkIns, field) => {
    const values = checkIns
        .map(ci => ADHERENCE_MAP[ci[field]])
        .filter(v => v !== undefined);
    return values.length > 0
        ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
        : null;
};

function getLocalCompletedDemoSessions() {
    if (DEMO_CHAT_CLIENTS.length === 0) return [];
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const sessions = [];
    try {
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && key.startsWith('akuma_demo_session_')) {
                const raw = window.localStorage.getItem(key);
                if (raw) {
                    const s = JSON.parse(raw);
                    if (s && s.status === 'completed') {
                        const client = DEMO_CHAT_CLIENTS.find(c => c.id === s.profile_id);
                        const clientName = client ? `${client.name} ${client.surname}` : 'Cliente';
                        const routineTitle = s.routine?.title || 'Entrenamiento';
                        const feelingLabel = s.feeling ? ` · Sensación: ${s.feeling}` : '';
                        sessions.push({
                            text: `${clientName} - ${routineTitle}${feelingLabel}`,
                            time: new Date(s.ended_at || s.started_at || Date.now()).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                            }),
                            timestamp: new Date(s.ended_at || s.started_at || Date.now()).getTime(),
                        });
                    }
                }
            }
        }
    } catch {
        // Ignore storage errors
    }
    return sessions;
}

export const dashboardService = {
    async getStats() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        let activeClients = 0;
        let weeklyCheckIns = 0;

        try {
            const [{ data: clientsData }, { data: checkInsData }] = await Promise.all([
                supabase
                    .from('profile')
                    .select('id, name, surname')
                    .eq('role', 'client'),
                supabase
                    .from('check_in')
                    .select('id, profile_id')
                    .gte('created_at', oneWeekAgo.toISOString()),
            ]);
            const validClients = (clientsData || []).filter(c => !isClientDeleted(c.id, `${c.name || ''} ${c.surname || ''}`));
            const validClientIds = new Set(validClients.map(c => c.id));
            const validCheckIns = (checkInsData || []).filter(ci => validClientIds.has(ci.profile_id));
            activeClients = validClients.length;
            weeklyCheckIns = validCheckIns.length;
        } catch {
            // Silently fall back to demo counts
        }

        // Integrar los clientes de prueba si existen
        const demoClientsCount = DEMO_CHAT_CLIENTS.length;
        const demoWeeklyCheckIns = demoClientsCount > 0 ? 2 : 0;

        return {
            activeClients: activeClients + demoClientsCount,
            weeklyCheckIns: weeklyCheckIns + demoWeeklyCheckIns,
        };
    },

    async getRecentCheckIns(limit = 5) {
        let realCheckIns = [];
        try {
            const { data, error } = await supabase
                .from('check_in')
                .select(`
                    id,
                    created_at,
                    diet_adherence,
                    training_adherence,
                    profile:profile_id (
                        name,
                        surname
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (!error && data) {
                realCheckIns = data
                    .filter(checkIn => {
                        const fullName = `${checkIn.profile?.name || ''} ${checkIn.profile?.surname || ''}`;
                        return !isClientDeleted(checkIn.profile_id, fullName);
                    })
                    .map(checkIn => {
                    const dietValue = ADHERENCE_MAP[checkIn.diet_adherence] || 0;
                    const trainingValue = ADHERENCE_MAP[checkIn.training_adherence] || 0;
                    const avgAdherence = Math.round((dietValue + trainingValue) / 2);

                    let adherenceClass = 'adherence-low';
                    if (avgAdherence >= 80) adherenceClass = 'adherence-high';
                    else if (avgAdherence >= 50) adherenceClass = 'adherence-medium';

                    return {
                        text: `${checkIn.profile?.name || ''} ${checkIn.profile?.surname || ''}`.trim() || 'Cliente',
                        time: new Date(checkIn.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                        }),
                        adherenceClass,
                        timestamp: new Date(checkIn.created_at).getTime(),
                    };
                });
            }
        } catch {
            realCheckIns = [];
        }

        // Extraer los check-ins de los clientes de prueba
        const demoCheckIns = [];
        for (const client of DEMO_CHAT_CLIENTS) {
            for (const ci of (client.checkIns || [])) {
                const dietValue = ADHERENCE_MAP[ci.diet_adherence] || 0;
                const trainingValue = ADHERENCE_MAP[ci.training_adherence] || 0;
                const avgAdherence = Math.round((dietValue + trainingValue) / 2);

                let adherenceClass = 'adherence-low';
                if (avgAdherence >= 80) adherenceClass = 'adherence-high';
                else if (avgAdherence >= 50) adherenceClass = 'adherence-medium';

                demoCheckIns.push({
                    text: `${client.name} ${client.surname}`,
                    time: new Date(ci.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                    }),
                    adherenceClass,
                    timestamp: new Date(ci.created_at).getTime(),
                });
            }
        }

        const all = [...realCheckIns, ...demoCheckIns].sort((a, b) => b.timestamp - a.timestamp);
        return all.slice(0, limit);
    },

    async getExtendedStats() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        let activeClientsCount = 0;
        let thisWeek = 0;
        let lastWeek = 0;
        let clientsThisWeek = 0;
        let sessionsThisWeek = 0;

        try {
            const [
                { data: activeClientsData },
                { data: checkInsThisWeekData },
                { data: checkInsLastWeekData },
                { data: sessionsData },
            ] = await Promise.all([
                supabase
                    .from('profile')
                    .select('id, name, surname')
                    .eq('role', 'client'),
                supabase
                    .from('check_in')
                    .select('id, profile_id')
                    .gte('created_at', oneWeekAgo.toISOString()),
                supabase
                    .from('check_in')
                    .select('id, profile_id')
                    .gte('created_at', twoWeeksAgo.toISOString())
                    .lt('created_at', oneWeekAgo.toISOString()),
                supabase
                    .from('training_session')
                    .select('id, profile_id')
                    .eq('status', 'completed')
                    .gte('started_at', oneWeekAgo.toISOString()),
            ]);

            const validClients = (activeClientsData || []).filter(c => !isClientDeleted(c.id, `${c.name || ''} ${c.surname || ''}`));
            const validClientIds = new Set(validClients.map(c => c.id));

            activeClientsCount = validClients.length;
            thisWeek = (checkInsThisWeekData || []).filter(c => validClientIds.has(c.profile_id)).length;
            lastWeek = (checkInsLastWeekData || []).filter(c => validClientIds.has(c.profile_id)).length;
            clientsThisWeek = new Set(
                (checkInsThisWeekData || [])
                    .filter(c => validClientIds.has(c.profile_id))
                    .map(c => c.profile_id)
            ).size;
            sessionsThisWeek = (sessionsData || []).filter(s => validClientIds.has(s.profile_id)).length;
        } catch {
            // Silently proceed
        }

        // Sumar datos de los clientes de prueba si existen en el entorno
        const demoClientsCount = DEMO_CHAT_CLIENTS.length;
        const totalActiveClients = activeClientsCount + demoClientsCount;
        const demoCheckInsCount = demoClientsCount > 0 ? 2 : 0;
        const totalWeeklyCheckIns = thisWeek + demoCheckInsCount;
        const totalLastWeek = lastWeek + demoCheckInsCount;
        const totalClientsWithCheckIn = clientsThisWeek + demoCheckInsCount;
        const clientsWithoutCheckIn = Math.max(0, totalActiveClients - totalClientsWithCheckIn);

        // Sesiones completadas (demo sessions + localStorage)
        const localSessions = getLocalCompletedDemoSessions();
        const defaultDemoSessionsCount = demoClientsCount > 0 ? 5 : 0;
        const totalSessions = sessionsThisWeek + defaultDemoSessionsCount + (demoClientsCount > 0 ? localSessions.length : 0);

        const trend = totalLastWeek > 0
            ? Math.round(((totalWeeklyCheckIns - totalLastWeek) / totalLastWeek) * 100)
            : 0;

        return {
            activeClients: totalActiveClients,
            weeklyCheckIns: totalWeeklyCheckIns,
            clientsWithoutCheckIn,
            completedSessions: totalSessions,
            checkInTrend: trend,
        };
    },

    async getAlerts() {
        let alerts = [];

        try {
            const { data: clients } = await supabase
                .from('profile')
                .select('id, name, surname')
                .eq('role', 'client');

            const validClients = (clients || []).filter(c => !isClientDeleted(c.id, `${c.name || ''} ${c.surname || ''}`));

            for (const client of validClients) {
                const { data: checkIns } = await supabase
                    .from('check_in')
                    .select('*')
                    .eq('profile_id', client.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (!checkIns || checkIns.length === 0) continue;

                const clientName = `${client.name} ${client.surname || ''}`.trim();
                const dietAdherence = calculateAdherence(checkIns, 'diet_adherence');
                const trainingAdherence = calculateAdherence(checkIns, 'training_adherence');

                if (dietAdherence !== null && dietAdherence < 50) {
                    alerts.push({ type: 'warning', clientName, text: 'Baja adherencia a la dieta' });
                }
                if (trainingAdherence !== null && trainingAdherence < 50) {
                    alerts.push({ type: 'warning', clientName, text: 'Baja adherencia al entrenamiento' });
                }
            }
        } catch {
            // Silently proceed
        }

        // Añadir alertas informativas para los clientes de prueba si existen en el entorno
        if (DEMO_CHAT_CLIENTS.length > 0) {
            alerts.push({
                type: 'success',
                clientName: 'Laura Gómez',
                text: 'Alta adherencia (100%) y progresión de fuerza en glúteo superada',
            });
            alerts.push({
                type: 'info',
                clientName: 'Carlos Pérez',
                text: 'Check-in quincenal respondido (+1 tortita de arroz en pre-entreno)',
            });
        }

        return alerts.slice(0, 10);
    },

    async getCompletedSessions(limit = 10) {
        let realSessions = [];
        try {
            const { data, error } = await supabase
                .from('training_session')
                .select(`
                    id,
                    started_at,
                    feeling,
                    notes,
                    routine:routine_id (
                        title
                    ),
                    profile:profile_id (
                        name,
                        surname
                    )
                `)
                .eq('status', 'completed')
                .order('ended_at', { ascending: false })
                .limit(limit);

            if (!error && data) {
                realSessions = data
                    .filter(session => {
                        const fullName = `${session.profile?.name || ''} ${session.profile?.surname || ''}`;
                        return !isClientDeleted(session.profile_id, fullName);
                    })
                    .map(session => {
                    const clientName = `${session.profile?.name || ''} ${session.profile?.surname || ''}`.trim() || 'Cliente';
                    const routineTitle = session.routine?.title || 'Sesión';
                    const feelingLabel = session.feeling ? ` · Sensación: ${session.feeling}` : '';
                    return {
                        text: `${clientName} - ${routineTitle}${feelingLabel}`,
                        time: new Date(session.started_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                        }),
                        timestamp: new Date(session.started_at).getTime(),
                    };
                });
            }
        } catch {
            realSessions = [];
        }

        const localSessions = getLocalCompletedDemoSessions();

        const defaultDemoSessions = DEMO_CHAT_CLIENTS.length > 0 ? [
            {
                text: 'Laura Gómez - Día 1 — Énfasis Glúteo e Isquios (Fuerza) · Sensación: Excelente (8.5/10)',
                time: new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
                timestamp: Date.now() - 1000 * 60 * 60 * 24,
            },
            {
                text: 'Carlos Pérez - Día A — Torso Hipertrofia (Pecho + Espalda) · Sensación: Muy buena (8/10)',
                time: new Date(Date.now() - 1000 * 60 * 60 * 48).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
                timestamp: Date.now() - 1000 * 60 * 60 * 48,
            },
            {
                text: 'Laura Gómez - Día 2 — Tren Superior Estético + Core · Sensación: Buen bombeo (8/10)',
                time: new Date(Date.now() - 1000 * 60 * 60 * 72).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
                timestamp: Date.now() - 1000 * 60 * 60 * 72,
            },
        ] : [];

        const all = [...localSessions, ...realSessions, ...defaultDemoSessions].sort((a, b) => b.timestamp - a.timestamp);
        return all.slice(0, limit);
    },
};
