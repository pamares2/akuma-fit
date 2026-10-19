import { useIsMobile } from '../../hooks/useIsMobile.js';
import { useElapsedTime } from '../../hooks/useElapsedTime.js';
import { useTrainingSession } from './useTrainingSession.js';
import SessionTopBar from './SessionTopBar.jsx';
import AbandonSessionModal from './AbandonSessionModal.jsx';
import SessionActionFeedback from './SessionActionFeedback.jsx';
import FeedbackScreen from './FeedbackScreen.jsx';
import MobileTrainingView from './MobileTrainingView.jsx';
import DesktopTrainingView from './DesktopTrainingView.jsx';
import RestTimer from './RestTimer.jsx';

/**
 * Vista de entrenamiento: orquesta el estado de la sesión y elige entre la
 * vista móvil (swipe) o de escritorio, con feedback y pantalla final.
 *
 * @param {Object} props - Props del componente.
 * @param {Object} props.session - Sesión activa.
 * @param {Object} props.routine - Rutina.
 * @param {Object} props.fullSession - Sesión completa (ejercicios y series).
 * @param {(summary: Object) => void} props.onFinished - Callback al finalizar.
 * @param {() => void} props.onCancelled - Callback al cancelar.
 */
function TrainingView({ session, routine, fullSession, onFinished, onCancelled }) {
    const isMobile = useIsMobile();
    const elapsedMs = useElapsedTime(session.started_at);
    const training = useTrainingSession({ session, routine, fullSession, onFinished, onCancelled });

    const {
        matchedExercises,
        currentIndex,
        setCurrentIndex,
        phase,
        busy,
        actionError,
        confirmAbandon,
        setConfirmAbandon,
        completedCount,
        progressPercent,
        handleFinishSession,
        handleAbandon,
    } = training;

    if (matchedExercises.length === 0) {
        return (
            <div className="session-page">
                <div className="page-container">
                    <h1 className="page-title">Entrenar</h1>
                    <div className="empty-state">
                        <p>Esta rutina no tiene ejercicios. Contacta con tu coach.</p>
                    </div>
                    <button className="btn-outline" onClick={() => setConfirmAbandon(true)}>
                        Abandonar sesión
                    </button>
                </div>
                <AbandonSessionModal
                    open={confirmAbandon}
                    busy={busy}
                    onCancel={() => setConfirmAbandon(false)}
                    onConfirm={handleAbandon}
                />
            </div>
        );
    }

    const topBar = (
        <SessionTopBar
            routineTitle={routine.title}
            elapsedMs={elapsedMs}
            completedCount={completedCount}
            totalCount={matchedExercises.length}
            progressPercent={progressPercent}
            busy={busy}
            onAbandon={() => setConfirmAbandon(true)}
        />
    );

    if (phase === 'feedback') {
        return (
            <div className="session-page session-training">
                {topBar}
                {actionError && <SessionActionFeedback error={actionError} />}
                <FeedbackScreen busy={busy} onSubmit={handleFinishSession} />
            </div>
        );
    }

    return (
        <div className="session-page session-training">
            {topBar}

            {isMobile ? (
                <MobileTrainingView
                    training={training}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                />
            ) : (
                <DesktopTrainingView training={training} />
            )}

            <RestTimer />

            <AbandonSessionModal
                open={confirmAbandon}
                busy={busy}
                onCancel={() => setConfirmAbandon(false)}
                onConfirm={handleAbandon}
            />
        </div>
    );
}

export default TrainingView;
