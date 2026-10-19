import { FiAlertCircle, FiDatabase, FiCheckCircle } from 'react-icons/fi';

export default function SetupRequired() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            background: 'var(--color-bg-primary, #0d0f12)',
            color: 'var(--color-text-primary, #ffffff)',
            fontFamily: 'inherit',
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%',
                padding: '2.5rem',
                borderRadius: '16px',
                background: 'var(--color-bg-secondary, #181b20)',
                border: '1px solid var(--color-border, #282c34)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f59e0b' }}>
                    <FiAlertCircle size={32} />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                        Configuración inicial requerida
                    </h1>
                </div>

                <p style={{ color: 'var(--color-text-secondary, #9aa0a6)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    <strong>Akuma Fit</strong> necesita conectarse a tu propio proyecto de Supabase para almacenar rutinas, dietas, usuarios y entrenamientos.
                </p>

                <div style={{
                    background: '#121418',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #2d333b',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <FiCheckCircle color="#10b981" style={{ marginTop: '3px', flexShrink: 0 }} />
                        <span>Crea un proyecto en <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>supabase.com</a></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <FiDatabase color="#10b981" style={{ marginTop: '3px', flexShrink: 0 }} />
                        <span>Ejecuta los scripts SQL de <code>src/migrations/</code> (001 a 006) en el SQL Editor de Supabase.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <FiCheckCircle color="#10b981" style={{ marginTop: '3px', flexShrink: 0 }} />
                        <span>Configura en tu archivo <code>.env.local</code>:</span>
                    </div>
                </div>

                <pre style={{
                    background: '#090a0f',
                    padding: '1rem',
                    borderRadius: '6px',
                    color: '#a7f3d0',
                    fontSize: '0.85rem',
                    overflowX: 'auto',
                    border: '1px solid #1e293b',
                    marginBottom: '1.5rem'
                }}>
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-anon-key-aqui
                </pre>

                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, textAlign: 'center' }}>
                    Una vez configuradas las variables, reinicia el servidor Vite con <code>npm run dev</code>.
                </p>
            </div>
        </div>
    );
}
