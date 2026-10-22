import { FiX, FiClock, FiUsers, FiEdit2, FiBookOpen, FiList } from 'react-icons/fi';
import {
    foodMacros,
    recipeTotalMacros,
    recipeServingMacros,
    formatMacros,
    deduplicateIngredients,
} from '../../../utils/dietMacros.js';

/**
 * Modal de detalle completo de una receta de dieta: muestra resumen de macros,
 * desglose de ingredientes con gramos/calorías y pasos de elaboración.
 *
 * @param {Object} props - Props del componente.
 * @param {Object} props.recipe - Receta a mostrar.
 * @param {() => void} props.onClose - Callback al cerrar el modal.
 * @param {(recipe: Object) => void} [props.onEdit] - Callback opcional para editar la receta.
 */
function RecipeDetailModal({ recipe, onClose, onEdit }) {
    if (!recipe) return null;

    const ingredients = deduplicateIngredients(recipe.ingredients
        || (recipe.recipe_food || []).filter(rel => rel.food).map(rel => ({
            id: rel.id,
            food: rel.food,
            quantity_g: rel.quantity_g,
            notes: rel.notes,
        })));

    const normalizedRecipe = { ...recipe, ingredients };
    const totalMacros = recipeTotalMacros(normalizedRecipe);
    const servingMacros = recipeServingMacros(normalizedRecipe);
    const servings = recipe.servings && recipe.servings > 0 ? recipe.servings : 1;

    const instructionSteps = (recipe.instructions || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content diet-modal-wide recipe-detail-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="modal-header">
                    <div>
                        <div className="recipe-detail-badges">
                            {recipe.category && (
                                <span className="category-badge">{recipe.category}</span>
                            )}
                            {(recipe.tags || []).map(tag => (
                                <span key={tag.id || tag.name} className="tag-badge">
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                        <h2 className="modal-title" style={{ marginTop: '0.35rem' }}>
                            {recipe.name}
                        </h2>
                    </div>
                    <button className="btn-icon" onClick={onClose} title="Cerrar">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="modal-body recipe-detail-body">
                    {recipe.description && (
                        <p className="recipe-detail-description">{recipe.description}</p>
                    )}

                    <div className="recipe-detail-stats-bar">
                        {recipe.preparation_time && (
                            <div className="recipe-detail-stat-pill">
                                <FiClock size={16} />
                                <span><strong>{recipe.preparation_time} min</strong> preparación</span>
                            </div>
                        )}
                        <div className="recipe-detail-stat-pill">
                            <FiUsers size={16} />
                            <span>
                                <strong>{servings}</strong> {servings === 1 ? 'ración' : 'raciones'}
                            </span>
                        </div>
                        <div className="recipe-detail-stat-pill recipe-detail-stat-macros">
                            <span>Por ración: <strong>{formatMacros(servingMacros)}</strong></span>
                        </div>
                        {servings > 1 && (
                            <div className="recipe-detail-stat-pill">
                                <span>Total receta: {formatMacros(totalMacros)}</span>
                            </div>
                        )}
                    </div>

                    <div className="recipe-detail-macros-cards">
                        <div className="recipe-macro-box">
                            <span className="recipe-macro-value">{Math.round(servingMacros.calories || 0)}</span>
                            <span className="recipe-macro-label">Kcal</span>
                        </div>
                        <div className="recipe-macro-box">
                            <span className="recipe-macro-value">{Math.round((servingMacros.protein || 0) * 10) / 10}g</span>
                            <span className="recipe-macro-label">Proteínas</span>
                        </div>
                        <div className="recipe-macro-box">
                            <span className="recipe-macro-value">{Math.round((servingMacros.carbs || 0) * 10) / 10}g</span>
                            <span className="recipe-macro-label">Carbohidratos</span>
                        </div>
                        <div className="recipe-macro-box">
                            <span className="recipe-macro-value">{Math.round((servingMacros.fat || 0) * 10) / 10}g</span>
                            <span className="recipe-macro-label">Grasas</span>
                        </div>
                    </div>

                    <div className="recipe-detail-section">
                        <h3 className="recipe-detail-section-title">
                            <FiList size={16} />
                            <span>Ingredientes ({ingredients.length})</span>
                        </h3>

                        {ingredients.length === 0 ? (
                            <p className="section-help">Sin ingredientes detallados.</p>
                        ) : (
                            <div className="recipe-detail-ingredients-list">
                                {ingredients.map((ing, idx) => {
                                    const macros = foodMacros(ing.food, ing.quantity_g);
                                    return (
                                        <div key={ing.id || idx} className="recipe-detail-ingredient-row">
                                            <div className="recipe-detail-ingredient-main">
                                                <span className="recipe-detail-ingredient-name">
                                                    {ing.food?.name || 'Alimento'}
                                                </span>
                                                {ing.notes && (
                                                    <span className="recipe-detail-ingredient-notes">
                                                        ({ing.notes})
                                                    </span>
                                                )}
                                            </div>
                                            <div className="recipe-detail-ingredient-right">
                                                <span className="recipe-detail-ingredient-qty">
                                                    {ing.quantity_g} g
                                                </span>
                                                <span className="recipe-detail-ingredient-macros">
                                                    {formatMacros(macros)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="recipe-detail-section">
                        <h3 className="recipe-detail-section-title">
                            <FiBookOpen size={16} />
                            <span>Modo de preparación</span>
                        </h3>

                        {instructionSteps.length === 0 ? (
                            <p className="section-help">
                                Cocinar los ingredientes según las cantidades indicadas respetando los pesos en crudo/cocido.
                            </p>
                        ) : (
                            <ol className="recipe-detail-steps">
                                {instructionSteps.map((step, index) => {
                                    const cleanStep = step.replace(/^\d+[.)-]\s*/, '');
                                    return (
                                        <li key={index} className="recipe-detail-step-item">
                                            {cleanStep}
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </div>
                </div>

                <div className="diet-modal-footer">
                    {onEdit && (
                        <button
                            type="button"
                            className="btn-outline"
                            onClick={() => onEdit(recipe)}
                        >
                            <FiEdit2 size={16} />
                            <span>Editar receta</span>
                        </button>
                    )}
                    <button type="button" className="btn-primary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RecipeDetailModal;
