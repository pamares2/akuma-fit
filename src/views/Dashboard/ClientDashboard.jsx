import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiCheckCircle, FiPlay, FiTrendingUp, FiClipboard, FiPlus, FiMessageSquare } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/complex/StatCard/StatCard.jsx';
import Spinner from '../../components/primitives/Spinner/Spinner.jsx';
import AnimeBanner from '../../components/complex/AnimeBanner/AnimeBanner.jsx';
import { clientDashboardService } from '../../services/clientDashboardService.js';
import { formatDate } from '../../utils/data.js';

function ClientDashboard() {
    const [loading, setLoading] = useState(true);
    const [weightData, setWeightData] = useState({ current: null, delta: null, chartData: [] });
    const [checkInStats, setCheckInStats] = useState({ streak: 0, dietAdherence: 0, trainingAdherence: 0 });
    const [trainingStats, setTrainingStats] = useState({ completedThisWeek: 0 });
    const [nextEvent, setNextEvent] = useState(null);
    const [latestFeedback, setLatestFeedback] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [weight, checkIn, training, event, feedback] = await Promise.all([
                    clientDashboardService.getWeightData(),
                    clientDashboardService.getCheckInStats(),
                    clientDashboardService.getTrainingStats(),
                    clientDashboardService.getNextEvent(),
                    clientDashboardService.getLatestCoachFeedback(),
                ]);
                setWeightData(weight);
                setCheckInStats(checkIn);
                setTrainingStats(training);
                setNextEvent(event);
                setLatestFeedback(feedback);
            } catch (err) {
                console.error('Error loading dashboard:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return <Spinner text="Cargando dashboard..." />;
    }

    const statsCards = [
        { value: weightData.current !== null ? `${weightData.current} kg` : '—', label: 'Peso actual', icon: <FiActivity /> },
        { value: weightData.delta !== null ? `${weightData.delta > 0 ? '+' : ''}${weightData.delta} kg` : '—', label: 'Cambio total', icon: <FiTrendingUp /> },
        { value: checkInStats.streak, label: 'Racha check-ins', icon: <FiCheckCircle /> },
        { value: trainingStats.completedThisWeek, label: 'Sesiones esta semana', icon: <FiCheckCircle /> },
    ];

    const formatEventDate = (dateStr, timeStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(date);
        eventDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));

        let dateText;
        if (diffDays === 0) {
            dateText = 'Hoy';
        } else if (diffDays === 1) {
            dateText = 'Mañana';
        } else if (diffDays < 7) {
            dateText = `En ${diffDays} días`;
        } else {
            dateText = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        }

        return timeStr ? `${dateText} a las ${timeStr}` : dateText;
    };

    return (
        <div className="dashboard-main">
            <AnimeBanner />

            <div className="dashboard-title">
                <h1>Mi Panel</h1>
            </div>

            <section className="stats-section">
                <div className="stats-grid">
                    {statsCards.map((stat, index) => (
                        <StatCard key={index} value={stat.value} label={stat.label} icon={stat.icon} />
                    ))}
                </div>
            </section>

            <section className="events-section">
                <div style={{
                    padding: '1.15rem 1.25rem',
                    borderRadius: '14px',
                    background: latestFeedback
                        ? 'linear-gradient(135deg, rgba(230, 57, 70, 0.12) 0%, rgba(24, 27, 32, 0.95) 100%)'
                        : 'var(--color-bg-secondary, #181b20)',
                    border: `1px solid ${latestFeedback ? 'rgba(230, 57, 70, 0.35)' : 'var(--color-border, #282c34)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                }}>
                    <div style={{ flex: 1, minWidth: 'min(100%, 240px)' }}>
                        <h3 className="event-list-title" style={{ margin: '0 0 0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <FiMessageSquare style={{ color: 'var(--color-primary, #e63946)' }} />
                            <span>Chat 1 a 1 con tu Entrenador</span>
                            {latestFeedback && (
                                <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#9aa0a6' }}>
                                    · {formatDate(latestFeedback.updatedAt || latestFeedback.createdAt)}
                                </span>
                            )}
                        </h3>
                        <p style={{ margin: 0, color: latestFeedback ? '#f1f5f9' : '#9aa0a6', lineHeight: 1.5, fontSize: '0.92rem' }}>
                            {latestFeedback
                                ? latestFeedback.text
                                : 'Habla directamente 1 a 1 con tu entrenador para resolver dudas de dieta, entrenamiento o check-ins.'}
                        </p>
                    </div>
                    <Link
                        to="/app/feedback"
                        className="btn-secondary"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <FiMessageSquare />
                        <span>{latestFeedback ? 'Responder en el Chat 1:1' : 'Abrir Chat 1:1'}</span>
                    </Link>
                </div>
            </section>

            {weightData.chartData.length > 0 && (
                <section className="events-section">
                    <h3 className="event-list-title">Evolución de peso</h3>
                    <div style={{ height: '200px', marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weightData.chartData}>
                                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                                <YAxis stroke="#888" fontSize={12} />
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="var(--color-primary)"
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--color-primary)', r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

            {nextEvent && (
                <section className="events-section">
                    <div className="event-list">
                        <h3 className="event-list-title">Próximo evento</h3>
                        <ul className="event-items">
                            <li className="event-item">
                                <div className="event-content">
                                    <p className="event-text">{nextEvent.title}</p>
                                    <span className="event-time">
                                        {formatEventDate(nextEvent.date, nextEvent.time)}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>
            )}

            <section className="events-section">
                <h3 className="event-list-title">Accesos rápidos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                    <Link to="/app/feedback" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiMessageSquare /> Chat Entrenador
                    </Link>
                    <Link to="/app/checkin/new" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiPlus /> Nuevo check-in
                    </Link>
                    <Link to="/app/session" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiPlay /> Entrenar
                    </Link>
                    <Link to="/app/progress" className="btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiTrendingUp /> Ver progreso
                    </Link>
                    <Link to="/app/my-plan" className="btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiClipboard /> Mi plan
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default ClientDashboard;
