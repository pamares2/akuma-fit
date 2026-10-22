-- ==============================================================================
-- 009_recipes_and_feedback.sql: Catálogo de Recetas Fitness y Feedback Coach <-> Cliente
-- ==============================================================================

-- 1. Columna `coach_feedback` en `check_in` y políticas RLS para feedback y sesiones
ALTER TABLE public.check_in
    ADD COLUMN IF NOT EXISTS coach_feedback text;

DROP POLICY IF EXISTS "Coaches can update check-ins" ON public.check_in;
CREATE POLICY "Coaches can update check-ins" ON public.check_in
    AS PERMISSIVE FOR UPDATE TO public
    USING (is_coach())
    WITH CHECK (is_coach());

DROP POLICY IF EXISTS "Coaches can view client training sessions" ON public.training_session;
CREATE POLICY "Coaches can view client training sessions" ON public.training_session
    AS PERMISSIVE FOR SELECT TO authenticated
    USING (is_coach());

-- 2. Etiquetas de dieta para recetas
INSERT INTO public.tag (name, category) VALUES
    ('Desayuno', 'dieta'),
    ('Comida', 'dieta'),
    ('Cena', 'dieta'),
    ('Snack / Post-entreno', 'dieta'),
    ('Alta en Proteína', 'dieta'),
    ('Volumen', 'dieta'),
    ('Definición', 'dieta'),
    ('Rápida', 'dieta')
ON CONFLICT (name) DO UPDATE SET category = 'dieta';

-- 3. Recetas Fitness base (idempotente por nombre)
DO $$
DECLARE
    v_recipe_id bigint;
    f_avena bigint;
    f_claras bigint;
    f_huevo bigint;
    f_platano bigint;
    f_whey bigint;
    f_leche bigint;
    f_arandanos bigint;
    f_cacahuete bigint;
    f_centeno bigint;
    f_aguacate bigint;
    f_pavo_fiambre bigint;
    f_tomate bigint;
    f_pollo bigint;
    f_arroz bigint;
    f_brocoli bigint;
    f_aove bigint;
    f_salmon bigint;
    f_patata bigint;
    f_esparragos bigint;
    f_ternera bigint;
    f_pimiento bigint;
    f_cebolla bigint;
    f_espinacas bigint;
    f_mozzarella bigint;
    f_atun bigint;
    f_garbanzos bigint;
    f_pasta bigint;
    f_picada bigint;
    f_merluza bigint;
    f_boniato bigint;
    f_calabacin bigint;
    f_queso_batido bigint;
    f_nueces bigint;
    f_datiles bigint;
    f_pavo bigint;
    f_quinoa bigint;
    f_champinones bigint;
