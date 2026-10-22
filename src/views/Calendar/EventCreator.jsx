import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import useFormSubmission from '../../hooks/useFormSubmission.js';
import { eventService } from '../../services/eventService.js';
import { routineService } from '../../services/routineService.js';
import { isDemoClientId } from '../../services/feedbackService.js';
import { getCurrentProfile } from '../../utils/auth.js';
import { WEEKDAYS, MONTH_NAMES, toISODate } from '../../utils/calendar.js';

const EVENT_TYPES = [
    { value: 'training', label: 'Entrenamiento' },
    { value: 'photos', label: 'Fotos' },
    { value: 'info', label: 'Informativo' },
];

const FREQUENCIES = [
    { value: 'once', label: 'Una vez' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'yearly', label: 'Anual' },
];

const DEFAULT_FREQ_BY_TYPE = {
    training: 'weekly',
    photos: 'monthly',
    info: 'once',
};

/**
 * Creador de eventos del coach (caso de uso 2).
 *
 * Permite seleccionar cliente, tipo de evento (`training`/`photos`/`info`) y
 * configurar su recurrencia (único, semanal, mensual o anual con intervalo y
 * fin opcional). Para eventos `training` se elige la rutina del cliente.
 */
function EventCreator() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialClientId = searchParams.get('clientId') || '';

    const [selectedClientId, setSelectedClientId] = useState(initialClientId);
    const [eventType, setEventType] = useState('training');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [freq, setFreq] = useState(DEFAULT_FREQ_BY_TYPE.training);
    const [interval, setInterval] = useState('1');
    const [weekday, setWeekday] = useState('1');
    const [dayOfMonth, setDayOfMonth] = useState('1');
    const [month, setMonth] = useState('1');
    const [dtstart, setDtstart] = useState(toISODate(new Date()));
    const [until, setUntil] = useState('');
    const [startTime, setStartTime] = useState('');
    const [routineId, setRoutineId] = useState('');

    const { data: clients } = useAsyncData(
        () => routineService.getClients().then((list) => {
            if (list.length > 0) {
                setSelectedClientId((prev) => prev || String(list[0].id));
            }
            return list;
        }),
        []
    );

    const { data: routines, loading: loadingRoutines } = useAsyncData(
        eventType === 'training' && selectedClientId
            ? () => routineService.getByClient(selectedClientId).then((list) => {
                if (list.length > 0) {
                    setRoutineId((prev) => prev || String(list[0].id));
                }
                return list;
            })
            : null,
        [eventType, selectedClientId]
    );

    const { submitting, submitError, submitSuccess, handleSubmit } = useFormSubmission({
        onSuccess: () => setTimeout(() => navigate('/app/calendario'), 1200),
    });

    const handleTypeChange = (value) => {
        setEventType(value);
        setFreq(DEFAULT_FREQ_BY_TYPE[value]);
        setRoutineId('');
    };

    const handleClientChange = (value) => {
        setSelectedClientId(value);
        setRoutineId('');
    };

    const onSubmit = async () => {
        if (!selectedClientId) throw new Error('Selecciona un cliente.');
        if (!title.trim()) throw new Error('El título es obligatorio.');
        if (eventType === 'training' && !routineId) throw new Error('Selecciona una rutina.');
        if (!dtstart) throw new Error('Indica la fecha de inicio.');

        const profile = await getCurrentProfile();

        await eventService.create({
            profileId: isDemoClientId(selectedClientId) ? selectedClientId : Number(selectedClientId),
            createdBy: profile.id,
            eventType,
            title: title.trim(),
            description: description.trim() || null,
            freq,
            interval,
            byday: freq === 'weekly' ? weekday : null,
            bymonthday: freq === 'monthly' || freq === 'yearly' ? dayOfMonth : null,
            bymonth: freq === 'yearly' ? month : null,
            dtstart,
            until: until || null,
            startTime: startTime || null,
            routineId: eventType === 'training' ? routineId : null,
        });
    };

    return (
        <div className="calendar-page">
            <div className="page-container">
                <h1 className="page-title">Crear evento</h1>
                <p className="page-description">Crea y asigna un evento o entrenamiento en el calendario de un cliente.</p>

                <div className="form-section-card">
                    <div className="form-field">
                        <label htmlFor="event-client">Cliente *</label>
                        <select
                            id="event-client"
                            className="form-field-input"
                            value={selectedClientId}
                            onChange={(e) => handleClientChange(e.target.value)}
                        >
                            <option value="">Selecciona un cliente</option>
                            {(clients || []).map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name ? `${client.name} ${client.surname || ''}` : 'Sin nombre'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="event-type">Tipo de evento *</label>
                        <select
                            id="event-type"
                            className="form-field-input"
                            value={eventType}
                            onChange={(e) => handleTypeChange(e.target.value)}
                        >
                            {EVENT_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="event-title">Título *</label>
                        <input
                            id="event-title"
                            className="form-field-input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Entreno de pecho"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="event-description">Descripción</label>
                        <textarea
                            id="event-description"
                            className="form-field-textarea"
                            rows="3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Información adicional del evento..."
                        />
                    </div>

                    {eventType === 'training' && (
                        <div className="form-field">
                            <label htmlFor="event-routine">Rutina *</label>
                            {loadingRoutines ? (
                                <p className="section-help">Cargando rutinas...</p>
                            ) : (
                                <select
                                    id="event-routine"
                                    className="form-field-input"
                                    value={routineId}
                                    onChange={(e) => setRoutineId(e.target.value)}
                                >
                                    <option value="">Selecciona una rutina</option>
                                    {(routines || []).map((routine) => (
                                        <option key={routine.id} value={routine.id}>{routine.title}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                <div className="form-section-card">
                    <h2 className="section-subtitle">Repetición</h2>

                    <div className="form-field">
                        <label htmlFor="event-freq">Frecuencia *</label>
                        <select
                            id="event-freq"
                            className="form-field-input"
                            value={freq}
                            onChange={(e) => setFreq(e.target.value)}
                        >
                            {FREQUENCIES.map((f) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                    </div>

                    {freq !== 'once' && (
                        <div className="form-field">
                            <label htmlFor="event-interval">Repetir cada</label>
                            <div className="calendar-interval-row">
                                <input
                                    id="event-interval"
                                    type="number"
                                    min="1"
                                    className="form-field-input"
                                    value={interval}
                                    onChange={(e) => setInterval(e.target.value)}
                                />
                                <span className="section-help">
                                    {freq === 'weekly' ? 'semanas' : freq === 'monthly' ? 'meses' : 'años'}
                                </span>
                            </div>
                        </div>
                    )}

                    {freq === 'weekly' && (
                        <div className="form-field">
                            <label htmlFor="event-weekday">Día de la semana</label>
                            <select
                                id="event-weekday"
                                className="form-field-input"
                                value={weekday}
                                onChange={(e) => setWeekday(e.target.value)}
                            >
                                {WEEKDAYS.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {freq === 'monthly' && (
                        <div className="form-field">
                            <label htmlFor="event-day-of-month">Día del mes</label>
                            <input
                                id="event-day-of-month"
                                type="number"
                                min="1"
                                max="31"
                                className="form-field-input"
                                value={dayOfMonth}
                                onChange={(e) => setDayOfMonth(e.target.value)}
                            />
                        </div>
                    )}

                    {freq === 'yearly' && (
                        <>
                            <div className="form-field">
                                <label htmlFor="event-month">Mes</label>
                                <select
                                    id="event-month"
                                    className="form-field-input"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                >
                                    {MONTH_NAMES.map((name, index) => (
                                        <option key={name} value={index + 1}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label htmlFor="event-yearly-day">Día del mes</label>
                                <input
                                    id="event-yearly-day"
                                    type="number"
                                    min="1"
                                    max="31"
                                    className="form-field-input"
                                    value={dayOfMonth}
                                    onChange={(e) => setDayOfMonth(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="form-field">
                        <label htmlFor="event-dtstart">
                            {freq === 'once' ? 'Fecha *' : 'Fecha de inicio *'}
                        </label>
                        <input
                            id="event-dtstart"
                            type="date"
                            className="form-field-input"
                            value={dtstart}
                            onChange={(e) => setDtstart(e.target.value)}
                        />
                    </div>

                    {freq !== 'once' && (
                        <div className="form-field">
                            <label htmlFor="event-until">Fecha de fin (opcional)</label>
                            <input
                                id="event-until"
                                type="date"
                                className="form-field-input"
                                value={until}
                                onChange={(e) => setUntil(e.target.value)}
                            />
                            <span className="section-help">Déjalo vacío para que se repita sin fin.</span>
                        </div>
                    )}

                    <div className="form-field">
                        <label htmlFor="event-time">Hora (opcional)</label>
                        <input
                            id="event-time"
                            type="time"
                            className="form-field-input"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-footer">
                    {submitError && <div className="error-message">{submitError}</div>}
                    {submitSuccess && <div className="success-message">¡Evento creado correctamente!</div>}

                    <div className="form-buttons">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate('/app/calendario')}
                            disabled={submitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => handleSubmit(onSubmit)}
                            disabled={submitting}
                        >
                            {submitting ? 'Creando...' : 'Crear evento'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EventCreator;
