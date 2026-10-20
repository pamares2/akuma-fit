import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCheckCircle, FiAlertTriangle, FiTrendingUp, FiTrendingDown, FiActivity, FiCalendar, FiFileText } from 'react-icons/fi';
import StatCard from '../../components/complex/StatCard/StatCard.jsx';
import EventList from '../../components/complex/EventList/EventList.jsx';
import Spinner from '../../components/primitives/Spinner/Spinner.jsx';
import AnimeBanner from '../../components/complex/AnimeBanner/AnimeBanner.jsx';
import { dashboardService } from '../../services/dashboardService.js';

function CoachDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeClients: 0,
        weeklyCheckIns: 0,
        clientsWithoutCheckIn: 0,
        completedSessions: 0,
        checkInTrend: null,
    });
    const [alerts, setAlerts] = useState([]);
    const [recentCheckIns, setRecentCheckIns] = useState([]);
    const [completedSessions, setCompletedSessions] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsData, alertsData, checkInsData, sessionsData] = await Promise.all([
                    dashboardService.getExtendedStats(),
                    dashboardService.getAlerts(),
                    dashboardService.getRecentCheckIns(),
                    dashboardService.getCompletedSessions(),
                ]);
                setStats(statsData);
                setAlerts(alertsData);
                setRecentCheckIns(checkInsData);
                setCompletedSessions(sessionsData);
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
        { value: stats.activeClients, label: 'Clientes activos', icon: <FiUsers /> },
        {
            value: stats.weeklyCheckIns,
            label: 'Check-ins esta semana',
            icon: <FiCheckCircle />,
            trend: stats.checkInTrend,
        },
        { value: stats.clientsWithoutCheckIn, label: 'Sin check-in', icon: <FiAlertTriangle /> },
        { value: stats.completedSessions, label: 'Sesiones completadas', icon: <FiActivity /> },
    ];

    const getTrendIcon = (trend) => {
        if (trend === null || trend === 0) return null;
        return trend > 0 ? <FiTrendingUp /> : <FiTrendingDown />;
    };

    const getTrendText = (trend) => {
        if (trend === null || trend === 0) return null;
        return trend > 0 ? `+${trend}%` : `${trend}%`;
    };

    return (
        <div className="dashboard-main">
            <AnimeBanner />

            <div className="dashboard-title">
                <h1>Panel de Control</h1>
            </div>

            <section className="stats-section">
                <div className="stats-grid">
                    {statsCards.map((stat, index) => (
                        <div key={index} className="stat-card-wrapper">
                            <StatCard value={stat.value} label={stat.label} icon={stat.icon} />
                            {stat.trend !== null && stat.trend !== undefined && (
                                <span className={`stat-trend ${stat.trend > 0 ? 'trend-up' : 'trend-down'}`}>
                                    {getTrendIcon(stat.trend)}
                                    {getTrendText(stat.trend)}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {alerts.length > 0 && (
                <section className="events-section">
                    <h3 className="event-list-title">Alertas y atención requerida</h3>
                    <div className="alerts-list">
                        {alerts.map((alert, index) => (
                            <div key={index} className={`alert-item alert-${alert.type}`}>
                                <div className="alert-content">
                                    <strong>{alert.clientName}</strong>
                                    <span>{alert.text}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="events-section">
                <h3 className="event-list-title">Últimos check-ins</h3>
                {recentCheckIns.length === 0 ? (
                    <p className="empty-state">No hay check-ins recientes</p>
                ) : (
                    <ul className="event-items">
                        {recentCheckIns.map((checkIn, index) => (
                            <li key={index} className="event-item">
                                <div className="event-content">
                                    <p className="event-text">{checkIn.text}</p>
                                    <span className="event-time">{checkIn.time}</span>
                                </div>
                                <span className={`adherence-indicator ${checkIn.adherenceClass}`} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {completedSessions.length > 0 && (
                <section className="events-section">
                    <EventList title="Sesiones completadas recientemente" items={completedSessions} />
                </section>
            )}

            <section className="events-section">
                <h3 className="event-list-title">Accesos rápidos</h3>
                <div className="quick-actions-grid">
                    <Link to="/app/client-checkins" className="quick-action-card">
                        <FiCheckCircle size={24} />
                        <span>Check-ins de clientes</span>
                    </Link>
                    <Link to="/app/calendario" className="quick-action-card">
                        <FiCalendar size={24} />
                        <span>Calendario</span>
                    </Link>
                    <Link to="/app/reportes" className="quick-action-card">
                        <FiFileText size={24} />
                        <span>Reportes</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default CoachDashboard;
