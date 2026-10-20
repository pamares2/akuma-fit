-- ==============================================================================
-- LIMPIEZA DE DUPLICADOS Y ACCESO TOTAL A EJERCICIOS (AKUMA FIT)
-- ==============================================================================

-- 1. Eliminar ejercicios duplicados (deja exactamente 1 de cada nombre)
DELETE FROM public.exercise_template
WHERE id NOT IN (
    SELECT MIN(id)
    FROM public.exercise_template
    GROUP BY exercise_name
);

-- 2. Eliminar todas las políticas antiguas restrictivas de exercise_template
DROP POLICY IF EXISTS "exercise_template_select_own" ON public.exercise_template;
DROP POLICY IF EXISTS "exercise_template_select_assigned" ON public.exercise_template;
DROP POLICY IF EXISTS "exercise_template_select_all" ON public.exercise_template;
DROP POLICY IF EXISTS "exercise_template_insert_own" ON public.exercise_template;
DROP POLICY IF EXISTS "exercise_template_update_own" ON public.exercise_template;
DROP POLICY IF EXISTS "exercise_template_delete_own" ON public.exercise_template;
DROP POLICY IF EXISTS "exercise_template_select_public" ON public.exercise_template;
DROP POLICY IF EXISTS "exercise_template_modify_authenticated" ON public.exercise_template;

-- 3. Crear política de LECTURA TOTAL (para que la web los muestre siempre)
CREATE POLICY "exercise_template_select_public" ON public.exercise_template 
    FOR SELECT TO public 
    USING (true);

CREATE POLICY "exercise_template_modify_authenticated" ON public.exercise_template 
    FOR ALL TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- 4. Asegurar también las etiquetas de los ejercicios
DROP POLICY IF EXISTS "exercise_template_has_tag_select_own" ON public.exercise_template_has_tag;
DROP POLICY IF EXISTS "exercise_template_has_tag_insert_own" ON public.exercise_template_has_tag;
DROP POLICY IF EXISTS "exercise_template_has_tag_update_own" ON public.exercise_template_has_tag;
DROP POLICY IF EXISTS "exercise_template_has_tag_delete_own" ON public.exercise_template_has_tag;

CREATE POLICY "exercise_template_has_tag_select_public" ON public.exercise_template_has_tag 
    FOR SELECT TO public 
    USING (true);

CREATE POLICY "exercise_template_has_tag_modify_authenticated" ON public.exercise_template_has_tag 
    FOR ALL TO authenticated 
    USING (true) 
    WITH CHECK (true);
