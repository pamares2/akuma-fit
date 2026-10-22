import { describe, it, expect, beforeEach, vi } from 'vitest';
import { routineService } from '../routineService.js';
import { supabase } from '../../supabaseClient.js';

describe('routineService - Progresión y Edición de Rutinas', () => {
    beforeEach(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
        }
        vi.restoreAllMocks();
    });

    it('debe obtener la lista de clientes incluyendo clientes de prueba', async () => {
        vi.spyOn(supabase, 'from').mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
            }),
        });

        const clients = await routineService.getClients();
        expect(clients.length).toBeGreaterThanOrEqual(2);
        expect(clients.some(c => c.id === 'demo-client-1')).toBe(true);
        expect(clients.some(c => c.id === 'demo-client-2')).toBe(true);
    });

    it('debe listar las rutinas asignadas al cliente demo Carlos Martínez', async () => {
        const routines = await routineService.getByClient('demo-client-1');
        expect(routines.length).toBeGreaterThan(0);
        const torso = routines.find(r => r.id === 'demo-routine-carlos-1');
        expect(torso).toBeDefined();
        expect(torso.title).toContain('Día A — Torso Hipertrofia');
        expect(torso.exercises.length).toBeGreaterThanOrEqual(3);
    });

    it('debe permitir al coach editar y sobrecargar las cargas (progresión) de una rutina', async () => {
        const originalRoutines = await routineService.getByClient('demo-client-1');
        const torso = originalRoutines.find(r => r.id === 'demo-routine-carlos-1');
        expect(torso).toBeDefined();

        // El coach progresa las cargas: sube el press banca de 36kg a 40kg, asigna RIR 1 y actualiza notas
        const updatedExercises = torso.exercises.map((ex) => {
            if (ex.exercise_name.includes('Press Banca')) {
                return {
                    ...ex,
                    sets: ex.sets.map((s) => ({
                        ...s,
                        kg: '40', // Sobrecarga progresiva
                        reps: '8',
                        rir: '1', // RIR asignado
                    })),
                };
            }
            return ex;
        });

        await routineService.update('demo-routine-carlos-1', {
            title: 'Día A — Torso Hipertrofia (Semana 2 - Progresión)',
            coachComment: '¡Gran avance! Subimos a 40kg en mancuernas en banco inclinado manteniendo RIR 1.',
            clientId: 'demo-client-1',
            exercises: updatedExercises,
        });

        // Verificamos que al consultar de nuevo por cliente, la rutina tenga las nuevas cargas y RIR
        const refreshedRoutines = await routineService.getByClient('demo-client-1');
        const refreshedTorso = refreshedRoutines.find(r => r.id === 'demo-routine-carlos-1');
        expect(refreshedTorso).toBeDefined();
        expect(refreshedTorso.title).toBe('Día A — Torso Hipertrofia (Semana 2 - Progresión)');
        expect(refreshedTorso.coach_comment).toContain('Subimos a 40kg');

        const pressBanca = refreshedTorso.exercises.find(e => e.exercise_name.includes('Press Banca'));
        expect(pressBanca.sets[0].kg).toBe('40');
        expect(pressBanca.sets[0].rir).toBe('1');

        // Verificamos getById
        const fetchedById = await routineService.getById('demo-routine-carlos-1');
        expect(fetchedById.title).toBe('Día A — Torso Hipertrofia (Semana 2 - Progresión)');
        expect(fetchedById.coach_comment).toContain('Subimos a 40kg');
        expect(fetchedById.exercises[0].sets[0].rir).toBe('1');
    });

    it('debe permitir eliminar una rutina de un cliente', async () => {
        const initial = await routineService.getByClient('demo-client-2');
        const initialCount = initial.length;
        const routineToDelete = initial[0];

        await routineService.delete(routineToDelete.id, 'demo-client-2');
        const afterDelete = await routineService.getByClient('demo-client-2');
        expect(afterDelete.length).toBe(initialCount - 1);
        expect(afterDelete.some(r => r.id === routineToDelete.id)).toBe(false);
    });
});
