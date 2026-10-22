import { useState } from 'react';
import { FiMessageSquare, FiSend, FiCheck } from 'react-icons/fi';
import { getAdherenceClass, ADHERENCE_MAP } from '../../../utils/checkInStats.js';

const QUICK_FEEDBACK_TEMPLATES = [
    '¡Gran semana de trabajo! Mantenemos calorías y buscamos progresar en cargas.',
    'Buena adherencia general. Esta semana prioriza llegar al objetivo de pasos y descanso.',
    'Ajustamos ligeramente el plan nutricional según tus sensaciones de hambre y energía.',
];

/**
 * Bloque de respuesta del entrenador para un check-in concreto.
 */
function CoachFeedbackBox({ checkIn, onSaveFeedback }) {
    const [draft, setDraft] = useState(checkIn.coach_feedback || '');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const handleSave = async () => {
        if (!onSaveFeedback || !draft.trim()) return;
        setSaving(true);
        setErrorMsg(null);
        setSavedMsg(false);
        try {
            await onSaveFeedback(checkIn.id, draft.trim());
            setSavedMsg(true);
            setTimeout(() => setSavedMsg(false), 2500);
        } catch (err) {
            setErrorMsg(err.message || 'No se pudo guardar el feedback');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="checkin-block"
            style={{
                gridColumn: '1 / -1',
                border: '1px solid rgba(230, 57, 70, 0.35)',
                background: 'linear-gradient(135deg, rgba(230, 57, 70, 0.08) 0%, rgba(24, 27, 32, 0.95) 100%)',
                borderRadius: '12px',
                padding: '1.15rem',
                marginTop: '0.75rem',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 className="block-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiMessageSquare style={{ color: 'var(--color-primary, #e63946)' }} />
                    <span>Feedback del Entrenador para este Check-In</span>
                </h3>
                {checkIn.coach_feedback && (
                    <span style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        fontWeight: 600,
                    }}>
                        Respondido
                    </span>
                )}
            </div>

            {checkIn.client_reply && (
                <div style={{
                    marginBottom: '0.85rem',
                    padding: '0.7rem 0.9rem',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderLeft: '3px solid #3b82f6',
                    fontSize: '0.88rem',
                }}>
                    <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '0.2rem' }}>
                        Respuesta del cliente:
                    </strong>
                    <span>{checkIn.client_reply}</span>
                </div>
            )}

            {onSaveFeedback ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {QUICK_FEEDBACK_TEMPLATES.map((tpl, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setDraft(tpl)}
                                style={{
                                    fontSize: '0.75rem',
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: '999px',
                                    border: '1px solid var(--color-border, #3a3f4b)',
                                    background: 'rgba(255,255,255,0.04)',
                                    color: 'var(--color-text-secondary, #cbd5e1)',
                                    cursor: 'pointer',
                                }}
                            >
                                + {tpl.slice(0, 42)}...
                            </button>
                        ))}
                    </div>

                    <textarea
                        rows={3}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Escribe aquí tu valoración, ajustes de dieta/entreno y ánimos para el cliente..."
                        className="form-field-textarea"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'var(--color-bg, #111318)',
                            border: '1px solid var(--color-border, #2d323e)',
                            color: '#ffffff',
                            fontSize: '0.9rem',
                        }}
                    />

                    {errorMsg && <div className="error-message" style={{ margin: 0 }}>{errorMsg}</div>}
                    {savedMsg && (
                        <div style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                            <FiCheck /> Feedback enviado y visible para el cliente.
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            className="btn-primary"
                            disabled={saving || !draft.trim()}
                            onClick={handleSave}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1.1rem' }}
                        >
                            <FiSend size={15} />
                            <span>{saving ? 'Guardando...' : checkIn.coach_feedback ? 'Actualizar feedback' : 'Enviar feedback al cliente'}</span>
                        </button>
                    </div>
                </div>
            ) : (
                <p style={{ margin: 0, color: checkIn.coach_feedback ? '#f1f5f9' : '#9aa0a6', lineHeight: 1.5 }}>
                    {checkIn.coach_feedback || 'Sin feedback registrado para este check-in.'}
                </p>
            )}
        </div>
    );
}

/**
 * Detalle de un check-in, en modo compacto (tarjeta de historial) o completo
 * (bloques por categoría), incluyendo el feedback del entrenador.
 *
 * @param {Object} props - Props del componente.
 * @param {Object} props.checkIn - Datos del check-in.
 * @param {boolean} [props.compact=false] - Si se muestra el modo compacto.
 * @param {(checkInId: number, text: string) => Promise<void>} [props.onSaveFeedback] - Callback para guardar feedback del coach.
 */
