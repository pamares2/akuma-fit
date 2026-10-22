import { supabase } from '../supabaseClient.js';

export const IMPERSONATE_STORAGE_KEY = 'akuma_impersonate_client_id';

const isTestEnv = (typeof globalThis !== 'undefined' && globalThis?.process?.env?.NODE_ENV === 'test')
    || (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test');

const RAW_DEMO_PROFILES = {
    'demo-client-1': {
        id: 'demo-client-1',
        name: 'Carlos',
        surname: 'Pérez',
        role: 'client',
        isDemo: true,
    },
    'demo-client-2': {
        id: 'demo-client-2',
        name: 'Laura',
        surname: 'Gómez',
        role: 'client',
        isDemo: true,
    },
};

export const DEMO_PROFILES = isTestEnv ? RAW_DEMO_PROFILES : {};

export function getImpersonatedClientId() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
        if (!isTestEnv) {
            window.localStorage.removeItem(IMPERSONATE_STORAGE_KEY);
            return null;
        }
        const val = window.localStorage.getItem(IMPERSONATE_STORAGE_KEY);
        return val && DEMO_PROFILES[val] ? val : null;
    } catch {
        return null;
    }
}

export function setImpersonatedClientId(clientId) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        if (!clientId) {
            window.localStorage.removeItem(IMPERSONATE_STORAGE_KEY);
        } else {
            window.localStorage.setItem(IMPERSONATE_STORAGE_KEY, String(clientId));
        }
    } catch {
        // Ignorar errores de almacenamiento
    }
}

/**
 * Obtiene el usuario autenticado actual desde Supabase. Lanza un error si no
 * hay sesión iniciada.
 *
 * @returns {Promise<Object>} Usuario autenticado.
 * @throws {Error} Si no hay usuario autenticado.
 */
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('Debes iniciar sesión.');
    }

    return user;
};

/**
 * Obtiene el perfil (`profile`) asociado al usuario autenticado (o el perfil
 * del cliente de prueba si el entrenador está en modo "Ver como cliente").
 *
 * @returns {Promise<Object>} Perfil del usuario (`id`, `name`, `surname`, `role`).
 * @throws {Error} Si no hay sesión o el perfil no se encuentra.
 */
export const getCurrentProfile = async () => {
    const impersonatedId = getImpersonatedClientId();
    if (impersonatedId && DEMO_PROFILES[impersonatedId]) {
        return DEMO_PROFILES[impersonatedId];
    }

    const user = await getCurrentUser();

    const { data: profile, error } = await supabase
        .from('profile')
        .select('id, name, surname, role')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) {
        throw new Error(`No se pudo comprobar el perfil: ${error.message}`);
    }

    if (!profile) {
        throw new Error('No se ha encontrado tu perfil. Completa primero la valoración inicial.');
    }

    return profile;
};
