/**
 * Utilidades para cálculo de 1RM (Repetición Máxima) y récords personales (PRs).
 */

/**
 * Calcula el 1RM estimado usando la fórmula de Epley.
 * 1RM = peso * (1 + reps / 30)
 *
 * @param {number} weightKg - Peso levantado en kg.
 * @param {number} reps - Número de repeticiones (normalmente entre 1 y 12).
 * @returns {number} 1RM estimado en kg redondeado a 1 decimal.
 */
export function calculateEpley1RM(weightKg, reps) {
    const w = Number(weightKg);
    const r = Number(reps);
    if (!w || w <= 0 || !r || r <= 0) return 0;
    if (r === 1) return Math.round(w * 10) / 10;
    const oneRm = w * (1 + r / 30);
    return Math.round(oneRm * 10) / 10;
}

/**
 * Calcula el 1RM estimado usando la fórmula de Brzycki.
 * 1RM = peso * (36 / (37 - reps))
 *
 * @param {number} weightKg - Peso levantado en kg.
 * @param {number} reps - Repeticiones realizadas (< 37).
 * @returns {number} 1RM estimado en kg redondeado a 1 decimal.
 */
export function calculateBrzycki1RM(weightKg, reps) {
    const w = Number(weightKg);
    const r = Number(reps);
    if (!w || w <= 0 || !r || r <= 0) return 0;
    if (r >= 37) return calculateEpley1RM(w, r);
    if (r === 1) return Math.round(w * 10) / 10;
    const oneRm = w * (36 / (37 - r));
    return Math.round(oneRm * 10) / 10;
}

/**
 * Calcula el 1RM óptimo promedio para hipertrofia y fuerza.
 *
 * @param {number} weightKg - Peso levantado en kg.
 * @param {number} reps - Repeticiones.
 * @returns {number}
 */
export function calculateEstimated1RM(weightKg, reps) {
    return calculateEpley1RM(weightKg, reps);
}

/**
 * Calcula porcentajes de entrenamiento respecto al 1RM (ej. 70%, 75%, 80%, 85%, 90%).
 *
 * @param {number} oneRmKg - 1RM del atleta en kg.
 * @returns {Object} Mapa de porcentajes de carga.
 */
export function calculateTrainingPercentages(oneRmKg) {
    const rm = Number(oneRmKg) || 0;
    if (rm <= 0) return {};
    return {
        oneRm: rm,
        p95: Math.round(rm * 0.95 * 10) / 10,
        p90: Math.round(rm * 0.90 * 10) / 10,
        p85: Math.round(rm * 0.85 * 10) / 10,
        p80: Math.round(rm * 0.80 * 10) / 10,
        p75: Math.round(rm * 0.75 * 10) / 10,
        p70: Math.round(rm * 0.70 * 10) / 10,
        p65: Math.round(rm * 0.65 * 10) / 10,
    };
}
