import { useState, useEffect, useMemo } from 'react';
import {
    FiUser,
    FiActivity,
    FiZap,
    FiCheckCircle,
    FiAlertTriangle,
    FiRefreshCw,
    FiInfo,
    FiChevronDown,
    FiChevronUp,
} from 'react-icons/fi';
import { mealPlanService } from '../../../services/mealPlanService.js';
import { dietGeneratorService } from '../../../services/dietGeneratorService.js';
import {
    WORK_ACTIVITY_LEVELS,
    EXERCISE_LEVELS,
    DEVIATION_CASES,
    DIET_GOALS,
    ANEF_MEAL_TYPES,
    ANEF_PRACTICAL_GUIDELINES,
    calculateTargetCalories,
    getRecommendedMacrosPerKg,
    calculateStep3Macros,
    buildDefaultMeals,
    calculateStep4Distribution,
    mapClientToAnefData,
} from '../../../utils/anefCalorieCalculator.js';

/**
 * Asistente completo de 5 pasos basado en el sistema ANEF Dietas para calcular
 * y generar la dieta personalizada de un cliente a partir de sus datos reales
 * (perfil, valoración inicial y mediciones corporales).
 *
 * @param {Object} props
 * @param {Object} [props.plan] - Plan existente (si se usa dentro del editor).
 * @param {number|string} [props.initialClientId] - Id de cliente preseleccionado.
 * @param {(planId: number) => void} [props.onCompleted] - Callback al finalizar generación.
 * @param {() => void} [props.onCancel] - Callback opcional para cancelar.
 */
