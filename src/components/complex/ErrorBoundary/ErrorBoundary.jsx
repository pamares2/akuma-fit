import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary capturó un error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    background: 'var(--color-bg-primary, #0d0f12)',
                    color: 'var(--color-text-primary, #ffffff)',
                    fontFamily: 'inherit'
                }}>
                    <div style={{
                        maxWidth: '520px',
                        width: '100%',
                        padding: '2rem',
                        borderRadius: '12px',
                        background: 'var(--color-bg-secondary, #181b20)',
                        border: '1px solid var(--color-border, #282c34)',
                        textAlign: 'center',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                            Ha ocurrido un error inesperado
                        </h2>
                        <p style={{ color: 'var(--color-text-secondary, #9aa0a6)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                            La aplicación encontró un problema al procesar esta vista. Puedes intentar recargar la página o volver a intentarlo.
                        </p>
                        {this.state.error?.message && (
                            <pre style={{
                                padding: '0.75rem',
                                borderRadius: '6px',
                                background: 'rgba(255, 69, 58, 0.1)',
                                border: '1px solid rgba(255, 69, 58, 0.3)',
                                color: '#ff6b6b',
                                fontSize: '0.85rem',
                                textAlign: 'left',
                                overflowX: 'auto',
                                marginBottom: '1.5rem'
                            }}>
                                {this.state.error.message}
                            </pre>
                        )}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-border, #3a3f4b)',
                                    background: 'transparent',
                                    color: '#ffffff',
                                    cursor: 'pointer'
                                }}
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: 'var(--color-primary, #e63946)',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Recargar página
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
