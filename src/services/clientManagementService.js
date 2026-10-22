import { supabase } from '../supabaseClient.js';
import { DEMO_CHAT_CLIENTS, isDemoClientId, getDemoClientById } from './feedbackService.js';

/**
 * Convierte un cliente de prueba (`DEMO_CHAT_CLIENTS`) al contrato de `Clients.jsx`.
 */
function mapDemoClientToManagementRow(demo) {
    return {
        id: demo.id,
        userId: demo.id,
        isDemo: true,
        name: demo.name,
        surname: demo.surname,
        fullName: demo.fullName,
        gender: demo.gender,
        birthdate: demo.birthdate,
        hasAssessment: true,
        assessment: demo.assessment,
        routines: [{ id: `rt-${demo.id}`, title: demo.routineName }],
        mealPlans: [{ id: `mp-${demo.id}`, title: demo.dietName }],
        latestCheckIn: demo.checkIns?.[0] || null,
    };
}

/**
 * Servicio de gestión integral de clientes para el entrenador.
 */
export const clientManagementService = {
    /**
     * Obtiene la lista completa de clientes con sus relaciones principales:
     * valoración inicial, rutinas asignadas, planes nutricionales y último check-in.
     * Incluye los 2 clientes de prueba interactivos si no hay clientes en BD o como apoyo.
     *
     * @returns {Promise<Array>} Lista de clientes enriquecida.
     */
    async getAllClients() {
        let profiles = [];
        try {
            const { data, error } = await supabase
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

            if (!error && data) {
                profiles = data;
            }
        } catch {
            profiles = [];
        }

        const realRows = [];
        const clientIds = (profiles || []).map((p) => p.id);

        if (clientIds.length > 0) {
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

            for (const p of profiles) {
                const assessment = Array.isArray(p.initial_assessment)
                    ? p.initial_assessment[0]
                    : p.initial_assessment;

                const routines = (p.profile_has_routine || [])
                    .map((r) => r.routine)
                    .filter(Boolean);

                const mealPlans = (p.profile_has_meal_plan || [])
                    .map((m) => m.meal_plan)
                    .filter(Boolean);

                realRows.push({
                    id: p.id,
                    userId: p.user_id,
                    isDemo: false,
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
                });
            }
        }

        const demoRows = DEMO_CHAT_CLIENTS.map(mapDemoClientToManagementRow);
        return [...realRows, ...demoRows];
    },

    /**
     * Obtiene la valoración inicial completa de un cliente.
     *
     * @param {number|string} profileId
     * @returns {Promise<Object|null>}
     */
    async getClientAssessment(profileId) {
        if (isDemoClientId(profileId)) {
            const demo = getDemoClientById(profileId);
            return demo?.assessment || null;
        }

        const { data, error } = await supabase
            .from('initial_assessment')
            .select('*')
            .eq('profile_id', profileId)
            .maybeSingle();

        if (error) throw new Error(error.message);
        return data;
    },
};
