import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiSearch,
    FiUser,
    FiActivity,
    FiCalendar,
    FiCheckCircle,
    FiTrendingUp,
    FiFileText,
    FiX,
    FiClipboard,
    FiMessageSquare,
    FiLogIn,
    FiCopy,
    FiCheck,
    FiUserPlus
} from 'react-icons/fi';
import Spinner from '../../components/primitives/Spinner/Spinner.jsx';
import StatCard from '../../components/complex/StatCard/StatCard.jsx';
import FeedbackThread from '../../components/complex/FeedbackThread/FeedbackThread.jsx';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useAuth } from '../../context/useAuth.js';
import { clientManagementService } from '../../services/clientManagementService.js';

export default function Clients() {
    const navigate = useNavigate();
    const { switchClientView } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [selectedAssessmentClient, setSelectedAssessmentClient] = useState(null);
    const [assessmentModalData, setAssessmentModalData] = useState(null);
    const [loadingAssessment, setLoadingAssessment] = useState(false);
    const [selectedFeedbackClient, setSelectedFeedbackClient] = useState(null);
    const [copiedLink, setCopiedLink] = useState(false);

    const handleCopyRegisterLink = () => {
        const registerUrl = typeof window !== 'undefined' ? `${window.location.origin}/register` : '/register';
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(registerUrl)
                .then(() => {
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                })
                .catch(() => {
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                });
        } else {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };

    const handleEnterAsClient = (client) => {
        switchClientView(client.id);
        navigate('/app/nutrition');
    };

    const { data: clients, loading, error, reload } = useAsyncData(
        () => clientManagementService.getAllClients(),
        []
    );

    const filteredClients = useMemo(() => {
        if (!clients) return [];
        return clients.filter((client) => {
            const matchesSearch = client.fullName.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (filterCategory === 'no_routine') {
                return client.routines.length === 0;
            }
            if (filterCategory === 'no_meal_plan') {
                return client.mealPlans.length === 0;
            }
            if (filterCategory === 'no_assessment') {
                return !client.hasAssessment;
            }
            return true;
        });
    }, [clients, searchTerm, filterCategory]);

    const stats = useMemo(() => {
        if (!clients) return { total: 0, withRoutine: 0, withMealPlan: 0, withCheckIn: 0 };
        return {
            total: clients.length,
            withRoutine: clients.filter((c) => c.routines.length > 0).length,
            withMealPlan: clients.filter((c) => c.mealPlans.length > 0).length,
            withCheckIn: clients.filter((c) => c.latestCheckIn !== null).length,
        };
    }, [clients]);

    const handleViewAssessment = async (client) => {
        setSelectedAssessmentClient(client);
        setLoadingAssessment(true);
        try {
            const data = await clientManagementService.getClientAssessment(client.id);
            setAssessmentModalData(data);
        } catch (err) {
            console.error('Error al cargar valoración:', err);
        } finally {
            setLoadingAssessment(false);
        }
    };

    const closeModal = () => {
        setSelectedAssessmentClient(null);
        setAssessmentModalData(null);
    };

    if (loading) {
        return <Spinner text="Cargando cartera de clientes..." />;
    }

    if (error) {
        return (
            <div className="page-container" style={{ padding: '2rem' }}>
                <div className="error-message">Error al cargar clientes: {error}</div>
                <button className="btn-primary" onClick={reload} style={{ marginTop: '1rem' }}>
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard-main" style={{ padding: 'clamp(0.85rem, 3vw, 1.5rem)', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Gestión de Clientes</h1>
                    <p style={{ color: 'var(--color-text-secondary, #9aa0a6)', margin: '0.25rem 0 0' }}>
                        Supervisa el progreso, el feedback, las valoraciones y la asignación de planes de tus atletas.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={handleCopyRegisterLink}
                        className="btn-secondary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            background: 'var(--color-bg-secondary, #181b20)',
                            border: '1px solid var(--color-border, #3a3f4b)',
                            color: copiedLink ? '#10b981' : '#ffffff',
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                        }}
                        title="Copiar enlace directo de registro para enviar a clientes"
                    >
                        {copiedLink ? <FiCheck /> : <FiUserPlus />}
                        {copiedLink ? '¡Enlace copiado!' : 'Copiar enlace de registro'}
                    </button>
                    <Link to="/app/plans" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <FiClipboard /> Crear Nueva Rutina
                    </Link>
                </div>
            </div>

            {/* Tarjetas de Estadísticas */}
            <section className="stats-section" style={{ marginBottom: '2rem' }}>
                <div className="stats-grid">
                    <StatCard value={stats.total} label="Total Clientes" icon={<FiUser />} />
                    <StatCard value={stats.withRoutine} label="Con Rutina Asignada" icon={<FiActivity />} />
                    <StatCard value={stats.withMealPlan} label="Con Dieta Asignada" icon={<FiCalendar />} />
                    <StatCard value={stats.withCheckIn} label="Con Check-in Reciente" icon={<FiCheckCircle />} />
                </div>
            </section>

            {/* Barra de Búsqueda y Filtros */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: 'var(--color-bg-secondary, #181b20)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid var(--color-border, #282c34)'
            }}>
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                    <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-input"
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'no_routine', label: 'Sin Rutina' },
                        { id: 'no_meal_plan', label: 'Sin Dieta' },
                        { id: 'no_assessment', label: 'Sin Valoración' },
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilterCategory(f.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border, #3a3f4b)',
                                background: filterCategory === f.id ? 'var(--color-primary, #e63946)' : 'transparent',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Listado de Clientes */}
            {filteredClients.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem 1.5rem',
                    background: 'var(--color-bg-secondary, #181b20)',
                    borderRadius: '12px',
                    border: '1px dashed var(--color-border, #282c34)',
                    maxWidth: '680px',
                    margin: '0 auto'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(230, 57, 70, 0.12)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary, #e63946)',
                        marginBottom: '1rem',
                    }}>
                        <FiUserPlus size={32} />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem' }}>
                        {searchTerm ? 'No se encontraron clientes' : 'Cartera de clientes lista'}
                    </h3>
                    <p style={{ color: '#9aa0a6', margin: '0 auto 1.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        {searchTerm
                            ? 'Intenta modificar el término de búsqueda.'
                            : 'Tu plataforma está limpia y preparada para registrar atletas reales. Comparte el enlace de registro con tu cliente para que cree su cuenta y complete su valoración inicial.'}
                    </p>

                    {!searchTerm && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: '#0d0f12',
                                border: '1px solid var(--color-border, #282c34)',
                                borderRadius: '8px',
                                padding: '0.5rem 0.75rem',
                                width: '100%',
                                maxWidth: '460px',
                                gap: '0.5rem'
                            }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={typeof window !== 'undefined' ? `${window.location.origin}/register` : '/register'}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ffffff',
                                        width: '100%',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        fontFamily: 'monospace'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleCopyRegisterLink}
                                    className="btn-primary"
                                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                                >
                                    {copiedLink ? <FiCheck /> : <FiCopy />}
                                    {copiedLink ? 'Copiado' : 'Copiar'}
                                </button>
                            </div>

                            <div style={{
                                textAlign: 'left',
                                marginTop: '0.5rem',
                                padding: '1rem',
                                background: '#13161c',
                                borderRadius: '8px',
                                border: '1px solid #222630',
                                width: '100%',
                                maxWidth: '460px',
                                fontSize: '0.85rem',
                                color: '#9aa0a6'
                            }}>
                                <div style={{ fontWeight: 600, color: '#e5e7eb', marginBottom: '0.4rem' }}>
                                    Flujo recomendado para demostración con tu cliente:
                                </div>
                                <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    <li>Pasa este enlace a tu cliente (o pruébalo en una ventana privada de incógnito).</li>
                                    <li>Tu cliente crea su cuenta con email y contraseña.</li>
                                    <li>Completa su valoración inicial (objetivos, nivel, disponibilidad, etc.).</li>
                                    <li>Aparecerá aquí automáticamente para que le asignes su rutina y dieta ANEF.</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {filteredClients.map((client) => {
                        const routineCount = client.routines.length;
                        const mealPlanCount = client.mealPlans.length;
                        const lastCheckIn = client.latestCheckIn;
                        const isDemoClient = String(client.id).startsWith('demo-client-');

                        return (
                            <div
                                key={client.id}
                                style={{
                                    background: 'var(--color-bg-secondary, #181b20)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border, #282c34)',
                                    padding: '1.25rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    transition: 'transform 0.15s, border-color 0.15s',
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '50%',
                                                background: '#282c34',
                                                color: 'var(--color-primary, #e63946)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.2rem',
                                                fontWeight: 700,
                                            }}>
                                                {client.name?.[0]?.toUpperCase() || 'C'}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{client.fullName}</h3>
                                                <span style={{ fontSize: '0.8rem', color: '#9aa0a6' }}>
                                                    {client.gender} {client.birthdate ? `• ${client.birthdate}` : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {isDemoClient && (
                                            <button
                                                type="button"
                                                onClick={() => handleEnterAsClient(client)}
                                                style={{
                                                    padding: '0.35rem 0.65rem',
                                                    fontSize: '0.75rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(16, 185, 129, 0.45)',
                                                    background: 'rgba(16, 185, 129, 0.14)',
                                                    color: '#10b981',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={`Entrar como ${client.fullName} para ver su dieta ANEF y rutina`}
                                            >
                                                <FiLogIn /> Entrar como cliente
                                            </button>
                                        )}
                                    </div>

                                    {/* Insignias de Estado */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            background: routineCount > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            color: routineCount > 0 ? '#10b981' : '#ef4444',
                                            border: `1px solid ${routineCount > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                                        }}>
                                            {routineCount > 0 ? `${routineCount} Rutina(s)` : 'Sin Rutina'}
                                        </span>

                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            background: mealPlanCount > 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                                            color: mealPlanCount > 0 ? '#60a5fa' : '#9ca3af',
                                            border: `1px solid ${mealPlanCount > 0 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`
                                        }}>
                                            {mealPlanCount > 0 ? `${mealPlanCount} Dieta(s)` : 'Sin Dieta'}
                                        </span>

                                        {lastCheckIn ? (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                background: 'rgba(245, 158, 11, 0.15)',
                                                color: '#f59e0b',
                                                border: '1px solid rgba(245, 158, 11, 0.3)'
                                            }}>
                                                Check-in: {new Date(lastCheckIn.created_at).toLocaleDateString('es-ES')}
                                            </span>
                                        ) : (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                background: 'rgba(107, 114, 128, 0.15)',
                                                color: '#9ca3af',
                                                border: '1px solid rgba(107, 114, 128, 0.3)'
                                            }}>
                                                Sin check-ins
                                            </span>
                                        )}
                                    </div>

                                    {/* Metas / Objetivo */}
                                    {client.assessment?.goals && (
                                        <p style={{
                                            fontSize: '0.85rem',
                                            color: '#cbd5e1',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '6px',
                                            margin: '0 0 1rem',
                                        }}>
                                            <strong>Objetivo:</strong> {client.assessment.goals}
                                        </p>
                                    )}
                                </div>

                                {/* Acciones Rápidas */}
                                <div style={{
                                    borderTop: '1px solid var(--color-border, #282c34)',
                                    paddingTop: '0.75rem',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(78px, 1fr))',
                                    gap: '0.4rem',
                                }}>
                                    {client.hasAssessment && (
                                        <button
                                            onClick={() => handleViewAssessment(client)}
                                            style={{
                                                flex: 1,
                                                padding: '0.45rem',
                                                fontSize: '0.8rem',
                                                borderRadius: '6px',
                                                border: '1px solid var(--color-border, #3a3f4b)',
                                                background: 'transparent',
                                                color: '#ffffff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.25rem'
                                            }}
                                        >
                                            <FiFileText /> Ficha
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setSelectedFeedbackClient(client)}
                                        style={{
                                            flex: 1,
                                            padding: '0.45rem',
                                            fontSize: '0.8rem',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(230, 57, 70, 0.45)',
                                            background: 'rgba(230, 57, 70, 0.12)',
                                            color: '#ffffff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.25rem',
                                            fontWeight: 600,
                                        }}
                                    >
                                        <FiMessageSquare /> Feedback
                                    </button>

                                    <Link
                                        to="/app/client-checkins"
                                        style={{
                                            flex: 1,
                                            padding: '0.45rem',
                                            fontSize: '0.8rem',
                                            borderRadius: '6px',
                                            border: '1px solid var(--color-border, #3a3f4b)',
                                            background: 'transparent',
                                            color: '#ffffff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.25rem',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <FiCheckCircle /> Check-in
                                    </Link>

                                    <Link
                                        to={`/app/plans?clientId=${client.id}`}
                                        style={{
                                            flex: 1,
                                            padding: '0.45rem',
                                            fontSize: '0.8rem',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(245, 158, 11, 0.45)',
                                            background: 'rgba(245, 158, 11, 0.12)',
                                            color: '#ffffff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.25rem',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                        }}
                                        title="Editar, asignar y progresar las rutinas y cargas de este cliente"
                                    >
                                        <FiActivity /> Rutinas
                                    </Link>

                                    <Link
                                        to={`/app/dietas/new?clientId=${client.id}`}
                                        style={{
                                            flex: 1,
                                            padding: '0.45rem',
                                            fontSize: '0.8rem',
                                            borderRadius: '6px',
                                            border: '1px solid var(--color-primary, #e63946)',
                                            background: 'rgba(230, 57, 70, 0.12)',
                                            color: '#ffffff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.25rem',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                        }}
                                        title="Crear dieta personalizada ANEF con los datos de este cliente"
                                    >
                                        <FiClipboard /> Dieta ANEF
                                    </Link>

                                    <Link
                                        to="/app/reportes"
                                        style={{
                                            flex: 1,
                                            padding: '0.45rem',
                                            fontSize: '0.8rem',
                                            borderRadius: '6px',
                                            border: '1px solid var(--color-border, #3a3f4b)',
                                            background: 'transparent',
                                            color: '#ffffff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.25rem',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        <FiTrendingUp /> Progreso
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Feedback Directo Entrenador <-> Cliente */}
            {selectedFeedbackClient && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem',
                    }}
                    onClick={() => setSelectedFeedbackClient(null)}
                >
                    <div
                        style={{
                            maxWidth: '680px',
                            width: '100%',
                            position: 'relative',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <FeedbackThread
                            clientProfileId={selectedFeedbackClient.id}
                            clientName={selectedFeedbackClient.fullName}
                            viewerRole="coach"
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                            <button
                                onClick={() => setSelectedFeedbackClient(null)}
                                className="btn-secondary"
                                style={{ padding: '0.5rem 1.25rem' }}
                            >
                                Cerrar ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Valoración Inicial */}
            {selectedAssessmentClient && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem',
                }}>
                    <div style={{
                        background: 'var(--color-bg-secondary, #181b20)',
                        border: '1px solid var(--color-border, #282c34)',
                        borderRadius: '16px',
                        maxWidth: '650px',
                        width: '100%',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)'
                    }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--color-border, #282c34)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                                    Valoración Inicial: {selectedAssessmentClient.fullName}
                                </h2>
                                <span style={{ fontSize: '0.8rem', color: '#9aa0a6' }}>
                                    Fecha de envío: {assessmentModalData?.created_at ? new Date(assessmentModalData.created_at).toLocaleDateString('es-ES') : '—'}
                                </span>
                            </div>
                            <button
                                onClick={closeModal}
                                style={{ background: 'transparent', border: 'none', color: '#9aa0a6', cursor: 'pointer', fontSize: '1.25rem' }}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {loadingAssessment ? (
                                <Spinner text="Cargando detalles de la valoración..." />
                            ) : assessmentModalData ? (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#9aa0a6', display: 'block' }}>Estatura</span>
                                            <strong style={{ fontSize: '1rem' }}>{assessmentModalData.height ? `${assessmentModalData.height} cm` : 'No indicada'}</strong>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#9aa0a6', display: 'block' }}>Nivel actual</span>
                                            <strong style={{ fontSize: '1rem' }}>{assessmentModalData.current_level || 'No indicado'}</strong>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#9aa0a6', display: 'block' }}>Frecuencia de entreno</span>
                                            <strong style={{ fontSize: '1rem' }}>{assessmentModalData.training_freq || 'No indicada'}</strong>
                                        </div>
                                    </div>

                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: '#9aa0a6', display: 'block', marginBottom: '0.25rem' }}>Objetivos</span>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                            {assessmentModalData.goals || 'Sin especificar'}
                                        </div>
                                    </div>

                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: '#9aa0a6', display: 'block', marginBottom: '0.25rem' }}>Lugar y Equipamiento</span>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                            Lugar: {assessmentModalData.where || 'No especificado'} <br />
                                            Equipamiento disponible: {assessmentModalData.equipment || 'No especificado'}
                                        </div>
                                    </div>

                                    {(assessmentModalData.current_injuries || assessmentModalData.disease || assessmentModalData.medical_restrictions) && (
                                        <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: '0.75rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                                                Atención médica / Lesiones
                                            </span>
                                            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                                                {assessmentModalData.current_injuries && <div><strong>Lesiones:</strong> {assessmentModalData.current_injuries}</div>}
                                                {assessmentModalData.disease && <div><strong>Enfermedades:</strong> {assessmentModalData.disease}</div>}
                                                {assessmentModalData.medical_restrictions && <div><strong>Restricciones:</strong> {assessmentModalData.medical_restrictions}</div>}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: '#9aa0a6', display: 'block', marginBottom: '0.25rem' }}>Alimentación actual y restricciones</span>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                            Dieta: {assessmentModalData.current_diet || 'No especificada'} <br />
                                            Restricciones: {assessmentModalData.food_restrictions || 'Ninguna'}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p style={{ color: '#9aa0a6' }}>No se han encontrado datos de valoración inicial.</p>
                            )}
                        </div>

                        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border, #282c34)', textAlign: 'right' }}>
                            <button onClick={closeModal} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
