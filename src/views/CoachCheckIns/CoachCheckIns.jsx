import { useState } from 'react';
import LineChart from '../../components/complex/LineChart/LineChart.jsx';
import Spinner from '../../components/primitives/Spinner/Spinner.jsx';
import ClientSelector from '../../components/complex/ClientSelector/ClientSelector.jsx';
import CheckInDetailBlock from '../../components/complex/CheckInDetailBlock/CheckInDetailBlock.jsx';
import FeedbackThread from '../../components/complex/FeedbackThread/FeedbackThread.jsx';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { coachCheckInService } from '../../services/coachCheckInService.js';
import { generateCoachAlerts, buildChartData, ADHERENCE_MAP, getAdherenceClass } from '../../utils/checkInStats.js';
import { formatDate } from '../../utils/data.js';
import { CHART_COLORS } from '../../config/chartColors.js';
import { FiAlertTriangle, FiChevronDown, FiChevronUp, FiMessageSquare } from 'react-icons/fi';


const COACH_CHART_FIELDS = [
    { key: 'energy', source: 'energy_level' },
    { key: 'gymPerformance', source: 'gym_performance' },
];

/**
 * Vista de check-ins de clientes para el coach: selector de cliente, alertas,
 * último check-in con respuesta del entrenador, canal de feedback directo,
 * gráficos de evolución e historial desplegable.
 */
