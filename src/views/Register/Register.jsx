import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService.js';
import { useTheme } from '../../context/useTheme.js';
import { translateSupabaseAuthError } from '../../utils/supabaseErrors.js';
import ThemeSelector from '../../components/complex/ThemeSelector/ThemeSelector.jsx';

/** Expresión regular para validar el formato del email. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Requisitos de la contraseña: mín. 8 caracteres con mayúscula, minúscula, número y símbolo. */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Pantalla de registro de cuenta con validación de email, contraseña y
 * confirmación, y selección de tema anime.
 */
function Register() {
    const { currentThemeInfo } = useTheme();
    const ThemeIcon = currentThemeInfo.Icon;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [errors, setErrors] = useState({
        email: false,
        password: false,
        confirmPassword: false,
        message: ''
    });

    const validateFields = () => {
        if (!email || !password || !confirmPassword) {
            return {
                email: !email,
                password: !password,
                confirmPassword: !confirmPassword,
                message: 'Por favor, rellena todos los campos obligatorios.'
            };
        }

        if (!EMAIL_REGEX.test(email)) {
            return {
                email: true,
                password: false,
                confirmPassword: false,
                message: 'El correo electrónico introducido no tiene un formato válido.'
            };
        }

        if (!PASSWORD_REGEX.test(password)) {
            return {
                email: false,
                password: true,
                confirmPassword: false,
                message: 'La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, una minúscula, un número y un carácter especial.'
            };
        }

        if (password !== confirmPassword) {
            return {
                email: false,
                password: true,
                confirmPassword: true,
                message: 'Las contraseñas no coinciden.'
            };
        }

        return null;
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        const validationErrors = validateFields();

        if (validationErrors) {
            setErrors(validationErrors);
            return;
        }

        setErrors({ email: false, password: false, confirmPassword: false, message: '' });
        setLoading(true);

        try {
            await authService.signUp(email, password);
            setLoading(false);
            setIsRegistered(true);
        } catch (error) {
            setLoading(false);
            setErrors({
                email: error.message.includes('email') || error.message.includes('user'),
                password: error.message.toLowerCase().includes('password'),
                confirmPassword: false,
                message: translateSupabaseAuthError(error.message)
            });
        }
    };

    if (isRegistered) {
        return (
            <div className="auth-page">
                <div className="auth-container" style={{
                    boxShadow: 'var(--anime-aura-glow, var(--shadow-lg))',
                    border: '1px solid var(--color-primary-border)'
                }}>
                    <div className="success-content">
                        <h2>¡Cuenta creada!</h2>
                        <p className="success-text">
                            Confirme su correo electrónico para poder iniciar sesión. Hemos enviado un enlace de verificación a su bandeja de entrada.
                        </p>
                        <div className="login-link">
                            <p><Link to="/login" className="link">Ir a iniciar sesión</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                    <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.4rem', fontWeight: 800 }}>ÚNETE A AKUMA FIT</h2>
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

                <form onSubmit={handleRegister} className="auth-form">
                    {errors.message && <div className="error-message">{errors.message}</div>}

                    <div className="input-group">
                        <label htmlFor="register-email">Correo Electrónico</label>
                        <input
                            id="register-email"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            onChange={(e) => setEmail(e.target.value)}
                            className={errors.email ? 'text-input input-error' : 'text-input'}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="register-password">Contraseña</label>
                        <input
                            id="register-password"
                            type="password"
                            placeholder="Crea una contraseña segura"
                            onChange={(e) => setPassword(e.target.value)}
                            className={errors.password ? 'text-input input-error' : 'text-input'}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="register-confirm-password">Repetir Contraseña</label>
                        <input
                            id="register-confirm-password"
                            type="password"
                            placeholder="Repite tu contraseña"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={errors.confirmPassword ? 'text-input input-error' : 'text-input'}
                        />
                    </div>

                    <button onClick={handleRegister} disabled={loading}>
                        <span className="button-text">{loading ? 'Creando cuenta...' : 'Registrarse'}</span>
                    </button>
                </form>
                <div className="login-link">
                    <p>¿Ya tienes cuenta? <Link to="/login" className="link">Inicia sesión aquí</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Register;
