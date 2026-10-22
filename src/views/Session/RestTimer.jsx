import { useState, useEffect, useRef } from 'react';
import { FiClock, FiPlus, FiX, FiPlay, FiPause } from 'react-icons/fi';

/**
 * Reproduce un pitido suave usando la Web Audio API nativa sin requerir assets externos.
 */
function playBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // Nota A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    } catch {
        // Ignorar si el audio no está permitido por política de interacción
    }
}

export default function RestTimer() {
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isRunning && secondsLeft > 0) {
            timerRef.current = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setIsRunning(false);
                        playBeep();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [isRunning, secondsLeft]);

    const startTimer = (seconds) => {
        setSecondsLeft(seconds);
        setIsRunning(true);
        setIsOpen(true);
    };

    // Escuchar eventos automáticos al completar una serie o ejercicio
    useEffect(() => {
        const handleAutoStart = (e) => {
            const sec = e.detail?.seconds || 90;
            startTimer(sec);
        };

        window.addEventListener('akuma_start_rest_timer', handleAutoStart);
        return () => window.removeEventListener('akuma_start_rest_timer', handleAutoStart);
    }, []);

    const addTime = (extra) => {
        setSecondsLeft((prev) => prev + extra);
        setIsRunning(true);
    };

    const togglePause = () => {
        setIsRunning((prev) => !prev);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setSecondsLeft(0);
        setIsOpen(false);
    };

    const formatTime = (totalSec) => {
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '1.25rem',
            right: '1.25rem',
            zIndex: 999,
        }}>
            {isOpen ? (
                <div style={{
                    background: 'var(--color-bg-secondary, #181b20)',
                    border: '1px solid var(--color-border, #282c34)',
                    borderRadius: '16px',
                    padding: '1rem 1.25rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    minWidth: '220px',
                    backdropFilter: 'blur(8px)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#9aa0a6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FiClock /> DESCANSO
                        </span>
                        <button onClick={resetTimer} style={{ background: 'transparent', border: 'none', color: '#9aa0a6', cursor: 'pointer' }}>
                            <FiX size={16} />
                        </button>
                    </div>

                    <div style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: secondsLeft <= 5 && secondsLeft > 0 ? '#ef4444' : '#ffffff',
                        letterSpacing: '1px'
                    }}>
                        {formatTime(secondsLeft)}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <button
                            onClick={togglePause}
                            style={{
                                flex: 1,
                                padding: '0.45rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border, #3a3f4b)',
                                background: isRunning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                color: isRunning ? '#ef4444' : '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.25rem',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            {isRunning ? <FiPause /> : <FiPlay />}
                            {isRunning ? 'Pausar' : 'Reanudar'}
                        </button>
                        <button
                            onClick={() => addTime(15)}
                            style={{
                                padding: '0.45rem 0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border, #3a3f4b)',
                                background: 'transparent',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            <FiPlus size={12} /> 15s
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', width: '100%', justifyContent: 'center' }}>
                        {[60, 90, 120].map((sec) => (
                            <button
                                key={sec}
                                onClick={() => startTimer(sec)}
                                style={{
                                    flex: 1,
                                    padding: '0.3rem',
                                    borderRadius: '6px',
                                    border: '1px solid #2d333b',
                                    background: '#121418',
                                    color: '#9aa0a6',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                }}
                            >
                                {sec}s
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        padding: '0.75rem 1.25rem',
                        borderRadius: '30px',
                        border: '1px solid var(--color-border, #3a3f4b)',
                        background: 'var(--color-bg-secondary, #181b20)',
                        color: 'var(--color-primary, #e63946)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    <FiClock size={18} />
                    <span>{secondsLeft > 0 ? formatTime(secondsLeft) : 'Descanso'}</span>
                </button>
            )}
        </div>
    );
}
