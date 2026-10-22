import { supabase } from '../supabaseClient.js';

const ADHERENCE_MAP = {
    'Totalmente': 100,
    'Parcialmente': 50,
    'Nada': 0,
};

const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const yearStart = new Date(d.getFullYear(), 0, 4);
    return d.getFullYear() * 100 + Math.round(((d - yearStart) / 604800000) + 1);
};

const calculateAdherence = (checkIns, field) => {
    const values = checkIns
        .map(ci => ADHERENCE_MAP[ci[field]])
        .filter(v => v !== undefined);
    return values.length > 0
        ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
        : null;
};

export const dashboardService = {
    async getStats() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [{ count: activeClients, error: clientsError }, { count: weeklyCheckIns, error: checkInsError }] = await Promise.all([
            supabase
                .from('profile')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'client'),
            supabase
                .from('check_in')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', oneWeekAgo.toISOString()),
        ]);

        if (clientsError) throw new Error(clientsError.message);
        if (checkInsError) throw new Error(checkInsError.message);

        return {
            activeClients: activeClients || 0,
            weeklyCheckIns: weeklyCheckIns || 0,
        };
    },

    async getRecentCheckIns(limit = 5) {
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

        if (error) throw new Error(error.message);

        return (data || []).map(checkIn => {
            const dietValue = ADHERENCE_MAP[checkIn.diet_adherence] || 0;
            const trainingValue = ADHERENCE_MAP[checkIn.training_adherence] || 0;
            const avgAdherence = Math.round((dietValue + trainingValue) / 2);

            let adherenceClass = 'adherence-low';
            if (avgAdherence >= 80) adherenceClass = 'adherence-high';
            else if (avgAdherence >= 50) adherenceClass = 'adherence-medium';

            return {
                text: `${checkIn.profile.name} ${checkIn.profile.surname}`,
                time: new Date(checkIn.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                }),
                adherenceClass,
            };
        });
    },

    async getExtendedStats() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const [
            { count: activeClients, error: clientsError },
            { count: thisWeekCount, error: thisWeekError },
            { count: lastWeekCount, error: lastWeekError },
            { data: checkInsThisWeek, error: checkInsError },
            { data: sessionsThisWeek, error: sessionsError },
        ] = await Promise.all([
            supabase
                .from('profile')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'client'),
            supabase
                .from('check_in')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', oneWeekAgo.toISOString()),
            supabase
                .from('check_in')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', twoWeeksAgo.toISOString())
                .lt('created_at', oneWeekAgo.toISOString()),
            supabase
                .from('check_in')
                .select('profile_id')
                .gte('created_at', oneWeekAgo.toISOString()),
            supabase
                .from('training_session')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'completed')
                .gte('started_at', oneWeekAgo.toISOString()),
        ]);

        if (clientsError) throw new Error(clientsError.message);
        if (thisWeekError) throw new Error(thisWeekError.message);
        if (lastWeekError) throw new Error(lastWeekError.message);
        if (checkInsError) throw new Error(checkInsError.message);
        if (sessionsError) throw new Error(sessionsError.message);

        const activeClientsCount = activeClients || 0;
        const thisWeek = thisWeekCount || 0;
        const lastWeek = lastWeekCount || 0;
        const clientsThisWeek = new Set((checkInsThisWeek || []).map(c => c.profile_id)).size;
        const clientsWithoutCheckIn = activeClientsCount - clientsThisWeek;

        const trend = lastWeek > 0
            ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
            : null;

        return {
            activeClients: activeClientsCount,
            weeklyCheckIns: thisWeek,
            clientsWithoutCheckIn,
            completedSessions: sessionsThisWeek || 0,
            checkInTrend: trend,
        };
    },

    async getAlerts() {
        const { data: clients, error: clientsError } = await supabase
            .from('profile')
            .select('id, name, surname')
            .eq('role', 'client');

        if (clientsError) throw new Error(clientsError.message);

        const alerts = [];

        for (const client of clients || []) {
            const { data: checkIns, error: checkInsError } = await supabase
                .from('check_in')
                .select('*')
                .eq('profile_id', client.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (checkInsError || !checkIns || checkIns.length === 0) continue;

            const clientName = `${client.name} ${client.surname || ''}`.trim();

            const dietAdherence = calculateAdherence(checkIns, 'diet_adherence');
            const trainingAdherence = calculateAdherence(checkIns, 'training_adherence');

            if (dietAdherence !== null && dietAdherence < 50) {
                alerts.push({
                    type: 'warning',
                    clientName,
                    text: 'Baja adherencia a la dieta',
                });
            }

            if (trainingAdherence !== null && trainingAdherence < 50) {
                alerts.push({
                    type: 'warning',
                    clientName,
                    text: 'Baja adherencia al entrenamiento',
                });
            }

            const avgEnergy = checkIns.reduce((sum, ci) => sum + (ci.energy_level || 0), 0) / checkIns.length;
            if (avgEnergy > 0 && avgEnergy <= 4) {
                alerts.push({
                    type: 'warning',
                    clientName,
                    text: 'Nivel de energía bajo',
                });
            }

            const avgRest = checkIns.reduce((sum, ci) => sum + (ci.rest_quality || 0), 0) / checkIns.length;
            if (avgRest > 0 && avgRest <= 5) {
                alerts.push({
                    type: 'warning',
                    clientName,
                    text: 'Recuperación insuficiente',
                });
            }

            const sorted = [...checkIns].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const weeks = [...new Set(sorted.map(ci => getWeekNumber(ci.created_at)))].sort((a, b) => b - a);
            const currentWeek = getWeekNumber(new Date());
            const lastWeek = getWeekNumber(new Date(Date.now() - 7 * 86400000));

            if (weeks.length >= 2 && weeks[0] !== currentWeek && weeks[0] !== lastWeek) {
                let streak = 1;
                for (let i = 0; i < weeks.length - 1; i++) {
                    if (weeks[i] - weeks[i + 1] === 1) {
                        streak++;
                    } else {
                        break;
                    }
                }
                if (streak >= 2) {
                    alerts.push({
                        type: 'info',
                        clientName,
                        text: `Racha rota (tenía ${streak} semanas)`,
                    });
                }
            }
        }

        return alerts.slice(0, 10);
    },

    async getCompletedSessions(limit = 10) {
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

        if (error) throw new Error(error.message);

        return (data || []).map(session => {
            const clientName = `${session.profile?.name || ''} ${session.profile?.surname || ''}`.trim();
            const routineTitle = session.routine?.title || 'Sesión';
            const feelingLabel = session.feeling ? ` · Sensación: ${session.feeling}` : '';
            const notesLabel = session.notes ? ` ("${session.notes}")` : '';
            return {
                text: `${clientName} - ${routineTitle}${feelingLabel}${notesLabel}`,
                time: new Date(session.started_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                }),
            };
        });
    },
};
