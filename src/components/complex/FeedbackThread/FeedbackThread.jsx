import { useState } from 'react';
import { FiMessageCircle, FiSend, FiRefreshCw } from 'react-icons/fi';
import { feedbackService } from '../../../services/feedbackService.js';
import { useAsyncData } from '../../../hooks/useAsyncData.js';
import { formatDate } from '../../../utils/data.js';

/**
 * Canal de Feedback bidireccional entre Entrenador (Coach) y Cliente.
 *
 * @param {Object} props - Props del componente.
 * @param {number} props.clientProfileId - Id del perfil del cliente.
 * @param {string} [props.clientName] - Nombre del cliente (para vista de coach).
 * @param {'coach'|'client'} [props.viewerRole='client'] - Rol de quien visualiza el hilo.
 * @param {() => void} [props.onFeedbackSent] - Callback opcional al enviar un mensaje.
 */
function FeedbackThread({ clientProfileId, clientName, viewerRole = 'client', onFeedbackSent }) {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const { data: messages, loading, error: loadError } = useAsyncData(
        clientProfileId
            ? () => feedbackService.getFeedbackForClient(clientProfileId).then(res => res.messages || [])
            : null,
        [clientProfileId, reloadKey],
        []
    );

    const error = sendError || loadError;

    const handleRefresh = () => {
        setReloadKey(k => k + 1);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || sending) return;
        setSending(true);
        setSendError(null);
        try {
            await feedbackService.sendMessage(clientProfileId, text.trim());
            setText('');
            setReloadKey(k => k + 1);
            if (onFeedbackSent) onFeedbackSent();
        } catch (err) {
            setSendError(err.message || 'No se pudo enviar el mensaje.');
        } finally {
            setSending(false);
        }
    };

    const title = viewerRole === 'coach'
        ? `Canal de Feedback con ${clientName || 'el cliente'}`
        : 'Canal de Feedback con tu Entrenador';

    const subtitle = viewerRole === 'coach'
        ? 'Envía indicaciones, ajustes de rutina/dieta o responde a las dudas del atleta.'
        : 'Lee las indicaciones de tu entrenador y escríbele tus dudas o sensaciones en cualquier momento.';

    return (
        <div style={{
            background: 'var(--color-bg-secondary, #181b20)',
            border: '1px solid var(--color-border, #282c34)',
            borderRadius: '14px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiMessageCircle style={{ color: 'var(--color-primary, #e63946)' }} />
                        <span>{title}</span>
                    </h2>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary, #9aa0a6)' }}>
                        {subtitle}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleRefresh}
                    className="btn-outline"
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    title="Actualizar mensajes"
                >
                    <FiRefreshCw size={13} />
                    <span>Actualizar</span>
                </button>
            </div>

            <div style={{
                maxHeight: '340px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '1.25rem', color: '#9aa0a6', fontSize: '0.9rem' }}>
                        Cargando historial de feedback...
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#9aa0a6', fontSize: '0.9rem' }}>
                        {viewerRole === 'coach'
                            ? 'Aún no hay mensajes de feedback con este cliente. ¡Envíale el primero abajo!'
                            : 'Aún no hay mensajes en el canal. Puedes escribirle a tu entrenador aquí debajo.'}
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMine = msg.authorRole === viewerRole;
                        const isCoachMsg = msg.authorRole === 'coach';
                        const badgeText = msg.kind === 'checkin_feedback'
                            ? 'Feedback de Check-In'
                            : msg.kind === 'checkin_reply'
                                ? 'Respuesta a Check-In'
                                : isCoachMsg ? 'Entrenador' : 'Cliente';

                        return (
                            <div
                                key={msg.rowId || idx}
                                style={{
                                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    minWidth: '220px',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    background: isCoachMsg
                                        ? 'rgba(230, 57, 70, 0.14)'
                                        : 'rgba(59, 130, 246, 0.14)',
                                    border: `1px solid ${isCoachMsg ? 'rgba(230, 57, 70, 0.35)' : 'rgba(59, 130, 246, 0.35)'}`,
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '0.35rem',
                                    fontSize: '0.75rem',
                                }}>
                                    <strong style={{ color: isCoachMsg ? '#f87171' : '#60a5fa' }}>
                                        {msg.authorName} · {badgeText}
                                    </strong>
                                    <span style={{ color: '#9aa0a6' }}>
                                        {formatDate(msg.updatedAt || msg.createdAt)}
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-line', color: '#f1f5f9' }}>
                                    {msg.text}
                                </p>
                            </div>
                        );
                    })
                )}
            </div>

            {error && <div className="error-message" style={{ margin: 0 }}>{error}</div>}

            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <textarea
                    rows={2}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                        viewerRole === 'coach'
                            ? 'Escribe un mensaje de feedback, ajuste de plan o nota para el cliente...'
                            : 'Escribe un comentario, duda o feedback para tu entrenador...'
                    }
                    style={{
                        flex: 1,
                        minWidth: '220px',
                        padding: '0.7rem 0.9rem',
                        borderRadius: '10px',
                        background: 'var(--color-bg, #111318)',
                        border: '1px solid var(--color-border, #2d323e)',
                        color: '#ffffff',
                        fontSize: '0.9rem',
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
                        padding: '0.7rem 1.2rem',
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