function CheckInDetailBlock({ checkIn, compact = false, onSaveFeedback }) {
    if (!checkIn) return null;

    if (compact) {
        return (
            <div className="history-card-content">
                <div className="history-detail">
                    <span className="detail-label">Dieta:</span>
                    <span>{checkIn.diet_adherence}</span>
                </div>
                {checkIn.diet_adherence_reason && (
                    <div className="history-detail reason">
                        <span className="detail-label">Motivo dieta:</span>
                        <span>{checkIn.diet_adherence_reason}</span>
                    </div>
                )}
                <div className="history-detail">
                    <span className="detail-label">Entrenamiento:</span>
                    <span>{checkIn.training_adherence}</span>
                </div>
                {checkIn.training_adherence_reason && (
                    <div className="history-detail reason">
                        <span className="detail-label">Motivo entreno:</span>
                        <span>{checkIn.training_adherence_reason}</span>
                    </div>
                )}
                <div className="history-detail">
                    <span className="detail-label">Cardio:</span>
                    <span>{checkIn.cardio_adherence}</span>
                </div>
                <div className="history-detail">
                    <span className="detail-label">Rendimiento gym:</span>
                    <span>{checkIn.gym_performance}/5</span>
                </div>
                {checkIn.avg_daily_steps && (
                    <div className="history-detail">
                        <span className="detail-label">Pasos diarios:</span>
                        <span>{checkIn.avg_daily_steps}</span>
                    </div>
                )}
                <div className="history-detail">
                    <span className="detail-label">Descanso:</span>
                    <span>{checkIn.rest_quality}/10</span>
                </div>
                {checkIn.avg_sleep_hours && (
                    <div className="history-detail">
                        <span className="detail-label">Horas sueño:</span>
                        <span>{checkIn.avg_sleep_hours}h</span>
                    </div>
                )}
                <div className="history-detail">
                    <span className="detail-label">Energía:</span>
                    <span>{checkIn.energy_level}/10</span>
                </div>
                <div className="history-detail">
                    <span className="detail-label">Hambre:</span>
                    <span>{checkIn.hunger_level}/10</span>
                </div>
                <div className="history-detail text-detail">
                    <span className="detail-label">Cómo te has sentido:</span>
                    <p>{checkIn.how_do_you_feel}</p>
                </div>
                {checkIn.comments && (
                    <div className="history-detail text-detail">
                        <span className="detail-label">Comentarios:</span>
                        <p>{checkIn.comments}</p>
                    </div>
                )}
                {checkIn.next_week_goal && (
                    <div className="history-detail text-detail">
                        <span className="detail-label">Objetivo próxima semana:</span>
                        <p>{checkIn.next_week_goal}</p>
                    </div>
                )}
                <CoachFeedbackBox
                    key={`${checkIn.id}-${checkIn.coach_feedback || ''}`}
                    checkIn={checkIn}
                    onSaveFeedback={onSaveFeedback}
                />
            </div>
        );
    }

    return (
        <div className="checkin-blocks">
            <div className="checkin-block">
                <h3 className="block-title">Adherencia y cumplimiento</h3>
                <div className="block-content">
                    <div className="checkin-field">
                        <span className="field-label">Dieta:</span>
                        <span className={`field-value ${getAdherenceClass(ADHERENCE_MAP[checkIn.diet_adherence])}`}>
                            {checkIn.diet_adherence}
                        </span>
                    </div>
                    {checkIn.diet_adherence_reason && (
                        <div className="checkin-field reason">
                            <span className="field-label">Motivo:</span>
                            <span className="field-value">{checkIn.diet_adherence_reason}</span>
                        </div>
                    )}
                    <div className="checkin-field">
                        <span className="field-label">Entrenamiento:</span>
                        <span className={`field-value ${getAdherenceClass(ADHERENCE_MAP[checkIn.training_adherence])}`}>
                            {checkIn.training_adherence}
                        </span>
                    </div>
                    {checkIn.training_adherence_reason && (
                        <div className="checkin-field reason">
                            <span className="field-label">Motivo:</span>
                            <span className="field-value">{checkIn.training_adherence_reason}</span>
                        </div>
                    )}
                    <div className="checkin-field">
                        <span className="field-label">Cardio:</span>
                        <span className="field-value">{checkIn.cardio_adherence}</span>
                    </div>
                </div>
            </div>

            <div className="checkin-block">
                <h3 className="block-title">Rendimiento deportivo</h3>
                <div className="block-content">
                    <div className="checkin-field">
                        <span className="field-label">Rendimiento gym:</span>
                        <span className="field-value">{checkIn.gym_performance}/5</span>
                    </div>
                    {checkIn.avg_daily_steps && (
                        <div className="checkin-field">
                            <span className="field-label">Pasos diarios:</span>
                            <span className="field-value">{checkIn.avg_daily_steps}</span>
                        </div>
                    )}
                    {checkIn.next_week_goal && (
                        <div className="checkin-field">
                            <span className="field-label">Objetivo próxima semana:</span>
                            <span className="field-value">{checkIn.next_week_goal}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="checkin-block">
                <h3 className="block-title">Bienestar y recuperación</h3>
                <div className="block-content">
                    <div className="checkin-field">
                        <span className="field-label">Descanso:</span>
                        <span className="field-value">{checkIn.rest_quality}/10</span>
                    </div>
                    {checkIn.avg_sleep_hours && (
                        <div className="checkin-field">
                            <span className="field-label">Horas de sueño:</span>
                            <span className="field-value">{checkIn.avg_sleep_hours}h</span>
                        </div>
                    )}
                    <div className="checkin-field">
                        <span className="field-label">Energía:</span>
                        <span className="field-value">{checkIn.energy_level}/10</span>
                    </div>
                    <div className="checkin-field">
                        <span className="field-label">Hambre:</span>
                        <span className="field-value">{checkIn.hunger_level}/10</span>
                    </div>
                </div>
            </div>

            <div className="checkin-block">
                <h3 className="block-title">Feedback subjetivo del cliente</h3>
                <div className="block-content">
                    <div className="checkin-field">
                        <span className="field-label">¿Cómo te has sentido?</span>
                        <p className="field-value text-block">{checkIn.how_do_you_feel}</p>
                    </div>
                    {checkIn.comments && (
                        <div className="checkin-field">
                            <span className="field-label">Comentarios:</span>
                            <p className="field-value text-block">{checkIn.comments}</p>
                        </div>
                    )}
                </div>
            </div>

            <CoachFeedbackBox
                key={`${checkIn.id}-${checkIn.coach_feedback || ''}`}
                checkIn={checkIn}
                onSaveFeedback={onSaveFeedback}
            />
        </div>
    );
}

export default CheckInDetailBlock;
