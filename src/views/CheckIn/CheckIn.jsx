import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/complex/DataTable/DataTable.jsx';
import LineChart from '../../components/complex/LineChart/LineChart.jsx';
import StatCard from '../../components/complex/StatCard/StatCard.jsx';
import Spinner from '../../components/primitives/Spinner/Spinner.jsx';
import FeedbackThread from '../../components/complex/FeedbackThread/FeedbackThread.jsx';
import { useResource } from '../../hooks/useResource.js';
import { useAutoLoad } from '../../hooks/useAutoLoad.js';
import { useAuth } from '../../context/useAuth.js';
import { checkInService } from '../../services/checkInService.js';
import {
    calculateStreak,
    calculateAverageAdherence,
    buildChartData as buildCheckInChartData,
    generateInsights,
} from '../../utils/checkInStats.js';
import { formatDate } from '../../utils/data.js';
import { CHART_COLORS } from '../../config/chartColors.js';
import { FiCheckCircle, FiTrendingUp, FiTarget, FiActivity, FiPlus, FiMessageSquare, FiSend } from 'react-icons/fi';


/**
 * Vista "Mis Check-Ins" del cliente: estadísticas, feedback del entrenador,
 * canal de comunicación bidireccional, gráficos de adherencia y bienestar,
 * insights e historial de check-ins.
 */
