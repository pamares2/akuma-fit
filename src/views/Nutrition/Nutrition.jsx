import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronDown, FiBookOpen, FiClock } from 'react-icons/fi';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { mealPlanService } from '../../services/mealPlanService.js';
import { useAuth } from '../../context/useAuth.js';
import {
    itemMacros,
    slotMacros,
    dayMacros,
    formatMacros,
} from '../../utils/dietMacros.js';

/**
 * Devuelve el nombre legible de un ítem de plan (alimento o receta).
 *
 * @param {Object} item - Ítem con `food` o `recipe`.
 * @returns {string} Nombre del ítem.
 */
function itemName(item) {
    return item.food ? item.food.name : `${item.recipe.name} (receta)`;
}

/**
 * Devuelve la etiqueta de cantidad de un ítem (gramos o raciones).
 *
 * @param {Object} item - Ítem con `food` y `quantity_g`, o `recipe` y `servings`.
 * @returns {string} Etiqueta de cantidad.
 */
function itemQuantityLabel(item) {
    if (item.food) {
        return item.quantity_g ? `${item.quantity_g} g` : '';
    }

    if (!item.servings) return '';

    return `${item.servings} ${item.servings === 1 ? 'ración' : 'raciones'}`;
}

/**
 * Línea que muestra los macros consumidos frente a los objetivos del plan.
 *
 * @param {Object} props - Props del componente.
 * @param {Object} props.plan - Plan con objetivos (`target_calories`, etc.).
 * @param {Object} props.macros - Macros actuales.
 */
function TargetLine({ plan, macros }) {
    if (!plan.target_calories && !plan.target_protein && !plan.target_carbs && !plan.target_fat) {
        return null;
    }

    const parts = [];

    if (plan.target_calories) {
        parts.push(`${Math.round(macros.calories)}/${plan.target_calories} kcal`);
    }
    if (plan.target_protein) {
        parts.push(`P ${Math.round(macros.protein)}/${plan.target_protein} g`);
    }
    if (plan.target_carbs) {
        parts.push(`C ${Math.round(macros.carbs)}/${plan.target_carbs} g`);
    }
    if (plan.target_fat) {
        parts.push(`F ${Math.round(macros.fat)}/${plan.target_fat} g`);
    }

    return <span className="nutrition-target">Objetivo: {parts.join(' · ')}</span>;
}

/**
 * Vista "Nutrición" del cliente: lista sus planes de alimentación y muestra
 * por día/comida los macros de cada ítem frente a los objetivos.
 */
