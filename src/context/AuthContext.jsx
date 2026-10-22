import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { authService } from '../services/authService.js';
import { profileService } from '../services/profileService.js';
import { assessmentService } from '../services/assessmentService.js';
import { DEMO_CHAT_CLIENTS } from '../services/feedbackService.js';
import { getImpersonatedClientId, setImpersonatedClientId } from '../utils/auth.js';
import { AuthContext } from './authContextInstance.js';

/**
 * Proveedor del estado de sesión y perfil. Permite además al entrenador
 * alternar en vivo a la vista de cualquiera de los clientes de prueba
 * (`Carlos Pérez` o `Laura Gómez`) para comprobar cómo ven su dieta ANEF,
 * su rutina, su chat 1:1 y su progreso.
 */
export function AuthProvider({ children }) {
    const [status, setStatus] = useState('loading');
    const [realUserEmail, setRealUserEmail] = useState(null);
    const [realProfileId, setRealProfileId] = useState(null);
    const [realUserRole, setRealUserRole] = useState('client');
    const [assessmentCompleted, setAssessmentCompleted] = useState(false);
    const [impersonatedClientId, setImpersonatedState] = useState(() => getImpersonatedClientId());

    const loadProfile = useCallback(async () => {
        const profile = await profileService.getWithRole();

        if (!profile) {
            setRealProfileId(null);
            setRealUserRole('client');
            setAssessmentCompleted(false);
            return;
        }

        const completed = profile.role === 'coach'
            ? true
            : await assessmentService.exists(profile.id).catch(() => false);

        setRealProfileId(profile.id);
        setRealUserRole(profile.role || 'client');
        setAssessmentCompleted(completed);
    }, []);

    useEffect(() => {
        let active = true;

        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!active) return;

            if (session?.user) {
                setRealUserEmail(session.user.email);
                await loadProfile();
                setStatus('signed-in');
            } else {
                setStatus('signed-out');
            }
        };

        init();

        const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                setImpersonatedClientId(null);
                setImpersonatedState(null);
                setRealUserEmail(null);
                setRealProfileId(null);
                setRealUserRole('client');
                setAssessmentCompleted(false);
                setStatus('signed-out');
            }
        });

        return () => {
            active = false;
            subscription?.subscription?.unsubscribe();
        };
    }, [loadProfile]);

    const login = useCallback(async (email, password) => {
        await authService.signIn(email, password);
        setRealUserEmail(email);
        await loadProfile();
        setStatus('signed-in');
    }, [loadProfile]);

    const logout = useCallback(async () => {
        setImpersonatedClientId(null);
        setImpersonatedState(null);
        await authService.signOut();
        setRealUserEmail(null);
        setRealProfileId(null);
        setRealUserRole('client');
        setAssessmentCompleted(false);
        setStatus('signed-out');
    }, []);

    const completeAssessment = useCallback(() => {
        setAssessmentCompleted(true);
    }, []);

    const switchClientView = useCallback((demoClientId) => {
        const nextId = demoClientId || null;
        setImpersonatedClientId(nextId);
        setImpersonatedState(nextId);
    }, []);

    const activeDemoClient = impersonatedClientId
        ? DEMO_CHAT_CLIENTS.find(c => String(c.id) === String(impersonatedClientId))
        : null;

    const isImpersonating = Boolean(activeDemoClient);
    const effectiveUserRole = isImpersonating ? 'client' : realUserRole;
    const effectiveProfileId = isImpersonating ? activeDemoClient.id : realProfileId;
    const effectiveUser = isImpersonating ? activeDemoClient.fullName : realUserEmail;
    const effectiveAssessmentCompleted = isImpersonating ? true : assessmentCompleted;

    const value = {
        status,
        user: effectiveUser,
        profileId: effectiveProfileId,
        userRole: effectiveUserRole,
        realUserRole,
        impersonatedClientId: isImpersonating ? activeDemoClient.id : null,
        impersonatedClientName: isImpersonating ? activeDemoClient.fullName : null,
        switchClientView,
        assessmentCompleted: effectiveAssessmentCompleted,
        login,
        logout,
        completeAssessment,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
