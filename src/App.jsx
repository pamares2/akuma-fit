import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SessionProvider } from './context/SessionContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { RequireAuth, PublicOnlyRoute, RootRedirect } from './routes/guards.jsx';
import Login from './views/Login/Login.jsx';
import Register from './views/Register/Register.jsx';
import AppLayout from './views/Home/Home.jsx';
import InitialAssessment from './views/InitialAssessment/InitialAssessment.jsx';
import ProfileFormRoute from './views/ProfileForm/ProfileFormRoute.jsx';
import { ALL_SECTION_ROUTES } from './routes/sectionRoutes.jsx';
import ErrorBoundary from './components/complex/ErrorBoundary/ErrorBoundary.jsx';
import SetupRequired from './components/complex/SetupRequired/SetupRequired.jsx';
import { isSupabaseConfigured } from './supabaseClient.js';

export default function App() {
    if (!isSupabaseConfigured) {
        return <SetupRequired />;
    }

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <BrowserRouter>
                    <AuthProvider>
                        <Routes>
                            <Route path="/" element={<RootRedirect />} />

                            <Route
                                path="/login"
                                element={<PublicOnlyRoute><Login /></PublicOnlyRoute>}
                            />
                            <Route
                                path="/register"
                                element={<PublicOnlyRoute><Register /></PublicOnlyRoute>}
                            />

                            <Route
                                path="/assessment"
                                element={<RequireAuth><InitialAssessment /></RequireAuth>}
                            />

                            <Route
                                path="/app"
                                element={(
                                    <RequireAuth requireAssessment>
                                        <SessionProvider>
                                            <AppLayout />
                                        </SessionProvider>
                                    </RequireAuth>
                                )}
                            >
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="profile" element={<ProfileFormRoute />} />
                                {ALL_SECTION_ROUTES.map(({ path, element }) => (
                                    <Route key={path} path={path} element={element} />
                                ))}
                            </Route>

                            <Route path="*" element={<RootRedirect />} />
                        </Routes>
                    </AuthProvider>
                </BrowserRouter>
            </ThemeProvider>
        </ErrorBoundary>
    );
}
