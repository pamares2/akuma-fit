import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    FiPlus,
    FiTrash2,
    FiChevronDown,
    FiChevronUp,
    FiSearch,
    FiX,
    FiTag,
    FiCheck,
    FiActivity,
    FiEdit2,
    FiCopy,
    FiTrendingUp,
} from 'react-icons/fi';
import Button from '../../components/primitives/Button/Button.jsx';
import useFormSubmission from '../../hooks/useFormSubmission.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { routineService } from '../../services/routineService.js';
import { exerciseService } from '../../services/exerciseService.js';
import { tagService } from '../../services/tagService.js';
import { getCurrentProfile } from '../../utils/auth.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';

const EXERCISE_CATEGORIES = [
    'Todas',
    'Pecho',
    'Espalda',
    'Hombro',
    'Pierna',
    'Bíceps',
    'Tríceps',
    'Fuerza',
    'Cardio',
    'Movilidad',
    'Core',
    'Pliometría',
    'Otros',
];

const SET_TYPES = [
    'Normal',
    'Calentamiento',
    'Aproximación',
    'Drop set',
    'Rest-pause',
    'Tempo',
];

/**
 * Creador de rutinas de entrenamiento: título, cliente, ejercicios (con
 * series) y asignación.
 */
function CreateRoutine() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryClientId = searchParams.get('clientId') || '';
    const queryRoutineId = searchParams.get('routineId') || '';

    const idCounter = useRef(0);
    const formSectionRef = useRef(null);
    const [title, setTitle] = useState('');
    const [coachComment, setCoachComment] = useState('');
    const [selectedClientId, setSelectedClientId] = useState(queryClientId);
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [expandedExercises, setExpandedExercises] = useState({});
    const [routinesReloadKey, setRoutinesReloadKey] = useState(0);
    const [editingRoutineId, setEditingRoutineId] = useState(null);
    const [deleteNotice, setDeleteNotice] = useState('');

    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [searchText, setSearchText] = useState('');
    const debouncedSearchText = useDebouncedValue(searchText);
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [selectedTags, setSelectedTags] = useState([]);
    const [pickerTrigger, setPickerTrigger] = useState(0);

    const { data: clients } = useAsyncData(
        () => routineService.getClients().then((list) => {
            if (!selectedClientId && list && list.length > 0) {
                setSelectedClientId(String(list[0].id));
            }
            return list;
        }),
        []
    );

    const { data: clientRoutines } = useAsyncData(
        selectedClientId ? () => routineService.getByClient(selectedClientId) : null,
        [selectedClientId, routinesReloadKey]
    );

    const loadTags = async () => tagService.getAll();
    const { data: allTags } = useAsyncData(showExercisePicker ? loadTags : null, [showExercisePicker]);

    const loadExercises = async () => exerciseService.search({
        text: debouncedSearchText || undefined,
        category: selectedCategory !== 'Todas' ? selectedCategory : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
    });

    const { data: availableExercises, loading: loadingExercises } = useAsyncData(
        showExercisePicker ? loadExercises : null,
        [showExercisePicker, debouncedSearchText, selectedCategory, selectedTags, pickerTrigger]
    );

    const handleEditRoutine = (routine) => {
        setEditingRoutineId(routine.id);
        setTitle(routine.title || '');
        setCoachComment(routine.coach_comment || '');
        const loadedExercises = (routine.exercises || []).map((ex, exIdx) => {
            idCounter.current += 1;
            return {
                id: ex.id || `ex-${idCounter.current}`,
                exercise_name: ex.exercise_name || ex.name || `Ejercicio ${exIdx + 1}`,
                category: ex.category || 'Fuerza',
                description: ex.description || '',
                comments: ex.comments || '',
                sets: (ex.sets || []).map((s, sIdx) => {
                    idCounter.current += 1;
                    return {
                        id: s.id || `set-${idCounter.current}`,
                        order: s.order || sIdx + 1,
                        reps: s.reps ?? '',
                        kg: s.kg ?? '',
                        rir: s.rir ?? '',
                        type: s.type || 'Normal',
                    };
                }),
            };
        });
        setSelectedExercises(loadedExercises);
        const expandMap = {};
        loadedExercises.forEach(e => { expandMap[e.id] = true; });
        setExpandedExercises(expandMap);
        if (formSectionRef.current) {
            formSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleDuplicateRoutine = (routine) => {
        setEditingRoutineId(null);
        setTitle(`${routine.title} (Semana +1)`);
        setCoachComment(routine.coach_comment || '');
        const loadedExercises = (routine.exercises || []).map((ex, exIdx) => {
            idCounter.current += 1;
            return {
                id: ex.id || `ex-${idCounter.current}`,
                exercise_name: ex.exercise_name || ex.name || `Ejercicio ${exIdx + 1}`,
                category: ex.category || 'Fuerza',
                description: ex.description || '',
                comments: ex.comments || '',
                sets: (ex.sets || []).map((s, sIdx) => {
                    idCounter.current += 1;
                    return {
                        id: `new-set-${idCounter.current}`,
                        order: s.order || sIdx + 1,
                        reps: s.reps ?? '',
                        kg: s.kg ?? '',
                        rir: s.rir ?? '',
                        type: s.type || 'Normal',
                    };
                }),
            };
        });
        setSelectedExercises(loadedExercises);
        const expandMap = {};
        loadedExercises.forEach(e => { expandMap[e.id] = true; });
        setExpandedExercises(expandMap);
        if (formSectionRef.current) {
            formSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleCancelEdit = () => {
        setEditingRoutineId(null);
        setTitle('');
        setCoachComment('');
        setSelectedExercises([]);
    };

    const handleDeleteRoutine = async (routine) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar la rutina "${routine.title}" de este cliente?`)) {
            return;
        }
        try {
            await routineService.delete(routine.id, selectedClientId);
            if (editingRoutineId === routine.id) {
                handleCancelEdit();
            }
            setRoutinesReloadKey(k => k + 1);
            setDeleteNotice(`Rutina "${routine.title}" eliminada con éxito.`);
            setTimeout(() => setDeleteNotice(''), 4000);
        } catch (err) {
            alert(`Error al eliminar rutina: ${err.message}`);
        }
    };

    // Auto-seleccionar rutina para editar si viene en la query URL
    useEffect(() => {
        if (queryRoutineId && clientRoutines && clientRoutines.length > 0 && !editingRoutineId) {
            const match = clientRoutines.find(r => String(r.id) === String(queryRoutineId));
            if (match) {
                const timer = setTimeout(() => {
                    handleEditRoutine(match);
                }, 0);
                return () => clearTimeout(timer);
            }
        }
    }, [queryRoutineId, clientRoutines, editingRoutineId]);

    const {
        submitting,
        submitError,
        submitSuccess,
        handleSubmit,
    } = useFormSubmission({
        onSuccess: () => {
            setEditingRoutineId(null);
            setTitle('');
            setCoachComment('');
            setSelectedExercises([]);
            setRoutinesReloadKey(k => k + 1);
        },
    });

    const selectedClientObj = useMemo(() => {
        return (clients || []).find(c => String(c.id) === String(selectedClientId)) || null;
    }, [clients, selectedClientId]);

    const openExercisePicker = () => {
        setShowExercisePicker(true);
        setSearchText('');
        setSelectedCategory('Todas');
        setSelectedTags([]);
        setPickerTrigger(prev => prev + 1);
    };

    const closeExercisePicker = () => {
        setShowExercisePicker(false);
    };

    const addExerciseToRoutine = (exercise) => {
        if (selectedExercises.some(e => e.id === exercise.id)) return;
        idCounter.current += 1;
        setSelectedExercises([...selectedExercises, {
            ...exercise,
            sets: [{ id: `new-${idCounter.current}`, order: 1, reps: '', kg: '', rir: '1-2', type: 'Normal' }],
        }]);
        setExpandedExercises(prev => ({ ...prev, [exercise.id]: true }));
    };

    const removeExerciseFromRoutine = (exerciseId) => {
        setSelectedExercises(selectedExercises.filter(e => e.id !== exerciseId));
    };

    const addSet = (exerciseId) => {
        setSelectedExercises(selectedExercises.map(e => {
            if (e.id === exerciseId) {
                idCounter.current += 1;
                const newSet = {
                    id: `new-${idCounter.current}`,
                    order: e.sets.length + 1,
                    reps: '',
                    kg: '',
                    rir: '1-2',
                    type: 'Normal',
                };
                return { ...e, sets: [...e.sets, newSet] };
            }
            return e;
        }));
    };

    const removeSet = (exerciseId, setId) => {
        setSelectedExercises(selectedExercises.map(e => {
            if (e.id === exerciseId) {
                const newSets = e.sets.filter(s => s.id !== setId)
                    .map((s, idx) => ({ ...s, order: idx + 1 }));
                return { ...e, sets: newSets };
            }
            return e;
        }));
    };

    const updateSet = (exerciseId, setId, field, value) => {
        setSelectedExercises(selectedExercises.map(e => {
            if (e.id === exerciseId) {
                const newSets = e.sets.map(s =>
                    s.id === setId ? { ...s, [field]: value } : s
                );
                return { ...e, sets: newSets };
            }
            return e;
        }));
    };

    const toggleExercise = (exerciseId) => {
        setExpandedExercises(prev => ({
            ...prev,
            [exerciseId]: !prev[exerciseId],
        }));
    };

    const toggleTag = (tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const clearFilters = () => {
        setSearchText('');
        setSelectedCategory('Todas');
        setSelectedTags([]);
    };

    const hasActiveFilters = searchText || selectedCategory !== 'Todas' || selectedTags.length > 0;

    const onSubmit = async () => {
        const profile = await getCurrentProfile();
        const routineData = {
            id: editingRoutineId || undefined,
            title,
            coachComment,
            creatorId: profile.id,
            clientId: selectedClientId || null,
            exercises: selectedExercises.map(e => ({
                id: e.id,
                exercise_name: e.exercise_name,
                category: e.category,
                description: e.description,
                comments: e.comments,
                sets: e.sets.map(s => ({
                    order: s.order,
                    reps: s.reps,
                    kg: s.kg,
                    rir: s.rir,
                    type: s.type,
                })),
            })),
        };

        if (editingRoutineId) {
            await routineService.update(editingRoutineId, routineData);
        } else {
            await routineService.create(routineData);
        }
    };

    const onSubmitClick = () => handleSubmit(onSubmit);

    const isFormValid = title.trim() !== '' && selectedExercises.length > 0;

    return (
        <div className="routine-page">
            <div className="page-container">
                <h1 className="page-title">Rutinas y Asignación</h1>
                <p className="page-description">
                    Supervisa las rutinas asignadas, ajusta cargas y repeticiones para progresar a tus atletas o diseña nuevas sesiones.
                </p>

                {deleteNotice && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        color: '#fca5a5',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                    }}>
                        {deleteNotice}
                    </div>
                )}

                {/* Rutinas actualmente asignadas al cliente seleccionado */}
                {selectedClientId && selectedClientObj && (
                    <div style={{
                        background: 'var(--color-bg-secondary, #181b20)',
                        border: '1px solid var(--color-border, #282c34)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        marginBottom: '1.5rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiActivity style={{ color: 'var(--color-primary, #e63946)' }} />
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                                    Rutinas asignadas a {selectedClientObj.name} {selectedClientObj.surname || ''}
                                </h3>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#9aa0a6' }}>
                                {(clientRoutines || []).length} rutina(s) activa(s)
                            </span>
                        </div>

                        {!clientRoutines || clientRoutines.length === 0 ? (
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#9aa0a6' }}>
                                Este atleta aún no tiene ninguna rutina asignada. Rellena el formulario de abajo para asignarle una.
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '0.85rem' }}>
                                {clientRoutines.map((r) => {
                                    const isCurrentlyEditing = editingRoutineId === r.id;
                                    return (
                                        <div
                                            key={r.id}
                                            style={{
                                                background: isCurrentlyEditing ? 'rgba(230, 57, 70, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                                border: `1px solid ${isCurrentlyEditing ? 'var(--color-primary, #e63946)' : 'rgba(255, 255, 255, 0.08)'}`,
                                                borderRadius: '10px',
                                                padding: '0.85rem 1rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                                                        {r.title}
                                                    </div>
                                                    {isCurrentlyEditing && (
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            background: 'var(--color-primary, #e63946)',
                                                            color: '#fff',
                                                            padding: '0.15rem 0.45rem',
                                                            borderRadius: '4px',
                                                            fontWeight: 700,
                                                        }}>
                                                            Editando
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: '#9aa0a6' }}>
                                                    {(r.exercises || []).length} ejercicios · {(r.exercises || []).reduce((acc, e) => acc + (e.sets?.length || 0), 0)} series
                                                </div>
                                                {r.coach_comment && (
                                                    <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: '0.35rem 0', fontStyle: 'italic' }}>
                                                        "{r.coach_comment}"
                                                    </p>
                                                )}

                                                {/* Previsualización rápida de ejercicios y cargas */}
                                                {r.exercises && r.exercises.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0.5rem 0' }}>
                                                        {r.exercises.slice(0, 3).map((ex, i) => (
                                                            <span
                                                                key={ex.id || i}
                                                                style={{
                                                                    fontSize: '0.72rem',
                                                                    background: 'rgba(255, 255, 255, 0.06)',
                                                                    padding: '0.2rem 0.45rem',
                                                                    borderRadius: '4px',
                                                                    color: '#e2e8f0',
                                                                }}
                                                            >
                                                                {ex.exercise_name || ex.name}
                                                                {ex.sets?.[0]?.kg ? ` (${ex.sets[0].kg}kg${ex.sets[0].rir ? `, RIR ${ex.sets[0].rir}` : ''})` : (ex.sets?.[0]?.rir ? ` (RIR ${ex.sets[0].rir})` : '')}
                                                            </span>
                                                        ))}
                                                        {r.exercises.length > 3 && (
                                                            <span style={{ fontSize: '0.72rem', color: '#9aa0a6', alignSelf: 'center' }}>
                                                                +{r.exercises.length - 3} más
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Acciones de progresión */}
                                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditRoutine(r)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.4rem 0.5rem',
                                                        fontSize: '0.76rem',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--color-primary, #e63946)',
                                                        background: isCurrentlyEditing ? 'var(--color-primary, #e63946)' : 'rgba(230, 57, 70, 0.15)',
                                                        color: '#ffffff',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.35rem',
                                                        fontWeight: 700,
                                                    }}
                                                    title="Editar ejercicios, series, kilos y repeticiones de esta rutina"
                                                >
                                                    <FiEdit2 size={13} /> {isCurrentlyEditing ? 'En edición' : 'Editar / Progresar'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDuplicateRoutine(r)}
                                                    style={{
                                                        padding: '0.4rem 0.5rem',
                                                        fontSize: '0.76rem',
                                                        borderRadius: '6px',
                                                        border: '1px solid rgba(255, 255, 255, 0.14)',
                                                        background: 'rgba(255, 255, 255, 0.06)',
                                                        color: '#cbd5e1',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.3rem',
                                                    }}
                                                    title="Duplicar como nueva rutina para la siguiente semana de progresión"
                                                >
                                                    <FiCopy size={13} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteRoutine(r)}
                                                    style={{
                                                        padding: '0.4rem 0.5rem',
                                                        fontSize: '0.76rem',
                                                        borderRadius: '6px',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                    title="Eliminar rutina de este cliente"
                                                >
                                                    <FiTrash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div className="form-section-card" ref={formSectionRef}>
                    {editingRoutineId && (
                        <div style={{
                            background: 'rgba(230, 57, 70, 0.12)',
                            border: '1px solid var(--color-primary, #e63946)',
                            borderRadius: '10px',
                            padding: '0.85rem 1rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            flexWrap: 'wrap',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiTrendingUp style={{ color: 'var(--color-primary, #e63946)', fontSize: '1.2rem' }} />
                                <div>
                                    <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                                        Modo Progresión de Rutina Activo
                                    </strong>
                                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                                        Modifica los kilos, repeticiones o añade ejercicios para progresar a {selectedClientObj?.name || 'tu atleta'}.
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#cbd5e1',
                                    borderRadius: '6px',
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancelar edición
                            </button>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h2 className="section-subtitle" style={{ margin: 0 }}>
                            {editingRoutineId ? `Editar Rutina: ${title || 'Sin título'}` : 'Crear y Asignar Nueva Rutina'}
                        </h2>
                        {editingRoutineId && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-primary, #e63946)', fontWeight: 700 }}>
                                Sobrecarga progresiva
                            </span>
                        )}
                    </div>

                    <div className="form-field">
                        <label htmlFor="client-select">Asignar a Cliente *</label>
                        <select
                            id="client-select"
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="form-field-input"
                        >
                            <option value="">Sin asignar</option>
                            {clients?.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.name ? `${client.name} ${client.surname || ''}` : 'Sin nombre'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="routine-title">Título de la Rutina *</label>
                        <input
                            id="routine-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Rutina de Fuerza - Nivel Intermedio"
                            className="form-field-input"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="coach-comment">Comentario del Coach</label>
                        <textarea
                            id="coach-comment"
                            value={coachComment}
                            onChange={(e) => setCoachComment(e.target.value)}
                            placeholder="Notas adicionales sobre la rutina..."
                            className="form-field-textarea"
                            rows="3"
                        />
                    </div>
                </div>

                <div className="exercises-section">
                    <div className="exercises-header">
                        <h2 className="section-subtitle">Ejercicios de la Rutina</h2>
                        <button onClick={openExercisePicker} className="btn-outline">
                            <FiPlus size={16} />
                            <span>Agregar Ejercicio</span>
                        </button>
                    </div>

                    {selectedExercises.length === 0 ? (
                        <div className="empty-state">
                            <p>No hay ejercicios agregados. Haz clic en "Agregar Ejercicio" para buscar en tu catálogo.</p>
                        </div>
                    ) : (
                        <div className="exercises-list">
                            {selectedExercises.map((exercise, idx) => (
                                <div key={exercise.id} className="routine-exercise-card">
                                    <div className="routine-exercise-header">
                                        <div className="routine-exercise-title-row">
                                            <span className="routine-exercise-number">Ejercicio {idx + 1}</span>
                                            <span className="routine-exercise-name">
                                                {exercise.exercise_name}
                                            </span>
                                            <span className="category-badge">{exercise.category}</span>
                                        </div>
                                        <div className="routine-exercise-actions">
                                            <button
                                                onClick={() => toggleExercise(exercise.id)}
                                                className="btn-icon"
                                            >
                                                {expandedExercises[exercise.id] ? <FiChevronUp /> : <FiChevronDown />}
                                            </button>
                                            <button
                                                onClick={() => removeExerciseFromRoutine(exercise.id)}
                                                className="btn-icon btn-icon-danger"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>

                                    {expandedExercises[exercise.id] && (
                                        <div className="routine-exercise-content">
                                            {exercise.description && (
                                                <p className="routine-exercise-info">{exercise.description}</p>
                                            )}
                                            {exercise.tags && exercise.tags.length > 0 && (
                                                <div className="routine-exercise-tags">
                                                    {exercise.tags.map(tag => (
                                                        <span key={tag.id} className="tag-badge">{tag.name}</span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="sets-section">
                                                <div className="sets-header">
                                                    <h3 className="sets-title">Series</h3>
                                                    <Button variant="outline" size="sm" onClick={() => addSet(exercise.id)}>
                                                        <FiPlus size={14} />
                                                        <span>Agregar Serie</span>
                                                    </Button>
                                                </div>

                                                <div className="sets-table-container">
                                                    <div className="sets-table">
                                                        <div className="sets-table-header">
                                                            <span className="set-col-order">#</span>
                                                            <span className="set-col-reps">Reps</span>
                                                            <span className="set-col-kg">Kg</span>
                                                            <span className="set-col-rir" title="Repeticiones en Reserva">RIR</span>
                                                            <span className="set-col-type">Tipo</span>
                                                            <span className="set-col-actions"></span>
                                                        </div>
                                                        {exercise.sets.map((set) => (
                                                            <div key={set.id} className="sets-table-row">
                                                                <span className="set-col-order set-order-number">{set.order}</span>
                                                                <div className="set-col-reps">
                                                                    <input
                                                                        type="text"
                                                                        value={set.reps}
                                                                        onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                                                                        placeholder="Ej: 8-10"
                                                                        className="set-input"
                                                                    />
                                                                </div>
                                                                <div className="set-col-kg">
                                                                    <input
                                                                        type="text"
                                                                        value={set.kg}
                                                                        onChange={(e) => updateSet(exercise.id, set.id, 'kg', e.target.value)}
                                                                        placeholder="Ej: 60"
                                                                        className="set-input"
                                                                    />
                                                                </div>
                                                                <div className="set-col-rir">
                                                                    <input
                                                                        type="text"
                                                                        value={set.rir ?? ''}
                                                                        onChange={(e) => updateSet(exercise.id, set.id, 'rir', e.target.value)}
                                                                        placeholder="Ej: 1-2 o 0"
                                                                        className="set-input"
                                                                        title="Repeticiones en Reserva: 0 = Fallo, 1 = 1 antes de fallo, 2 = 2 antes..."
                                                                    />
                                                                </div>
                                                                <div className="set-col-type">
                                                                    <select
                                                                        value={set.type}
                                                                        onChange={(e) => updateSet(exercise.id, set.id, 'type', e.target.value)}
                                                                        className="set-input"
                                                                    >
                                                                        {SET_TYPES.map(type => (
                                                                            <option key={type} value={type}>{type}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="set-col-actions">
                                                                    <button
                                                                        onClick={() => removeSet(exercise.id, set.id)}
                                                                        className="btn-icon btn-icon-danger btn-icon-sm"
                                                                        title="Eliminar serie"
                                                                    >
                                                                        <FiTrash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-footer">
                    {submitError && <div className="error-message">{submitError}</div>}
                    {submitSuccess && (
                        <div className="success-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiCheck />
                            <span>
                                {editingRoutineId
                                    ? '¡Rutina y sobrecarga progresiva actualizadas con éxito! Los cambios se reflejan inmediatamente en la cuenta del cliente.'
                                    : '¡Rutina creada y asignada correctamente! Ya aparece arriba en la lista de rutinas del cliente.'}
                            </span>
                        </div>
                    )}

                    <div className="form-buttons">
                        {editingRoutineId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={submitting}
                                className="btn-secondary"
                                style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                            >
                                Cancelar Edición
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/app/clients')}
                            disabled={submitting}
                            className="btn-secondary"
                        >
                            Ver Cartera de Clientes
                        </button>
                        <button
                            onClick={onSubmitClick}
                            disabled={submitting || !isFormValid}
                            className="btn-primary"
                            style={editingRoutineId ? {
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                borderColor: '#10b981',
                            } : {}}
                        >
                            {submitting
                                ? (editingRoutineId ? 'Guardando progresión...' : 'Creando y asignando...')
                                : (editingRoutineId ? '💾 Guardar Cambios de Progresión' : 'Crear y Asignar Rutina')}
                        </button>
                    </div>
                </div>
            </div>

            {showExercisePicker && (
                <div className="modal-overlay" onClick={closeExercisePicker}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Seleccionar Ejercicio</h2>
                            <button onClick={closeExercisePicker} className="btn-icon">
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="modal-filters">
                            <div className="search-box">
                                <FiSearch className="search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className="search-input"
                                />
                            </div>

                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="category-select"
                            >
                                {EXERCISE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {allTags.length > 0 && (
                            <div className="modal-tags">
                                <span className="tags-filter-label">
                                    <FiTag size={14} />
                                    Tags:
                                </span>
                                <div className="tags-list">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleTag(tag.id)}
                                            className={`tag-chip ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                                        >
                                            {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="modal-body">
                            {loadingExercises ? (
                                <div className="loading-state">Cargando ejercicios...</div>
                            ) : !availableExercises || availableExercises.length === 0 ? (
                                <div className="empty-state">
                                    <p>No se encontraron ejercicios.</p>
                                    {hasActiveFilters && (
                                        <button onClick={clearFilters} className="btn-outline">
                                            Limpiar filtros
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="exercise-picker-list">
                                    {availableExercises.map(exercise => {
                                        const isAdded = selectedExercises.some(e => e.id === exercise.id);
                                        return (
                                            <div key={exercise.id} className={`exercise-picker-item ${isAdded ? 'added' : ''}`}>
                                                <div className="exercise-picker-info">
                                                    <span className="exercise-picker-name">{exercise.exercise_name}</span>
                                                    <span className="category-badge">{exercise.category}</span>
                                                </div>
                                                {exercise.tags && exercise.tags.length > 0 && (
                                                    <div className="exercise-picker-tags">
                                                        {exercise.tags.map(tag => (
                                                            <span key={tag.id} className="tag-badge">{tag.name}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => !isAdded && addExerciseToRoutine(exercise)}
                                                    disabled={isAdded}
                                                    className={isAdded ? 'btn-added' : 'btn-outline btn-sm'}
                                                >
                                                    {isAdded ? 'Agregado' : 'Agregar'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateRoutine;
