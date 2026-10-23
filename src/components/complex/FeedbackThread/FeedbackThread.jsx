import { useState, useEffect, useRef, useMemo } from 'react';
import { FiMessageCircle, FiSend, FiRefreshCw, FiZap, FiUserCheck } from 'react-icons/fi';
import {
    feedbackService,
    FEEDBACK_TOPICS,
    getCoachQuickTemplates,
    CLIENT_QUICK_TEMPLATES,
} from '../../../services/feedbackService.js';
import { formatDate } from '../../../utils/data.js';

/**
 * Formatea la hora de un timestamp ISO en formato HH:mm.
 */
function formatTime(isoString) {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

/**
 * Etiqueta de día amigable para agrupar mensajes del chat.
 */
function formatDayLabel(isoString) {
    if (!isoString) return 'Mensajes';
    try {
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return formatDate(isoString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Hoy';
        if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
        return formatDate(isoString);
    } catch {
        return formatDate(isoString);
    }
}

/**
 * Chat 1 a 1 personalizado y bidireccional entre Entrenador (Coach) y Cliente.
 *
 * @param {Object} props - Props del componente.
 * @param {number|string} props.clientProfileId - Id del perfil del cliente.
 * @param {string} [props.clientName] - Nombre del cliente (para vista de coach).
 * @param {'coach'|'client'} [props.viewerRole='client'] - Rol de quien visualiza el hilo.
 * @param {boolean} [props.allowRoleSwitch=false] - Permite simular el envío como cliente/entrenador para pruebas en vivo.
 * @param {string} [props.chatHeight='420px'] - Altura máxima del área de mensajes.
 * @param {() => void} [props.onFeedbackSent] - Callback opcional al enviar un mensaje.
 */
function FeedbackThread({
    clientProfileId,
    clientName,
    viewerRole = 'client',
    allowRoleSwitch = false,
    chatHeight = '420px',
    onFeedbackSent,
}) {
    const [messages, setMessages] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [text, setText] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('general');
    const [activeSenderRole, setActiveSenderRole] = useState(viewerRole);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState(null);
    const messagesEndRef = useRef(null);

    // Carga silenciosa para sincronización en directo sin parpadeos ni pantalla en blanco
    const reloadSilently = () => {
        if (!clientProfileId) return;
        setRefreshing(true);
        feedbackService.getFeedbackForClient(clientProfileId)
            .then((res) => {
                const fetched = res?.messages || [];
                setMessages((prev) => {
                    const pendingOptimistic = prev.filter(m => m.isPending);
                    const confirmedIds = new Set(fetched.map(m => m.rowId || `${m.createdAt}_${m.text}`));
                    const stillPending = pendingOptimistic.filter(m => !confirmedIds.has(m.rowId) && !fetched.some(f => f.text === m.text && f.authorRole === m.authorRole));
                    return [...fetched, ...stillPending];
                });
                setLoadError(null);
            })
            .catch((err) => {
                setLoadError(err.message || 'Error sincronizando chat.');
            })
            .finally(() => {
                setRefreshing(false);
            });
    };

    // Carga inicial al montar o cambiar de cliente
    useEffect(() => {
        let active = true;
        if (!clientProfileId) {
            return undefined;
        }

        feedbackService.getFeedbackForClient(clientProfileId)
            .then((res) => {
                if (active) {
                    setMessages(res?.messages || []);
                    setLoadError(null);
                    setInitialLoading(false);
                }
            })
            .catch((err) => {
                if (active) {
                    setLoadError(err.message || 'Error cargando chat.');
                    setInitialLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [clientProfileId]);

    // Suscripción en tiempo real: WebSockets, BroadcastChannel y reconexión móvil
    useEffect(() => {
        if (!clientProfileId) return undefined;
        const unsubscribe = feedbackService.subscribeToClientFeedback(clientProfileId, (incomingMsg) => {
            if (incomingMsg && incomingMsg.text) {
                setMessages((prev) => {
                    const alreadyExists = prev.some(m =>
                        (m.rowId && incomingMsg.rowId && m.rowId === incomingMsg.rowId)
                        || (m.createdAt === incomingMsg.createdAt && m.text === incomingMsg.text)
                    );
                    if (alreadyExists) return prev;
                    return [...prev, incomingMsg];
                });
            }
            reloadSilently();
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientProfileId]);

    // Auto-scroll al último mensaje cuando cambia la lista
    useEffect(() => {
        if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages.length, clientProfileId]);

    const error = sendError || loadError;

    const firstName = useMemo(() => {
        if (!clientName) return 'atleta';
        return clientName.trim().split(' ')[0] || clientName;
    }, [clientName]);

    const quickTemplates = useMemo(() => {
        return activeSenderRole === 'coach'
            ? getCoachQuickTemplates(firstName)
            : CLIENT_QUICK_TEMPLATES;
    }, [activeSenderRole, firstName]);

    // Agrupar mensajes por día
    const groupedMessages = useMemo(() => {
        const groups = [];
        for (const msg of messages) {
            const dayLabel = formatDayLabel(msg.createdAt || msg.updatedAt);
            const lastGroup = groups[groups.length - 1];
            if (!lastGroup || lastGroup.dayLabel !== dayLabel) {
                groups.push({ dayLabel, items: [msg] });
            } else {
                lastGroup.items.push(msg);
            }
        }
        return groups;
    }, [messages]);

    const handleRefresh = () => {
        reloadSilently();
    };

    const handleApplyTemplate = (tpl) => {
        setSelectedTopic(tpl.topic || 'general');
        setText(tpl.text);
    };

    const submitCurrentMessage = async () => {
        const cleanMsg = text.trim();
        if (!cleanMsg || sending) return;

        setSending(true);
        setSendError(null);

        const overrideAuthorName = activeSenderRole === 'coach'
            ? 'Entrenador'
            : (clientName || 'Cliente');

        // Inserción optimista instantánea (0 ms de espera visual para el usuario)
        const tempId = `optimistic-${Date.now()}`;
        const optimisticEntry = {
            rowId: tempId,
            profileId: clientProfileId,
            kind: 'message',
            topic: selectedTopic,
            authorRole: activeSenderRole,
            authorName: overrideAuthorName,
            text: cleanMsg,
            createdAt: new Date().toISOString(),
            isPending: true,
        };

        setMessages(prev => [...prev, optimisticEntry]);
        setText('');

        try {
            await feedbackService.sendMessage(clientProfileId, cleanMsg, {
                topic: selectedTopic,
                overrideRole: activeSenderRole,
                overrideAuthorName: allowRoleSwitch ? overrideAuthorName : undefined,
            });
            reloadSilently();
            if (onFeedbackSent) onFeedbackSent();
        } catch (err) {
            setSendError(err.message || 'No se pudo enviar el mensaje.');
            // Eliminar mensaje optimista si falló
            setMessages(prev => prev.filter(m => m.rowId !== tempId));
        } finally {
            setSending(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        await submitCurrentMessage();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitCurrentMessage();
        }
    };

    const title = viewerRole === 'coach'
        ? `Chat 1 a 1 con ${clientName || 'el cliente'}`
        : 'Chat 1 a 1 con tu Entrenador';

    const subtitle = viewerRole === 'coach'
        ? 'Feedback directo personalizado sobre su dieta ANEF, rutina, técnica y check-ins.'
        : 'Habla directamente con tu entrenador para resolver dudas de dieta, entreno o sensaciones.';

    return (
        <div style={{
            background: 'var(--color-bg-secondary, #181b20)',
            border: '1px solid var(--color-border, #282c34)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
        }}>
            {/* Cabecera del Chat */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-primary, #e63946), #ff6b6b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0,
                    }}>
                        {(clientName || 'E').trim().charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <FiMessageCircle style={{ color: 'var(--color-primary, #e63946)' }} />
                            <span>{title}</span>
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
                            }}
                            title="Sincronización en tiempo real vía WebSockets activa para Web y App móvil"
                            >
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
                        </h2>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary, #9aa0a6)' }}>
                            {subtitle}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {allowRoleSwitch && (
                        <div style={{
                            display: 'inline-flex',
                            background: 'rgba(0, 0, 0, 0.35)',
                            padding: '0.2rem',
                            borderRadius: '999px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: '0.75rem',
                        }}>
                            <button
                                type="button"
                                onClick={() => setActiveSenderRole('coach')}
                                style={{
                                    padding: '0.28rem 0.65rem',
                                    borderRadius: '999px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    background: activeSenderRole === 'coach' ? 'var(--color-primary, #e63946)' : 'transparent',
                                    color: activeSenderRole === 'coach' ? '#fff' : '#9aa0a6',
                                }}
                                title="Enviar mensajes como Entrenador"
                            >
                                🏋️ Como Entrenador
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSenderRole('client')}
                                style={{
                                    padding: '0.28rem 0.65rem',
                                    borderRadius: '999px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    background: activeSenderRole === 'client' ? '#3b82f6' : 'transparent',
                                    color: activeSenderRole === 'client' ? '#fff' : '#9aa0a6',
                                }}
                                title="Simular respuesta como el Cliente para probar el chat"
                            >
                                <FiUserCheck style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                Simular {firstName}
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="btn-outline"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Actualizar mensajes"
                    >
                        <FiRefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Ventana de Mensajes Estilo Chat */}
            <div style={{
                height: chatHeight,
                maxHeight: chatHeight,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(180deg, rgba(12, 14, 18, 0.85) 0%, rgba(17, 20, 26, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
                {initialLoading ? (
                    <div style={{ textAlign: 'center', margin: 'auto', color: '#9aa0a6', fontSize: '0.9rem' }}>
                        Cargando conversación 1 a 1...
                    </div>
                ) : groupedMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', margin: 'auto', padding: '1.5rem 1rem', color: '#9aa0a6', fontSize: '0.9rem' }}>
                        <FiMessageCircle size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0 }}>
                            {viewerRole === 'coach'
                                ? `Aún no hay mensajes con ${clientName || 'este cliente'}. Usa una plantilla rápida abajo o escríbele el primer mensaje.`
                                : 'Aún no hay mensajes en el chat. Escríbele a tu entrenador cualquier duda abajo.'}
                        </p>
                    </div>
                ) : (
                    groupedMessages.map((group) => (
                        <div key={group.dayLabel} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            <div style={{ textAlign: 'center', margin: '0.35rem 0' }}>
                                <span style={{
                                    fontSize: '0.72rem',
                                    padding: '0.2rem 0.75rem',
                                    borderRadius: '999px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    color: '#9aa0a6',
                                    fontWeight: 600,
                                }}>
                                    {group.dayLabel}
                                </span>
                            </div>

                            {group.items.map((msg, idx) => {
                                const isMine = msg.authorRole === viewerRole;
                                const isCoachMsg = msg.authorRole === 'coach';
                                const topicMeta = FEEDBACK_TOPICS.find(t => t.id === msg.topic) || FEEDBACK_TOPICS[0];
                                const timeText = msg.isPending ? 'enviando...' : formatTime(msg.updatedAt || msg.createdAt);

                                const kindBadge = msg.kind === 'checkin_feedback'
                                    ? '📋 Revisión Check-In'
                                    : msg.kind === 'checkin_reply'
                                        ? '↩️ Respuesta Check-In'
                                        : `${topicMeta.icon} ${topicMeta.label}`;

                                return (
                                    <div
                                        key={msg.rowId || idx}
                                        style={{
                                            alignSelf: isMine ? 'flex-end' : 'flex-start',
                                            maxWidth: '88%',
                                            minWidth: 'min(100%, 200px)',
                                            padding: '0.75rem 1rem',
                                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            opacity: msg.isPending ? 0.78 : 1,
                                            background: isCoachMsg
                                                ? 'linear-gradient(135deg, rgba(230, 57, 70, 0.22) 0%, rgba(230, 57, 70, 0.11) 100%)'
                                                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0.11) 100%)',
                                            border: `1px solid ${isCoachMsg ? 'rgba(230, 57, 70, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                            transition: 'opacity 0.2s ease',
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            marginBottom: '0.35rem',
                                            fontSize: '0.74rem',
                                            flexWrap: 'wrap',
                                        }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <strong style={{ color: isCoachMsg ? '#fca5a5' : '#93c5fd' }}>
                                                    {msg.authorName}
                                                </strong>
                                                <span style={{
                                                    padding: '0.08rem 0.45rem',
                                                    borderRadius: '999px',
                                                    background: 'rgba(0, 0, 0, 0.28)',
                                                    color: topicMeta.color,
                                                    fontSize: '0.68rem',
                                                    fontWeight: 600,
                                                }}>
                                                    {kindBadge}
                                                </span>
                                            </span>
                                            <span style={{ color: '#9aa0a6', fontSize: '0.7rem' }}>
                                                {timeText || formatDate(msg.updatedAt || msg.createdAt)}
                                            </span>
                                        </div>

                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.92rem',
                                            lineHeight: 1.5,
                                            whiteSpace: 'pre-line',
                                            color: '#f8fafc',
                                        }}>
                                            {msg.text}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Plantillas rápidas personalizadas 1 a 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.76rem', color: '#9aa0a6', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <FiZap size={12} style={{ color: 'var(--color-primary, #e63946)' }} />
                        <span>
                            {activeSenderRole === 'coach'
                                ? `Respuestas rápidas personalizadas para ${firstName}:`
                                : 'Mensajes rápidos para tu entrenador:'}
                        </span>
                    </span>

                    {/* Selector de categoría/tema del mensaje */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.74rem', color: '#9aa0a6' }}>Tema:</span>
                        {FEEDBACK_TOPICS.map(topic => (
                            <button
                                key={topic.id}
                                type="button"
                                onClick={() => setSelectedTopic(topic.id)}
                                style={{
                                    padding: '0.18rem 0.55rem',
                                    borderRadius: '999px',
                                    fontSize: '0.72rem',
                                    border: `1px solid ${selectedTopic === topic.id ? topic.color : 'rgba(255,255,255,0.1)'}`,
                                    background: selectedTopic === topic.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: selectedTopic === topic.id ? '#fff' : '#9aa0a6',
                                    cursor: 'pointer',
                                }}
                            >
                                {topic.icon} {topic.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    {quickTemplates.map(tpl => (
                        <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleApplyTemplate(tpl)}
                            style={{
                                padding: '0.32rem 0.7rem',
                                borderRadius: '999px',
                                fontSize: '0.76rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#e2e8f0',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {tpl.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="error-message" style={{ margin: 0 }}>{error}</div>}

            {/* Caja de envío de mensaje */}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <textarea
                    rows={2}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        activeSenderRole === 'coach'
                            ? `Escribe un mensaje personalizado a ${firstName} (pulsa Enter para enviar)...`
                            : 'Escribe un mensaje o duda para tu entrenador (pulsa Enter para enviar)...'
                    }
                    style={{
                        flex: 1,
                        minWidth: 'min(100%, 200px)',
                        padding: '0.75rem 0.95rem',
                        borderRadius: '12px',
                        background: 'var(--color-bg, #111318)',
                        border: '1px solid var(--color-border, #2d323e)',
                        color: '#ffffff',
                        fontSize: '0.92rem',
                        resize: 'vertical',
                    }}
                />
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={sending || !text.trim()}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.8rem 1.25rem',
                        borderRadius: '12px',
                        height: 'fit-content',
                    }}
                >
                    <FiSend size={16} />
                    <span>{sending ? 'Enviando...' : 'Enviar'}</span>
                </button>
            </form>
        </div>
    );
}

export default FeedbackThread;
