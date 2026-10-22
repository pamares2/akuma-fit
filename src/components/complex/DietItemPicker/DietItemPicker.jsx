import { useState } from 'react';
import { FiSearch, FiX, FiClock, FiBookOpen } from 'react-icons/fi';
import { foodService } from '../../../services/foodService.js';
import { recipeService } from '../../../services/recipeService.js';
import { RECIPE_CATEGORIES } from '../../../data/defaultRecipes.js';
import { useAsyncData } from '../../../hooks/useAsyncData.js';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.js';
import { recipeServingMacros, formatMacros } from '../../../utils/dietMacros.js';
import RecipeDetailModal from '../RecipeDetailModal/RecipeDetailModal.jsx';

/**
 * Modal para elegir una receta o un alimento y añadirlo a una comida del plan
 * de dieta, con pestañas, filtros por momento del día, búsqueda y vista previa
 * de la receta completa.
 *
 * @param {Object} props - Props del componente.
 * @param {() => void} props.onClose - Callback de cierre.
 * @param {(food: Object) => void} props.onPickFood - Callback al elegir un alimento.
 * @param {(recipe: Object) => void} props.onPickRecipe - Callback al elegir una receta.
 */
function DietItemPicker({ onClose, onPickFood, onPickRecipe }) {
    const [tab, setTab] = useState('recipes');
    const [searchText, setSearchText] = useState('');
    const [recipeCategory, setRecipeCategory] = useState('Todas');
    const [previewRecipe, setPreviewRecipe] = useState(null);
    const debouncedSearchText = useDebouncedValue(searchText);

    const loadFoods = async () => foodService.getAll({
        text: debouncedSearchText || undefined,
    });

    const loadRecipes = async () => recipeService.getAll({
        text: debouncedSearchText || undefined,
        category: recipeCategory !== 'Todas' ? recipeCategory : undefined,
    });

    const { data: foods, loading: foodsLoading, error: foodsError } = useAsyncData(
        tab === 'foods' ? loadFoods : null,
        [debouncedSearchText, tab],
        []
    );

    const { data: recipes, loading: recipesLoading, error: recipesError } = useAsyncData(
        tab === 'recipes' ? loadRecipes : null,
        [debouncedSearchText, recipeCategory, tab],
        []
    );

    const loading = tab === 'foods' ? foodsLoading : recipesLoading;
    const error = tab === 'foods' ? foodsError : recipesError;
    const items = tab === 'foods' ? foods : recipes;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content diet-modal-wide" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Añadir a la comida</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                <div className="reports-tabs">
                    <button
                        type="button"
                        className={`tab-button ${tab === 'recipes' ? 'active' : ''}`}
                        onClick={() => setTab('recipes')}
                    >
                        Recetas de Dieta
                    </button>
                    <button
                        type="button"
                        className={`tab-button ${tab === 'foods' ? 'active' : ''}`}
                        onClick={() => setTab('foods')}
                    >
                        Alimentos Individuales
                    </button>
                </div>

                <div className="modal-filters">
                    <div className="search-box">
                        <FiSearch className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder={tab === 'recipes' ? 'Buscar receta o ingrediente...' : 'Buscar alimento...'}
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                            className="search-input"
                        />
                        {searchText && (
                            <button type="button" onClick={() => setSearchText('')} className="clear-search">
                                <FiX size={16} />
                            </button>
                        )}
                    </div>

                    {tab === 'recipes' && (
                        <div className="tags-list" style={{ marginTop: '0.6rem' }}>
                            {(RECIPE_CATEGORIES || ['Todas', 'Desayuno', 'Media Mañana', 'Comida', 'Merienda', 'Cena', 'Post-Entreno']).map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setRecipeCategory(cat)}
                                    className={`tag-chip ${recipeCategory === cat ? 'active' : ''}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">Cargando...</div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : items.length === 0 ? (
                        <div className="empty-state">
                            <p>No se encontraron resultados.</p>
                        </div>
                    ) : (
                        <div className="food-picker-list">
                            {tab === 'foods'
                                ? items.map(food => (
                                    <button
                                        key={food.id}
                                        type="button"
                                        className="food-picker-item"
                                        onClick={() => onPickFood(food)}
                                    >
                                        <div className="food-picker-info">
                                            <span className="food-picker-name">{food.name}</span>
                                            {food.brand && (
                                                <span className="food-picker-brand">{food.brand}</span>
                                            )}
                                        </div>
                                        <span className="food-picker-macros">
                                            {food.calories ?? 0} kcal/100g · P {food.protein ?? 0}g · C {food.carbs ?? 0}g · F {food.fat ?? 0}g
                                        </span>
                                    </button>
                                ))
                                : items.map(recipe => {
                                    const ingredientsList = (recipe.ingredients || [])
                                        .map(ing => `${ing.food?.name} (${ing.quantity_g}g)`)
                                        .join(', ');

                                    return (
                                        <div key={recipe.id} className="food-picker-item recipe-picker-item">
                                            <div
                                                className="food-picker-info"
                                                style={{ flex: 1, cursor: 'pointer' }}
                                                onClick={() => onPickRecipe(recipe)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {recipe.category && (
                                                        <span className="category-badge">{recipe.category}</span>
                                                    )}
                                                    <span className="food-picker-name">{recipe.name}</span>
                                                    {recipe.preparation_time && (
                                                        <span className="food-picker-brand" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                                            <FiClock size={12} /> {recipe.preparation_time} min
                                                        </span>
                                                    )}
                                                </div>
                                                {ingredientsList && (
                                                    <span className="food-picker-brand" style={{ marginTop: '0.2rem' }}>
                                                        Ingredientes: {ingredientsList}
                                                    </span>
                                                )}
                                                <span className="food-picker-macros" style={{ marginTop: '0.25rem', color: 'var(--color-primary)' }}>
                                                    {formatMacros(recipeServingMacros(recipe))} / ración
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <button
                                                    type="button"
                                                    className="btn-outline btn-sm"
                                                    onClick={() => setPreviewRecipe(recipe)}
                                                    title="Ver pasos e ingredientes"
                                                >
                                                    <FiBookOpen size={14} />
                                                    <span>Ver receta</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-primary btn-sm"
                                                    onClick={() => onPickRecipe(recipe)}
                                                >
                                                    Añadir
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>

            {previewRecipe && (
                <RecipeDetailModal
                    recipe={previewRecipe}
                    onClose={() => setPreviewRecipe(null)}
                />
            )}
        </div>
    );
}

export default DietItemPicker;