function AnefDietWizard({ plan = null, initialClientId = '', onCompleted, onCancel }) {
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState(
        initialClientId
            ? String(initialClientId)
            : plan?.clients?.[0]?.id
                ? String(plan.clients[0].id)
                : ''
    );
    const [loadingClient, setLoadingClient] = useState(false);
    const [clientRestrictions, setClientRestrictions] = useState('');
    const [clientLoadedBadge, setClientLoadedBadge] = useState(false);

    // Paso 1: Datos del cliente y estilo de vida
    const [planTitle, setPlanTitle] = useState(plan?.title || '');
    const [clientName, setClientName] = useState('');
    const [sex, setSex] = useState('Hombre');
    const [age, setAge] = useState(28);
    const [weight, setWeight] = useState(75);
    const [height, setHeight] = useState(175);
    const [deviationId, setDeviationId] = useState('normal');
    const [workActivityId, setWorkActivityId] = useState('oficina');
    const [exerciseId, setExerciseId] = useState('intense_1h');
    const [goalId, setGoalId] = useState('definicion');
    const [manualAdjustment, setManualAdjustment] = useState(0);
    const [mealsCount, setMealsCount] = useState(4);
    const [postWorkoutIndex, setPostWorkoutIndex] = useState(2);

    // Paso 2: Comidas y reparto %
    const [meals, setMeals] = useState(() => buildDefaultMeals(4, 2));

    // Paso 3: Macros por g/kg y Auto-Ajuste
    const [proteinPerKg, setProteinPerKg] = useState(2.0);
    const [fatPerKg, setFatPerKg] = useState(0.9);
    const [carbsPerKg, setCarbsPerKg] = useState(2.5);
    const [fiberGrams, setFiberGrams] = useState(30);
    const [autoAdjust, setAutoAdjust] = useState('carbs');

    // Paso 5: Opciones de generación
    const [generationMode, setGenerationMode] = useState('recipes');
    const [includeEquivalences, setIncludeEquivalences] = useState(true);
    const [showGuidelines, setShowGuidelines] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Cargar lista de clientes al montar
    useEffect(() => {
        let active = true;
        mealPlanService.getClients()
            .then((data) => {
                if (active) setClients(data || []);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, []);

    const handleSelectClient = (newClientId) => {
        setSelectedClientId(newClientId);
        if (!newClientId) {
            setClientRestrictions('');
            setClientLoadedBadge(false);
        } else {
            setLoadingClient(true);
        }
    };

    // Cargar datos reales del cliente cuando cambia selectedClientId
    useEffect(() => {
        if (!selectedClientId) {
            return;
        }

        let active = true;

        mealPlanService.getClientNutritionalProfile(Number(selectedClientId))
            .then((profileBundle) => {
                if (!active || !profileBundle?.client) return;
                const mapped = mapClientToAnefData(profileBundle);

                setClientName(mapped.clientName);
                setSex(mapped.sex);
                setAge(mapped.age);
                setWeight(mapped.weight);
                setHeight(mapped.height);
                setWorkActivityId(mapped.workActivityId);
                setExerciseId(mapped.exerciseId);
                setGoalId(mapped.goalId);
                setDeviationId(mapped.deviationId);
                setClientRestrictions(mapped.restrictions || '');
                setClientLoadedBadge(true);

                if (!plan) {
                    const goalObj = DIET_GOALS.find(g => g.id === mapped.goalId);
                    const goalLabel = goalObj ? goalObj.label.split(' (')[0] : 'Personalizada';
                    setPlanTitle(`Dieta ANEF — ${mapped.clientName} (${goalLabel})`);
                }
            })
            .catch((err) => {
                console.warn('No se pudieron cargar todos los datos del cliente:', err.message);
            })
            .finally(() => {
                if (active) setLoadingClient(false);
            });

        return () => {
            active = false;
        };
    }, [selectedClientId, plan]);

    // Cálculos metabólicos Paso 1
    const metabolic = useMemo(() => calculateTargetCalories({
        sex,
        weight: Number(weight) || 70,
        height: Number(height) || 170,
        age: Number(age) || 28,
        workActivityId,
        exerciseId,
        deviationId,
        goalId,
        manualAdjustment: Number(manualAdjustment) || 0,
    }), [sex, weight, height, age, workActivityId, exerciseId, deviationId, goalId, manualAdjustment]);

    // Actualizar recomendación de g/kg cuando cambia objetivo o actividad
    const recommendedPerKg = useMemo(() => getRecommendedMacrosPerKg({
        activityFactor: metabolic.activityFactor,
        goalId,
        deviationId,
    }), [metabolic.activityFactor, goalId, deviationId]);

    const handleApplyRecommendedMacros = () => {
        setProteinPerKg(recommendedPerKg.proteinPerKg);
        setFatPerKg(recommendedPerKg.fatPerKg);
        setFiberGrams(recommendedPerKg.fiberGrams);
        setAutoAdjust('carbs');
    };

    // Cambiar número de comidas (3 a 8)
    const handleMealsCountChange = (newCount) => {
        const count = Math.max(3, Math.min(8, Number(newCount) || 4));
        const newPostIdx = postWorkoutIndex !== null && postWorkoutIndex < count ? postWorkoutIndex : count - 2;
        setMealsCount(count);
        setPostWorkoutIndex(newPostIdx);
        setMeals(buildDefaultMeals(count, newPostIdx));
    };

    const handlePostWorkoutChange = (mealIndex) => {
        const nextIdx = postWorkoutIndex === mealIndex ? null : mealIndex;
        setPostWorkoutIndex(nextIdx);
        setMeals(buildDefaultMeals(mealsCount, nextIdx));
    };

    const handleMealTypeChange = (index, newType) => {
        setMeals(prev => prev.map((m, i) => (i === index ? { ...m, type: newType } : m)));
    };

    const handleMealPctChange = (index, newPct) => {
        const val = Math.max(0, Math.min(100, Number(newPct) || 0));
        setMeals(prev => prev.map((m, i) => (i === index ? { ...m, pct: val } : m)));
    };

    const handleResetMealDistribution = () => {
        setMeals(buildDefaultMeals(mealsCount, postWorkoutIndex));
    };

    const totalPct = useMemo(
        () => Math.round(meals.reduce((acc, m) => acc + (Number(m.pct) || 0), 0) * 10) / 10,
        [meals]
    );
    const remainingPct = Math.round((100 - totalPct) * 10) / 10;

    // Paso 3: Cálculo de macronutrientes con Auto-Ajuste
    const step3Macros = useMemo(() => calculateStep3Macros({
        targetCalories: metabolic.targetCalories,
        weight: Number(weight) || 70,
        proteinPerKg: Number(proteinPerKg) || 2.0,
        fatPerKg: Number(fatPerKg) || 0.9,
        carbsPerKg: Number(carbsPerKg) || 2.5,
        fiberGrams: Number(fiberGrams) || 30,
        autoAdjust,
    }), [metabolic.targetCalories, weight, proteinPerKg, fatPerKg, carbsPerKg, fiberGrams, autoAdjust]);

    // Paso 4: Distribución de macros por comida
    const step4Meals = useMemo(() => calculateStep4Distribution({
        meals,
        targetCalories: metabolic.targetCalories,
        step3Macros,
    }), [meals, metabolic.targetCalories, step3Macros]);

    // Paso 5: Generar y guardar la dieta personalizada
    const handleGenerateDiet = async () => {
        if (!plan && !planTitle.trim()) {
            setError('Por favor, indica un título para el plan de dieta.');
            return;
        }
        if (Math.abs(remainingPct) > 1) {
            setError(`El reparto de calorías por comida del Paso 2 debe sumar 100% (actualmente suma ${totalPct}%).`);
            return;
        }
        if (step3Macros.isNegativeAdjustment) {
            setError('Los gramos de proteínas y grasas superan las calorías totales. Reduce los g/kg en el Paso 3.');
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const goalLabel = DIET_GOALS.find(g => g.id === goalId)?.label || goalId;
            const summaryDescription = [
                clientName ? `Cliente: ${clientName} (${sex}, ${age} años, ${weight} kg, ${height} cm)` : '',
                `Cálculo ANEF: TMB ${metabolic.bmr} kcal · Factor actividad ${metabolic.activityFactor} (${metabolic.activityScaleLabel}) · GET ${metabolic.tdee} kcal · Objetivo ${goalLabel} → ${metabolic.targetCalories} kcal/día`,
                `Macros: P ${step3Macros.proteinGrams}g (${step3Macros.proteinPerKg}g/kg) · HC ${step3Macros.carbsGrams}g (${step3Macros.carbsPerKg}g/kg) · G ${step3Macros.fatGrams}g (${step3Macros.fatPerKg}g/kg) · Fibra ${step3Macros.fiberGrams}g`,
                'Pautas: Pesos en crudo salvo indicación. Beber 1.5-2L de agua al día.',
            ].filter(Boolean).join(' | ');

            let targetPlanId = plan?.id;

            if (!targetPlanId) {
                const created = await mealPlanService.create({
                    title: planTitle.trim(),
                    description: summaryDescription,
                    target_calories: metabolic.targetCalories,
                    target_protein: step3Macros.proteinGrams,
                    target_carbs: step3Macros.carbsGrams,
                    target_fat: step3Macros.fatGrams,
                });
                targetPlanId = created.id;
            } else {
                await mealPlanService.update(targetPlanId, {
                    title: planTitle.trim() || plan.title,
                    description: summaryDescription,
                    target_calories: metabolic.targetCalories,
                    target_protein: step3Macros.proteinGrams,
                    target_carbs: step3Macros.carbsGrams,
                    target_fat: step3Macros.fatGrams,
                });
            }

            if (selectedClientId) {
                await mealPlanService.assign(Number(selectedClientId), targetPlanId);
            }

            await dietGeneratorService.generateAnefCompleteDiet(targetPlanId, {
                targetCalories: metabolic.targetCalories,
                step3Macros,
                step4Meals,
                mode: generationMode,
                includeEquivalences,
            });

            setSuccessMsg('✓ ¡Dieta personalizada ANEF calculada y generada con éxito!');
            if (onCompleted) {
                onCompleted(targetPlanId);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="anef-wizard-container">
            {/* CABECERA Y SELECTOR DE CLIENTE */}
            <div className="form-section-card anef-header-card">
                <div className="anef-header-top">
                    <div>
                        <span className="anime-badge">Sistema Profesional ANEF Dietas</span>
                        <h2 className="section-subtitle" style={{ marginTop: '0.4rem', marginBottom: '0.25rem' }}>
                            Calculadora y Generador de Dieta Personalizada por Cliente
                        </h2>
                        <p className="section-help" style={{ margin: 0 }}>
                            Selecciona un cliente para cargar automáticamente su edad, peso, altura, actividad y objetivo, o ajusta cualquier parámetro en los 5 pasos de ANEF.
                        </p>
                    </div>
                </div>

                <div className="diet-form-grid" style={{ marginTop: '1.25rem' }}>
                    <div className="form-field">
                        <label>
                            <FiUser size={14} style={{ marginRight: '0.35rem' }} />
                            Seleccionar Cliente de la App
                        </label>
                        <select
                            className="category-select"
                            value={selectedClientId}
                            onChange={(e) => handleSelectClient(e.target.value)}
                        >
                            <option value="">— Seleccionar cliente (o introducir datos manualmente) —</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.surname}
                                </option>
                            ))}
                        </select>
                        {loadingClient && (
                            <span className="section-help">Cargando valoración y último peso del cliente...</span>
                        )}
                        {clientLoadedBadge && !loadingClient && (
                            <span className="anef-loaded-pill">
                                <FiCheckCircle size={13} /> Datos del cliente sincronizados desde su perfil y mediciones
                            </span>
                        )}
                    </div>

                    <div className="form-field">
                        <label>Título del Plan de Alimentación *</label>
                        <input
                            type="text"
                            className="form-field-input"
                            value={planTitle}
                            onChange={(e) => setPlanTitle(e.target.value)}
                            placeholder="Ej: Dieta Personalizada Definición — Juan Pérez"
                        />
                    </div>
                </div>

                {clientRestrictions && (
                    <div className="alert-item alert-warning" style={{ marginTop: '1rem' }}>
                        <FiAlertTriangle className="alert-icon" size={18} />
                        <span>
                            <strong>Restricciones alimentarias del cliente:</strong> {clientRestrictions}
                        </span>
                    </div>
                )}
            </div>

            {/* PASO 1: INTRODUCCIÓN DE DATOS DE USUARIO */}
            <div className="form-section-card">
                <div className="anef-step-header">
                    <span className="anef-step-badge">Paso 1</span>
                    <h3 className="section-subtitle" style={{ margin: 0 }}>
                        Datos Antropométricos, Actividad Física y Objetivo
                    </h3>
                </div>

                <div className="anef-grid-4">
                    <div className="form-field">
                        <label>Sexo</label>
                        <select
                            className="category-select"
                            value={sex}
                            onChange={(e) => setSex(e.target.value)}
                        >
                            <option value="Hombre">Hombre</option>
                            <option value="Mujer">Mujer</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Edad (1 - 99 años)</label>
                        <input
                            type="number"
                            min="1"
                            max="99"
                            className="form-field-input"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label>Peso actual (kg)</label>
                        <input
                            type="number"
                            min="8"
                            max="170"
                            step="0.1"
                            className="form-field-input"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label>Altura (cm)</label>
                        <input
                            type="number"
                            min="60"
                            max="240"
                            className="form-field-input"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                        />
                    </div>
                </div>

                <div className="diet-form-grid" style={{ marginTop: '1rem' }}>
                    <div className="form-field">
                        <label>Actividad laboral</label>
                        <select
                            className="category-select"
                            value={workActivityId}
                            onChange={(e) => setWorkActivityId(e.target.value)}
                        >
                            {WORK_ACTIVITY_LEVELS.map(level => (
                                <option key={level.id} value={level.id}>
                                    {level.label} (x{level.factor}) — {level.detail}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Ejercicio físico (excluyendo trabajo)</label>
                        <select
                            className="category-select"
                            value={exerciseId}
                            onChange={(e) => setExerciseId(e.target.value)}
                        >
                            {EXERCISE_LEVELS.map(ex => (
                                <option key={ex.id} value={ex.id}>
                                    {ex.label} (+{(ex.factor - 1).toFixed(2)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Desviación corporal / Caso extremo</label>
                        <select
                            className="category-select"
                            value={deviationId}
                            onChange={(e) => setDeviationId(e.target.value)}
                        >
                            {DEVIATION_CASES.map(dev => (
                                <option key={dev.id} value={dev.id}>
                                    {dev.label} (x{dev.factor})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Objetivo nutricional</label>
                        <select
                            className="category-select"
                            value={goalId}
                            onChange={(e) => setGoalId(e.target.value)}
                        >
                            {DIET_GOALS.map(goal => (
                                <option key={goal.id} value={goal.id}>
                                    {goal.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Ajuste manual de calorías (kcal)</label>
                        <input
                            type="number"
                            step="25"
                            className="form-field-input"
                            value={manualAdjustment}
                            onChange={(e) => setManualAdjustment(e.target.value)}
                            placeholder="Ej: -100 o +150"
                        />
                    </div>

                    <div className="form-field">
                        <label>Número de comidas al día (3 a 8)</label>
                        <select
                            className="category-select"
                            value={mealsCount}
                            onChange={(e) => handleMealsCountChange(e.target.value)}
                        >
                            {[3, 4, 5, 6, 7, 8].map(n => (
                                <option key={n} value={n}>{n} comidas diarias</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* RESUMEN DE CÁLCULOS METABÓLICOS (Mifflin + AMR + CUN-BAE) */}
                <div className="anef-metabolic-summary">
                    <div className="anef-metric-box">
                        <span className="anef-metric-label">Metabolismo Basal (Mifflin)</span>
                        <span className="anef-metric-value">{metabolic.bmr} kcal</span>
                    </div>
                    <div className="anef-metric-box">
                        <span className="anef-metric-label">Factor Actividad ({metabolic.activityScaleLabel})</span>
                        <span className="anef-metric-value">x{metabolic.activityFactor}</span>
                    </div>
                    <div className="anef-metric-box">
                        <span className="anef-metric-label">Gasto Mantenimiento (GET)</span>
                        <span className="anef-metric-value">{metabolic.tdee} kcal</span>
                    </div>
                    <div className="anef-metric-box">
                        <span className="anef-metric-label">IMC / Grasa Est. (CUN-BAE)</span>
                        <span className="anef-metric-value">{metabolic.bmi} · {metabolic.bodyFatPct}%</span>
                    </div>
                    <div className="anef-metric-box anef-metric-highlight">
                        <span className="anef-metric-label">Calorías Resultantes</span>
                        <span className="anef-metric-value">{metabolic.targetCalories} kcal</span>
                    </div>
                </div>
            </div>

            {/* PASO 2: REPARTO DE CALORÍAS POR COMIDA */}
            <div className="form-section-card">
                <div className="anef-step-header" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="anef-step-badge">Paso 2</span>
                        <h3 className="section-subtitle" style={{ margin: 0 }}>
                            Definición de Comidas y Reparto de Calorías (100%)
                        </h3>
                    </div>
                    <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={handleResetMealDistribution}
                    >
                        <FiRefreshCw size={14} />
                        <span>Auto-repartir 100%</span>
                    </button>
                </div>

                <div className="anef-meals-table">
                    <div className="anef-meals-header">
                        <span>#</span>
                        <span>Tipo de comida</span>
                        <span>¿Post-ejercicio?</span>
                        <span>% Calorías</span>
                        <span>Kcal Comida</span>
                    </div>

                    {meals.map((meal, index) => {
                        const mealKcal = Math.round((metabolic.targetCalories * (Number(meal.pct) || 0)) / 100);
                        return (
                            <div key={index} className="anef-meals-row">
                                <span className="anef-meal-num">Comida {index + 1}</span>
                                <select
                                    className="category-select"
                                    value={meal.type}
                                    onChange={(e) => handleMealTypeChange(index, e.target.value)}
                                >
                                    {ANEF_MEAL_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                <label className="anef-post-check">
                                    <input
                                        type="checkbox"
                                        checked={postWorkoutIndex === index}
                                        onChange={() => handlePostWorkoutChange(index)}
                                    />
                                    <span>{postWorkoutIndex === index ? 'Sí (Post-entreno)' : 'No'}</span>
                                </label>
                                <div className="diet-item-quantity">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        className="set-input"
                                        value={meal.pct}
                                        onChange={(e) => handleMealPctChange(index, e.target.value)}
                                    />
                                    <span className="diet-item-unit">%</span>
                                </div>
                                <span className="anef-meal-kcal">{mealKcal} kcal</span>
                            </div>
                        );
                    })}
                </div>

                <div className={`anef-distribution-status ${Math.abs(remainingPct) <= 0.5 ? 'ok' : 'warn'}`}>
                    <span>
                        Reparto Total: <strong>{totalPct}%</strong> ({metabolic.targetCalories} kcal)
                    </span>
                    <span>
                        {Math.abs(remainingPct) <= 0.5
                            ? '✓ Reparto al 100% completado correctamente'
                            : `Falta por repartir: ${remainingPct > 0 ? `+${remainingPct}%` : `${remainingPct}%`}`}
                    </span>
                </div>
            </div>

            {/* PASO 3: ASIGNAR MACRONUTRIENTES POR GR/KG PESO */}
            <div className="form-section-card">
                <div className="anef-step-header" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="anef-step-badge">Paso 3</span>
                        <h3 className="section-subtitle" style={{ margin: 0 }}>
                            Asignar Macronutrientes por g/Kg de Peso ({weight} kg)
                        </h3>
                    </div>
                    <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={handleApplyRecommendedMacros}
                    >
                        <FiActivity size={14} />
                        <span>
                            Sugerido ANEF: P {recommendedPerKg.proteinPerKg}g/kg · G {recommendedPerKg.fatPerKg}g/kg
                        </span>
                    </button>
                </div>

                <p className="section-help" style={{ marginBottom: '1rem' }}>
                    El macronutriente marcado en <strong>Auto-Ajuste</strong> se calcula automáticamente restando a las calorías objetivo ({metabolic.targetCalories} kcal) las calorías de los otros dos macronutrientes.
                </p>

                <div className="anef-grid-4">
                    <div className={`anef-macro-card ${autoAdjust === 'protein' ? 'auto-active' : ''}`}>
                        <div className="anef-macro-card-top">
                            <label>Proteínas (g/kg)</label>
                            <button
                                type="button"
                                className={`tag-chip ${autoAdjust === 'protein' ? 'active' : ''}`}
                                onClick={() => setAutoAdjust('protein')}
                            >
                                {autoAdjust === 'protein' ? 'Auto-Ajuste' : 'Fijar'}
                            </button>
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            min="0.5"
                            max="4.0"
                            disabled={autoAdjust === 'protein'}
                            value={autoAdjust === 'protein' ? step3Macros.proteinPerKg : proteinPerKg}
                            onChange={(e) => setProteinPerKg(e.target.value)}
                            className="form-field-input"
                        />
                        <div className="anef-macro-card-stats">
                            <strong>{step3Macros.proteinGrams} g</strong>
                            <span>{step3Macros.proteinKcal} kcal ({step3Macros.proteinPct}%)</span>
                        </div>
                    </div>

                    <div className={`anef-macro-card ${autoAdjust === 'carbs' ? 'auto-active' : ''}`}>
                        <div className="anef-macro-card-top">
                            <label>Hidratos C. (g/kg)</label>
                            <button
                                type="button"
                                className={`tag-chip ${autoAdjust === 'carbs' ? 'active' : ''}`}
                                onClick={() => setAutoAdjust('carbs')}
                            >
                                {autoAdjust === 'carbs' ? 'Auto-Ajuste' : 'Fijar'}
                            </button>
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            min="0.2"
                            max="10.0"
                            disabled={autoAdjust === 'carbs'}
                            value={autoAdjust === 'carbs' ? step3Macros.carbsPerKg : carbsPerKg}
                            onChange={(e) => setCarbsPerKg(e.target.value)}
                            className="form-field-input"
                        />
                        <div className="anef-macro-card-stats">
                            <strong>{step3Macros.carbsGrams} g</strong>
                            <span>{step3Macros.carbsKcal} kcal ({step3Macros.carbsPct}%)</span>
                        </div>
                    </div>

                    <div className={`anef-macro-card ${autoAdjust === 'fat' ? 'auto-active' : ''}`}>
                        <div className="anef-macro-card-top">
                            <label>Grasas (g/kg)</label>
                            <button
                                type="button"
                                className={`tag-chip ${autoAdjust === 'fat' ? 'active' : ''}`}
                                onClick={() => setAutoAdjust('fat')}
                            >
                                {autoAdjust === 'fat' ? 'Auto-Ajuste' : 'Fijar'}
                            </button>
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            min="0.3"
                            max="3.0"
                            disabled={autoAdjust === 'fat'}
                            value={autoAdjust === 'fat' ? step3Macros.fatPerKg : fatPerKg}
                            onChange={(e) => setFatPerKg(e.target.value)}
                            className="form-field-input"
                        />
                        <div className="anef-macro-card-stats">
                            <strong>{step3Macros.fatGrams} g</strong>
                            <span>{step3Macros.fatKcal} kcal ({step3Macros.fatPct}%)</span>
                        </div>
                    </div>

                    <div className="anef-macro-card">
                        <div className="anef-macro-card-top">
                            <label>Fibra diaria (g)</label>
                            <span className="tag-badge">Recomendado ~30g</span>
                        </div>
                        <input
                            type="number"
                            step="1"
                            min="10"
                            max="70"
                            value={fiberGrams}
                            onChange={(e) => setFiberGrams(e.target.value)}
                            className="form-field-input"
                        />
                        <div className="anef-macro-card-stats">
                            <strong>{step3Macros.fiberGrams} g</strong>
                            <span>Salud digestiva y saciedad</span>
                        </div>
                    </div>
                </div>

                {step3Macros.isNegativeAdjustment && (
                    <div className="error-message" style={{ marginTop: '0.75rem' }}>
                        ¡Atención! El auto-ajuste resulta negativo porque las proteínas y grasas superan las calorías objetivo. Reduce los g/kg fijados.
                    </div>
                )}
            </div>

            {/* PASO 4: REPARTO ESPECÍFICO DE MACRONUTRIENTES POR COMIDA */}
            <div className="form-section-card">
                <div className="anef-step-header">
                    <span className="anef-step-badge">Paso 4</span>
                    <h3 className="section-subtitle" style={{ margin: 0 }}>
                        Reparto Específico de Macronutrientes por Comida
                    </h3>
                </div>

                <div className="anef-step4-table-wrapper">
                    <table className="diet-bulk-grid">
                        <thead>
                            <tr>
                                <th>Comida</th>
                                <th>Reparto %</th>
                                <th>Energía</th>
                                <th>Proteínas</th>
                                <th>Hidratos (H.C.)</th>
                                <th>Grasas</th>
                                <th>Fibra</th>
                            </tr>
                        </thead>
                        <tbody>
                            {step4Meals.map((m, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <strong>{m.type}</strong>
                                        {m.isPostWorkout && (
                                            <span className="tag-badge" style={{ marginLeft: '0.4rem' }}>
                                                Post-Entreno
                                            </span>
                                        )}
                                    </td>
                                    <td>{m.pct}%</td>
                                    <td><strong>{m.kcal} kcal</strong></td>
                                    <td>{m.proteinGrams} g</td>
                                    <td>{m.carbsGrams} g</td>
                                    <td>{m.fatGrams} g</td>
                                    <td>{m.fiberGrams} g</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ borderTop: '2px solid var(--color-border)', fontWeight: 700 }}>
                                <td>TOTAL DÍA</td>
                                <td>{totalPct}%</td>
                                <td>{metabolic.targetCalories} kcal</td>
                                <td>{step3Macros.proteinGrams} g</td>
                                <td>{step3Macros.carbsGrams} g</td>
                                <td>{step3Macros.fatGrams} g</td>
                                <td>{step3Macros.fiberGrams} g</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* PASO 5: CREAR DIETA Y EQUIVALENCIAS ANEF */}
            <div className="form-section-card">
                <div className="anef-step-header">
                    <span className="anef-step-badge">Paso 5</span>
                    <h3 className="section-subtitle" style={{ margin: 0 }}>
                        Generar Dieta Completa, Recetas y Equivalencias
                    </h3>
                </div>

                <div className="diet-form-grid" style={{ marginBottom: '1rem' }}>
                    <div className="form-field">
                        <label>Formato de platos de la dieta</label>
                        <select
                            className="category-select"
                            value={generationMode}
                            onChange={(e) => setGenerationMode(e.target.value)}
                        >
                            <option value="recipes">
                                Recetas de Dieta completas (con ingredientes en gramos y elaboración)
                            </option>
                            <option value="foods">
                                Alimentos individuales desglosados en gramos
                            </option>
                        </select>
                    </div>

                    <div className="form-field" style={{ justifyContent: 'flex-end' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.65rem 0.85rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                            <input
                                type="checkbox"
                                checked={includeEquivalences}
                                onChange={(e) => setIncludeEquivalences(e.target.checked)}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                            />
                            <span>
                                Generar también <strong>Equivalencia 1 y Equivalencia 2</strong> (3 opciones de menú con los mismos macros)
                            </span>
                        </label>
                    </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                    <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => setShowGuidelines(prev => !prev)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <FiInfo size={14} />
                        <span>Ver tabla de equivalencias y pautas ANEF incluidas</span>
                        {showGuidelines ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    </button>

                    {showGuidelines && (
                        <div className="anef-guidelines-box">
                            <ul>
                                {ANEF_PRACTICAL_GUIDELINES.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}
                {successMsg && <div className="success-message" style={{ marginBottom: '1rem' }}>{successMsg}</div>}

                <div className="form-buttons">
                    {onCancel && (
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onCancel}
                            disabled={submitting}
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn-primary"
                        disabled={submitting || Math.abs(remainingPct) > 1 || step3Macros.isNegativeAdjustment}
                        onClick={handleGenerateDiet}
                        style={{ display: ' inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <FiZap size={18} />
                        <span>
                            {submitting
                                ? 'Calculando y generando dieta personalizada...'
                                : plan
                                    ? '⚡ Aplicar Cálculo ANEF y Generar Comidas del Cliente'
                                    : '⚡ Crear Dieta Personalizada ANEF para el Cliente'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AnefDietWizard;
