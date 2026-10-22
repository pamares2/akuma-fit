import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiPlus,
    FiSearch,
    FiX,
    FiClock,
    FiUsers,
    FiTrash2,
    FiBookOpen,
    FiEdit2,
    FiRefreshCw,
} from 'react-icons/fi';
import Button from '../../components/primitives/Button/Button.jsx';
import RecipeDetailModal from '../../components/complex/RecipeDetailModal/RecipeDetailModal.jsx';
import { recipeService } from '../../services/recipeService.js';
import { RECIPE_CATEGORIES } from '../../data/defaultRecipes.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { recipeServingMacros, formatMacros } from '../../utils/dietMacros.js';

/**
 * Listado de recetas de dieta del coach con filtros por comida/categoría,
 * búsqueda por nombre o ingrediente, vista previa de ingredientes, modal de
 * receta completa (pasos e ingredientes) y sincronización con Supabase.
 */
function Recipes() {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const debouncedSearchText = useDebouncedValue(searchText);
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState(null);

    const loadRecipes = async () => recipeService.getAll({
        text: debouncedSearchText || undefined,
        category: selectedCategory !== 'Todas' ? selectedCategory : undefined,
    });

    const { data: recipes, loading, error } = useAsyncData(
        loadRecipes,
        [debouncedSearchText, selectedCategory, reloadKey],
        []
    );

    const handleDelete = async (recipe) => {
        if (!window.confirm(`¿Eliminar la receta "${recipe.name}"?`)) return;

        try {
            await recipeService.delete(recipe.id);
            setReloadKey(key => key + 1);
        } catch (err) {
            window.alert(`No se pudo eliminar: ${err.message}`);
        }
    };

    const handleSyncCatalog = async () => {
        setSyncing(true);
        setSyncMessage(null);
        try {
            const count = await recipeService.seedCatalogToDatabase();
            setSyncMessage(
                count > 0
                    ? `✓ Se han guardado ${count} recetas del catálogo en la base de datos.`
                    : '✓ Todas las recetas del catálogo ya están sincronizadas.'
            );
            setReloadKey(key => key + 1);
        } catch (err) {
            setSyncMessage(`Aviso al sincronizar: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    const clearFilters = () => {
        setSearchText('');
        setSelectedCategory('Todas');
    };

    const hasActiveFilters = Boolean(searchText) || selectedCategory !== 'Todas';

    return (
        <div className="diet-page">
            <div className="page-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Recetas de Dieta</h1>
                        <p className="page-description" style={{ marginBottom: 0 }}>
                            Catálogo de recetas nutricionales con ingredientes en gramos, macros calculados y pasos de preparación para tus planes de dieta.
                        </p>
                    </div>
                    <div className="diet-header-actions">
                        <Button
                            variant="outline"
                            onClick={handleSyncCatalog}
                            disabled={syncing}
                        >
                            <FiRefreshCw size={16} />
                            <span>{syncing ? 'Sincronizando...' : 'Guardar catálogo en BD'}</span>
                        </Button>
                        <Button onClick={() => navigate('/app/recetas/new')}>
                            <FiPlus size={18} />
                            <span>Nueva receta</span>
                        </Button>
                    </div>
                </div>

                {syncMessage && (
                    <div className="success-message" style={{ marginBottom: '1rem' }}>
                        {syncMessage}
                    </div>
                )}

                <div className="filters-row">
                    <div className="search-box">
                        <FiSearch className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre de receta o ingrediente (ej: pollo, avena, salmón)..."
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                            className="search-input"
                        />
                        {searchText && (
                            <button onClick={() => setSearchText('')} className="clear-search">
                                <FiX size={16} />
                            </button>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                            Limpiar filtros
                        </Button>
                    )}
                </div>

                <div className="tags-filter" style={{ marginBottom: '1.5rem' }}>
                    <span className="tags-filter-label">Momento del día:</span>
                    <div className="tags-list">
                        {(RECIPE_CATEGORIES || ['Todas', 'Desayuno', 'Media Mañana', 'Comida', 'Merienda', 'Cena', 'Post-Entreno']).map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`tag-chip ${selectedCategory === cat ? 'active' : ''}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Cargando recetas...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : !recipes || recipes.length === 0 ? (
                    <div className="empty-state">
                        <p>
                            {hasActiveFilters
                                ? 'No se encontraron recetas con esos filtros.'
                                : 'Aún no hay recetas. Crea la primera.'}
                        </p>
                    </div>
                ) : (
                    <div className="recipes-grid">
                        {recipes.map(recipe => {
                            const macros = recipeServingMacros(recipe);
                            const ingredients = recipe.ingredients || [];

                            return (
                                <div
                                    key={recipe.id}
                                    className="recipe-card clickable"
                                    onClick={() => setSelectedRecipe(recipe)}
                                >
                                    <div className="recipe-card-header">
                                        <div>
                                            {recipe.category && (
                                                <span className="category-badge" style={{ marginBottom: '0.35rem', display: 'inline-block' }}>
                                                    {recipe.category}
                                                </span>
                                            )}
                                            <h3 className="recipe-card-title">{recipe.name}</h3>
                                        </div>
                                        {!recipe.isDefault && (
                                            <button
                                                className="btn-icon btn-icon-danger"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleDelete(recipe);
                                                }}
                                                title="Eliminar receta"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {recipe.description && (
                                        <p className="recipe-card-description">{recipe.description}</p>
                                    )}

                                    <div className="recipe-card-meta">
                                        {recipe.preparation_time && (
                                            <span className="recipe-card-stat">
                                                <FiClock size={14} />
                                                {recipe.preparation_time} min
                                            </span>
                                        )}
                                        <span className="recipe-card-stat">
                                            <FiUsers size={14} />
                                            {recipe.servings} {recipe.servings === 1 ? 'ración' : 'raciones'}
                                        </span>
                                        <span className="recipe-card-stat">
                                            {ingredients.length} {ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}
                                        </span>
                                    </div>

                                    <span className="recipe-card-macros">
                                        {formatMacros(macros)}
                                    </span>

                                    {ingredients.length > 0 && (
                                        <div className="recipe-card-ingredients-preview">
                                            {ingredients.slice(0, 4).map((ing, idx) => (
                                                <span key={ing.id || idx} className="recipe-ingredient-chip">
                                                    {ing.food?.name} ({ing.quantity_g}g)
                                                </span>
                                            ))}
                                            {ingredients.length > 4 && (
                                                <span className="recipe-ingredient-chip">
                                                    +{ingredients.length - 4} más
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {(recipe.tags || []).length > 0 && (
                                        <div className="exercise-card-tags">
                                            {recipe.tags
                                                .filter(tag => tag.name !== recipe.category)
                                                .map(tag => (
                                                    <span key={tag.id || tag.name} className="tag-badge">
                                                        {tag.name}
                                                    </span>
                                                ))}
                                        </div>
                                    )}

                                    <div
                                        className="exercise-card-actions"
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setSelectedRecipe(recipe)}
                                        >
                                            <FiBookOpen size={14} />
                                            <span>Ver receta</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/app/recetas/${recipe.id}/edit`)}
                                        >
                                            <FiEdit2 size={14} />
                                            <span>Editar</span>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedRecipe && (
                <RecipeDetailModal
                    recipe={selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                    onEdit={(recipe) => {
                        setSelectedRecipe(null);
                        navigate(`/app/recetas/${recipe.id}/edit`);
                    }}
                />
            )}
        </div>
    );
}

export default Recipes;
