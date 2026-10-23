import { useState } from 'react';
import { FiColumns, FiMaximize2 } from 'react-icons/fi';

const SAMPLE_COMPARISONS = {
    frente: {
        before: {
            date: 'Semana 1 · 12 Sep',
            weight: '82.5 kg',
            url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=80',
        },
        after: {
            date: 'Semana 8 · Hoy',
            weight: '78.2 kg (-4.3 kg)',
            url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80',
        },
    },
    perfil: {
        before: {
            date: 'Semana 1 · 12 Sep',
            weight: '82.5 kg',
            url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format&fit=crop&q=80',
        },
        after: {
            date: 'Semana 8 · Hoy',
            weight: '78.2 kg (-4.3 kg)',
            url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80',
        },
    },
    espalda: {
        before: {
            date: 'Semana 1 · 12 Sep',
            weight: '82.5 kg',
            url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=500&auto=format&fit=crop&q=80',
        },
        after: {
            date: 'Semana 8 · Hoy',
            weight: '78.2 kg (-4.3 kg)',
            url: 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=500&auto=format&fit=crop&q=80',
        },
    },
};

export default function PhotoComparator({ customBeforeUrl, customAfterUrl, clientName = 'Atleta' }) {
    const [position, setPosition] = useState('frente');
    const [sliderPos, setSliderPos] = useState(50);
    const [mode, setMode] = useState('split'); // 'split' | 'slider'

    const activeData = SAMPLE_COMPARISONS[position] || SAMPLE_COMPARISONS.frente;
    const beforeUrl = customBeforeUrl || activeData.before.url;
    const afterUrl = customAfterUrl || activeData.after.url;

    return (
        <div style={{
            background: 'var(--color-bg-secondary, #181b20)',
            border: '1px solid var(--color-border, #282c34)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginTop: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
        }}>
            {/* Header del Comparador */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📸 Comparador Visual de Progreso · {clientName}</span>
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#9aa0a6' }}>
                        Compara tu evolución física antes vs después desde diferentes ángulos.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => setMode('split')}
                        className={mode === 'split' ? 'btn-primary' : 'btn-outline'}
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        <FiColumns size={14} />
                        <span>Lado a Lado</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('slider')}
                        className={mode === 'slider' ? 'btn-primary' : 'btn-outline'}
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        <FiMaximize2 size={14} />
                        <span>Deslizador</span>
                    </button>
                </div>
            </div>

            {/* Selector de postura/ángulo */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                    { id: 'frente', label: '🧍 Frente' },
                    { id: 'perfil', label: '🚶 Perfil' },
                    { id: 'espalda', label: '🔙 Espalda' },
                ].map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setPosition(item.id)}
                        style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: '999px',
                            border: '1px solid',
                            borderColor: position === item.id ? 'var(--color-primary, #e63946)' : 'rgba(255,255,255,0.1)',
                            background: position === item.id ? 'rgba(230, 57, 70, 0.15)' : 'transparent',
                            color: position === item.id ? '#fff' : '#9aa0a6',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Visualizador Modo Lado a Lado */}
            {mode === 'split' ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                    gap: '1rem',
                }}>
                    {/* Tarjeta ANTES */}
                    <div style={{
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <div style={{
                            padding: '0.6rem 0.85rem',
                            background: 'rgba(239, 68, 68, 0.15)',
                            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171' }}>
                                ANTES · {activeData.before.date}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                                {activeData.before.weight}
                            </span>
                        </div>
                        <div style={{ position: 'relative', width: '100%', height: '340px', overflow: 'hidden' }}>
                            <img
                                src={beforeUrl}
                                alt="Progreso anterior"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    </div>

                    {/* Tarjeta DESPUÉS */}
                    <div style={{
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <div style={{
                            padding: '0.6rem 0.85rem',
                            background: 'rgba(16, 185, 129, 0.15)',
                            borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399' }}>
                                DESPUÉS · {activeData.after.date}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                                {activeData.after.weight}
                            </span>
                        </div>
                        <div style={{ position: 'relative', width: '100%', height: '340px', overflow: 'hidden' }}>
                            <img
                                src={afterUrl}
                                alt="Progreso reciente"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                /* Visualizador Modo Slider Interactivo */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '480px',
                        height: '420px',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                        userSelect: 'none',
                    }}>
                        {/* Imagen Después (fondo) */}
                        <img
                            src={afterUrl}
                            alt="Después"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '12px',
                            right: '12px',
                            background: 'rgba(0,0,0,0.7)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: '#34d399',
                            fontWeight: 700,
                        }}>
                            DESPUÉS: {activeData.after.weight}
                        </div>

                        {/* Imagen Antes (superpuesta con clip-path) */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            width: `${sliderPos}%`,
                            overflow: 'hidden',
                            borderRight: '2px solid #ffffff',
                        }}>
                            <img
                                src={beforeUrl}
                                alt="Antes"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '480px',
                                    height: '100%',
                                    objectFit: 'cover',
                                    maxWidth: 'none',
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '12px',
                                left: '12px',
                                background: 'rgba(0,0,0,0.7)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                color: '#f87171',
                                fontWeight: 700,
                            }}>
                                ANTES: {activeData.before.weight}
                            </div>
                        </div>

                        {/* Línea divisoria central interactiva */}
                        <div style={{
                            position: 'absolute',
                            left: `${sliderPos}%`,
                            transform: 'translate(-50%, -50%)',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                            top: '50%',
                            pointerEvents: 'none',
                        }}>
                            ↔
                        </div>
                    </div>

                    {/* Control de rango */}
                    <div style={{ width: '100%', maxWidth: '480px', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#f87171', fontWeight: 700 }}>Antes</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderPos}
                            onChange={(e) => setSliderPos(Number(e.target.value))}
                            style={{ flex: 1, accentColor: 'var(--color-primary, #e63946)', cursor: 'ew-resize' }}
                        />
                        <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>Después</span>
                    </div>
                </div>
            )}
        </div>
    );
}
