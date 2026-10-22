-- ==============================================================================
-- CARGA DE RECETAS FITNESS PREDETERMINADAS Y AJUSTE DE POLÍTICAS RLS (AKUMA FIT)
-- ==============================================================================
-- Script SQL idempotente para registrar el catálogo completo de 16 recetas
-- predeterminadas fitness, vincular sus ingredientes con public.food y
-- garantizar que las políticas RLS permitan acceso a usuarios autenticados.

-- ------------------------------------------------------------------------------
-- 1. HABILITACIÓN DE RLS Y PERMISOS ABIERTOS
-- ------------------------------------------------------------------------------
ALTER TABLE public.recipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_food ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_has_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_has_tag ENABLE ROW LEVEL SECURITY;

-- Concesión de permisos DML a roles clave
GRANT ALL ON public.recipe TO anon, authenticated;
GRANT ALL ON public.recipe_food TO anon, authenticated;
GRANT ALL ON public.recipe_has_tag TO anon, authenticated;
GRANT ALL ON public.tag TO anon, authenticated;
GRANT ALL ON public.food TO anon, authenticated;
GRANT ALL ON public.food_has_tag TO anon, authenticated;

-- Políticas universales para recipe, recipe_food y recipe_has_tag
DROP POLICY IF EXISTS "recipe_authenticated_all" ON public.recipe;
DROP POLICY IF EXISTS "recipe_coach_all" ON public.recipe;
DROP POLICY IF EXISTS "recipe_client_select" ON public.recipe;
CREATE POLICY "recipe_authenticated_all" ON public.recipe
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "recipe_anon_select" ON public.recipe;
CREATE POLICY "recipe_anon_select" ON public.recipe
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "recipe_food_authenticated_all" ON public.recipe_food;
DROP POLICY IF EXISTS "recipe_food_coach_all" ON public.recipe_food;
DROP POLICY IF EXISTS "recipe_food_client_select" ON public.recipe_food;
CREATE POLICY "recipe_food_authenticated_all" ON public.recipe_food
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "recipe_food_anon_select" ON public.recipe_food;
CREATE POLICY "recipe_food_anon_select" ON public.recipe_food
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "recipe_has_tag_authenticated_all" ON public.recipe_has_tag;
DROP POLICY IF EXISTS "recipe_has_tag_coach_all" ON public.recipe_has_tag;
DROP POLICY IF EXISTS "recipe_has_tag_client_select" ON public.recipe_has_tag;
CREATE POLICY "recipe_has_tag_authenticated_all" ON public.recipe_has_tag
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "recipe_has_tag_anon_select" ON public.recipe_has_tag;
CREATE POLICY "recipe_has_tag_anon_select" ON public.recipe_has_tag
    FOR SELECT TO anon
    USING (true);

-- Apertura de lectura para etiquetas y alimentos
DROP POLICY IF EXISTS "tag_authenticated_all" ON public.tag;
CREATE POLICY "tag_authenticated_all" ON public.tag
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "tag_anon_select" ON public.tag;
CREATE POLICY "tag_anon_select" ON public.tag
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "food_authenticated_all" ON public.food;
CREATE POLICY "food_authenticated_all" ON public.food
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "food_anon_select" ON public.food;
CREATE POLICY "food_anon_select" ON public.food
    FOR SELECT TO anon
    USING (true);

