import { describe, it, expect } from 'vitest';
import {
    calculateEpley1RM,
    calculateBrzycki1RM,
    calculateEstimated1RM,
    calculateTrainingPercentages,
} from '../oneRepMax.js';

describe('oneRepMax - Fórmulas de cálculo de 1RM', () => {
    it('devuelve el mismo peso si las repeticiones son 1', () => {
        expect(calculateEpley1RM(100, 1)).toBe(100);
        expect(calculateBrzycki1RM(100, 1)).toBe(100);
    });

    it('calcula 1RM realista para 100 kg x 10 reps', () => {
        // Epley: 100 * (1 + 10/30) = 133.3 kg
        const epley = calculateEpley1RM(100, 10);
        expect(epley).toBeCloseTo(133.3, 1);
        expect(calculateEstimated1RM(100, 10)).toBe(epley);

        // Brzycki: 100 * (36 / 27) = 133.3 kg
        const brzycki = calculateBrzycki1RM(100, 10);
        expect(brzycki).toBeCloseTo(133.3, 1);
    });

    it('devuelve 0 si los valores son inválidos o negativos', () => {
        expect(calculateEpley1RM(0, 5)).toBe(0);
        expect(calculateEpley1RM(80, 0)).toBe(0);
        expect(calculateBrzycki1RM(-50, 5)).toBe(0);
    });

    it('calcula porcentajes de trabajo (70%, 80%, 90%)', () => {
        const percentages = calculateTrainingPercentages(100);
        expect(percentages.oneRm).toBe(100);
        expect(percentages.p90).toBe(90);
        expect(percentages.p80).toBe(80);
        expect(percentages.p70).toBe(70);
    });
});
