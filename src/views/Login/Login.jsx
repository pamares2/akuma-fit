import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { useTheme } from '../../context/useTheme.js';
import { translateSupabaseAuthError } from '../../utils/supabaseErrors.js';
import ThemeSelector from '../../components/complex/ThemeSelector/ThemeSelector.jsx';
import { FcGoogle } from 'react-icons/fc';

/** Expresión regular para validar el formato del email. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pantalla de inicio de sesión con personalización de tema anime.
 */
function Login() {
    const { login } = useAuth();
    const { currentThemeInfo } = useTheme();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        email: false,
        password: false,
        message: ''
    });

    const ThemeIcon = currentThemeInfo.Icon;

    const validateFields = () => {
        if (!email || !password) {
            return {
                email: !email,
                password: !password,
                message: 'Por favor, rellena todos los campos.'
            };
        }

        if (!EMAIL_REGEX.test(email)) {
            return {
                email: true,
                password: false,
                message: 'El correo electrónico introducido no tiene un formato válido.'
            };
        }

        return null;
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const validationErrors = validateFields();

        if (validationErrors) {
            setErrors(validationErrors);
            return;
        }

        setErrors({ email: false, password: false, message: '' });
        setLoading(true);

        try {
            await login(email, password);
            setLoading(false);
            navigate('/', { replace: true });
        } catch (error) {
            setLoading(false);
            const normalizedMessage = error.message.toLowerCase();
            const isCredentialsError = normalizedMessage.includes('credentials') || normalizedMessage.includes('invalid login');

            setErrors({
                email: isCredentialsError || normalizedMessage.includes('email'),
                password: isCredentialsError || normalizedMessage.includes('password'),
                message: translateSupabaseAuthError(error.message)
            });
        }
    };

    const handleGoogleLogin = async (e) => {
        e.preventDefault();
        setErrors({ email: false, password: false, message: 'El inicio de sesión con Google todavía no está disponible.' });
    };

    return (
        <div className="auth-page">
            <div className="auth-container" style={{
                boxShadow: 'var(--anime-aura-glow, var(--shadow-lg))',
                border: '1px solid var(--color-primary-border)',
                transition: 'all 0.3s ease'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <ThemeSelector compact={true} />
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'var(--color-primary-soft)',
                        border: '1px solid var(--color-primary-border)',
                        color: 'var(--color-primary)',
                        fontSize: '1.8rem',
                        marginBottom: '0.75rem'
                    }}>
                        <ThemeIcon />
                    </div>
                    <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.4rem', fontWeight: 800 }}>AKUMA FIT</h2>
                    <span className="anime-badge">{currentThemeInfo.rank}</span>
                    <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-secondary)',
                        fontStyle: 'italic',
                        marginTop: '0.5rem',
                        marginBottom: 0
                    }}>
                        "{currentThemeInfo.quote}"
                    </p>
                </div>

                <form onSubmit={handleLogin} className="auth-form">
                    {errors.message && <div className="error-message">{errors.message}</div>}

                    <div className="input-group">
                        <label htmlFor="email-input">Correo Electrónico</label>
                        <input
                            id="email-input"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={errors.email ? 'text-input input-error' : 'text-input'}
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password-input">Contraseña</label>
                        <input
                            id="password-input"
                            type="password"
                            placeholder="Tu contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={errors.password ? 'text-input input-error' : 'text-input'}
                        />
                    </div>

                    <div className="buttons-container">
                        <button onClick={handleLogin} className="login-button" disabled={loading}>
                            <span className="button-text">{loading ? 'Entrando...' : 'Entrar'}</span>
                        </button>
                        <button onClick={handleGoogleLogin} className="google-button">
                            <span className="button-icon"><FcGoogle size={20} /></span>
                            <span className="button-text">Google</span>
                        </button>
                    </div>
                </form>

                <div className="register-link">
                    <p>¿No tienes cuenta? <Link to="/register" className="link">Regístrate aquí</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Login;
