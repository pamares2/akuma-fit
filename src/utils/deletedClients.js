const DELETED_CLIENTS_KEY = 'akuma_deleted_client_ids_v1';

/**
 * Obtiene la lista de IDs de clientes eliminados o purgados.
 *
 * @returns {Array<string>} Lista de IDs.
 */
export function getDeletedClientIds() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const raw = window.localStorage.getItem(DELETED_CLIENTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Registra un cliente como eliminado en el cliente.
 *
 * @param {string|number} clientId - Id del cliente.
 */
export function markClientDeleted(clientId) {
    if (typeof window === 'undefined' || !window.localStorage || !clientId) return;
    try {
        const list = getDeletedClientIds();
        const idStr = String(clientId);
        if (!list.includes(idStr)) {
            window.localStorage.setItem(DELETED_CLIENTS_KEY, JSON.stringify([...list, idStr]));
        }
    } catch {
        // no-op
    }
}

/**
 * Comprueba si un ID o nombre de cliente ha sido marcado como eliminado o debe purgarse.
 *
 * @param {string|number} clientId - Id del cliente.
 * @param {string} [clientName] - Nombre opcional del cliente.
 * @returns {boolean}
 */
export function isClientDeleted(clientId, clientName = '') {
    if (!clientId) return false;
    const list = getDeletedClientIds();
    if (list.includes(String(clientId))) return true;

    // Purgar automáticamente clientes de pruebas previos como Óscar
    if (clientName && /oscar|óscar/i.test(clientName)) {
        markClientDeleted(clientId);
        return true;
    }

    return false;
}

/**
 * Limpia la lista de clientes eliminados.
 */
export function clearDeletedClientIds() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.removeItem(DELETED_CLIENTS_KEY);
    } catch {
        // no-op
    }
}
