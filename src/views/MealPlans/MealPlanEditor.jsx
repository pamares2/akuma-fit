import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    FiPlus,
    FiTrash2,
    FiChevronUp,
    FiChevronDown,
    FiCopy,
    FiAlertTriangle,
    FiZap,
    FiBookOpen,
} from 'react-icons/fi';
import { mealPlanService } from '../../services/mealPlanService.js';
import { assessmentService } from '../../services/assessmentService.js';
import { dietGeneratorService } from '../../services/dietGeneratorService.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import useFormSubmission from '../../hooks/useFormSubmission.js';
import DietItemPicker from '../../components/complex/DietItemPicker/DietItemPicker.jsx';
import RecipeDetailModal from '../../components/complex/RecipeDetailModal/RecipeDetailModal.jsx';
import AnefDietWizard from '../../components/complex/AnefDietWizard/AnefDietWizard.jsx';
import { itemMacros, slotMacros, dayMacros, formatMacros } from '../../utils/dietMacros.js';

/**
 * Input de texto editable inline que guarda al perder el foco.
 */
function InlineText({ value, onSave, placeholder, className }) {
    const [draft, setDraft] = useState(value ?? '');

    return (
        <input
            type="text"
            className={className}
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
                if (draft !== value) onSave(draft);
            }}
            onKeyDown={(event) => {
                if (event.key === 'Enter') event.target.blur();
            }}
        />
    );
}

/**
 * Input numérico editable inline que guarda al perder el foco.
 */
function InlineNumber({ value, onSave, className, step = '0.1' }) {
    const [draft, setDraft] = useState(value ?? '');

    return (
        <input
            type="number"
            min="0"
            step={step}
            className={className}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
                const parsed = draft === '' ? null : Number(draft);
                const normalized = parsed === null || Number.isNaN(parsed) ? null : parsed;
                if (normalized !== value) onSave(normalized);
            }}
            onKeyDown={(event) => {
                if (event.key === 'Enter') event.target.blur();
            }}
        />
    );
}

/**
 * Formulario de datos generales de un plan (título, descripción y macros objetivo).
 */
function PlanHeaderForm({ plan, onSaved }) {
    const [title, setTitle] = useState(plan.title);
    const [description, setDescription] = useState(plan.description || '');
    const [targetCalories, setTargetCalories] = useState(plan.target_calories ?? '');
    const [targetProtein, setTargetProtein] = useState(plan.target_protein ?? '');
    const [targetCarbs, setTargetCarbs] = useState(plan.target_carbs ?? '');
    const [targetFat, setTargetFat] = useState(plan.target_fat ?? '');

    const { submitting, submitError, submitSuccess, handleSubmit } = useFormSubmission({
        onSuccess: onSaved,
    });

    const toNumber = (value) => (value === '' ? null : Number(value));

    const onSubmit = async () => {
        await mealPlanService.update(plan.id, {
            title: title.trim(),
            description: description.trim(),
            target_calories: toNumber(targetCalories),
            target_protein: toNumber(targetProtein),
            target_carbs: toNumber(targetCarbs),
            target_fat: toNumber(targetFat),
        });
    };

    return (
        <div className="form-section-card">
            <h2 className="section-subtitle">Datos del plan</h2>

            <div className="form-field">
                <label>Título *</label>
                <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
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

            <h3 className="diet-form-subtitle">Macros objetivo por día (opcional)</h3>
            <div className="diet-form-grid diet-form-macros">
                <div className="form-field">
                    <label>Kcal</label>
                    <input
                        type="number"
                        min="0"
                        value={targetCalories}
                        onChange={(event) => setTargetCalories(event.target.value)}
                        className="form-field-input"
                    />
                </div>
                <div className="form-field">
                    <label>Proteínas (g)</label>
                    <input
                        type="number"
                        min="0"
                        value={targetProtein}
                        onChange={(event) => setTargetProtein(event.target.value)}
                        className="form-field-input"
                    />
                </div>
                <div className="form-field">
                    <label>Carbohidratos (g)</label>
                    <input
                        type="number"
                        min="0"
                        value={targetCarbs}
                        onChange={(event) => setTargetCarbs(event.target.value)}
                        className="form-field-input"
                    />
                </div>
                <div className="form-field">
                    <label>Grasas (g)</label>
                    <input
                        type="number"
                        min="0"
                        value={targetFat}
                        onChange={(event) => setTargetFat(event.target.value)}
                        className="form-field-input"
                    />
                </div>
            </div>

            {submitError && <div className="error-message">{submitError}</div>}
            {submitSuccess && <div className="success-message">Plan guardado.</div>}

            <div className="form-buttons">
                <button
                    className="btn-primary"
                    disabled={submitting || title.trim() === ''}
                    onClick={() => handleSubmit(onSubmit)}
                >
                    {submitting ? 'Guardando...' : 'Guardar datos del plan'}
                </button>
            </div>
        </div>
    );
}