-- ------------------------------------------------------------------------------
-- 2. ASEGURAR ÍNDICES ÚNICOS PARA IDEMPOTENCIA
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_food_unique') THEN
        ALTER TABLE public.recipe_food ADD CONSTRAINT recipe_food_unique UNIQUE (recipe_id, food_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_has_tag_unique') THEN
        ALTER TABLE public.recipe_has_tag ADD CONSTRAINT recipe_has_tag_unique UNIQUE (recipe_id, tag_id);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. REGISTRAR ETIQUETAS DE DIETA
-- ------------------------------------------------------------------------------
INSERT INTO public.tag (name, category) VALUES
    ('Desayuno', 'dieta'),
    ('Media Mañana', 'dieta'),
    ('Comida', 'dieta'),
    ('Merienda', 'dieta'),
    ('Cena', 'dieta'),
    ('Post-Entreno', 'dieta'),
    ('Alta Proteína', 'dieta'),
    ('Volumen', 'dieta'),
    ('Definición', 'dieta'),
    ('Baja en Grasas', 'dieta'),
    ('Rápida', 'dieta')
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- 4. ASEGURAR QUE LOS ALIMENTOS DEL CATÁLOGO EXISTEN
-- ------------------------------------------------------------------------------
INSERT INTO public.food (name, brand, calories, protein, carbs, fat, fiber, serving_size, created_by)
SELECT v.name, v.brand, v.calories, v.protein, v.carbs, v.fat, v.fiber, v.serving_size, NULL
FROM (VALUES
    ('Copos de Avena Integrales', 'Genérico', 375.0, 13.5, 60.0, 7.0, 10.0, '100g'),
    ('Clara de Huevo Pasteurizada', 'Genérico', 50.0, 11.0, 0.7, 0.2, 0.0, '100g'),
    ('Huevo Entero Clase L', 'Genérico', 143.0, 12.6, 0.7, 9.5, 0.0, '100g'),
    ('Plátano', 'Fresco', 89.0, 1.1, 23.0, 0.3, 2.6, '100g'),
    ('Pechuga de Pollo', 'Fresco', 120.0, 23.5, 0.0, 2.6, 0.0, '100g'),
    ('Pechuga de Pavo', 'Fresco', 111.0, 24.1, 0.0, 1.6, 0.0, '100g'),
    ('Ternera Magra (Filete/Solomillo)', 'Fresco', 135.0, 22.0, 0.0, 5.0, 0.0, '100g'),
    ('Salmón Fresco', 'Fresco', 208.0, 20.4, 0.0, 13.4, 0.0, '100g'),
    ('Merluza Fresca / Congelada', 'Fresco', 71.0, 16.5, 0.0, 0.7, 0.0, '100g'),
    ('Atún Claro al Natural', 'En Conserva', 101.0, 23.5, 0.0, 0.8, 0.0, '100g'),
    ('Fiambre de Pavo (>90% carne)', 'Genérico', 89.0, 17.5, 1.5, 1.2, 0.0, '100g'),
    ('Arroz Blanco Cocido', 'Preparado', 130.0, 2.7, 28.2, 0.3, 0.4, '100g'),
    ('Pasta Integral', 'En Seco', 348.0, 13.0, 65.0, 2.5, 8.0, '100g'),
    ('Patata Cocida / Asada', 'Tubérculo', 77.0, 2.0, 17.5, 0.1, 2.2, '100g'),
    ('Boniato / Batata Asada', 'Tubérculo', 86.0, 1.6, 20.1, 0.1, 3.0, '100g'),
    ('Pan Integral 100%', 'Panadería', 250.0, 9.5, 45.0, 2.8, 6.5, '100g'),
    ('Tortitas de Arroz Inflado', 'Snack', 385.0, 8.0, 82.0, 2.5, 2.8, '100g'),
    ('Garbanzos Cocidos', 'En Conserva', 139.0, 7.5, 22.0, 2.6, 6.5, '100g'),
    ('Queso Fresco Batido 0% M.G.', 'Genérico', 48.0, 8.5, 3.5, 0.1, 0.0, '100g'),
    ('Yogur Griego Ligero 0%', 'Genérico', 58.0, 10.3, 4.0, 0.2, 0.0, '100g'),
    ('Queso Cottage', 'Genérico', 98.0, 11.5, 3.4, 4.3, 0.0, '100g'),
    ('Leche Semidesnatada', 'Genérico', 46.0, 3.2, 4.8, 1.6, 0.0, '100g'),
    ('Proteína Whey en Polvo (Concentrado)', 'Genérico', 390.0, 78.0, 6.0, 6.0, 1.5, '100g'),
    ('Aceite de Oliva Virgen Extra (AOVE)', 'Genérico', 884.0, 0.0, 0.0, 100.0, 0.0, '100g'),
    ('Mantequilla de Cacahuete 100%', 'Genérico', 588.0, 25.0, 20.0, 50.0, 8.0, '100g'),
    ('Almendras Naturales / Tostadas', 'Genérico', 579.0, 21.2, 21.6, 49.9, 12.5, '100g'),
    ('Nueces Peladas', 'Genérico', 654.0, 15.2, 13.7, 65.2, 6.7, '100g'),
    ('Aguacate Hass', 'Fresco', 160.0, 2.0, 8.5, 14.7, 6.7, '100g'),
    ('Brócoli al Vapor / Crudo', 'Fresco', 34.0, 2.8, 6.6, 0.4, 2.6, '100g'),
    ('Espinacas Frescas', 'Fresco', 23.0, 2.9, 3.6, 0.4, 2.2, '100g'),
    ('Espárragos Verdes', 'Fresco', 20.0, 2.2, 3.9, 0.1, 2.1, '100g'),
    ('Tomate de Ensalada', 'Fresco', 18.0, 0.9, 3.9, 0.2, 1.2, '100g'),
    ('Pimiento Rojo', 'Fresco', 31.0, 1.0, 6.0, 0.3, 2.1, '100g'),
    ('Calabacín con Piel', 'Fresco', 17.0, 1.2, 3.1, 0.3, 1.0, '100g'),
    ('Arándanos Frescos', 'Fresco', 57.0, 0.7, 14.5, 0.3, 2.4, '100g'),
    ('Fresas Frescas', 'Fresco', 32.0, 0.7, 7.7, 0.3, 2.0, '100g')
) AS v(name, brand, calories, protein, carbs, fat, fiber, serving_size)
WHERE NOT EXISTS (SELECT 1 FROM public.food f WHERE f.name = v.name);

-- ------------------------------------------------------------------------------
-- 5. INSERCIÓN DE LAS 16 RECETAS (SI NO EXISTEN POR NAME)
-- ------------------------------------------------------------------------------
INSERT INTO public.recipe (name, description, instructions, preparation_time, servings, created_by)
SELECT v.name, v.description, v.instructions, v.preparation_time, v.servings, (SELECT id FROM public.profile ORDER BY id LIMIT 1)
FROM (VALUES
    -- 1. Desayuno
    ('Tortitas de avena y claras con plátano',
     'Deliciosas tortitas fitness ricas en carbohidratos complejos y proteína de alto valor biológico, ideales para empezar el día con energía.',
     E'1. En el vaso de la batidora, añade los copos de avena, las claras de huevo y medio plátano.\n2. Tritura todo hasta obtener una mezcla homogénea y sin grumos.\n3. Calienta una sartén antiadherente a fuego medio y engrásala con unas gotas de AOVE retirando el exceso con papel.\n4. Vierte porciones de masa formando tortitas y cocina durante 2 minutos hasta que aparezcan burbujas en la superficie.\n5. Dales la vuelta con una espátula y cocina 1 minuto más por el otro lado hasta dorar.\n6. Sirve en un plato decorando con el resto del plátano cortado en rodajas finas.',
     15, 1),

    -- 2. Desayuno
    ('Porridge proteico con frutos rojos y almendras',
     'Gachas de avena cremosa cocinadas con leche y enriquecidas con proteína Whey, coronadas con arándanos frescos y almendras crujientes.',
     E'1. En un cazo pequeño, calienta la leche semidesnatada junto con los copos de avena a fuego medio-bajo.\n2. Remueve constantemente con una cuchara durante 5-7 minutos hasta que la avena absorba la leche y adquiera textura cremosa.\n3. Retira el cazo del fuego y deja reposar durante 1 minuto para que baje ligeramente la temperatura.\n4. Añade el cazo de proteína Whey en polvo y remueve enérgicamente con una varilla para evitar que se formen grumos.\n5. Vierte el porridge cremoso en un bol hondo.\n6. Decora por encima con los arándanos frescos previamente lavados y las almendras picadas.',
     10, 1),

    -- 3. Desayuno
    ('Tostadas integrales con huevos revueltos y aguacate',
     'Clásico desayuno equilibrado con pan integral tostado, aguacate machacado y huevos revueltos cremosos con toque de aceite de oliva.',
     E'1. Coloca las rebanadas de pan integral en la tostadora hasta que queden doradas y crujientes por fuera.\n2. En un cuenco, casca los huevos enteros, añade una pizca de sal y bate ligeramente con un tenedor.\n3. Pon una sartén a fuego medio con la mitad del AOVE y añade los huevos batidos.\n4. Remueve suavemente con una espátula de silicona durante 2 minutos hasta que cuajen manteniendo una consistencia jugosa y tierna.\n5. En un plato aparte, aplasta la pulpa del aguacate Hass con un tenedor y úntala generosamente sobre las tostadas calientes.\n6. Coloca los huevos revueltos sobre el aguacate y corona con las gotas restantes de AOVE y pimienta recién molida.',
     10, 1),

    -- 4. Desayuno
    ('Bowl de yogur griego 0% con avena y nueces',
     'Desayuno express completo con yogur griego bajo en grasa, avena integral cruda, nueces ricas en omega 3 y fresas dulces.',
     E'1. Vierte el yogur griego ligero 0% en un bol hondo y remueve con una cuchara para que quede sedoso y cremoso.\n2. Espolvorea los copos de avena integrales crudos sobre el yogur para que aporten textura.\n3. Lava las fresas frescas bajo el grifo, retira las hojas verdes y córtalas en rodajas uniformes.\n4. Distribuye las fresas laminadas y las nueces peladas troceadas con las manos por la superficie del bol.\n5. Mezcla todos los ingredientes con cada cucharada para combinar frescura y textura crujiente.',
     5, 1),

    -- 5. Post-Entreno
    ('Batido post-entreno Whey con plátano y avena',
     'Batido de absorción óptima para reponer glucógeno y suministrar aminoácidos esenciales a las fibras musculares tras el entrenamiento.',
     E'1. Vierte la leche semidesnatada fría en el vaso de la batidora.\n2. Pela el plátano, córtalo en varios trozos e incorpóralo al vaso.\n3. Agrega los copos de avena integrales para aportar carbohidratos de asimilación progresiva.\n4. Añade un cazo de proteína Whey en polvo sabor chocolate o vainilla.\n5. Tritura a velocidad máxima durante 45-60 segundos hasta que la mezcla sea suave, espumosa y sin grumos.\n6. Sírvelo en un vaso grande o shaker y tómalo en los primeros 45 minutos tras terminar la sesión de pesas.',
     5, 1),

    -- 6. Media Mañana
    ('Sándwich integral de pavo y queso cottage',
     'Snack saciante y limpio de media mañana con pan integral, alto contenido de pavo magro y queso cottage fresco con rodajas de tomate.',
     E'1. Dispón las dos rebanadas de pan integral sobre una superficie limpia o tabla de cocina.\n2. Unta el queso cottage uniformemente sobre una de las caras de cada rebanada.\n3. Lava el tomate de ensalada, córtalo en rodajas finas y sazónalo con una pizca de orégano y sal.\n4. Coloca las rodajas de tomate sobre la base de queso cottage.\n5. Distribuye las lonchas de fiambre de pavo dobladas en capas para darle volumen y textura al sándwich.\n6. Cubre con la otra rebanada de pan, presiona ligeramente y corta en diagonal por la mitad.',
     5, 1),

    -- 7. Comida
    ('Pollo a la plancha con arroz blanco y brócoli',
     'El pilar de la nutrición fitness: pechuga tierna dorada a la plancha, arroz blanco suave y brócoli al vapor con AOVE.',
     E'1. Corta el brócoli en ramilletes pequeños, lávalos bien y cocínalos al vapor durante 6-8 minutos hasta que estén tiernos pero crujientes.\n2. Calienta el arroz blanco previamente cocido en microondas o sartén para servirlo a temperatura agradable.\n3. Seca los filetes de pechuga de pollo con papel absorbente y salpimienta al gusto con ajo en polvo y sal marina.\n4. Pon una plancha o sartén gruesa a fuego vivo con el aceite de oliva virgen extra.\n5. Cocina el pollo durante 3-4 minutos por cada lado hasta que adquiera un color dorado exterior sin resecar el interior.\n6. Sirve en un plato hondo disponiendo el arroz, el brócoli al vapor y la pechuga jugosa fileteada en tiras.',
     20, 1),

    -- 8. Comida
    ('Pasta integral boloñesa de ternera magra',
     'Pasta integral con boloñesa fitness casera de ternera magra picada, tomate natural y especias mediterráneas como orégano y albahaca.',
     E'1. Llena una cacerola con agua, añade sal y lleva a ebullición. Vierte la pasta integral y cuece de 9 a 11 minutos al dente.\n2. En una sartén antiadherente a fuego medio, añade el aceite de oliva virgen extra.\n3. Incorpora la ternera magra picada, desmenuzándola con la cuchara y cocinándola durante 4-5 minutos hasta que empiece a dorarse.\n4. Tritura o pica muy fino el tomate de ensalada y añádelo a la sartén junto con orégano, albahaca seca y una pizca de sal.\n5. Baja a fuego lento y deja que la salsa de tomate reduzca durante 7-8 minutos concentrando sus sabores.\n6. Escurre la pasta integral reservando una cucharada de agua de cocción, mézclala con la salsa boloñesa y saltea todo junto durante 1 minuto.',
     25, 1),

    -- 9. Comida
    ('Bowl mediterráneo de garbanzos y atún',
     'Ensalada completa fresca y reconstituyente que combina legumbres ricas en fibra, atún al natural, aguacate cremoso y tomate fresco.',
     E'1. Vierte los garbanzos cocidos en un colador y acláralos bajo el chorro de agua fría hasta retirar el líquido de conservación. Escurre bien.\n2. Coloca los garbanzos limpios en el fondo de un cuenco grande para ensaladas.\n3. Abre las latas de atún claro al natural, escurre el agua sobrante presionando con la tapa y desmenuza el atún sobre los garbanzos.\n4. Lava el tomate de ensalada y córtalo en dados medianos.\n5. Corta el aguacate por la mitad, retira el hueso y corta la pulpa en cubitos regulares.\n6. Añade el tomate y el aguacate al bol, condimenta con el aceite de oliva virgen extra, sal y zumo de limón, y mezcla suavemente.',
     10, 1),

    -- 10. Comida
    ('Salteado de pavo con boniato asado y verduras',
     'Combinación rica en antioxidantes y carbohidratos de bajo índice glucémico con dados de pechuga de pavo, boniato asado, pimiento y calabacín.',
     E'1. Si no dispones de boniato asado con antelación, pélalo, córtalo en dados y ásalo al microondas en recipiente tapado durante 5-6 minutos hasta que esté blando.\n2. Corta la pechuga de pavo limpia en dados de 2 cm. Corta el pimiento rojo y el calabacín con piel en cubos similares.\n3. Calienta un wok o sartén amplia a fuego alto con el aceite de oliva virgen extra.\n4. Saltea los dados de pavo salpimentados durante 4 minutos hasta dorar la superficie. Retira a un plato.\n5. En la misma sartén añade el pimiento rojo y el calabacín, salteando con energía durante 4-5 minutos hasta que queden al dente.\n6. Reincorpora el pavo y suma los dados de boniato asado; remueve todo a fuego vivo durante 2 minutos sazonando con pimentón dulce.',
     25, 1),

    -- 11. Merienda
    ('Bowl de queso fresco batido con crema de cacahuete y tortitas de arroz',
     'Snack proteico de absorción sostenida (caseína y grasas monoinsaturadas) perfecto para mantener la saciedad durante la tarde.',
     E'1. Vierte el queso fresco batido 0% M.G. en un bol hondo individual.\n2. Con la ayuda de una cuchara, incorpora la mantequilla de cacahuete 100% pura y haz movimientos circulares para integrarla parcialmente o crear vetas.\n3. Toma las tortitas de arroz inflado y rómpelas con las manos en trozos de tamaño bocado.\n4. Añade las tortitas troceadas sobre la superficie del bol para conseguir un contraste crujiente irresistible.\n5. Opcional: añade canela de Ceilán en polvo por encima y consúmelo al momento.',
     5, 1),

    -- 12. Merienda
    ('Pudin proteico de yogur y fresas',
     'Merienda fresca y ligera con yogur griego 0%, un extra de proteína Whey para potenciar el valor biológico y fresas naturales troceadas.',
     E'1. Coloca el yogur griego ligero 0% en un cuenco hondo.\n2. Añade el cazo de proteína Whey en polvo poco a poco, batiendo con una cuchara o varilla pequeña hasta que espese y adquiera textura similar a un pudin cremoso.\n3. Lava bien las fresas frescas, desecha las hojas y córtalas en daditos pequeños.\n4. Incorpora la mitad de los dados de fresa dentro de la mezcla proteica removiendo suavemente.\n5. Coloca la otra mitad de las fresas en la parte superior como decoración.\n6. Deja enfriar 10-15 minutos en el frigorífico antes de comer para intensificar su frescura y firmeza.',
     5, 1),

    -- 13. Cena
    ('Salmón al horno con patata asada y espinacas',
     'Cena rica en ácidos grasos omega 3, potasio y micronutrientes, con lomo de salmón jugoso al horno, patata asada y espinacas frescas salteadas.',
     E'1. Precalienta el horno a 200°C. Lava la patata y cuécela al vapor o ásala al microondas durante 6-7 minutos hasta que esté tierna por dentro.\n2. Coloca el lomo de salmón fresco sobre una bandeja forrada con papel de horno y sazona con sal, pimienta y unas gotas de limón.\n3. Hornea el salmón a 190°C durante 12-14 minutos, vigilando que el centro quede sonrosado y tierno.\n4. Mientras tanto, calienta una sartén con el aceite de oliva virgen extra y saltea las espinacas frescas durante 2 minutos hasta que mengüen y queden verdes vivas.\n5. Abre la patata asada por la mitad en el plato y añade una pizca de sal marina.\n6. Emplata el salmón al horno junto con la patata caliente y la guarnición de espinacas salteadas.',
     25, 1),

    -- 14. Cena
    ('Merluza a la plancha con espárragos verdes y patata',
     'Cena hipocalórica y digestiva perfecta para etapas de definición: merluza blanca magra, espárragos verdes a la parrilla y patata cocida.',
     E'1. Lava los espárragos verdes y corta la parte inferior leñosa del tallo.\n2. Calienta una plancha o sartén acanalada con la mitad del aceite de oliva virgen extra y asa los espárragos a fuego medio-alto durante 6-7 minutos hasta que estén dorados.\n3. Saca los lomos de merluza, sécalos con papel de cocina y sálalos ligeramente.\n4. En la misma plancha o sartén caliente con el resto del AOVE, marca la merluza durante 3 minutos por cada lado con cuidado al darle la vuelta para no desmenuzarla.\n5. Corta la patata previamente cocida en rodajas gruesas y caliéntala si fuera necesario.\n6. Emplata los lomos de merluza dorados acompañados de los espárragos crujientes y las rodajas de patata con perejil picado.',
     20, 1),

    -- 15. Cena
    ('Tortilla francesa de claras y huevo con ensalada de tomate y aguacate',
     'Tortilla ligera y esponjosa combinando un huevo entero con claras pasteurizadas, acompañada de una ensalada fresca de tomate y aguacate.',
     E'1. En un plato hondo o bol, bate con energía el huevo entero junto con la clara de huevo pasteurizada y una pizca de sal hasta obtener una mezcla espumosa.\n2. Pon una sartén antiadherente a calentar a fuego medio con la mitad del aceite de oliva virgen extra.\n3. Vierte los huevos batidos y mueve la sartén con suavidad para que el huevo cubra toda la superficie.\n4. Cuando los bordes estén firmes pero el centro aún jugoso, pliega la tortilla sobre sí misma formando un rollo tierno y deja dorar 30 segundos más.\n5. Corta el tomate de ensalada en gajos y corta el aguacate maduro en dados medianos.\n6. Sirve la tortilla francesa caliente en el plato junto a los gajos de tomate y aguacate, aderezando la ensalada con el resto del AOVE y una pizca de sal.',
     15, 1),

    -- 16. Cena
    ('Fajitas / salteado ligero de pollo con pimientos y calabacín',
     'Salteado estilo fajita sin tortillas, con tiras jugosas de pechuga de pollo, pimiento rojo y calabacín especiados con comino y orégano.',
     E'1. Corta la pechuga de pollo en tiras finas alargadas de bocado y sazona con comino en polvo, ajo, orégano, sal y pimienta.\n2. Lava el pimiento rojo y el calabacín con piel y córtalos en tiras alargadas estilo fajita.\n3. Calienta a fuego vivo una sartén amplia o wok con el aceite de oliva virgen extra.\n4. Añade las tiras de pollo y saltea con fuerza durante 4-5 minutos hasta que tomen un apetecible color dorado exterior. Reserva en un plato.\n5. En la misma sartén bien caliente, añade las tiras de pimiento y calabacín; saltea durante 4 minutos manteniendo las verduras al dente y crujientes.\n6. Devuelve el pollo a la sartén junto con las verduras, saltea todo junto durante 1 minuto a fuego fuerte para amalgamar los sabores y sirve inmediatamente.',
     20, 1)
) AS v(name, description, instructions, preparation_time, servings)
WHERE NOT EXISTS (SELECT 1 FROM public.recipe r WHERE r.name = v.name);

-- ------------------------------------------------------------------------------
-- 6. VINCULACIÓN DE INGREDIENTES EN PUBLIC.RECIPE_FOOD
-- ------------------------------------------------------------------------------
INSERT INTO public.recipe_food (recipe_id, food_id, quantity_g, notes)
SELECT r.id, f.id, v.quantity_g, v.notes
FROM (VALUES
    -- Receta 1
    ('Tortitas de avena y claras con plátano', 'Copos de Avena Integrales', 60.0, 'Triturados con las claras para la masa'),
    ('Tortitas de avena y claras con plátano', 'Clara de Huevo Pasteurizada', 180.0, 'Aportan proteína limpia sin grasas'),
    ('Tortitas de avena y claras con plátano', 'Plátano', 100.0, 'Mitad para la masa y mitad en rodajas para topping'),
    ('Tortitas de avena y claras con plátano', 'Aceite de Oliva Virgen Extra (AOVE)', 3.0, 'Para engrasar la sartén antiadherente'),

    -- Receta 2
    ('Porridge proteico con frutos rojos y almendras', 'Copos de Avena Integrales', 50.0, 'Copos suaves de avena integral'),
    ('Porridge proteico con frutos rojos y almendras', 'Leche Semidesnatada', 200.0, 'Para cocer la avena a fuego suave'),
    ('Porridge proteico con frutos rojos y almendras', 'Proteína Whey en Polvo (Concentrado)', 30.0, 'Proteína whey concentrada (vainilla o neutra)'),
    ('Porridge proteico con frutos rojos y almendras', 'Arándanos Frescos', 50.0, 'Arándanos frescos lavados'),
    ('Porridge proteico con frutos rojos y almendras', 'Almendras Naturales / Tostadas', 15.0, 'Almendras picadas para dar toque crujiente'),

    -- Receta 3
    ('Tostadas integrales con huevos revueltos y aguacate', 'Pan Integral 100%', 80.0, '2 rebanadas de pan integral bien tostadas'),
    ('Tostadas integrales con huevos revueltos y aguacate', 'Huevo Entero Clase L', 120.0, '2 huevos camperos enteros'),
    ('Tostadas integrales con huevos revueltos y aguacate', 'Aguacate Hass', 50.0, 'Medio aguacate maduro machacado'),
    ('Tostadas integrales con huevos revueltos y aguacate', 'Aceite de Oliva Virgen Extra (AOVE)', 5.0, 'Para engrasar la sartén y aliñar'),

    -- Receta 4
    ('Bowl de yogur griego 0% con avena y nueces', 'Yogur Griego Ligero 0%', 200.0, 'Base cremosa alta en caseína'),
    ('Bowl de yogur griego 0% con avena y nueces', 'Copos de Avena Integrales', 40.0, 'Copos integrales crudos'),
    ('Bowl de yogur griego 0% con avena y nueces', 'Nueces Peladas', 20.0, 'Nueces peladas troceadas a mano'),
    ('Bowl de yogur griego 0% con avena y nueces', 'Fresas Frescas', 80.0, 'Fresas dulces laminadas'),

    -- Receta 5
    ('Batido post-entreno Whey con plátano y avena', 'Proteína Whey en Polvo (Concentrado)', 30.0, '1 cazo de proteína Whey concentrada'),
    ('Batido post-entreno Whey con plátano y avena', 'Plátano', 110.0, '1 plátano maduro troceado'),
    ('Batido post-entreno Whey con plátano y avena', 'Copos de Avena Integrales', 40.0, 'Copos de avena fina'),
    ('Batido post-entreno Whey con plátano y avena', 'Leche Semidesnatada', 250.0, 'Leche fría para diluir y mezclar'),

    -- Receta 6
    ('Sándwich integral de pavo y queso cottage', 'Pan Integral 100%', 80.0, '2 rebanadas de pan integral de grano entero'),
    ('Sándwich integral de pavo y queso cottage', 'Fiambre de Pavo (>90% carne)', 100.0, 'Lonchas finas de fiambre de pavo de alta calidad (>90%)'),
    ('Sándwich integral de pavo y queso cottage', 'Queso Cottage', 60.0, 'Queso cottage fresco y granulado'),
    ('Sándwich integral de pavo y queso cottage', 'Tomate de Ensalada', 60.0, 'Tomate maduro en rodajas'),

    -- Receta 7
    ('Pollo a la plancha con arroz blanco y brócoli', 'Pechuga de Pollo', 180.0, 'Filetes limpios de pechuga de pollo'),
    ('Pollo a la plancha con arroz blanco y brócoli', 'Arroz Blanco Cocido', 180.0, 'Arroz blanco cocido de grano largo'),
    ('Pollo a la plancha con arroz blanco y brócoli', 'Brócoli al Vapor / Crudo', 150.0, 'Ramilletes de brócoli al vapor'),
    ('Pollo a la plancha con arroz blanco y brócoli', 'Aceite de Oliva Virgen Extra (AOVE)', 10.0, '1 cucharada de AOVE para marcar el pollo y aliñar'),

    -- Receta 8
    ('Pasta integral boloñesa de ternera magra', 'Pasta Integral', 80.0, 'Pasta de trigo integral en seco'),
    ('Pasta integral boloñesa de ternera magra', 'Ternera Magra (Filete/Solomillo)', 150.0, 'Carne picada de ternera magra sin grasa añadida'),
    ('Pasta integral boloñesa de ternera magra', 'Tomate de Ensalada', 120.0, 'Tomates maduros triturados para la salsa'),
    ('Pasta integral boloñesa de ternera magra', 'Aceite de Oliva Virgen Extra (AOVE)', 8.0, 'AOVE para sofreír la carne'),

    -- Receta 9
    ('Bowl mediterráneo de garbanzos y atún', 'Garbanzos Cocidos', 180.0, 'Garbanzos cocidos de bote bien enjuagados'),
    ('Bowl mediterráneo de garbanzos y atún', 'Atún Claro al Natural', 120.0, 'Atún en conserva al natural escurrido'),
    ('Bowl mediterráneo de garbanzos y atún', 'Aguacate Hass', 50.0, 'Aguacate Hass en dados'),
    ('Bowl mediterráneo de garbanzos y atún', 'Tomate de Ensalada', 100.0, 'Tomate fresco en dados'),
    ('Bowl mediterráneo de garbanzos y atún', 'Aceite de Oliva Virgen Extra (AOVE)', 8.0, 'AOVE virgen extra para el aliño'),

    -- Receta 10
    ('Salteado de pavo con boniato asado y verduras', 'Pechuga de Pavo', 180.0, 'Pechuga magra de pavo en cubos'),
    ('Salteado de pavo con boniato asado y verduras', 'Boniato / Batata Asada', 180.0, 'Boniato asado en dados tiernos'),
    ('Salteado de pavo con boniato asado y verduras', 'Pimiento Rojo', 80.0, 'Pimiento rojo fresco en cubos'),
    ('Salteado de pavo con boniato asado y verduras', 'Calabacín con Piel', 80.0, 'Calabacín fresco con piel en cubos'),
    ('Salteado de pavo con boniato asado y verduras', 'Aceite de Oliva Virgen Extra (AOVE)', 10.0, 'AOVE para saltear verduras y carne al wok'),

    -- Receta 11
    ('Bowl de queso fresco batido con crema de cacahuete y tortitas de arroz', 'Queso Fresco Batido 0% M.G.', 250.0, 'Queso fresco batido desnatado alto en caseína'),
    ('Bowl de queso fresco batido con crema de cacahuete y tortitas de arroz', 'Mantequilla de Cacahuete 100%', 20.0, 'Crema de cacahuete 100% natural sin azúcares añadidos'),
    ('Bowl de queso fresco batido con crema de cacahuete y tortitas de arroz', 'Tortitas de Arroz Inflado', 24.0, '3 tortitas de arroz inflado troceadas crujientes'),

    -- Receta 12
    ('Pudin proteico de yogur y fresas', 'Yogur Griego Ligero 0%', 180.0, 'Yogur griego desnatado espeso'),
    ('Pudin proteico de yogur y fresas', 'Proteína Whey en Polvo (Concentrado)', 20.0, 'Proteína whey sabor fresa o vainilla'),
    ('Pudin proteico de yogur y fresas', 'Fresas Frescas', 100.0, 'Fresas maduras en cubos'),

    -- Receta 13
    ('Salmón al horno con patata asada y espinacas', 'Salmón Fresco', 160.0, 'Lomo limpio de salmón fresco con piel'),
    ('Salmón al horno con patata asada y espinacas', 'Patata Cocida / Asada', 150.0, 'Patata mediana asada o cocida'),
    ('Salmón al horno con patata asada y espinacas', 'Espinacas Frescas', 100.0, 'Hojas tiernas de espinacas frescas'),
    ('Salmón al horno con patata asada y espinacas', 'Aceite de Oliva Virgen Extra (AOVE)', 5.0, 'AOVE para saltear las espinacas'),

    -- Receta 14
    ('Merluza a la plancha con espárragos verdes y patata', 'Merluza Fresca / Congelada', 180.0, 'Lomos limpios sin espinas de merluza'),
    ('Merluza a la plancha con espárragos verdes y patata', 'Espárragos Verdes', 120.0, 'Espárragos verdes tiernos a la plancha'),
    ('Merluza a la plancha con espárragos verdes y patata', 'Patata Cocida / Asada', 120.0, 'Patata cocida en rodajas'),
    ('Merluza a la plancha con espárragos verdes y patata', 'Aceite de Oliva Virgen Extra (AOVE)', 8.0, 'AOVE para la plancha y aliño ligero'),

    -- Receta 15
    ('Tortilla francesa de claras y huevo con ensalada de tomate y aguacate', 'Huevo Entero Clase L', 60.0, '1 huevo campero entero para textura y sabor'),
    ('Tortilla francesa de claras y huevo con ensalada de tomate y aguacate', 'Clara de Huevo Pasteurizada', 150.0, 'Claras pasteurizadas para maximizar la proteína limpia'),
    ('Tortilla francesa de claras y huevo con ensalada de tomate y aguacate', 'Tomate de Ensalada', 120.0, 'Tomate de ensalada en gajos frescos'),
    ('Tortilla francesa de claras y huevo con ensalada de tomate y aguacate', 'Aguacate Hass', 40.0, 'Aguacate en dados cremosos'),
    ('Tortilla francesa de claras y huevo con ensalada de tomate y aguacate', 'Aceite de Oliva Virgen Extra (AOVE)', 6.0, 'AOVE para la sartén y aderezo'),

    -- Receta 16
    ('Fajitas / salteado ligero de pollo con pimientos y calabacín', 'Pechuga de Pollo', 180.0, 'Pechuga magra en tiras alargadas'),
    ('Fajitas / salteado ligero de pollo con pimientos y calabacín', 'Pimiento Rojo', 90.0, 'Pimiento rojo fresco en tiras tipo juliana'),
    ('Fajitas / salteado ligero de pollo con pimientos y calabacín', 'Calabacín con Piel', 90.0, 'Calabacín fresco con piel en tiras'),
    ('Fajitas / salteado ligero de pollo con pimientos y calabacín', 'Aceite de Oliva Virgen Extra (AOVE)', 8.0, 'AOVE para saltear en sartén caliente')
) AS v(recipe_name, food_name, quantity_g, notes)
JOIN public.recipe r ON r.name = v.recipe_name
JOIN public.food f ON f.name = v.food_name
ON CONFLICT (recipe_id, food_id) DO UPDATE
SET quantity_g = EXCLUDED.quantity_g,
    notes = EXCLUDED.notes;

-- ------------------------------------------------------------------------------
-- 7. VINCULACIÓN DE ETIQUETAS EN PUBLIC.RECIPE_HAS_TAG
-- ------------------------------------------------------------------------------
INSERT INTO public.recipe_has_tag (recipe_id, tag_id)
SELECT r.id, t.id
FROM (VALUES
    ('Tortitas de avena y claras con plátano', 'Desayuno'),
    ('Tortitas de avena y claras con plátano', 'Alta Proteína'),
    ('Tortitas de avena y claras con plátano', 'Volumen'),

    ('Porridge proteico con frutos rojos y almendras', 'Desayuno'),
    ('Porridge proteico con frutos rojos y almendras', 'Alta Proteína'),
    ('Porridge proteico con frutos rojos y almendras', 'Rápida'),

    ('Tostadas integrales con huevos revueltos y aguacate', 'Desayuno'),
    ('Tostadas integrales con huevos revueltos y aguacate', 'Alta Proteína'),
    ('Tostadas integrales con huevos revueltos y aguacate', 'Definición'),

    ('Bowl de yogur griego 0% con avena y nueces', 'Desayuno'),
    ('Bowl de yogur griego 0% con avena y nueces', 'Alta Proteína'),
    ('Bowl de yogur griego 0% con avena y nueces', 'Rápida'),
    ('Bowl de yogur griego 0% con avena y nueces', 'Definición'),

    ('Batido post-entreno Whey con plátano y avena', 'Post-Entreno'),
    ('Batido post-entreno Whey con plátano y avena', 'Alta Proteína'),
    ('Batido post-entreno Whey con plátano y avena', 'Rápida'),
    ('Batido post-entreno Whey con plátano y avena', 'Volumen'),

    ('Sándwich integral de pavo y queso cottage', 'Media Mañana'),
    ('Sándwich integral de pavo y queso cottage', 'Alta Proteína'),
    ('Sándwich integral de pavo y queso cottage', 'Baja en Grasas'),
    ('Sándwich integral de pavo y queso cottage', 'Rápida'),

    ('Pollo a la plancha con arroz blanco y brócoli', 'Comida'),
    ('Pollo a la plancha con arroz blanco y brócoli', 'Alta Proteína'),
    ('Pollo a la plancha con arroz blanco y brócoli', 'Definición'),
    ('Pollo a la plancha con arroz blanco y brócoli', 'Baja en Grasas'),

    ('Pasta integral boloñesa de ternera magra', 'Comida'),
    ('Pasta integral boloñesa de ternera magra', 'Alta Proteína'),
    ('Pasta integral boloñesa de ternera magra', 'Volumen'),

    ('Bowl mediterráneo de garbanzos y atún', 'Comida'),
    ('Bowl mediterráneo de garbanzos y atún', 'Alta Proteína'),
    ('Bowl mediterráneo de garbanzos y atún', 'Rápida'),

    ('Salteado de pavo con boniato asado y verduras', 'Comida'),
    ('Salteado de pavo con boniato asado y verduras', 'Alta Proteína'),
    ('Salteado de pavo con boniato asado y verduras', 'Definición'),

    ('Bowl de queso fresco batido con crema de cacahuete y tortitas de arroz', 'Merienda'),
    ('Bowl de queso fresco batido con crema de cacahuete y tortitas de arroz', 'Alta Proteína'),
    ('Bowl de queso fresco batido con crema de cacahuete y tortitas de arroz', 'Rápida'),
    ('Bowl de queso fresco batido con crema de cacahuete y tortitas de arroz', 'Volumen'),

    ('Pudin proteico de yogur y fresas', 'Merienda'),
    ('Pudin proteico de yogur y fresas', 'Alta Proteína'),
    ('Pudin proteico de yogur y fresas', 'Definición'),
    ('Pudin proteico de yogur y fresas', 'Baja en Grasas'),

    ('Salmón al horno con patata asada y espinacas', 'Cena'),
    ('Salmón al horno con patata asada y espinacas', 'Alta Proteína'),
    ('Salmón al horno con patata asada y espinacas', 'Definición'),

    ('Merluza a la plancha con espárragos verdes y patata', 'Cena'),
    ('Merluza a la plancha con espárragos verdes y patata', 'Alta Proteína'),
    ('Merluza a la plancha con espárragos verdes y patata', 'Baja en Grasas'),
    ('Merluza a la plancha con espárragos verdes y patata', 'Definición'),

    ('Tortilla francesa de claras y huevo con ensalada de tomate y aguacate', 'Cena'),
    ('Tortilla francesa de claras y huevo con ensalada de tomate y aguacate', 'Alta Proteína'),
    ('Tortilla francesa de claras y huevo con ensalada de tomate y aguacate', 'Definición'),
    ('Tortilla francesa de claras y huevo con ensalada de tomate y aguacate', 'Rápida'),

    ('Fajitas / salteado ligero de pollo con pimientos y calabacín', 'Cena'),
    ('Fajitas / salteado ligero de pollo con pimientos y calabacín', 'Alta Proteína'),
    ('Fajitas / salteado ligero de pollo con pimientos y calabacín', 'Definición'),
    ('Fajitas / salteado ligero de pollo con pimientos y calabacín', 'Baja en Grasas')
) AS v(recipe_name, tag_name)
JOIN public.recipe r ON r.name = v.recipe_name
JOIN public.tag t ON t.name = v.tag_name
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

-- Notificar a PostgREST para recargar el esquema de Supabase
NOTIFY pgrst, 'reload schema';
