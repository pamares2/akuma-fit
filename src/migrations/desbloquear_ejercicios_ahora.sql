-- ==============================================================================
-- DESBLOQUEO INMEDIATO DE EJERCICIOS EN LA WEB (AKUMA FIT)
-- ==============================================================================

-- 1. Desactivar RLS en ejercicios y etiquetas para que NINGÚN candado los oculte en la web
ALTER TABLE public.exercise_template DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_template_has_tag DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag DISABLE ROW LEVEL SECURITY;

-- 2. Conceder permisos de lectura a usuarios autenticados y anónimos
GRANT ALL ON public.exercise_template TO anon, authenticated;
GRANT ALL ON public.exercise_template_has_tag TO anon, authenticated;
GRANT ALL ON public.tag TO anon, authenticated;

-- 3. Asignar el creador válido a todos los ejercicios existentes
UPDATE public.exercise_template 
SET creator = COALESCE(
    (SELECT creator FROM public.exercise_template WHERE creator IS NOT NULL LIMIT 1),
    (SELECT id FROM public.profile LIMIT 1)
);

-- 4. Vincular automáticamente las etiquetas musculares a los ejercicios según su categoría
INSERT INTO public.exercise_template_has_tag (exercise_template, tag)
SELECT et.id, t.id
FROM public.exercise_template et
JOIN public.tag t ON t.name = et.category
ON CONFLICT (exercise_template, tag) DO NOTHING;

-- 5. Refrescar la caché interna de PostgREST en Supabase
NOTIFY pgrst, 'reload schema';
