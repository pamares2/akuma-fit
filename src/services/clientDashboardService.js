import { supabase } from '../supabaseClient.js';
import { getCurrentProfile } from '../utils/auth.js';

export const clientDashboardService = {
    async getWeightData() {
        const profile = await getCurrentProfile();

        const { data, error } = await supabase
            .from('measurement')
            .select('id, weight, created_at')
            .eq('profile_id', profile.id)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);

        const measurements = data || [];
        const current = measurements.length > 0
            ? [...measurements].reverse().find(m => m.weight !== null)?.weight
            : null;

        const first = measurements.find(m => m.weight !== null)?.weight;
        const delta = current !== null && first !== null && current !== first
            ? Math.round((current - first) * 10) / 10
            : null;

        const chartData = measurements
            .filter(m => m.weight !== null)
            .slice(-8)
            .map(m => ({
                date: new Date(m.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
                weight: Number(m.weight),
            }));

        return { current, delta, chartData };
    },

    async getCheckInStats() {
        const profile = await getCurrentProfile();

        const { data, error } = await supabase
            .from('check_in')
            .select('*')
            .eq('profile_id', profile.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        const checkIns = data || [];
        if (checkIns.length === 0) {
            return { streak: 0, dietAdherence: 0, trainingAdherence: 0 };
        }

        const sorted = [...checkIns].map(ci => new Date(ci.created_at)).sort((a, b) => b - a);
        const getWeekNumber = (date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
            const yearStart = new Date(d.getFullYear(), 0, 4);
            return d.getFullYear() * 100 + Math.round(((d - yearStart) / 604800000) + 1);
        };

        const weeks = [...new Set(sorted.map(d => getWeekNumber(d)))].sort((a, b) => b - a);
        const currentWeek = getWeekNumber(new Date());
        const lastWeek = getWeekNumber(new Date(Date.now() - 7 * 86400000));

        let streak = 0;
        if (weeks.length > 0 && (weeks[0] === currentWeek || weeks[0] === lastWeek)) {
            streak = 1;
            for (let i = 0; i < weeks.length - 1; i++) {
                if (weeks[i] - weeks[i + 1] === 1) {
                    streak++;
                } else {
                    break;
                }
            }
        }

        const adherenceMap = { 'Totalmente': 100, 'Parcialmente': 50, 'Nada': 0 };
        const recentCheckIns = checkIns.slice(0, 4);

        const dietValues = recentCheckIns
            .map(ci => adherenceMap[ci.diet_adherence])
            .filter(v => v !== undefined);
        const dietAdherence = dietValues.length > 0
            ? Math.round(dietValues.reduce((sum, v) => sum + v, 0) / dietValues.length)
            : 0;

        const trainingValues = recentCheckIns
            .map(ci => adherenceMap[ci.training_adherence])
            .filter(v => v !== undefined);
        const trainingAdherence = trainingValues.length > 0
            ? Math.round(trainingValues.reduce((sum, v) => sum + v, 0) / trainingValues.length)
            : 0;

        return { streak, dietAdherence, trainingAdherence };
    },

    async getTrainingStats() {
        const profile = await getCurrentProfile();

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data, error } = await supabase
            .from('training_session')
            .select('id, started_at')
            .eq('profile_id', profile.id)
            .eq('status', 'completed')
            .gte('started_at', oneWeekAgo.toISOString());

        if (error) throw new Error(error.message);

        return { completedThisWeek: (data || []).length };
    },

    async getNextEvent() {
        const profile = await getCurrentProfile();
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('calendar_event')
            .select('title, dtstart, start_time, event_type, freq')
            .eq('profile_id', profile.id)
            .eq('active', true)
            .gte('dtstart', today)
            .order('dtstart', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) throw new Error(error.message);

        if (data) {
            return {
                title: data.title,
                date: data.dtstart,
                time: data.start_time,
                type: data.event_type,
            };
        }

        // Si no hay un evento futuro puntual, sugerir el próximo check-in dominical
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 es domingo
        const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
        const nextSunday = new Date(now);
        nextSunday.setDate(now.getDate() + daysUntilSunday);

        return {
            title: 'Check-in semanal',
            date: nextSunday.toISOString().split('T')[0],
            time: '20:00',
            type: 'check_in',
        };
    },
};
