import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiInfo } from 'react-icons/fi';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { routineService } from '../../services/routineService.js';
import ExerciseVideo from '../../components/complex/ExerciseVideo/ExerciseVideo.jsx';
import { useAuth } from '../../context/useAuth.js';

/**
 * Vista "Mi Plan" del cliente: lista sus rutinas asignadas y permite navegar
 * a los detalles de cada rutina y ejercicio.
 */
function MyPlan() {
    const { profileId } = useAuth();
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    const [expandedExercise, setExpandedExercise] = useState(null);

    const loadRoutines = async () => routineService.getByClient(profileId);

    const { data: routines, loading, error } = useAsyncData(profileId ? loadRoutines : null, [profileId]);

    const handleRoutineClick = (routine) => {
        setSelectedRoutine(routine);
        setExpandedExercise(null);
    };

    const handleBackToRoutines = () => {
        setSelectedRoutine(null);
        setExpandedExercise(null);
    };

    const handleExerciseClick = (exerciseId) => {
        setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
    };

    if (loading) {
        return <div className="loading-state">Cargando tus rutinas...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    if (!routines || routines.length === 0) {
        return (
            <div className="my-plan-page">
                <div className="page-container">
                    <h1 className="page-title">Mi Plan</h1>
                    <div className="empty-state">
                        <p>Tu coach aún no te ha asignado ninguna rutina.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedRoutine && expandedExercise) {
        const exercise = selectedRoutine.exercises?.find(e => e.id === expandedExercise);

        if (!exercise) {
            return <div className="error-message">Ejercicio no encontrado</div>;
        }

        const sets = exercise.sets || [];

        return (
            <div className="my-plan-page">
                <div className="page-container">
                    <button onClick={() => setExpandedExercise(null)} className="btn-outline">
                        <FiChevronLeft size={18} />
                        <span>Volver a ejercicios</span>
                    </button>

                    <div className="exercise-detail-card">
                        <div className="exercise-detail-header">
                            <h2 className="exercise-detail-title">{exercise.exercise_name}</h2>
                            <span className="category-badge">{exercise.category}</span>
                        </div>

                        {exercise.description && (
                            <div className="exercise-detail-section">
                                <h3 className="exercise-detail-subtitle">Descripción</h3>
                                <p className="exercise-detail-text">{exercise.description}</p>
                            </div>
                        )}

                        {exercise.comments && (
                            <div className="exercise-detail-section">
                                <h3 className="exercise-detail-subtitle">Comentarios del Coach</h3>
                                <p className="exercise-detail-text">{exercise.comments}</p>
                            </div>
                        )}

                        {sets.length > 0 && (
                            <div className="exercise-detail-section">
                                <h3 className="exercise-detail-subtitle">Series & Cargas</h3>
                                <div className="sets-table-container">
                                    <div className="sets-table sets-table-5col">
                                        <div className="sets-table-header">
                                            <span className="set-col-order">#</span>
                                            <span className="set-col-reps">Reps</span>
                                            <span className="set-col-kg">Kg</span>
                                            <span className="set-col-rir" title="Repeticiones en Reserva">RIR</span>
                                            <span className="set-col-type">Tipo</span>
                                        </div>
                                        {sets.map((set) => (
                                            <div key={set.id} className="sets-table-row">
                                                <span className="set-col-order set-order-number">{set.order}</span>
                                                <span className="set-col-reps">{set.reps}</span>
                                                <span className="set-col-kg">{set.kg ? `${set.kg} kg` : '—'}</span>
                                                <span className="set-col-rir">
                                                    {set.rir ? (
                                                        <span style={{
                                                            background: 'rgba(230, 57, 70, 0.15)',
                                                            color: 'var(--color-primary, #e63946)',
                                                            padding: '0.15rem 0.45rem',
                                                            borderRadius: '4px',
                                                            fontWeight: 700,
                                                            fontSize: '0.78rem',
                                                            display: 'inline-block',
                                                        }}>
                                                            RIR {set.rir}
                                                        </span>
                                                    ) : '—'}
                                                </span>
                                                <span className="set-col-type">{set.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="exercise-detail-section">
                            <h3 className="exercise-detail-subtitle">Video Explicativo</h3>
                            <ExerciseVideo
                                exerciseId={exercise.id}
                                emptyMessage="No hay video disponible para este ejercicio."
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedRoutine) {
        const exercises = selectedRoutine.exercises || [];

        return (
            <div className="my-plan-page">
                <div className="page-container">
                    <button onClick={handleBackToRoutines} className="btn-outline">
                        <FiChevronLeft size={18} />
                        <span>Volver a rutinas</span>
                    </button>

                    <div className="routine-detail-header">
                        <h1 className="page-title">{selectedRoutine.title}</h1>
                        {selectedRoutine.coach_comment && (
                            <p className="routine-coach-comment">{selectedRoutine.coach_comment}</p>
                        )}
                    </div>

                    {exercises.length === 0 ? (
                        <div className="empty-state">
                            <p>Esta rutina no tiene ejercicios asignados.</p>
                        </div>
                    ) : (
                        <div className="exercises-list">
                            {exercises.map((exercise, idx) => (
                                <div key={exercise.id} className="routine-exercise-card">
                                    <div 
                                        className="routine-exercise-header clickable"
                                        onClick={() => handleExerciseClick(exercise.id)}
                                    >
                                        <div className="routine-exercise-title-row">
                                            <span className="routine-exercise-number">Ejercicio {idx + 1}</span>
                                            <span className="routine-exercise-name">{exercise.exercise_name}</span>
                                            <span className="category-badge">{exercise.category}</span>
                                        </div>
                                        <div className="routine-exercise-actions">
                                            <button className="btn-icon">
                                                {expandedExercise === exercise.id ? <FiChevronLeft /> : <FiChevronRight />}
                                            </button>
                                        </div>
                                    </div>

                                    {expandedExercise === exercise.id && (
                                        <div className="routine-exercise-content">
                                            <button 
                                                onClick={() => handleExerciseClick(exercise.id)}
                                                className="btn-primary"
                                            >
                                                <FiInfo size={16} />
                                                <span>Ver detalles del ejercicio</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="my-plan-page">
            <div className="page-container">
                <h1 className="page-title">Mi Plan</h1>
                <p className="page-description">Tus rutinas de entrenamiento asignadas por tu coach.</p>

                <div className="routines-grid">
                    {routines.map((routine) => {
                        const exerciseCount = routine.exercises?.length || 0;
                        return (
                            <div 
                                key={routine.id} 
                                className="routine-card clickable"
                                onClick={() => handleRoutineClick(routine)}
                            >
                                <h3 className="routine-card-title">{routine.title}</h3>
                                {routine.coach_comment && (
                                    <p className="routine-card-comment">{routine.coach_comment}</p>
                                )}
                                <div className="routine-card-footer">
                                    <span className="routine-card-stat">
                                        {exerciseCount} {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
                                    </span>
                                    <FiChevronRight size={20} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default MyPlan;
