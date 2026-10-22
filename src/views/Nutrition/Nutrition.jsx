import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronDown, FiBookOpen, FiShoppingCart, FiPrinter } from 'react-icons/fi';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { mealPlanService } from '../../services/mealPlanService.js';
import { useAuth } from '../../context/useAuth.js';
import RecipeDetailModal from '../../components/complex/RecipeDetailModal/RecipeDetailModal.jsx';
import ShoppingListModal from '../../components/complex/ShoppingListModal/ShoppingListModal.jsx';
import {
    itemMacros,
    slotMacros,
    dayMacros,
    formatMacros,
    deduplicateIngredients,
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
    const [viewingRecipe, setViewingRecipe] = useState(null);
    const [showShoppingList, setShowShoppingList] = useState(false);

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                        <button
                            className="btn-outline"
                            onClick={() => setSelectedPlan(null)}
                        >
                            <FiChevronLeft size={18} />
                            <span>Volver a planes</span>
                        </button>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                className="btn-outline"
                                onClick={() => setShowShoppingList(true)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                            >
                                <FiShoppingCart />
                                <span>🛒 Lista de la Compra</span>
                            </button>
                            <button
                                type="button"
                                className="btn-outline"
                                onClick={() => window.print()}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                            >
                                <FiPrinter />
                                <span>📄 Imprimir / Guardar PDF</span>
                            </button>
                        </div>
                    </div>

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

                                                        {slot.items.map(item => (
                                                            <div key={item.id} className="nutrition-item">
                                                                <div className="nutrition-item-info">
                                                                    <span className="nutrition-item-name">{itemName(item)}</span>
                                                                    <span className="nutrition-item-quantity">
                                                                        {itemQuantityLabel(item)}
                                                                        {item.notes ? ` · ${item.notes}` : ''}
                                                                    </span>
                                                                    {item.recipe && deduplicateIngredients(item.recipe.ingredients || []).length > 0 && (
                                                                        <span className="diet-item-recipe-ingredients">
                                                                            {deduplicateIngredients(item.recipe.ingredients || [])
                                                                                .map(ing => `${ing.food?.name} (${Math.round((ing.quantity_g || 0) * (item.servings || 1))}g)`)
                                                                                .join(' · ')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                    {item.recipe && (
                                                                        <button
                                                                            type="button"
                                                                            className="btn-outline btn-sm"
                                                                            onClick={() => setViewingRecipe(item.recipe)}
                                                                        >
                                                                            <FiBookOpen size={14} />
                                                                            <span>Ver receta</span>
                                                                        </button>
                                                                    )}
                                                                    <span className="nutrition-item-macros">
                                                                        {formatMacros(itemMacros(item))}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
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

                {viewingRecipe && (
                    <RecipeDetailModal
                        recipe={viewingRecipe}
                        onClose={() => setViewingRecipe(null)}
                    />
                )}

                <ShoppingListModal
                    mealPlan={selectedPlan}
                    isOpen={showShoppingList}
                    onClose={() => setShowShoppingList(false)}
                />
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