/**
 * Tarjeta del Generador Automático de Dieta según macros.
 */
function AutoDietGeneratorCard({ plan, onGenerated }) {
    const [calories, setCalories] = useState(plan.target_calories || 2200);
    const [protein, setProtein] = useState(plan.target_protein || 160);
    const [carbs, setCarbs] = useState(plan.target_carbs || 240);
    const [fat, setFat] = useState(plan.target_fat || 65);
    const [mealsCount, setMealsCount] = useState(4);
    const [mode, setMode] = useState('recipes');
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState(null);
    const [genSuccess, setGenSuccess] = useState(false);

    const handleGenerate = async () => {
        setGenerating(true);
        setGenError(null);
        setGenSuccess(false);

        try {
            await dietGeneratorService.generateDay(plan.id, {
                calories: Number(calories),
                protein: Number(protein),
                carbs: Number(carbs),
                fat: Number(fat),
                mealsCount: Number(mealsCount),
                mode,
            });
            setGenSuccess(true);
            onGenerated();
        } catch (err) {
            setGenError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="form-section-card" style={{
            border: '1px solid var(--color-primary-border)',
            background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-alt) 100%)',
            boxShadow: 'var(--anime-aura-glow, none)',
            marginTop: '1.5rem',
            marginBottom: '1.5rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h2 className="section-subtitle" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiZap style={{ color: 'var(--color-primary)' }} /> Generador Automático de Dieta y Recetas
                </h2>
                <span className="anime-badge">IA / Automático</span>
            </div>

            <p className="section-help" style={{ marginBottom: '1.25rem' }}>
                Calcula automáticamente todas las comidas del día con recetas completas de dieta (o alimentos por gramos) cuadradas a los macros del cliente.
            </p>

            <div className="diet-form-grid diet-form-macros" style={{ marginBottom: '1rem' }}>
                <div className="form-field">
                    <label>Kcal Objetivo</label>
                    <input
                        type="number"
                        min="500"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        className="form-field-input"
                    />
                </div>
                <div className="form-field">
                    <label>Proteínas (g)</label>
                    <input
                        type="number"
                        min="20"
                        value={protein}
                        onChange={(e) => setProtein(e.target.value)}
                        className="form-field-input"
                    />
                </div>
                <div className="form-field">
                    <label>Carbohidratos (g)</label>
                    <input
                        type="number"
                        min="20"
                        value={carbs}
                        onChange={(e) => setCarbs(e.target.value)}
                        className="form-field-input"
                    />
                </div>
                <div className="form-field">
                    <label>Grasas (g)</label>
                    <input
                        type="number"
                        min="10"
                        value={fat}
                        onChange={(e) => setFat(e.target.value)}
                        className="form-field-input"
                    />
                </div>
            </div>

            <div className="diet-form-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="form-field">
                    <label>Número de comidas al día</label>
                    <select
                        className="category-select"
                        value={mealsCount}
                        onChange={(e) => setMealsCount(Number(e.target.value))}
                    >
                        <option value={3}>3 Comidas (Desayuno, Comida, Cena)</option>
                        <option value={4}>4 Comidas (Desayuno, Comida, Merienda, Cena)</option>
                        <option value={5}>5 Comidas (Desayuno, Media Mañana, Comida, Merienda, Cena)</option>
                    </select>
                </div>

                <div className="form-field">
                    <label>Formato de generación</label>
                    <select
                        className="category-select"
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                    >
                        <option value="recipes">Recetas completas de dieta (con ingredientes y elaboración)</option>
                        <option value="foods">Alimentos individuales desglosados por gramos</option>
                    </select>
                </div>
            </div>

            {genError && <div className="error-message">{genError}</div>}
            {genSuccess && (
                <div className="success-message" style={{ marginBottom: '1rem' }}>
                    ✓ ¡Día generado automáticamente con éxito! Desplázate abajo para ver las comidas y recetas.
                </div>
            )}

            <button
                className="btn-primary"
                disabled={generating || !calories || !protein || !carbs || !fat}
                onClick={handleGenerate}
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
            >
                <FiZap size={18} />
                <span>
                    {generating
                        ? 'Calculando y generando comidas...'
                        : mode === 'recipes'
                            ? '⚡ Generar Día con Recetas de Dieta'
                            : '⚡ Generar Día con Alimentos por Gramos'}
                </span>
            </button>
        </div>
    );
}

/**
 * Asignación/desasignación de clientes a un plan, mostrando sus restricciones
 * alimentarias.
 */
function PlanAssignment({ plan, onSaved }) {
    const { data: clients } = useAsyncData(() => mealPlanService.getClients(), [], []);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [busy, setBusy] = useState(false);

    const { data: restrictions } = useAsyncData(
        selectedClientId
            ? async () => {
                const assessment = await assessmentService.getByProfile(selectedClientId);
                return assessment?.food_restrictions || null;
            }
            : null,
        [selectedClientId],
        null
    );

    const assignedIds = plan.clients.map(client => client.id);
    const assignableClients = clients.filter(client => !assignedIds.includes(client.id));

    const handleAssign = async () => {
        if (!selectedClientId) return;

        setBusy(true);
        try {
            await mealPlanService.assign(selectedClientId, plan.id);
            setSelectedClientId('');
            onSaved();
        } finally {
            setBusy(false);
        }
    };

    const handleUnassign = async (clientId) => {
        setBusy(true);
        try {
            await mealPlanService.unassign(clientId, plan.id);
            onSaved();
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="form-section-card">
            <h2 className="section-subtitle">Clientes asignados</h2>

            {plan.clients.length > 0 ? (
                <div className="diet-assigned-list">
                    {plan.clients.map(client => (
                        <div key={client.id} className="diet-assigned-item">
                            <span>{client.name} {client.surname}</span>
                            <button
                                className="btn-outline btn-sm"
                                disabled={busy}
                                onClick={() => handleUnassign(client.id)}
                            >
                                Desasignar
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="section-help">Este plan aún no está asignado a ningún cliente.</p>
            )}

            <div className="diet-assign-row">
                <select
                    className="category-select"
                    value={selectedClientId}
                    onChange={(event) => setSelectedClientId(event.target.value)}
                >
                    <option value="">Seleccionar cliente...</option>
                    {assignableClients.map(client => (
                        <option key={client.id} value={client.id}>
                            {client.name} {client.surname}
                        </option>
                    ))}
                </select>
                <button
                    className="btn-primary"
                    disabled={!selectedClientId || busy}
                    onClick={handleAssign}
                >
                    Asignar
                </button>
            </div>

            {selectedClientId && restrictions && (
                <div className="alert-item alert-warning">
                    <FiAlertTriangle className="alert-icon" size={18} />
                    <span>Este cliente tiene restricciones alimentarias: {restrictions}</span>
                </div>
            )}
        </div>
    );
}

/**
 * Fila de un ítem dentro de una comida, con cantidad/raciones editables y
 * acciones de mover/eliminar.
 */
function ItemRow({ item, busy, onUpdate, onMove, onRemove, onViewRecipe }) {
    const macros = itemMacros(item);
    const servingsFactor = item.servings && item.servings > 0 ? item.servings : 1;
    const recipeIngredients = item.recipe?.ingredients || [];

    return (
        <div className="diet-item-row">
            <div className="diet-item-name-block">
                <span className="diet-item-name">
                    {item.food ? item.food.name : item.recipe?.name}
                </span>
                {item.recipe && (
                    <div className="diet-item-recipe-meta">
                        <span className="tag-badge">Receta</span>
                        {recipeIngredients.length > 0 && (
                            <span className="diet-item-recipe-ingredients">
                                {recipeIngredients
                                    .map(ing => `${ing.food?.name} (${Math.round((ing.quantity_g || 0) * servingsFactor)}g)`)
                                    .join(' · ')}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {item.food ? (
                <div className="diet-item-quantity">
                    <InlineNumber
                        value={item.quantity_g}
                        onSave={(value) => onUpdate(item, { quantity_g: value })}
                        className="set-input"
                    />
                    <span className="diet-item-unit">g</span>
                </div>
            ) : (
                <div className="diet-item-quantity">
                    <InlineNumber
                        value={item.servings}
                        onSave={(value) => onUpdate(item, { servings: value })}
                        className="set-input"
                    />
                    <span className="diet-item-unit">raciones</span>
                </div>
            )}

            <InlineText
                value={item.notes}
                onSave={(value) => onUpdate(item, { notes: value })}
                placeholder="Notas"
                className="diet-item-notes"
            />

            <span className="diet-item-macros">{formatMacros(macros)}</span>

            <div className="diet-row-actions">
                {item.recipe && onViewRecipe && (
                    <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => onViewRecipe(item.recipe)}
                        title="Ver receta e instrucciones"
                    >
                        <FiBookOpen size={14} />
                        <span>Receta</span>
                    </button>
                )}
                <button className="btn-icon" disabled={busy} onClick={() => onMove(item.id, -1)} title="Subir">
                    <FiChevronUp size={16} />
                </button>
                <button className="btn-icon" disabled={busy} onClick={() => onMove(item.id, 1)} title="Bajar">
                    <FiChevronDown size={16} />
                </button>
                <button
                    className="btn-icon btn-icon-danger"
                    disabled={busy}
                    onClick={() => onRemove(item.id)}
                    title="Eliminar"
                >
                    <FiTrash2 size={16} />
                </button>
            </div>
        </div>
    );
}

/**
 * Editor de un plan de alimentación: datos generales, asignación de clientes
 * y estructura de días -> comidas -> ítems. En modo creación delega en
 * {@link PlanCreate}.
 */
function MealPlanEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [reloadKey, setReloadKey] = useState(0);
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [pickerSlotId, setPickerSlotId] = useState(null);
    const [viewingRecipe, setViewingRecipe] = useState(null);
    const [showAnefWizard, setShowAnefWizard] = useState(false);

    const { data: plan, loading, error } = useAsyncData(
        isEditing ? () => mealPlanService.getById(id) : null,
        [id, reloadKey],
        null
    );

    const reload = () => setReloadKey(key => key + 1);

    const runAction = async (action) => {
        setBusy(true);
        setActionError(null);

        try {
            await action();
            reload();
        } catch (err) {
            setActionError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const handleUpdateItem = (item, changes) => {
        runAction(() => mealPlanService.updateItem(item.id, changes));
    };

    const handlePickFood = (food) => {
        if (!pickerSlotId) return;
        const slotId = pickerSlotId;
        setPickerSlotId(null);
        runAction(() => mealPlanService.addItem(slotId, { food_id: food.id, quantity_g: 100 }));
    };

    const handlePickRecipe = (recipe) => {
        if (!pickerSlotId) return;
        const slotId = pickerSlotId;
        setPickerSlotId(null);
        runAction(() => mealPlanService.addItem(slotId, { recipe, recipe_id: recipe.id, servings: 1 }));
    };

    if (!isEditing) {
        return <PlanCreate />;
    }

    if (loading) {
        return <div className="loading-state">Cargando plan...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    if (!plan) {
        return <div className="loading-state">Cargando plan...</div>;
    }

    return (
        <div className="diet-page">
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">{plan.title}</h1>
                    <div className="diet-header-actions">
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={() => setShowAnefWizard(prev => !prev)}
                        >
                            <FiZap size={16} />
                            <span>
                                {showAnefWizard
                                    ? 'Ocultar Calculadora ANEF (5 Pasos)'
                                    : '⚡ Calculadora ANEF por Datos del Cliente'}
                            </span>
                        </button>
                        <button className="btn-outline" onClick={() => navigate('/app/dietas')}>
                            Volver a dietas
                        </button>
                    </div>
                </div>

                {actionError && <div className="error-message">{actionError}</div>}

                {showAnefWizard && (
                    <div style={{ marginBottom: '2rem' }}>
                        <AnefDietWizard
                            plan={plan}
                            onCompleted={() => {
                                setShowAnefWizard(false);
                                reload();
                            }}
                            onCancel={() => setShowAnefWizard(false)}
                        />
                    </div>
                )}

                <PlanHeaderForm key={`header-${plan.id}-${reloadKey}`} plan={plan} onSaved={reload} />
                <AutoDietGeneratorCard key={`autogen-${plan.id}-${reloadKey}`} plan={plan} onGenerated={reload} />
                <PlanAssignment key={`assign-${plan.id}-${reloadKey}`} plan={plan} onSaved={reload} />

                <div className="diet-days">
                    {plan.days.map((day, dayIndex) => (
                        <div key={day.id} className="diet-day-card">
                            <div className="diet-day-header">
                                <InlineText
                                    value={day.label}
                                    onSave={(value) => runAction(() => mealPlanService.updateDay(day.id, { label: value }))}
                                    className="diet-day-label"
                                />
                                <span className="diet-day-macros">{formatMacros(dayMacros(day))}</span>
                                <div className="diet-row-actions">
                                    <button
                                        className="btn-icon"
                                        disabled={busy || dayIndex === 0}
                                        onClick={() => runAction(() => mealPlanService.moveDay(day.id, -1))}
                                        title="Subir día"
                                    >
                                        <FiChevronUp size={16} />
                                    </button>
                                    <button
                                        className="btn-icon"
                                        disabled={busy || dayIndex === plan.days.length - 1}
                                        onClick={() => runAction(() => mealPlanService.moveDay(day.id, 1))}
                                        title="Bajar día"
                                    >
                                        <FiChevronDown size={16} />
                                    </button>
                                    <button
                                        className="btn-icon"
                                        disabled={busy}
                                        onClick={() => runAction(() => mealPlanService.copyDay(day.id))}
                                        title="Duplicar día"
                                    >
                                        <FiCopy size={16} />
                                    </button>
                                    <button
                                        className="btn-icon btn-icon-danger"
                                        disabled={busy}
                                        onClick={() => {
                                            if (window.confirm('¿Eliminar este día y todas sus comidas?')) {
                                                runAction(() => mealPlanService.removeDay(day.id));
                                            }
                                        }}
                                        title="Eliminar día"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="diet-slots">
                                {day.slots.map((slot, slotIndex) => (
                                    <div key={slot.id} className="diet-slot-card">
                                        <div className="diet-slot-header">
                                            <InlineText
                                                value={slot.label}
                                                onSave={(value) => runAction(() => mealPlanService.updateSlot(slot.id, { label: value }))}
                                                className="diet-slot-label"
                                            />
                                            <span className="diet-slot-macros">{formatMacros(slotMacros(slot))}</span>
                                            <div className="diet-row-actions">
                                                <button
                                                    className="btn-icon"
                                                    disabled={busy || slotIndex === 0}
                                                    onClick={() => runAction(() => mealPlanService.moveSlot(slot.id, -1))}
                                                    title="Subir comida"
                                                >
                                                    <FiChevronUp size={16} />
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    disabled={busy || slotIndex === day.slots.length - 1}
                                                    onClick={() => runAction(() => mealPlanService.moveSlot(slot.id, 1))}
                                                    title="Bajar comida"
                                                >
                                                    <FiChevronDown size={16} />
                                                </button>
                                                <button
                                                    className="btn-icon btn-icon-danger"
                                                    disabled={busy}
                                                    onClick={() => {
                                                        if (window.confirm('¿Eliminar esta comida?')) {
                                                            runAction(() => mealPlanService.removeSlot(slot.id));
                                                        }
                                                    }}
                                                    title="Eliminar comida"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {slot.items.map((item) => (
                                            <ItemRow
                                                key={item.id}
                                                item={item}
                                                busy={busy}
                                                onUpdate={handleUpdateItem}
                                                onMove={(itemId, direction) => runAction(() => mealPlanService.moveItem(itemId, direction))}
                                                onRemove={(itemId) => runAction(() => mealPlanService.removeItem(itemId))}
                                                onViewRecipe={(recipe) => setViewingRecipe(recipe)}
                                            />
                                        ))}

                                        <button
                                            className="btn-outline btn-sm diet-add-item-btn"
                                            disabled={busy}
                                            onClick={() => setPickerSlotId(slot.id)}
                                        >
                                            <FiPlus size={14} />
                                            <span>Añadir alimento o receta</span>
                                        </button>
                                    </div>
                                ))}

                                <button
                                    className="btn-outline diet-add-slot-btn"
                                    disabled={busy}
                                    onClick={() => runAction(() => mealPlanService.addSlot(day.id))}
                                >
                                    <FiPlus size={14} />
                                    <span>Añadir comida</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        className="btn-secondary diet-add-day-btn"
                        disabled={busy}
                        onClick={() => runAction(() => mealPlanService.addDay(plan.id))}
                    >
                        <FiPlus size={16} />
                        <span>Añadir día manual</span>
                    </button>
                </div>
            </div>

            {pickerSlotId && (
                <DietItemPicker
                    onClose={() => setPickerSlotId(null)}
                    onPickFood={handlePickFood}
                    onPickRecipe={handlePickRecipe}
                />
            )}

            {viewingRecipe && (
                <RecipeDetailModal
                    recipe={viewingRecipe}
                    onClose={() => setViewingRecipe(null)}
                    onEdit={(recipe) => {
                        setViewingRecipe(null);
                        navigate(`/app/recetas/${recipe.id}/edit`);
                    }}
                />
            )}
        </div>
    );
}

/**
 * Formulario de creación de un plan con la Calculadora Personalizada ANEF
 * (5 pasos con datos reales del cliente) o creación rápida por macros.
 */
function PlanCreate() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialClientId = searchParams.get('clientId') || '';

    return (
        <div className="diet-page">
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Nueva Dieta Personalizada (Sistema ANEF)</h1>
                        <p className="page-description" style={{ marginBottom: 0 }}>
                            Calcula el metabolismo basal, factor de actividad, reparto de comidas (3 a 8), gramos por kg con Auto-Ajuste y genera el menú con recetas y equivalencias.
                        </p>
                    </div>
                    <button className="btn-outline" onClick={() => navigate('/app/dietas')}>
                        Volver a dietas
                    </button>
                </div>

                <AnefDietWizard
                    initialClientId={initialClientId}
                    onCompleted={(newPlanId) => {
                        navigate(`/app/dietas/${newPlanId}/edit`, { replace: true });
                    }}
                    onCancel={() => navigate('/app/dietas')}
                />
            </div>
        </div>
    );
}

export default MealPlanEditor;
