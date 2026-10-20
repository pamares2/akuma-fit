import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiPlus, FiX, FiVideo, FiTrash2 } from 'react-icons/fi';
import Button from '../../components/primitives/Button/Button.jsx';
import { exerciseService, exerciseVideoService } from '../../services/exerciseService.js';
import { tagService } from '../../services/tagService.js';
import useFormSubmission from '../../hooks/useFormSubmission.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';

const EXERCISE_CATEGORIES = [
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

/**
 * Formulario de creación/edición de un ejercicio, con tags y vídeo de
 * demostración.
 */
function ExerciseForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [comments, setComments] = useState('');
    const [category, setCategory] = useState('Fuerza');
    const [selectedTags, setSelectedTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [existingVideoUrl, setExistingVideoUrl] = useState(null);
    const [allTags, setAllTags] = useState([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    const loadData = async () => {
        const tags = await tagService.getAll();
        setAllTags(tags);

        if (isEditing) {
            const exercise = await exerciseService.getById(id);
            setName(exercise.exercise_name);
            setDescription(exercise.description || '');
            setComments(exercise.comments || '');
            setCategory(exercise.category);
            setSelectedTags(exercise.tags || []);

            try {
                const videoUrl = await exerciseVideoService.getSignedUrl(id);
                if (videoUrl) setExistingVideoUrl(videoUrl);
            } catch {
            }
        }
        return true;
    };

    const { loading } = useAsyncData(loadData, []);

    const {
        submitting,
        submitError,
        submitSuccess,
        handleSubmit,
    } = useFormSubmission({
        onSuccess: () => {
            setTimeout(() => navigate('/app/exercises'), 1200);
        },
    });

    const suggestedTags = allTags.filter(
        tag => tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
            !selectedTags.some(t => t.id === tag.id)
    );

    const addTag = (tag) => {
        if (!selectedTags.some(t => t.id === tag.id)) {
            setSelectedTags([...selectedTags, tag]);
        }
        setTagInput('');
        setShowTagSuggestions(false);
    };

    const removeTag = (tagId) => {
        setSelectedTags(selectedTags.filter(t => t.id !== tagId));
    };

    const createNewTag = async () => {
        if (!tagInput.trim()) return;
        try {
            const newTag = await tagService.create(tagInput.trim());
            addTag(newTag);
            setAllTags([...allTags, newTag]);
        } catch (error) {
            console.error('Error creating tag:', error);
        }
    };

    const handleTagKeyDown = async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const existing = allTags.find(t => t.name.toLowerCase() === tagInput.toLowerCase());
            if (existing) {
                addTag(existing);
            } else {
                await createNewTag();
            }
        }
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const removeVideo = () => {
        setVideoFile(null);
        if (videoPreview) {
            URL.revokeObjectURL(videoPreview);
            setVideoPreview(null);
        }
    };

    const onSubmit = async () => {
        const exerciseData = {
            name,
            description,
            comments,
            category,
        };

        let exerciseId;
        if (isEditing) {
            await exerciseService.update(id, exerciseData);
            exerciseId = id;
        } else {
            const created = await exerciseService.create(exerciseData);
            exerciseId = created.id;
        }

        for (const tag of selectedTags) {
            await tagService.addTagToExercise(exerciseId, tag.id);
        }

        if (videoFile) {
            await exerciseVideoService.upload(exerciseId, videoFile);
        }
    };

    const onSubmitClick = () => handleSubmit(onSubmit);

    const isFormValid = name.trim() !== '';

    if (loading) {
        return <div className="loading-state">Cargando...</div>;
    }

    return (
        <div className="exercise-form-page">
            <div className="page-container">
                <h1 className="page-title">
                    {isEditing ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                </h1>
                <p className="page-description">
                    {isEditing
                        ? 'Modifica los datos del ejercicio.'
                        : 'Crea un nuevo ejercicio para tu catálogo.'}
                </p>

                <div className="form-section-card">
                    <h2 className="section-subtitle">Información Básica</h2>

                    <div className="form-field">
                        <label htmlFor="exercise-name">Nombre del Ejercicio *</label>
                        <input
                            id="exercise-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Sentadilla con barra"
                            className="form-field-input"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="exercise-category">Categoría</label>
                        <select
                            id="exercise-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="form-field-input"
                        >
                            {EXERCISE_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="exercise-description">Descripción</label>
                        <textarea
                            id="exercise-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descripción técnica del ejercicio..."
                            className="form-field-textarea"
                            rows="3"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="exercise-comments">Comentarios</label>
                        <textarea
                            id="exercise-comments"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Notas adicionales para el cliente..."
                            className="form-field-textarea"
                            rows="2"
                        />
                    </div>
                </div>

                <div className="form-section-card">
                    <h2 className="section-subtitle">Tags</h2>
                    <p className="section-help">
                        Añade tags para clasificar el ejercicio (grupo muscular, equipamiento, etc.)
                    </p>

                    <div className="tag-input-container">
                        <div className="tag-input-wrapper">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => {
                                    setTagInput(e.target.value);
                                    setShowTagSuggestions(true);
                                }}
                                onFocus={() => setShowTagSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="Escribe para buscar o crear un tag..."
                                className="tag-input"
                            />
                            {tagInput && (
                                <button onClick={createNewTag} className="btn-icon" title="Crear nuevo tag">
                                    <FiPlus />
                                </button>
                            )}
                        </div>

                        {showTagSuggestions && suggestedTags.length > 0 && (
                            <div className="tag-suggestions">
                                {suggestedTags.slice(0, 5).map(tag => (
                                    <button
                                        key={tag.id}
                                        onClick={() => addTag(tag)}
                                        className="tag-suggestion-item"
                                    >
                                        {tag.name}
                                        {tag.category && <span className="tag-category">({tag.category})</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedTags.length > 0 && (
                        <div className="selected-tags">
                            {selectedTags.map(tag => (
                                <span key={tag.id} className="selected-tag">
                                    {tag.name}
                                    <button onClick={() => removeTag(tag.id)} className="remove-tag">
                                        <FiX size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-section-card">
                    <h2 className="section-subtitle">Video Explicativo</h2>
                    <p className="section-help">
                        Sube un video demostrando la técnica correcta del ejercicio.
                    </p>

                    {existingVideoUrl && !videoPreview && (
                        <div className="video-preview-container">
                            <video controls src={existingVideoUrl} className="video-preview">
                                Tu navegador no soporta videos.
                            </video>
                            <Button variant="outline" size="sm" onClick={() => setExistingVideoUrl(null)}>
                                <FiTrash2 size={14} />
                                Eliminar video actual
                            </Button>
                        </div>
                    )}

                    {videoPreview && (
                        <div className="video-preview-container">
                            <video controls src={videoPreview} className="video-preview">
                                Tu navegador no soporta videos.
                            </video>
                            <Button variant="outline" size="sm" onClick={removeVideo}>
                                <FiTrash2 size={14} />
                                Eliminar video
                            </Button>
                        </div>
                    )}

                    {!videoPreview && (
                        <label className="video-upload-area">
                            <FiVideo size={32} />
                            <span>Haz clic para subir un video</span>
                            <span className="video-upload-hint">MP4, WebM o MOV (máx. 50MB)</span>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoChange}
                                className="video-input"
                            />
                        </label>
                    )}
                </div>

                <div className="form-footer">
                    {submitError && <div className="error-message">{submitError}</div>}
                    {submitSuccess && <div className="success-message">
                        {isEditing ? '¡Ejercicio actualizado!' : '¡Ejercicio creado!'}
                    </div>}

                    <div className="form-buttons">
                        <button
                            onClick={() => navigate('/app/exercises')}
                            disabled={submitting}
                            className="btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onSubmitClick}
                            disabled={submitting || !isFormValid}
                            className="btn-primary"
                        >
                            {submitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Ejercicio')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExerciseForm;