function CoachCheckIns() {
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [expandedCards, setExpandedCards] = useState({});
    const [reloadKey, setReloadKey] = useState(0);

    const { data: clients, loading, error: clientsError } = useAsyncData(
        () => coachCheckInService.getClients().then((data) => {
            if (data.length > 0) setSelectedClientId((prev) => prev ?? data[0].id);
            return data;
        }),
        []
    );

    const { data: checkIns, loading: loadingCheckIns, error: checkInsError } = useAsyncData(
        selectedClientId ? () => coachCheckInService.getClientCheckIns(selectedClientId) : null,
        [selectedClientId, reloadKey]
    );

    const error = clientsError || checkInsError;

    const toggleCard = (index) => {
        setExpandedCards((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const handleSaveFeedback = async (checkInId, feedbackText) => {
        await coachCheckInService.saveCheckInFeedback(selectedClientId, checkInId, feedbackText);
        setReloadKey((k) => k + 1);
    };

    const selectedClient = clients.find((c) => c.id === selectedClientId);
    const clientFullName = selectedClient
        ? `${selectedClient.name || ''} ${selectedClient.surname || ''}`.trim()
        : 'el cliente';
    const latestCheckIn = checkIns.length > 0 ? checkIns[0] : null;
    const alerts = generateCoachAlerts(checkIns);
    const chartData = buildChartData(checkIns, COACH_CHART_FIELDS);

    const adherenceLines = [
        { dataKey: 'diet', name: 'Dieta (%)', color: CHART_COLORS.primary },
        { dataKey: 'training', name: 'Entrenamiento (%)', color: CHART_COLORS.success },
    ];

    const wellbeingLines = [
        { dataKey: 'rest', name: 'Descanso', color: CHART_COLORS.info },
        { dataKey: 'energy', name: 'Energía', color: CHART_COLORS.warning },
        { dataKey: 'hunger', name: 'Hambre', color: CHART_COLORS.error },
    ];

    const performanceLines = [
        { dataKey: 'gymPerformance', name: 'Rendimiento gym (1-5)', color: CHART_COLORS.primary },
    ];

    if (loading) {
        return <Spinner text="Cargando clientes..." />;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (clients.length === 0) {
        return (
            <div className="coach-checkins">
                <h1 className="coach-checkins-title">Check-Ins y Feedback de Clientes</h1>
                <div className="coach-checkins-empty">
                    <p>No tienes clientes asignados.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="coach-checkins">
            <h1 className="coach-checkins-title">Check-Ins y Feedback de Clientes</h1>

            <ClientSelector
                clients={clients}
                selectedClientId={selectedClientId}
                onChange={setSelectedClientId}
                className="coach-checkins-client-selector"
            />

            {selectedClientId && (
                <section style={{ marginBottom: '1.75rem' }}>
                    <FeedbackThread
                        key={`thread-${selectedClientId}-${reloadKey}`}
                        clientProfileId={selectedClientId}
                        clientName={clientFullName}
                        viewerRole="coach"
                    />
                </section>
            )}

            {loadingCheckIns ? (
                <Spinner text="Cargando check-ins..." />
            ) : checkIns.length === 0 ? (
                <div className="coach-checkins-no-data">
                    <p>{selectedClient?.name || 'Este cliente'} aún no ha realizado ningún check-in semanal, pero puedes enviarle feedback directo arriba.</p>
                </div>
            ) : (
                <>
                    {alerts.length > 0 && (
                        <section className="coach-checkins-alerts">
                            <h2 className="section-title">Alertas</h2>
                            <div className="alerts-list">
                                {alerts.map((alert, index) => (
                                    <div key={index} className={`alert-item alert-${alert.type}`}>
                                        <FiAlertTriangle className="alert-icon" />
                                        <span>{alert.text}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {latestCheckIn && (
                        <section className="coach-checkins-latest">
                            <h2 className="section-title">Último Check-In ({formatDate(latestCheckIn.created_at)})</h2>
                            <CheckInDetailBlock
                                checkIn={latestCheckIn}
                                onSaveFeedback={handleSaveFeedback}
                            />
                        </section>
                    )}

                    {chartData.length > 1 && (
                        <section className="coach-checkins-charts">
                            <h2 className="section-title">Evolución temporal</h2>

                            <div className="charts-grid">
                                <LineChart title="Adherencia" data={chartData} lines={adherenceLines} showControls={true} />
                                <LineChart title="Bienestar" data={chartData} lines={wellbeingLines} showControls={true} />
                                <LineChart title="Rendimiento" data={chartData} lines={performanceLines} />
                            </div>
                        </section>
                    )}

                    <section className="coach-checkins-history">
                        <h2 className="section-title">Historial completo</h2>
                        <div className="history-cards">
                            {checkIns.map((checkIn, index) => (
                                <div key={checkIn.id} className={`history-card ${expandedCards[index] ? 'expanded' : ''}`}>
                                    <div className="history-card-header" onClick={() => toggleCard(index)}>
                                        <div className="history-card-summary">
                                            <span className="history-date">{formatDate(checkIn.created_at)}</span>
                                            <div className="history-indicators">
                                                <span className={`indicator ${getAdherenceClass(ADHERENCE_MAP[checkIn.diet_adherence])}`} title="Dieta">
                                                    D
                                                </span>
                                                <span className={`indicator ${getAdherenceClass(ADHERENCE_MAP[checkIn.training_adherence])}`} title="Entrenamiento">
                                                    E
                                                </span>
                                                <span className={`indicator ${getAdherenceClass(checkIn.rest_quality * 10)}`} title="Descanso">
                                                    {checkIn.rest_quality}
                                                </span>
                                                <span className={`indicator ${getAdherenceClass(checkIn.energy_level * 10)}`} title="Energía">
                                                    {checkIn.energy_level}
                                                </span>
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        fontSize: '0.72rem',
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '999px',
                                                        background: checkIn.coach_feedback ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                        color: checkIn.coach_feedback ? '#10b981' : '#f59e0b',
                                                        border: `1px solid ${checkIn.coach_feedback ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                                                    }}
                                                    title={checkIn.coach_feedback ? 'Check-in respondido' : 'Pendiente de feedback'}
                                                >
                                                    <FiMessageSquare size={11} />
                                                    {checkIn.coach_feedback ? 'Respondido' : 'Sin responder'}
                                                </span>
                                            </div>
                                        </div>
                                        {expandedCards[index] ? <FiChevronUp /> : <FiChevronDown />}
                                    </div>
                                    {expandedCards[index] && (
                                        <CheckInDetailBlock
                                            checkIn={checkIn}
                                            compact
                                            onSaveFeedback={handleSaveFeedback}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

export default CoachCheckIns;
