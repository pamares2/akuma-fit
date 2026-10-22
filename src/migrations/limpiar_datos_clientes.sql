-- ============================================================================
-- limpiar_datos_clientes.sql: Limpieza total de clientes y datos de atletas
-- Mantiene intacta toda la información del entrenador (Coach):
--   - Catálogo de alimentos (food)
--   - Catálogo de recetas fitness (recipe, recipe_food, recipe_has_tag)
--   - Biblioteca de ejercicios (exercise_template, set_template)
--   - Etiquetas (tag)
--   - Perfil del entrenador (role = 'coach')
--   - Rutinas maestras y planes de dieta maestros creados por el coach
-- ============================================================================

-- 1. Eliminar eventos de calendario de clientes
DELETE FROM public.calendar_event 
WHERE profile_id IN (SELECT id FROM public.profile WHERE role = 'client');

-- 2. Eliminar sesiones de entrenamiento de clientes
DELETE FROM public.training_session 
WHERE profile_id IN (SELECT id FROM public.profile WHERE role = 'client');

-- 3. Eliminar check-ins semanales de clientes
DELETE FROM public.check_in 
WHERE profile_id IN (SELECT id FROM public.profile WHERE role = 'client');

-- 4. Eliminar valoraciones iniciales de clientes
DELETE FROM public.initial_assessment 
WHERE profile_id IN (SELECT id FROM public.profile WHERE role = 'client');

-- 5. Eliminar registros de peso y medidas de clientes
DELETE FROM public.measurement 
WHERE profile_id IN (SELECT id FROM public.profile WHERE role = 'client');

-- 6. Eliminar fotos corporales de clientes
DELETE FROM public.body_photo 
WHERE profile_id IN (SELECT id FROM public.profile WHERE role = 'client');

-- 7. Eliminar asignaciones de rutinas y planes de dieta a clientes
DELETE FROM public.profile_has_routine 
WHERE profile IN (SELECT id FROM public.profile WHERE role = 'client');

DELETE FROM public.profile_has_meal_plan 
WHERE profile_id IN (SELECT id FROM public.profile WHERE role = 'client');

-- 8. Eliminar relaciones entrenador-cliente
DELETE FROM public.coach_has_client 
WHERE client_id IN (SELECT id FROM public.profile WHERE role = 'client');

-- 9. Eliminar perfiles de clientes
DELETE FROM public.profile 
WHERE role = 'client';
