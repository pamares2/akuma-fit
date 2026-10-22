import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiX, FiClock, FiUsers, FiTrash2, FiBookOpen, FiRefreshCw } from 'react-icons/fi';
import Button from '../../components/primitives/Button/Button.jsx';
import { recipeService } from '../../services/recipeService.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { recipeServingMacros, recipeTotalMacros, foodMacros, formatMacros } from '../../utils/dietMacros.js';

const RECIPE_CATEGORY_FILTERS = [
    'Todas',
    'Desayuno',
    'Comida',
    'Cena',
    'Snack / Post-entreno',
    'Alta en Proteína',
    'Volumen',
    'Definición',
    'Rápida',
];

/**
 * Listado de recetas del coach con búsqueda, filtrado por categoría,
 * visualización de ingredientes/pasos, creación, edición y borrado.
 */
function Recipes() {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [seeding, setSeeding] = useState(false);
    const debouncedSearchText = useDebouncedValue(searchText);
    const [reloadKey, setReloadKey] = useState(0);

    const loadRecipes = async () => recipeService.getAll({
        text: debouncedSearchText || undefined,
        tagName: selectedCategory !== 'Todas' ? selectedCategory : undefined,
    });

    const { data: recipes, loading, error } = useAsyncData(
        loadRecipes,
        [debouncedSearchText, selectedCategory, reloadKey]
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

    const handleRestoreCatalog = async () => {
        setSeeding(true);
        try {
            await recipeService.seedCatalogRecipes();
            setReloadKey(key => key + 1);
        } catch (err) {
            window.alert(`Error al importar catálogo: ${err.message}`);
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="diet-page">
            <div className="page-container">
                <div className="page-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Recetas Fitness</h1>
                        <p className="page-description" style={{ margin: 0 }}>
                            Biblioteca de recetas con macros calculados al milímetro listas para tus planes nutricionales.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Button
                            variant="outline"
                            onClick={handleRestoreCatalog}
                            disabled={seeding}
                        >
                            <FiRefreshCw size={16} />
                            <span>{seeding ? 'Sincronizando...' : 'Sincronizar catálogo'}</span>
                        </Button>
                        <Button onClick={() => navigate('/app/recetas/new')}>
                            <FiPlus size={18} />
                            <span>Nueva receta</span>
                        </Button>
                    </div>
                </div>

                <div className="filters-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.85rem' }}>
                    <div className="search-box">
                        <FiSearch className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar receta por nombre o ingrediente..."
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

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {RECIPE_CATEGORY_FILTERS.map(cat => {
                            const active = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '0.4rem 0.85rem',
                                        borderRadius: '999px',
                                        border: `1px solid ${active ? 'var(--color-primary, #e63946)' : 'var(--color-border, #2d323e)'}`,
                                        background: active ? 'var(--color-primary, #e63946)' : 'var(--color-surface, #181b20)',
                                        color: '#ffffff',
                                        fontSize: '0.82rem',
                                        fontWeight: active ? 600 : 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Cargando recetas...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : !recipes || recipes.length === 0 ? (
                    <div className="empty-state">
                        <p>{searchText || selectedCategory !== 'Todas'
                            ? 'No se encontraron recetas con esos filtros.'
                            : 'Aún no hay recetas. Haz clic en "Sincronizar catálogo" o crea la primera.'}</p>
                    </div>
                ) : (
                    <div className="recipes-grid">
                        {recipes.map(recipe => (
                            <div key={recipe.id} className="recipe-card">
                                <div className="recipe-card-header">
                                    <h3 className="recipe-card-title">{recipe.name}</h3>
                                    {recipe.id > 0 && (
                                        <button
                                            className="btn-icon btn-icon-danger"
                                            onClick={() => handleDelete(recipe)}
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
                                        <FiBookOpen size={14} />
                                        {(recipe.ingredients || []).length} ingr.
                                    </span>
                                </div>

                                <span className="recipe-card-macros">
                                    Por ración: {formatMacros(recipeServingMacros(recipe))}
                                </span>

                                {recipe.tags && recipe.tags.length > 0 && (
                                    <div className="exercise-card-tags">
                                        {recipe.tags.map(tag => (
                                            <span key={tag.id || tag.name} className="tag-badge">{tag.name}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="exercise-card-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedRecipe(recipe)}
                                    >
                                        Ver receta
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/app/recetas/${recipe.id}/edit`)}
                                    >
                                        Editar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedRecipe && (
                    <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
                        <div
                            className="modal-content"
                            style={{ maxWidth: '640px', width: '100%' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <div>
                                    <h2 className="modal-title" style={{ marginBottom: '0.25rem' }}>{selectedRecipe.name}</h2>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #9aa0a6)' }}>
                                        {selectedRecipe.preparation_time ? `${selectedRecipe.preparation_time} min · ` : ''}
                                        {selectedRecipe.servings} {selectedRecipe.servings === 1 ? 'ración' : 'raciones'}
                                    </span>
                                </div>
                                <button className="btn-icon" onClick={() => setSelectedRecipe(null)}>
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {selectedRecipe.description && (
                                    <p style={{ margin: 0, color: 'var(--color-text-secondary, #cbd5e1)', lineHeight: 1.5 }}>
                                        {selectedRecipe.description}
                                    </p>
                                )}

                                <div style={{
                                    padding: '0.85rem 1rem',
                                    borderRadius: '10px',
                                    background: 'rgba(230, 57, 70, 0.1)',
                                    border: '1px solid rgba(230, 57, 70, 0.25)',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                }}>
                                    <div>Por ración: {formatMacros(recipeServingMacros(selectedRecipe))}</div>
                                    {selectedRecipe.servings > 1 && (
                                        <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.25rem' }}>
                                            Total receta: {formatMacros(recipeTotalMacros(selectedRecipe))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '0.65rem' }}>
                                        Ingredientes ({(selectedRecipe.ingredients || []).length})
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                        {(selectedRecipe.ingredients || []).map((ing, idx) => {
                                            const macros = foodMacros(ing.food, ing.quantity_g);
                                            return (
                                                <div
                                                    key={ing.id || idx}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '0.55rem 0.8rem',
                                                        borderRadius: '8px',
                                                        background: 'rgba(255,255,255,0.03)',
                                                        border: '1px solid var(--color-border, #282c34)',
                                                        gap: '0.75rem',
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    <div>
                                                        <strong>{ing.food?.name}</strong>
                                                        <span style={{ color: 'var(--color-text-secondary, #9aa0a6)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                                                            {ing.quantity_g} g {ing.notes ? `(${ing.notes})` : ''}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #9aa0a6)' }}>
                                                        {formatMacros(macros)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {selectedRecipe.instructions && (
                                    <div>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Preparación paso a paso</h3>
                                        <div style={{
                                            whiteSpace: 'pre-line',
                                            lineHeight: 1.6,
                                            padding: '0.85rem 1rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid var(--color-border, #282c34)',
                                            fontSize: '0.9rem',
                                        }}>
                                            {selectedRecipe.instructions}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <Button variant="outline" onClick={() => setSelectedRecipe(null)}>
                                        Cerrar
                                    </Button>
                                    <Button onClick={() => {
                                        const id = selectedRecipe.id;
                                        setSelectedRecipe(null);
                                        navigate(`/app/recetas/${id}/edit`);
                                    }}>
                                        Editar receta
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Recipes;