function CheckIn() {
    const navigate = useNavigate();
    const { profileId } = useAuth();
    const { items: checkIns, loading, error, load } = useResource(checkInService);
    useAutoLoad(load);

    const [replyDraft, setReplyDraft] = useState('');
    const [replySending, setReplySending] = useState(false);

    const checkInColumns = [
        { key: 'created_at', label: 'Fecha', render: (val) => formatDate(val) },
        { key: 'how_do_you_feel', label: '¿Cómo te has sentido?' },
        { key: 'diet_adherence', label: 'Dieta' },
        { key: 'training_adherence', label: 'Entrenamiento' },
        { key: 'hunger_level', label: 'Hambre' },
        { key: 'rest_quality', label: 'Descanso' },
        { key: 'comments', label: 'Comentarios' },
        {
            key: 'coach_feedback',
            label: 'Feedback del Coach',
            render: (val) => val ? (
                <span style={{ color: '#10b981', fontWeight: 500 }}>{val}</span>
            ) : (
                <span style={{ color: '#9aa0a6' }}>Pendiente de revisión</span>
            ),
        },
    ];

    const totalCheckIns = checkIns.length;
    const streak = calculateStreak(checkIns);
    const avgDiet = calculateAverageAdherence(checkIns, 'diet_adherence');
    const avgTraining = calculateAverageAdherence(checkIns, 'training_adherence');
    const latestCheckIn = checkIns.length > 0 ? checkIns[0] : null;

    const chartData = buildCheckInChartData(checkIns);

    const adherenceLines = [
        { dataKey: 'diet', name: 'Dieta (%)', color: CHART_COLORS.primary },
        { dataKey: 'training', name: 'Entrenamiento (%)', color: CHART_COLORS.success },
    ];

    const wellbeingLines = [
        { dataKey: 'rest', name: 'Descanso', color: CHART_COLORS.info },
        { dataKey: 'hunger', name: 'Hambre', color: CHART_COLORS.error },
    ];

    const insights = generateInsights(checkIns);

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!latestCheckIn || !replyDraft.trim() || replySending) return;
        setReplySending(true);
        try {
            await checkInService.replyToCheckInFeedback(latestCheckIn.id, replyDraft.trim());
            setReplyDraft('');
            await load();
        } catch (err) {
            window.alert(err.message || 'No se pudo enviar la respuesta.');
        } finally {
            setReplySending(false);
        }
    };

    return (
        <div className="dashboard-main">
            <div className="dashboard-title">
                <h1>Mis Check-Ins y Feedback</h1>
            </div>

            {loading && <Spinner text="Cargando check-ins..." />}
            {error && <div className="error-message">{error}</div>}

            {!loading && !error && checkIns.length === 0 && (
                <div className="empty-state">
                    <p>Aún no has realizado ningún check-in.</p>
                    <p>¡Haz tu primer check-in para empezar a trackear tu progreso!</p>
                </div>
            )}

            {!loading && !error && checkIns.length > 0 && (
                <>
                    <section className="stats-section">
                        <div className="stats-grid">
                            <StatCard
                                value={totalCheckIns}
                                label="Check-ins totales"
                                icon={<FiCheckCircle />}
                            />
                            <StatCard
                                value={streak}
                                label="Racha actual (semanas)"
                                icon={<FiTrendingUp />}
                            />
                            <StatCard
                                value={`${avgDiet}%`}
                                label="Adherencia dieta"
                                icon={<FiTarget />}
                            />
                            <StatCard
                                value={`${avgTraining}%`}
                                label="Adherencia entrenamiento"
                                icon={<FiActivity />}
                            />
                        </div>
                    </section>

                    {latestCheckIn && (
                        <section className="events-section">
                            <div style={{
                                padding: '1.25rem',
                                borderRadius: '14px',
                                background: latestCheckIn.coach_feedback
                                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(24, 27, 32, 0.95) 100%)'
                                    : 'var(--color-bg-secondary, #181b20)',
                                border: `1px solid ${latestCheckIn.coach_feedback ? 'rgba(16, 185, 129, 0.4)' : 'var(--color-border, #282c34)'}`,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                                    <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FiMessageSquare style={{ color: latestCheckIn.coach_feedback ? '#10b981' : 'var(--color-primary, #e63946)' }} />
                                        <span>Feedback de tu Entrenador · Último Check-In ({formatDate(latestCheckIn.created_at)})</span>
                                    </h2>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.2rem 0.65rem',
                                        borderRadius: '999px',
                                        background: latestCheckIn.coach_feedback ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                                        color: latestCheckIn.coach_feedback ? '#10b981' : '#f59e0b',
                                        fontWeight: 600,
                                    }}>
                                        {latestCheckIn.coach_feedback ? 'Revisado por tu coach' : 'Pendiente de revisión'}
                                    </span>
                                </div>

                                <p style={{ margin: '0 0 0.75rem', lineHeight: 1.6, fontSize: '0.95rem', color: latestCheckIn.coach_feedback ? '#f1f5f9' : '#9aa0a6' }}>
                                    {latestCheckIn.coach_feedback
                                        || 'Tu entrenador revisará tu último check-in pronto y te dejará aquí sus indicaciones para la semana.'}
                                </p>

                                {latestCheckIn.client_reply && (
                                    <div style={{
                                        padding: '0.65rem 0.9rem',
                                        borderRadius: '8px',
                                        background: 'rgba(59, 130, 246, 0.12)',
                                        borderLeft: '3px solid #3b82f6',
                                        fontSize: '0.88rem',
                                        marginBottom: '0.75rem',
                                    }}>
                                        <strong style={{ color: '#60a5fa' }}>Tu respuesta: </strong>
                                        <span>{latestCheckIn.client_reply}</span>
                                    </div>
                                )}

                                {latestCheckIn.coach_feedback && (
                                    <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={replyDraft}
                                            onChange={(e) => setReplyDraft(e.target.value)}
                                            placeholder="Responder a la valoración de este check-in..."
                                            className="form-field-input"
                                            style={{ flex: 1, minWidth: '220px' }}
                                        />
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={replySending || !replyDraft.trim()}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                                        >
                                            <FiSend size={14} />
                                            <span>{replySending ? 'Enviando...' : 'Responder'}</span>
                                        </button>
                                    </form>
                                )}
                            </div>
                        </section>
                    )}

                    <section className="events-section">
                        <div className="charts-grid">
                            <LineChart
                                title="Adherencia"
                                data={chartData}
                                lines={adherenceLines}
                            />
                            <LineChart
                                title="Bienestar"
                                data={chartData}
                                lines={wellbeingLines}
                            />
                        </div>
                    </section>

                    {insights.length > 0 && (
                        <section className="events-section">
                            <h2 className="section-title">Resumen</h2>
                            <div className="check-in-insights-list">
                                {insights.map((insight, index) => (
                                    <div
                                        key={index}
                                        className={`alert-item ${insight.type === 'positive' ? 'alert-success' : insight.type === 'warning' ? 'alert-warning' : 'alert-info'}`}
                                    >
                                        <span className="alert-icon">
                                            {insight.type === 'positive' && '✓'}
                                            {insight.type === 'warning' && '!'}
                                            {insight.type === 'neutral' && 'i'}
                                        </span>
                                        <span>{insight.text}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="events-section">
                        <h2 className="section-title">Historial de Check-Ins</h2>
                        <DataTable columns={checkInColumns} data={checkIns} />
                    </section>
                </>
            )}

            {profileId && (
                <section className="events-section" style={{ marginTop: '1.5rem' }}>
                    <FeedbackThread
                        clientProfileId={profileId}
                        viewerRole="client"
                        onFeedbackSent={load}
                    />
                </section>
            )}

            <button onClick={() => navigate('/app/checkin/new')} className="btn-fab">
                <span className="button-icon"><FiPlus size={24} /></span>
            </button>
        </div>
    );
}

export default CheckIn;