function Nutrition() {
    const { profileId } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [expandedDayId, setExpandedDayId] = useState(null);
    const [expandedRecipes, setExpandedRecipes] = useState({});

    const { data: plans, loading, error } = useAsyncData(
        profileId ? () => mealPlanService.getByClient(profileId) : null,
        [profileId],
        []
    );

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setExpandedDayId(plan.days[0]?.id ?? null);
    };

    const handleToggleDay = (dayId) => {
        setExpandedDayId(prev => (prev === dayId ? null : dayId));
    };

    const toggleRecipeDetails = (itemId) => {
        setExpandedRecipes(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    if (loading) {
        return <div className="loading-state">Cargando tus planes...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    if (plans.length === 0) {
        return (
            <div className="diet-page">
                <div className="page-container">
                    <h1 className="page-title">Nutrición</h1>
                    <div className="empty-state">
                        <p>Tu coach aún no te ha asignado ningún plan de alimentación.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedPlan) {
        return (
            <div className="diet-page">
                <div className="page-container">
                    <button
                        className="btn-outline"
                        onClick={() => setSelectedPlan(null)}
                    >
                        <FiChevronLeft size={18} />
                        <span>Volver a planes</span>
                    </button>

                    <div className="routine-detail-header">
                        <h1 className="page-title">{selectedPlan.title}</h1>
                        {selectedPlan.description && (
                            <p className="routine-coach-comment">{selectedPlan.description}</p>
                        )}
                    </div>

                    <div className="nutrition-days">
                        {selectedPlan.days.map(day => {
                            const macros = dayMacros(day);
                            const isExpanded = expandedDayId === day.id;

                            return (
                                <div key={day.id} className="nutrition-day-card">
                                    <button
                                        type="button"
                                        className="nutrition-day-header"
                                        onClick={() => handleToggleDay(day.id)}
                                    >
                                        <span className="nutrition-day-label">{day.label}</span>
                                        <span className="nutrition-day-macros">{formatMacros(macros)}</span>
                                        {isExpanded ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                                    </button>

                                    {isExpanded && (
                                        <div className="nutrition-day-content">
                                            <TargetLine plan={selectedPlan} macros={macros} />

                                            {day.slots.length === 0 ? (
                                                <p className="section-help">Este día aún no tiene comidas.</p>
                                            ) : (
                                                day.slots.map(slot => (
                                                    <div key={slot.id} className="nutrition-slot">
                                                        <div className="nutrition-slot-header">
                                                            <span className="nutrition-slot-label">{slot.label}</span>
                                                            <span className="nutrition-slot-macros">
                                                                {formatMacros(slotMacros(slot))}
                                                            </span>
                                                        </div>

                                                        {slot.items.map(item => {
                                                            const isRecipe = Boolean(item.recipe);
                                                            const recipeOpen = Boolean(expandedRecipes[item.id]);
                                                            const recipeIngredients = item.recipe?.ingredients || item.recipe?.recipe_food || [];
                                                            const factor = (item.servings && item.servings > 0 ? item.servings : 1)
                                                                / (item.recipe?.servings && item.recipe.servings > 0 ? item.recipe.servings : 1);

                                                            return (
                                                                <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <div className="nutrition-item">
                                                                        <div className="nutrition-item-info">
                                                                            <span className="nutrition-item-name">{itemName(item)}</span>
                                                                            <span className="nutrition-item-quantity">
                                                                                {itemQuantityLabel(item)}
                                                                                {item.notes ? ` · ${item.notes}` : ''}
                                                                            </span>
                                                                            {isRecipe && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleRecipeDetails(item.id)}
                                                                                    style={{
                                                                                        marginTop: '0.35rem',
                                                                                        background: 'transparent',
                                                                                        border: 'none',
                                                                                        color: 'var(--color-primary, #e63946)',
                                                                                        fontSize: '0.8rem',
                                                                                        cursor: 'pointer',
                                                                                        padding: 0,
                                                                                        display: 'inline-flex',
                                                                                        alignItems: 'center',
                                                                                        gap: '0.3rem',
                                                                                        fontWeight: 600,
                                                                                    }}
                                                                                >
                                                                                    <FiBookOpen size={13} />
                                                                                    {recipeOpen ? 'Ocultar receta' : 'Ver ingredientes y preparación'}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <span className="nutrition-item-macros">
                                                                            {formatMacros(itemMacros(item))}
                                                                        </span>
                                                                    </div>

                                                                    {isRecipe && recipeOpen && (
                                                                        <div style={{
                                                                            margin: '0.25rem 0 0.75rem 0.75rem',
                                                                            padding: '0.85rem 1rem',
                                                                            borderRadius: '8px',
                                                                            background: 'rgba(255,255,255,0.03)',
                                                                            borderLeft: '3px solid var(--color-primary, #e63946)',
                                                                            fontSize: '0.85rem',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '0.6rem',
                                                                        }}>
                                                                            {item.recipe.preparation_time && (
                                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary, #9aa0a6)' }}>
                                                                                    <FiClock size={13} /> Tiempo de preparación: {item.recipe.preparation_time} min
                                                                                </span>
                                                                            )}
                                                                            {recipeIngredients.length > 0 && (
                                                                                <div>
                                                                                    <strong style={{ display: 'block', marginBottom: '0.3rem' }}>Ingredientes:</strong>
                                                                                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                                                                        {recipeIngredients.map((ing, idx) => (
                                                                                            <li key={ing.id || idx}>
                                                                                                {ing.food?.name}: <strong>{Math.round((ing.quantity_g || 0) * factor)} g</strong>
                                                                                                {ing.notes ? ` (${ing.notes})` : ''}
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}
                                                                            {item.recipe.instructions && (
                                                                                <div>
                                                                                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Elaboración:</strong>
                                                                                    <p style={{ margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5, color: 'var(--color-text-secondary, #cbd5e1)' }}>
                                                                                        {item.recipe.instructions}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="diet-page">
            <div className="page-container">
                <h1 className="page-title">Nutrición</h1>
                <p className="page-description">Tus planes de alimentación asignados por tu coach.</p>

                <div className="routines-grid">
                    {plans.map(plan => (
                        <div
                            key={plan.id}
                            className="routine-card clickable"
                            onClick={() => handleSelectPlan(plan)}
                        >
                            <h3 className="routine-card-title">{plan.title}</h3>
                            {plan.description && (
                                <p className="routine-card-comment">{plan.description}</p>
                            )}
                            <div className="routine-card-footer">
                                <span className="routine-card-stat">
                                    {plan.days.length} {plan.days.length === 1 ? 'día' : 'días'}
                                </span>
                                <FiChevronRight size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Nutrition;
