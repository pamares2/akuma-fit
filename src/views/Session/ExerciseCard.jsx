import { FiCheck } from 'react-icons/fi';
import ExerciseVideo from '../../components/complex/ExerciseVideo/ExerciseVideo.jsx';
import { calculateEstimated1RM } from '../../utils/oneRepMax.js';

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

 
/**
 * Tarjeta de un ejercicio durante la sesión: series editables, vídeo, RPE y
 * acción de completar/desmarcar.
 *
 * @param {Object} props - Props del componente.
 * @param {Object} props.exercise - Ejercicio (con `sets`).
 * @param {Object} props.row - Fila de ejercicio completado.
 * @param {number} props.index - Posición del ejercicio.
 * @param {boolean} props.completed - Si está completado.
 * @param {boolean} props.canComplete - Si se puede completar.
 * @param {boolean} props.busy - Si hay una acción en curso.
 * @param {Object} props.setValues - Valores de series por clave.
 * @param {number|null} props.rpe - RPE seleccionado.
 * @param {Function} props.onSetChange - Callback de cambio de serie.
 * @param {Function} props.onSetBlur - Callback al salir de una serie.
 * @param {Function} props.onRpeChange - Callback de cambio de RPE.
 * @param {() => void} props.onComplete - Callback de completar.
 * @param {() => void} props.onUnmark - Callback de desmarcar.
 */
function ExerciseCard({
    exercise,
    row,
    index,
    completed,
    canComplete,
    busy,
    setValues,
    rpe,
    onSetChange,
    onSetBlur,
    onRpeChange,
    onComplete,
    onUnmark,
}) {
    const sets = exercise.sets || [];

    return (
        <div className={`session-exercise-card ${completed ? 'completed' : ''}`}>
            <div className="session-exercise-header">
                <div className="session-exercise-title-row">
                    <span className="session-exercise-number">Ejercicio {index + 1}</span>
                    <h3 className="session-exercise-name">{exercise.exercise_name}</h3>
                    {completed && <FiCheck className="session-exercise-check" size={20} />}
                </div>
                {exercise.category && <span className="category-badge">{exercise.category}</span>}
            </div>

            {exercise.description && (
                <p className="session-exercise-description">{exercise.description}</p>
            )}

            {exercise.comments && (
                <p className="session-exercise-comment">{exercise.comments}</p>
            )}

            <ExerciseVideo exerciseId={exercise.id} />

            <div className="sets-table session-sets-table">
                <div className="sets-table-header session-sets-header">
                    <span className="set-col-order">#</span>
                    <span className="set-col-reps">Reps</span>
                    <span className="set-col-kg">Kg</span>
                    <span className="set-col-type">Tipo</span>
                </div>
                {sets.map((set) => {
                    const value = setValues[`${row.id}:${set.order}`] || {};

                    return (
                        <div key={set.id} className="sets-table-row session-sets-row">
                            <span className="set-col-order set-order-number">{set.order}</span>
                            <input
                                type="number"
                                inputMode="numeric"
                                min="0"
                                className="set-input"
                                placeholder={set.reps || '—'}
                                value={value.reps ?? ''}
                                onChange={(event) => onSetChange(row, set.order, 'reps', event.target.value)}
                                onBlur={() => onSetBlur(row, set)}
                            />
                            <input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.5"
                                className="set-input"
                                placeholder={set.kg || '—'}
                                value={value.kg ?? ''}
                                onChange={(event) => onSetChange(row, set.order, 'kg', event.target.value)}
                                onBlur={() => onSetBlur(row, set)}
                            />
                            <span className="set-col-type">{set.type}</span>
                        </div>
                    );
                })}
            </div>

            {(() => {
                const max1RM = sets.reduce((max, s) => {
                    const val = setValues[`${row.id}:${s.order}`] || {};
                    const reps = Number(val.reps ?? s.reps);
                    const kg = Number(val.kg ?? s.kg);
                    if (reps > 0 && kg > 0) {
                        const est = calculateEstimated1RM(kg, reps);
                        return est > max ? est : max;
                    }
                    return max;
                }, 0);

                if (max1RM <= 0) return null;
                return (
                    <div style={{
                        marginTop: '0.45rem',
                        marginBottom: '0.5rem',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fbbf24',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                    }}>
                        <span>🏆 1RM Estimado: <strong>{max1RM} kg</strong></span>
                        <span style={{ fontSize: '0.68rem', opacity: 0.75 }}>· Fórmula Epley</span>
                    </div>
                );
            })()}

            {completed ? (
                <div className="session-exercise-actions">
                    {rpe && <span className="session-rpe-badge">RPE {rpe}</span>}
                    <button className="btn-outline" onClick={onUnmark} disabled={busy}>
                        Marcar como pendiente
                    </button>
                </div>
            ) : (
                <>
                    <div className="session-rpe">
                        <span className="session-rpe-label">Esfuerzo percibido (RPE) — opcional</span>
                        <div className="session-rpe-scale">
                            {RPE_VALUES.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`session-rpe-btn ${rpe === value ? 'selected' : ''}`}
                                    onClick={() => onRpeChange(row, rpe === value ? null : value)}
                                    aria-label={`RPE ${value}`}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                        <div className="session-rpe-hints">
                            <span>Suave</span>
                            <span>Máximo</span>
                        </div>
                    </div>

                    <div className="session-exercise-actions">
                        <button
                            className="btn-primary"
                            onClick={onComplete}
                            disabled={!canComplete || busy}
                        >
                            <FiCheck size={16} />
                            <span>Completar ejercicio</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default ExerciseCard;
