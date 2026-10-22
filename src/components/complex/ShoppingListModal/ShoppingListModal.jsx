import { useState } from 'react';
import { FiShoppingCart, FiX, FiCheck, FiCopy, FiPrinter } from 'react-icons/fi';
import { generateShoppingList, formatShoppingListText } from '../../../utils/shoppingList.js';

export default function ShoppingListModal({ mealPlan, isOpen, onClose }) {
    const [checkedItems, setCheckedItems] = useState({});
    const [copied, setCopied] = useState(false);

    if (!isOpen || !mealPlan) return null;

    const categories = generateShoppingList(mealPlan);

    const toggleItem = (key) => {
        setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleCopy = async () => {
        try {
            const text = formatShoppingListText(categories);
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // fallback
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
        }}>
            <div style={{
                background: 'var(--color-bg-secondary, #181b20)',
                border: '1px solid var(--color-border, #282c34)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                overflow: 'hidden',
            }}>
                {/* Cabecera */}
                <div style={{
                    padding: '1.2rem 1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'rgba(230, 57, 70, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary, #e63946)',
                            fontSize: '1.2rem',
                        }}>
                            <FiShoppingCart />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                                Lista de la Compra Semanal
                            </h2>
                            <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#9aa0a6' }}>
                                Ingredientes agrupados para tu Dieta ANEF
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9aa0a6',
                            cursor: 'pointer',
                            padding: '0.4rem',
                        }}
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Contenido con Scroll */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    overflowY: 'auto',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.2rem',
                }}>
                    {categories.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9aa0a6' }}>
                            No hay alimentos asignados en este plan nutricional.
                        </div>
                    ) : (
                        categories.map((cat) => (
                            <div key={cat.category} style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '0.85rem 1rem',
                            }}>
                                <h3 style={{
                                    margin: '0 0 0.65rem 0',
                                    fontSize: '0.86rem',
                                    fontWeight: 700,
                                    color: 'var(--color-primary, #e63946)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    {cat.category}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.4rem' }}>
                                    {cat.items.map((item) => {
                                        const key = `${cat.category}-${item.name}`;
                                        const isChecked = checkedItems[key];
                                        return (
                                            <label
                                                key={key}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.55rem',
                                                    padding: '0.45rem 0.6rem',
                                                    borderRadius: '8px',
                                                    background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.2)',
                                                    cursor: 'pointer',
                                                    textDecoration: isChecked ? 'line-through' : 'none',
                                                    opacity: isChecked ? 0.6 : 1,
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={!!isChecked}
                                                    onChange={() => toggleItem(key)}
                                                    style={{ accentColor: '#10b981', cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '0.84rem', color: isChecked ? '#9aa0a6' : '#fff', flex: 1 }}>
                                                    {item.name}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    color: isChecked ? '#9aa0a6' : '#10b981',
                                                    fontFamily: 'monospace',
                                                }}>
                                                    {item.displayQuantity}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pie de acciones */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                }}>
                    <span style={{ fontSize: '0.76rem', color: '#9aa0a6' }}>
                        Toca cada ingrediente para tacharlo en el súper
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                        >
                            {copied ? <FiCheck color="#10b981" /> : <FiCopy />}
                            <span>{copied ? '¡Copiado!' : 'Copiar (WhatsApp)'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                        >
                            <FiPrinter />
                            <span>Imprimir</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
