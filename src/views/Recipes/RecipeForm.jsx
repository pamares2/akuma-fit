import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { recipeService } from '../../services/recipeService.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import useFormSubmission from '../../hooks/useFormSubmission.js';
import TagPicker from '../../components/complex/TagPicker/TagPicker.jsx';
import FoodPicker from '../../components/complex/FoodPicker/FoodPicker.jsx';
import { recipeTotalMacros, recipeServingMacros, formatMacros } from '../../utils/dietMacros.js';

const DIET_TAG_CATEGORY = 'dieta';

/**
 * Formulario de creación/edición de una receta, con ingredientes (alimentos)
 * y etiquetas, y previsualización de macros.
 */
function RecipeForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [preparationTime, setPreparationTime] = useState('');
    const [servings, setServings] = useState('1');
    const [ingredients, setIngredients] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [showFoodPicker, setShowFoodPicker] = useState(false);

    const loadData = async () => {
        if (!isEditing) return true;

        const recipe = await recipeService.getById(id);
        setName(recipe.name);
        setDescription(recipe.description || '');
        setInstructions(recipe.instructions || '');
        setPreparationTime(recipe.preparation_time ?? '');
        setServings(String(recipe.servings || 1));
        setIngredients(recipe.ingredients.map(ingredient => ({
            food: ingredient.food,
            quantity_g: ingredient.quantity_g,
            notes: ingredient.notes || '',
        })));
        setSelectedTags(recipe.tags || []);
        return true;
    };

    const { loading } = useAsyncData(loadData, [], null);

    const { submitting, submitError, submitSuccess, handleSubmit } = useFormSubmission({
        onSuccess: () => {
            setTimeout(() => navigate('/app/recetas'), 1200);
        },
    });

    const handleAddFood = (food) => {
        if (ingredients.some(ingredient =>
            (ingredient.food.id && ingredient.food.id === food.id)
            || ingredient.food.name?.toLowerCase() === food.name?.toLowerCase()
        )) {
            setShowFoodPicker(false);
            return;
        }

        setIngredients(prev => [...prev, { food, quantity_g: 100, notes: '' }]);
        setShowFoodPicker(false);
    };

    const handleIngredientChange = (index, field, value) => {
        setIngredients(prev => prev.map((ingredient, i) => (
            i === index ? { ...ingredient, [field]: value } : ingredient
        )));
    };

    const handleRemoveIngredient = (index) => {
        setIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const recipeForMacros = {
        servings: Number(servings) || 1,
        ingredients: ingredients.map(ingredient => ({
            food: ingredient.food,
            quantity_g: Number(ingredient.quantity_g) || 0,
        })),
    };

    const totalMacros = recipeTotalMacros(recipeForMacros);
    const servingMacros = recipeServingMacros(recipeForMacros);

    const onSubmit = async () => {
        const payload = {
            name: name.trim(),
            description: description.trim(),
            instructions: instructions.trim(),
            preparation_time: preparationTime === '' ? null : Number(preparationTime),
            servings: Number(servings) || 1,
            ingredients: ingredients.map(ingredient => ({
                food_id: typeof ingredient.food.id === 'number' ? ingredient.food.id : null,
                food: ingredient.food,
                quantity_g: Number(ingredient.quantity_g) || 0,
                notes: (ingredient.notes || '').trim() || null,
            })),
            tagIds: selectedTags.map(tag => tag.id),
        };

        if (isEditing) {
            await recipeService.update(id, payload);
        } else {
            await recipeService.create(payload);
        }
    };

    const isFormValid = name.trim() !== '' && ingredients.length > 0;

    if (loading) {
        return <div className="loading-state">Cargando...</div>;
    }

    return (
        <div className="recipe-form-page">
            <div className="page-container">
                <h1 className="page-title">{isEditing ? 'Editar receta' : 'Nueva receta'}</h1>
                <p className="page-description">
                    Las recetas son reutilizables en cualquier plan de alimentación.
                </p>

                <div className="form-section-card">
                    <h2 className="section-subtitle">Información básica</h2>

                    <div className="form-field">
                        <label>Nombre *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Ej: Tortilla de claras con espinacas"
                            className="form-field-input"
                        />
                    </div>

                    <div className="form-field">
                        <label>Descripción</label>
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            rows="2"
                            className="form-field-textarea"
                        />
                    </div>

                    <div className="form-field">
                        <label>Elaboración</label>
                        <textarea
                            value={instructions}
                            onChange={(event) => setInstructions(event.target.value)}
                            rows="4"
                            placeholder="Pasos de preparación..."
                            className="form-field-textarea"
                        />
                    </div>

                    <div className="diet-form-grid">
                        <div className="form-field">
                            <label>Tiempo de preparación (min)</label>
                            <input
                                type="number"
                                min="0"
                                value={preparationTime}
                                onChange={(event) => setPreparationTime(event.target.value)}
                                className="form-field-input"
                            />
                        </div>
                        <div className="form-field">
                            <label>Raciones *</label>
                            <input
                                type="number"
                                min="1"
                                value={servings}
                                onChange={(event) => setServings(event.target.value)}
                                className="form-field-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section-card">
                    <div className="sets-header">
                        <h2 className="sets-title">Ingredientes *</h2>
                        <button className="btn-outline" onClick={() => setShowFoodPicker(true)}>
                            <FiPlus size={14} />
                            <span>Añadir alimento</span>
                        </button>
                    </div>

                    {ingredients.length === 0 ? (
                        <div className="empty-state">
                            <p>Añade alimentos de la biblioteca para componer la receta.</p>
                        </div>
                    ) : (
                        <div className="sets-table recipe-ingredients-table">
                            <div className="sets-table-header recipe-ingredients-header">
                                <span>Alimento</span>
                                <span>Gramos</span>
                                <span>Notas</span>
                                <span>Kcal</span>
                                <span />
                            </div>
                            {ingredients.map((ingredient, index) => (
                                <div key={ingredient.food.id || ingredient.food.name || index} className="sets-table-row recipe-ingredients-row">
                                    <span className="recipe-ingredient-name">{ingredient.food.name}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={ingredient.quantity_g}
                                        onChange={(event) => handleIngredientChange(index, 'quantity_g', event.target.value)}
                                        className="set-input"
                                    />
                                    <input
                                        type="text"
                                        value={ingredient.notes}
                                        onChange={(event) => handleIngredientChange(index, 'notes', event.target.value)}
                                        placeholder="Ej: cocido"
                                        className="set-input"
                                    />
                                    <span className="recipe-ingredient-kcal">
                                        {Math.round((ingredient.food.calories || 0) * (Number(ingredient.quantity_g) || 0) / 100)}
                                    </span>
                                    <button
                                        className="btn-icon btn-icon-danger"
                                        onClick={() => handleRemoveIngredient(index)}
                                        title="Quitar ingrediente"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {ingredients.length > 0 && (
                        <div className="recipe-macros-preview">
                            <span>Total: {formatMacros(totalMacros)}</span>
                            <span>Por ración: {formatMacros(servingMacros)}</span>
                        </div>
                    )}
                </div>

                <div className="form-section-card">
                    <h2 className="section-subtitle">Tags</h2>
                    <TagPicker
                        selectedTags={selectedTags}
                        onChange={setSelectedTags}
                        category={DIET_TAG_CATEGORY}
                        placeholder="Ej: alto en proteína, vegetariana..."
                    />
                </div>

                <div className="form-footer">
                    {submitError && <div className="error-message">{submitError}</div>}
                    {submitSuccess && (
                        <div className="success-message">
                            {isEditing ? '¡Receta actualizada!' : '¡Receta creada!'}
                        </div>
                    )}

                    <div className="form-buttons">
                        <button onClick={() => navigate('/app/recetas')} disabled={submitting} className="btn-secondary">
                            Cancelar
                        </button>
                        <button
                            onClick={() => handleSubmit(onSubmit)}
                            disabled={submitting || !isFormValid}
                            className="btn-primary"
                        >
                            {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear receta'}
                        </button>
                    </div>
                </div>
            </div>

            {showFoodPicker && (
                <FoodPicker
                    onSelect={handleAddFood}
                    onClose={() => setShowFoodPicker(false)}
                />
            )}
        </div>
    );
}

export default RecipeForm;
