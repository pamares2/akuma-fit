import { describe, it, expect } from 'vitest';
import {
    matchExerciseRows,
    buildInitialSetValues,
    buildInitialCompletedMap,
    buildInitialRpeMap,
    firstIncompleteIndex,
    buildSummary,
} from '../sessionMappers.js';

describe('sessionMappers', () => {
    describe('matchExerciseRows', () => {
        it('matches routine exercises with completed exercise rows by ID', () => {
            const routineExercises = [
                { id: 10, exercise_name: 'Press Banca' },
                { id: 20, exercise_name: 'Sentadilla' },
                { id: 30, exercise_name: 'Dominadas' },
            ];
            const completedRows = [
                { id: 101, exercise_template_id: 10, completed: true },
                { id: 102, exercise_template_id: 30, completed: false },
            ];

            const matched = matchExerciseRows(routineExercises, completedRows);
            expect(matched).toHaveLength(2);
            expect(matched[0]).toEqual({
                exercise: routineExercises[0],
                row: completedRows[0],
            });
            expect(matched[1]).toEqual({
                exercise: routineExercises[2],
                row: completedRows[1],
            });
        });

        it('returns empty array when no matches exist or inputs are empty', () => {
            expect(matchExerciseRows([], [])).toEqual([]);
            expect(matchExerciseRows([{ id: 1 }], [{ exercise_template_id: 99 }])).toEqual([]);
        });
    });

    describe('buildInitialSetValues', () => {
        it('extracts reps and kg mapped by row.id:set_order', () => {
            const matchedExercises = [
                {
                    row: {
                        id: 5,
                        completed_set: [
                            { set_order: 1, reps_completed: 10, kg_used: 80 },
                            { set_order: 2, reps_completed: 8, kg_used: 85 },
                        ],
                    },
                },
                {
                    row: {
                        id: 6,
                        completed_set: [
                            { set_order: 1, reps_completed: 12, kg_used: 30 },
                        ],
                    },
                },
            ];

            const values = buildInitialSetValues(matchedExercises);
            expect(values).toEqual({
                '5:1': { reps: 10, kg: 80 },
                '5:2': { reps: 8, kg: 85 },
                '6:1': { reps: 12, kg: 30 },
            });
        });
    });

    describe('buildInitialCompletedMap', () => {
        it('maps completion booleans keyed by row.id', () => {
            const matched = [
                { row: { id: 1, completed: true } },
                { row: { id: 2, completed: false } },
            ];

            expect(buildInitialCompletedMap(matched)).toEqual({
                1: true,
                2: false,
            });
        });
    });

    describe('buildInitialRpeMap', () => {
        it('collects numeric RPE values and ignores null/undefined', () => {
            const matched = [
                { row: { id: 1, rpe: 8.5 } },
                { row: { id: 2, rpe: null } },
                { row: { id: 3, rpe: 9 } },
                { row: { id: 4 } },
            ];

            expect(buildInitialRpeMap(matched)).toEqual({
                1: 8.5,
                3: 9,
            });
        });
    });

    describe('firstIncompleteIndex', () => {
        it('returns the index of the first incomplete exercise', () => {
            const matched = [
                { row: { id: 1, completed: true } },
                { row: { id: 2, completed: true } },
                { row: { id: 3, completed: false } },
                { row: { id: 4, completed: false } },
            ];
            expect(firstIncompleteIndex(matched)).toBe(2);
        });

        it('returns 0 if all exercises are already completed or list is empty', () => {
            expect(firstIncompleteIndex([])).toBe(0);
            expect(firstIncompleteIndex([{ row: { completed: true } }])).toBe(0);
        });
    });

    describe('buildSummary', () => {
        it('calculates total volume, sets, duration and feedback correctly', () => {
            const startedAt = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
            const matchedExercises = [
                {
                    exercise: {
                        exercise_name: 'Press Banca',
                        sets: [
                            { order: 1, type: 'normal' },
                            { order: 2, type: 'normal' },
                        ],
                    },
                    row: { id: 10 },
                },
            ];

            const setValues = {
                '10:1': { reps: 10, kg: 100 }, // 1000 kg vol
                '10:2': { reps: 8, kg: 100 },  // 800 kg vol
            };
            const completedMap = { 10: true };
            const rpeMap = { 10: 8 };
            const feedback = { feeling: 'great', notes: 'Entrenamiento muy sólido' };

            const summary = buildSummary({
                matchedExercises,
                routineTitle: 'Empuje Hipertrofia',
                startedAt,
                setValues,
                completedMap,
                rpeMap,
                feedback,
            });

            expect(summary.routineTitle).toBe('Empuje Hipertrofia');
            expect(summary.exercisesTotal).toBe(1);
            expect(summary.exercisesCompleted).toBe(1);
            expect(summary.totalSets).toBe(2);
            expect(summary.completedSets).toBe(2);
            expect(summary.totalVolume).toBe(1800);
            expect(summary.feeling).toBe('great');
            expect(summary.notes).toBe('Entrenamiento muy sólido');
            expect(summary.durationMs).toBeGreaterThan(0);
        });
    });
});
