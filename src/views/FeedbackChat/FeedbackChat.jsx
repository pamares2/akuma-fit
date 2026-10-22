import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    FiMessageSquare,
    FiSearch,
    FiUser,
    FiActivity,
    FiCheckCircle,
    FiZap,
    FiClipboard,
    FiAlertCircle,
} from 'react-icons/fi';
import Spinner from '../../components/primitives/Spinner/Spinner.jsx';
import FeedbackThread from '../../components/complex/FeedbackThread/FeedbackThread.jsx';
import { useAuth } from '../../context/useAuth.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { feedbackService } from '../../services/feedbackService.js';
import { formatDate } from '../../utils/data.js';

/**
 * Vista dedicada de Chat y Feedback 1 a 1 Personalizado entre Entrenador y Cliente.
 *
 * - Para el Coach: Bandeja de conversaciones 1 a 1 a la izquierda, chat en vivo en el
 *   centro y ficha rápida de contexto del atleta (peso, objetivo, adherencia, dieta ANEF
 *   y rutina) a la derecha.
 * - Para el Cliente: Chat directo 1 a 1 con su entrenador y accesos rápidos a su plan.
 */
function FeedbackChat() {
    const { userRole, profileId, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialClientParam = searchParams.get('clientId');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState('all'); // 'all' | 'pending'
    const [selectedClientId, setSelectedClientId] = useState(initialClientParam || null);
    const [reloadKey, setReloadKey] = useState(0);

    const { data: conversations, loading, error } = useAsyncData(
        userRole === 'coach'
            ? () => feedbackService.getCoachConversations(true).then((list) => {
                if (list.length > 0) {
                    setSelectedClientId((prev) => {
                        if (prev && list.some(c => String(c.id) === String(prev))) {
                            return prev;
                        }
                        return list[0].id;
                    });
                }
                return list;
            })
            : null,
        [userRole, reloadKey],
        []
    );

    // Sincronización en directo de la bandeja de conversaciones (Web & Móvil)
    useEffect(() => {
        if (userRole !== 'coach') return undefined;
        const unsubscribe = feedbackService.subscribeToClientFeedback('all', () => {
            setReloadKey(k => k + 1);
        });
        return () => unsubscribe();
    }, [userRole]);

    const filteredConversations = useMemo(() => {
        return (conversations || []).filter((conv) => {
            const matchesSearch = conv.fullName.toLowerCase().includes(searchTerm.toLowerCase())
                || (conv.goal || '').toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;
            if (filterMode === 'pending') return conv.needsReply;
            return true;
        });
    }, [conversations, searchTerm, filterMode]);

    const activeClient = useMemo(() => {
        if (!conversations || conversations.length === 0) return null;
        return conversations.find(c => String(c.id) === String(selectedClientId)) || conversations[0];
    }, [conversations, selectedClientId]);

    // Vista del Cliente: Chat 1 a 1 directo con su entrenador
    if (userRole !== 'coach') {
        return (
            <div className="dashboard-main" style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
                            Chat 1 a 1 con tu Entrenador
                        </h1>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary, #9aa0a6)', fontSize: '0.92rem' }}>
                            Resuelve tus dudas de dieta ANEF, técnica de ejercicios o revisa el feedback semanal con tu coach.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="btn-outline"
                            onClick={() => navigate('/app/nutrition')}
                        >
                            🥗 Ver mi Dieta
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => navigate('/app/checkin/new')}
                        >
                            📋 Enviar Check-In Semanal
                        </button>
                    </div>
                </div>

                <FeedbackThread
                    clientProfileId={profileId}
                    clientName={user || 'Atleta'}
                    viewerRole="client"
                    chatHeight="480px"
                />
            </div>
        );
    }

    if (loading && (!conversations || conversations.length === 0)) {
        return <Spinner text="Cargando conversaciones 1 a 1 con clientes..." />;
    }

    return (
        <div className="dashboard-main" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.25rem 1.5rem' }}>
            {/* Cabecera */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem',
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <FiMessageSquare style={{ color: 'var(--color-primary, #e63946)' }} />
                        <span>Feedback y Chat 1 a 1 con Clientes</span>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.65rem',
                            borderRadius: '999px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
                        }}>
                            <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                boxShadow: '0 0 6px #10b981',
                                display: 'inline-block',
                            }} />
                            En directo (Web & App)
                        </span>
                    </h1>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary, #9aa0a6)', fontSize: '0.9rem' }}>
                        Comunicación directa e individualizada con cada atleta, conectada a su Dieta ANEF, rutina y check-ins.
                    </p>
                </div>
            </div>

            {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

            {/* Layout de 3 columnas: Conversaciones | Chat 1 a 1 | Contexto del Cliente */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(270px, 320px) minmax(420px, 1fr) minmax(260px, 310px)',
                gap: '1.25rem',
                alignItems: 'start',
            }}
            className="feedback-chat-layout"
            >
                {/* COLUMNA 1: Lista de Conversaciones 1 a 1 */}
                <aside style={{
                    background: 'var(--color-bg-secondary, #181b20)',
                    border: '1px solid var(--color-border, #282c34)',
                    borderRadius: '16px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                }}>
                    <div style={{ position: 'relative' }}>
                        <FiSearch style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#6b7280',
                        }} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar cliente u objetivo..."
                            className="form-field-input"
                            style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.86rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                            type="button"
                            onClick={() => setFilterMode('all')}
                            style={{
                                flex: 1,
                                padding: '0.4rem 0.6rem',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: filterMode === 'all' ? 'var(--color-primary, #e63946)' : 'transparent',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            Todos ({conversations.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode('pending')}
                            style={{
                                flex: 1,
                                padding: '0.4rem 0.6rem',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: filterMode === 'pending' ? 'var(--color-primary, #e63946)' : 'transparent',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            Por responder ({conversations.filter(c => c.needsReply).length})
                        </button>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        maxHeight: '540px',
                        overflowY: 'auto',
                    }}>
                        {filteredConversations.map((conv) => {
                            const isSelected = activeClient && String(activeClient.id) === String(conv.id);
                            const initials = `${(conv.name || 'C').charAt(0)}${(conv.surname || '').charAt(0)}`.toUpperCase();

                            return (
                                <button
                                    key={conv.id}
                                    type="button"
                                    onClick={() => setSelectedClientId(conv.id)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '0.8rem',
                                        borderRadius: '12px',
                                        border: isSelected
                                            ? '1px solid var(--color-primary, #e63946)'
                                            : '1px solid rgba(255, 255, 255, 0.06)',
                                        background: isSelected
                                            ? 'linear-gradient(135deg, rgba(230, 57, 70, 0.18) 0%, rgba(24, 27, 32, 0.95) 100%)'
                                            : 'rgba(255, 255, 255, 0.02)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        gap: '0.75rem',
                                        alignItems: 'flex-start',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <div style={{
                                        width: '38px',
                                        height: '38px',
                                        borderRadius: '50%',
                                        background: isSelected ? 'var(--color-primary, #e63946)' : '#2d323e',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        flexShrink: 0,
                                    }}>
                                        {initials}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{
                                                fontWeight: 700,
                                                fontSize: '0.9rem',
                                                color: '#fff',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {conv.fullName}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                                {conv.lastMessage?.createdAt && (
                                                    <span style={{ fontSize: '0.68rem', color: '#9aa0a6' }}>
                                                        {formatDate(conv.lastMessage.createdAt)}
                                                    </span>
                                                )}
                                                {conv.needsReply && (
                                                    <span style={{
                                                        fontSize: '0.66rem',
                                                        padding: '0.1rem 0.45rem',
                                                        borderRadius: '999px',
                                                        background: 'rgba(59, 130, 246, 0.22)',
                                                        color: '#60a5fa',
                                                        fontWeight: 700,
                                                    }}>
                                                        Nuevo
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                                                {conv.goal}
                                            </span>
                                            {conv.isDemo && (
                                                <span style={{
                                                    fontSize: '0.64rem',
                                                    padding: '0.05rem 0.4rem',
                                                    borderRadius: '999px',
                                                    background: 'rgba(245, 158, 11, 0.16)',
                                                    color: '#fbbf24',
                                                }}>
                                                    Demo interactivo
                                                </span>
                                            )}
                                        </div>

                                        <p style={{
                                            margin: '0.35rem 0 0',
                                            fontSize: '0.78rem',
                                            color: '#9aa0a6',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {conv.lastMessage
                                                ? `${conv.lastMessage.authorRole === 'coach' ? 'Tú: ' : ''}${conv.lastMessage.text}`
                                                : 'Sin mensajes aún — iniciar chat'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* COLUMNA 2: Chat 1 a 1 en Vivo */}
                <section>
                    {activeClient ? (
                        <FeedbackThread
                            key={`chat-1on1-${activeClient.id}`}
                            clientProfileId={activeClient.id}
                            clientName={activeClient.fullName}
                            viewerRole="coach"
                            allowRoleSwitch={true}
                            chatHeight="450px"
                            onFeedbackSent={() => setReloadKey(k => k + 1)}
                        />
                    ) : (
                        <div className="empty-state">
                            Selecciona un cliente a la izquierda para abrir su chat 1 a 1.
                        </div>
                    )}
                </section>

                {/* COLUMNA 3: Ficha Rápida Personalizada del Cliente */}
                {activeClient && (
                    <aside style={{
                        background: 'var(--color-bg-secondary, #181b20)',
                        border: '1px solid var(--color-border, #282c34)',
                        borderRadius: '16px',
                        padding: '1.15rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                    }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <FiUser style={{ color: 'var(--color-primary, #e63946)' }} />
                                <span>Ficha 1:1 · {activeClient.fullName}</span>
                            </h3>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#9aa0a6' }}>
                                Datos en vivo para personalizar tu feedback
                            </p>
                        </div>

                        {/* Métricas físicas y objetivo */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.6rem',
                        }}>
                            <div style={{
                                padding: '0.65rem',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <span style={{ fontSize: '0.72rem', color: '#9aa0a6', display: 'block' }}>Peso actual</span>
                                <strong style={{ fontSize: '1.05rem', color: '#fff' }}>
                                    {activeClient.weight ? `${activeClient.weight} kg` : '—'}
                                </strong>
                            </div>
                            <div style={{
                                padding: '0.65rem',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <span style={{ fontSize: '0.72rem', color: '#9aa0a6', display: 'block' }}>Altura / Edad</span>
                                <strong style={{ fontSize: '0.95rem', color: '#fff' }}>
                                    {activeClient.height ? `${activeClient.height} cm` : '—'}
                                    {activeClient.age ? ` · ${activeClient.age}a` : ''}
                                </strong>
                            </div>
                        </div>

                        {/* Objetivo y Restricciones */}
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            fontSize: '0.82rem',
                        }}>
                            <div style={{ marginBottom: '0.35rem' }}>
                                <strong style={{ color: '#10b981' }}>🎯 Objetivo: </strong>
                                <span style={{ color: '#f1f5f9' }}>{activeClient.goal}</span>
                            </div>
                            <div>
                                <strong style={{ color: '#fbbf24' }}>⚠️ Restricciones: </strong>
                                <span style={{ color: '#f1f5f9' }}>{activeClient.restrictions || 'Ninguna'}</span>
                            </div>
                        </div>

                        {/* Resumen de Adherencia del último Check-In */}
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.45rem',
                        }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <FiCheckCircle style={{ color: '#10b981' }} /> Último Check-In Semanal
                            </span>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', fontSize: '0.78rem' }}>
                                <div>
                                    <span style={{ color: '#9aa0a6' }}>Dieta: </span>
                                    <strong style={{ color: '#10b981' }}>{activeClient.dietAdherence}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#9aa0a6' }}>Entreno: </span>
                                    <strong style={{ color: '#60a5fa' }}>{activeClient.trainingAdherence}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#9aa0a6' }}>Descanso: </span>
                                    <strong>{activeClient.restQuality}/10</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#9aa0a6' }}>Energía: </span>
                                    <strong>{activeClient.energyLevel}/10</strong>
                                </div>
                            </div>
                        </div>

                        {/* Planes activos del cliente */}
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            fontSize: '0.8rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                        }}>
                            <div>
                                <span style={{ color: '#9aa0a6', display: 'block', fontSize: '0.72rem' }}>🥗 Dieta ANEF activa:</span>
                                <strong style={{ color: '#f8fafc' }}>{activeClient.dietName}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#9aa0a6', display: 'block', fontSize: '0.72rem' }}>🏋️ Rutina activa:</span>
                                <strong style={{ color: '#f8fafc' }}>{activeClient.routineName}</strong>
                            </div>
                        </div>

                        {/* Acciones directas 1 a 1 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => {
                                    if (activeClient.dietPlanId) {
                                        navigate(`/app/dietas/${activeClient.dietPlanId}/edit`);
                                    } else {
                                        const query = activeClient.isDemo ? '' : `?clientId=${activeClient.id}`;
                                        navigate(`/app/dietas/new${query}`);
                                    }
                                }}
                                style={{ width: '100%', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem' }}
                            >
                                <FiZap size={15} />
                                <span>{activeClient.dietPlanId ? 'Editar su Dieta ANEF' : 'Crear Dieta ANEF 1 a 1'}</span>
                            </button>

                            <button
                                type="button"
                                className="btn-outline"
                                onClick={() => navigate('/app/client-checkins')}
                                style={{ width: '100%', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem' }}
                            >
                                <FiActivity size={14} />
                                <span>Ver Gráficas y Check-Ins</span>
                            </button>

                            <button
                                type="button"
                                className="btn-outline"
                                onClick={() => navigate('/app/plans')}
                                style={{ width: '100%', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem' }}
                            >
                                <FiClipboard size={14} />
                                <span>Gestionar su Rutina</span>
                            </button>
                        </div>

                        {activeClient.isDemo && (
                            <div style={{
                                padding: '0.65rem',
                                borderRadius: '10px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                fontSize: '0.75rem',
                                color: '#fde68a',
                                display: 'flex',
                                gap: '0.45rem',
                                alignItems: 'flex-start',
                            }}>
                                <FiAlertCircle size={15} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                                <span>
                                    <strong>Modo Prueba 1:1 activo:</strong> Usa el botón <em>&ldquo;Simular {activeClient.name}&rdquo;</em> arriba en el chat para responder como el cliente y ver cómo funciona la conversación en ambos sentidos.
                                </span>
                            </div>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
}

export default FeedbackChat;
