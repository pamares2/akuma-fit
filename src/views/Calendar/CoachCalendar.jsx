import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../../components/complex/Calendar/Calendar.jsx';
import Spinner from '../../components/primitives/Spinner/Spinner.jsx';
import ClientSelector from '../../components/complex/ClientSelector/ClientSelector.jsx';
import EventEditModal from './EventEditModal.jsx';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { eventService } from '../../services/eventService.js';
import { routineService } from '../../services/routineService.js';
import { expandOccurrences, completionRange } from '../../utils/calendar.js';
import { FiPlus } from 'react-icons/fi';

/**
 * Calendario del coach.
 *
 * Permite seleccionar un cliente y ver su calendario. Al hacer click en un
 * evento persistido se abre {@link EventEditModal} para editarlo/eliminarlo
 * con ámbito (esta ocurrencia / esta y las siguientes / serie completa). Los
 * eventos fijos del sistema (mediciones y check-in) no son editables.
 */
function CoachCalendar() {
    const navigate = useNavigate();

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [editing, setEditing] = useState(null);
    const [version, setVersion] = useState(0);
    const [notice, setNotice] = useState(null);

    const { data: clients, loading: loadingClients, error: clientsError } = useAsyncData(
        () => routineService.getClients().then((list) => {
            if (list.length > 0) setSelectedClientId((prev) => prev ?? list[0].id);
            return list;
        }),
        []
    );

    const { data: eventData, loading: loadingEvents, error: eventsError } = useAsyncData(
        selectedClientId ? () => eventService.getByClient(selectedClientId) : null,
        [selectedClientId, version]
    );

    const { data: completions } = useAsyncData(
        selectedClientId ? () => eventService.getCompletions(selectedClientId, completionRange(year, month)) : null,
        [selectedClientId, year, month]
    );

    const events = eventData?.events ?? [];
    const exceptions = eventData?.exceptions ?? [];
    const occurrences = expandOccurrences(events, exceptions, year, month);

    const goPrev = () => {
        if (month === 0) {
            setMonth(11);
            setYear((y) => y - 1);
        } else {
            setMonth((m) => m - 1);
        }
    };

    const goNext = () => {
        if (month === 11) {
            setMonth(0);
            setYear((y) => y + 1);
        } else {
            setMonth((m) => m + 1);
        }
    };

    const handleEventClick = (occ) => {
        if (typeof occ.event.id === 'string') return; // eventos fijos del sistema
        setEditing(occ);
    };

    const handleSaved = () => {
        setEditing(null);
        setVersion((v) => v + 1);
        setNotice('Cambios guardados.');
        setTimeout(() => setNotice(null), 3000);
    };

    if (loadingClients) {
        return <Spinner text="Cargando clientes..." />;
    }

    if (clientsError || eventsError) {
        return <div className="error-message">{clientsError || eventsError}</div>;
    }

    if (!clients || clients.length === 0) {
        return (
            <div className="calendar-page">
                <div className="page-container">
                    <h1 className="page-title">Calendario</h1>
                    <div className="empty-state">
                        <p>No tienes clientes asignados.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="calendar-page">
            <div className="page-container">
                <h1 className="page-title">Calendario</h1>
                <p className="page-description">Consulta y gestiona los eventos y entrenamientos programados de tus clientes.</p>

                <div className="calendar-client-actions">
                    <ClientSelector
                        clients={clients}
                        selectedClientId={selectedClientId}
                        onChange={setSelectedClientId}
                        className="coach-checkins-client-selector"
                    />
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => navigate(`/app/calendario/nuevo${selectedClientId ? `?clientId=${selectedClientId}` : ''}`)}
                    >
                        <FiPlus size={16} />
                        <span>Nuevo evento</span>
                    </button>
                </div>

                {notice && <div className="success-message">{notice}</div>}

                {loadingEvents ? (
                    <Spinner text="Cargando calendario..." />
                ) : (
                    <Calendar
                        year={year}
                        month={month}
                        occurrences={occurrences}
                        completions={completions}
                        onEventClick={handleEventClick}
                        onPrevMonth={goPrev}
                        onNextMonth={goNext}
                    />
                )}
            </div>

            {editing && (
                <EventEditModal occurrence={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
            )}
        </div>
    );
}

export default CoachCalendar;
