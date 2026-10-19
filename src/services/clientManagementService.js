import { supabase } from '../supabaseClient.js';

/**
 * Servicio de gestión integral de clientes para el entrenador.
 */
export const clientManagementService = {
    /**
     * Obtiene la lista completa de clientes con sus relaciones principales:
     * valoración inicial, rutinas asignadas, planes nutricionales y último check-in.
     *
     * @returns {Promise<Array>} Lista de clientes enriquecida.
     */
    async getAllClients() {
        const { data: profiles, error } = await supabase
            .from('profile')
            .select(`
                id,
                user_id,
                name,
                surname,
                gender,
                birthdate,
                role,
                initial_assessment (
                    id,
                    goals,
                    current_level,
                    created_at,
                    height
                ),
                profile_has_routine (
                    routine (
                        id,
                        title
                    )
                ),
                profile_has_meal_plan (
                    meal_plan (
                        id,
                        title
                    )
                )
            `)
            .eq('role', 'client')
            .order('name');

        if (error) throw new Error(error.message);

        const clientIds = (profiles || []).map((p) => p.id);
        if (clientIds.length === 0) return [];

        // Obtener el último check-in de cada cliente
        const { data: recentCheckIns } = await supabase
            .from('check_in')
            .select('id, profile_id, created_at, how_do_you_feel, diet_adherence, training_adherence')
            .in('profile_id', clientIds)
            .order('created_at', { ascending: false });

        const latestCheckInByProfile = {};
        (recentCheckIns || []).forEach((ci) => {
            if (!latestCheckInByProfile[ci.profile_id]) {
                latestCheckInByProfile[ci.profile_id] = ci;
            }
        });

        return profiles.map((p) => {
            const assessment = Array.isArray(p.initial_assessment)
                ? p.initial_assessment[0]
                : p.initial_assessment;

            const routines = (p.profile_has_routine || [])
                .map((r) => r.routine)
                .filter(Boolean);

            const mealPlans = (p.profile_has_meal_plan || [])
                .map((m) => m.meal_plan)
                .filter(Boolean);

            return {
                id: p.id,
                userId: p.user_id,
                name: p.name || 'Sin nombre',
                surname: p.surname || '',
                fullName: `${p.name || ''} ${p.surname || ''}`.trim() || 'Cliente sin nombre',
                gender: p.gender || 'No especificado',
                birthdate: p.birthdate,
                hasAssessment: Boolean(assessment),
                assessment,
                routines,
                mealPlans,
                latestCheckIn: latestCheckInByProfile[p.id] || null,
            };
        });
    },

    /**
     * Obtiene la valoración inicial completa de un cliente.
     *
     * @param {number} profileId
     * @returns {Promise<Object|null>}
     */
    async getClientAssessment(profileId) {
        const { data, error } = await supabase
            .from('initial_assessment')
            .select('*')
            .eq('profile_id', profileId)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return data;
    },
};