BEGIN
    SELECT id INTO f_avena FROM public.food WHERE name ILIKE '%Avena%' LIMIT 1;
    SELECT id INTO f_claras FROM public.food WHERE name ILIKE '%Clara de Huevo%' LIMIT 1;
    SELECT id INTO f_huevo FROM public.food WHERE name ILIKE '%Huevo Entero%' LIMIT 1;
    SELECT id INTO f_platano FROM public.food WHERE name ILIKE '%Plátano%' LIMIT 1;
    SELECT id INTO f_whey FROM public.food WHERE name ILIKE '%Proteína Whey%' LIMIT 1;
    SELECT id INTO f_leche FROM public.food WHERE name ILIKE '%Leche Semidesnatada%' LIMIT 1;
    SELECT id INTO f_arandanos FROM public.food WHERE name ILIKE '%Arándanos%' LIMIT 1;
    SELECT id INTO f_cacahuete FROM public.food WHERE name ILIKE '%Mantequilla de Cacahuete%' LIMIT 1;
    SELECT id INTO f_centeno FROM public.food WHERE name ILIKE '%Pan de Centeno%' LIMIT 1;
    SELECT id INTO f_aguacate FROM public.food WHERE name ILIKE '%Aguacate%' LIMIT 1;
    SELECT id INTO f_pavo_fiambre FROM public.food WHERE name ILIKE '%Fiambre de Pavo%' LIMIT 1;
    SELECT id INTO f_tomate FROM public.food WHERE name ILIKE '%Tomate%' LIMIT 1;
    SELECT id INTO f_pollo FROM public.food WHERE name ILIKE '%Pechuga de Pollo%' LIMIT 1;
    SELECT id INTO f_arroz FROM public.food WHERE name ILIKE '%Arroz Blanco%' LIMIT 1;
    SELECT id INTO f_brocoli FROM public.food WHERE name ILIKE '%Brócoli%' LIMIT 1;
    SELECT id INTO f_aove FROM public.food WHERE name ILIKE '%Aceite de Oliva%' LIMIT 1;
    SELECT id INTO f_salmon FROM public.food WHERE name ILIKE '%Salmón%' LIMIT 1;
    SELECT id INTO f_patata FROM public.food WHERE name ILIKE '%Patata%' LIMIT 1;
    SELECT id INTO f_esparragos FROM public.food WHERE name ILIKE '%Espárragos%' LIMIT 1;
    SELECT id INTO f_ternera FROM public.food WHERE name ILIKE '%Ternera Magra%' LIMIT 1;
    SELECT id INTO f_pimiento FROM public.food WHERE name ILIKE '%Pimiento Rojo%' LIMIT 1;
    SELECT id INTO f_cebolla FROM public.food WHERE name ILIKE '%Cebolla%' LIMIT 1;
    SELECT id INTO f_espinacas FROM public.food WHERE name ILIKE '%Espinacas%' LIMIT 1;
    SELECT id INTO f_mozzarella FROM public.food WHERE name ILIKE '%Mozzarella%' LIMIT 1;
    SELECT id INTO f_atun FROM public.food WHERE name ILIKE '%Atún%' LIMIT 1;
    SELECT id INTO f_garbanzos FROM public.food WHERE name ILIKE '%Garbanzos%' LIMIT 1;
    SELECT id INTO f_pasta FROM public.food WHERE name ILIKE '%Pasta Integral%' LIMIT 1;
    SELECT id INTO f_picada FROM public.food WHERE name ILIKE '%Carne Picada%' LIMIT 1;
    SELECT id INTO f_merluza FROM public.food WHERE name ILIKE '%Merluza%' LIMIT 1;
    SELECT id INTO f_boniato FROM public.food WHERE name ILIKE '%Boniato%' LIMIT 1;
    SELECT id INTO f_calabacin FROM public.food WHERE name ILIKE '%Calabacín%' LIMIT 1;
    SELECT id INTO f_queso_batido FROM public.food WHERE name ILIKE '%Queso Fresco Batido%' LIMIT 1;
    SELECT id INTO f_nueces FROM public.food WHERE name ILIKE '%Nueces%' LIMIT 1;
    SELECT id INTO f_datiles FROM public.food WHERE name ILIKE '%Dátiles%' LIMIT 1;
    SELECT id INTO f_pavo FROM public.food WHERE name ILIKE '%Pechuga de Pavo%' LIMIT 1;
    SELECT id INTO f_quinoa FROM public.food WHERE name ILIKE '%Quinoa%' LIMIT 1;
    SELECT id INTO f_champinones FROM public.food WHERE name ILIKE '%Champiñones%' LIMIT 1;

    -- Receta 1: Tortitas Proteicas de Avena, Claras y Plátano
    IF NOT EXISTS (SELECT 1 FROM public.recipe WHERE name = 'Tortitas Proteicas de Avena, Claras y Plátano') THEN
        INSERT INTO public.recipe (name, description, instructions, preparation_time, servings)
        VALUES (
            'Tortitas Proteicas de Avena, Claras y Plátano',
            'Clásico desayuno fitness esponjoso, rico en proteínas de alto valor biológico y carbohidratos de absorción gradual.',
            '1. Tritura los copos de avena con las claras, el huevo y medio plátano. 2. Cocina en sartén antiadherente 2 min por lado. 3. Sirve con rodajas de plátano.',
            10, 1
        ) RETURNING id INTO v_recipe_id;
        IF f_avena IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_avena, 60, 'Molidos o en copos'); END IF;
        IF f_claras IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_claras, 150, 'Líquidas'); END IF;
        IF f_huevo IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_huevo, 60, '1 unidad'); END IF;
        IF f_platano IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_platano, 100, 'Maduro'); END IF;
    END IF;

    -- Receta 2: Bowl Fitness de Pollo, Arroz Basmati, Brócoli y Aguacate
    IF NOT EXISTS (SELECT 1 FROM public.recipe WHERE name = 'Bowl Fitness de Pollo, Arroz Basmati, Brócoli y Aguacate') THEN
        INSERT INTO public.recipe (name, description, instructions, preparation_time, servings)
        VALUES (
            'Bowl Fitness de Pollo, Arroz Basmati, Brócoli y Aguacate',
            'La comida base por excelencia para rendimiento e hipertrofia: limpia, saciante y fácil de llevar en táper.',
            '1. Dora la pechuga de pollo en dados a la plancha. 2. Cuece el brócoli al vapor 5 min. 3. Sirve sobre el arroz cocido con el aguacate en dados.',
            20, 1
        ) RETURNING id INTO v_recipe_id;
        IF f_pollo IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_pollo, 180, 'En dados a la plancha'); END IF;
        IF f_arroz IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_arroz, 220, 'Peso cocido'); END IF;
        IF f_brocoli IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_brocoli, 120, 'Al vapor'); END IF;
        IF f_aguacate IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_aguacate, 50, 'En dados'); END IF;
        IF f_aove IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_aove, 5, 'Plancha'); END IF;
    END IF;

    -- Receta 3: Salmón al Horno con Patata Asada y Espárragos Verdes
    IF NOT EXISTS (SELECT 1 FROM public.recipe WHERE name = 'Salmón al Horno con Patata Asada y Espárragos Verdes') THEN
        INSERT INTO public.recipe (name, description, instructions, preparation_time, servings)
        VALUES (
            'Salmón al Horno con Patata Asada y Espárragos Verdes',
            'Cena o comida rica en ácidos grasos esenciales Omega-3, ideal para recuperación muscular.',
            '1. Hornea la patata en gajos a 200 °C durante 15 min. 2. Añade el salmón y los espárragos y hornea 10 min más.',
            25, 1
        ) RETURNING id INTO v_recipe_id;
        IF f_salmon IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_salmon, 160, 'Lomo limpio'); END IF;
        IF f_patata IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_patata, 200, 'Asada'); END IF;
        IF f_esparragos IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_esparragos, 120, 'Manojo'); END IF;
        IF f_aove IS NOT NULL THEN INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes) VALUES (v_recipe_id, f_aove, 5, '1 cucharadita'); END IF;
    END IF;
END $$;
