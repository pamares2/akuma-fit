-- ==============================================================================
-- AKUMA FIT: CATÁLOGO COMPLETO DE EJERCICIOS, ALIMENTOS Y AJUSTE DE POLÍTICAS RLS
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase.
-- ==============================================================================

-- 1. CORRECCIÓN DE POLÍTICAS RLS PARA EJERCICIOS Y ETIQUETAS
-- Permite que los entrenadores vean todos los ejercicios y que los usuarios autenticados
-- vean los ejercicios globales (creator IS NULL) y los suyos propios.

DROP POLICY IF EXISTS "exercise_template_select_own" ON public.exercise_template;
DROP POLICY IF EXISTS "exercise_template_select_all" ON public.exercise_template;
CREATE POLICY "exercise_template_select_all" ON public.exercise_template FOR SELECT TO authenticated
    USING (
        creator IS NULL
        OR creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())
        OR is_coach()
    );

DROP POLICY IF EXISTS "exercise_template_has_tag_select_own" ON public.exercise_template_has_tag;
DROP POLICY IF EXISTS "exercise_template_has_tag_select_all" ON public.exercise_template_has_tag;
CREATE POLICY "exercise_template_has_tag_select_all" ON public.exercise_template_has_tag FOR SELECT TO authenticated
    USING (
        exercise_template IN (
            SELECT id FROM public.exercise_template
            WHERE creator IS NULL
               OR creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())
               OR is_coach()
        )
    );

DROP POLICY IF EXISTS "exercise_template_has_set_template_select_own" ON public.exercise_template_has_set_template;
DROP POLICY IF EXISTS "exercise_template_has_set_template_select_all" ON public.exercise_template_has_set_template;
CREATE POLICY "exercise_template_has_set_template_select_all" ON public.exercise_template_has_set_template FOR SELECT TO authenticated
    USING (
        exercise_template IN (
            SELECT id FROM public.exercise_template
            WHERE creator IS NULL
               OR creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())
               OR is_coach()
        )
    );

-- Política para que cualquier usuario autenticado pueda leer todas las etiquetas
DROP POLICY IF EXISTS "tag_select_all" ON public.tag;
CREATE POLICY "tag_select_all" ON public.tag FOR SELECT TO authenticated
    USING (true);

-- Política para que cualquier coach vea todos los alimentos (globales y personalizados)
DROP POLICY IF EXISTS "food_coach_all" ON public.food;
CREATE POLICY "food_coach_all" ON public.food FOR ALL TO authenticated
    USING (is_coach() OR created_by IS NULL OR created_by = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()))
    WITH CHECK (is_coach() OR created_by = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));

DROP POLICY IF EXISTS "food_has_tag_coach_all" ON public.food_has_tag;
CREATE POLICY "food_has_tag_coach_all" ON public.food_has_tag FOR ALL TO authenticated
    USING (true)
    WITH CHECK (is_coach());


-- 2. INSERCIÓN DE ETIQUETAS (TAGS) PARA FILTRADO
INSERT INTO public.tag (name) VALUES
    ('Mancuerna'),
    ('Barra'),
    ('Máquina'),
    ('Polea'),
    ('Peso Corporal'),
    ('Multipower'),
    ('Pecho'),
    ('Espalda'),
    ('Hombro'),
    ('Bíceps'),
    ('Tríceps'),
    ('Cuádriceps'),
    ('Isquiosurales'),
    ('Glúteos'),
    ('Gemelos'),
    ('Abdomen/Core'),
    ('Proteína'),
    ('Carbohidrato'),
    ('Grasa Saludable'),
    ('Lácteo'),
    ('Vegetal'),
    ('Fruta'),
    ('Bebida')
ON CONFLICT (name) DO NOTHING;


-- 3. CATÁLOGO EXTENSO DE EJERCICIOS (Mancuernas, Máquinas, Barras, Poleas, Peso Corporal)
INSERT INTO public.exercise_template (exercise_name, description, comments, category, creator) VALUES
    -- === PECHO ===
    ('Press de Banca Plano con Barra', 'Ejercicio básico multiarticular de empuje horizontal con barra recta.', 'Mantener retracción escapular, arco lumbar natural y pies firmes.', 'Pecho', NULL),
    ('Press de Banca con Mancuernas', 'Empuje horizontal con mancuernas para mayor rango de movimiento y trabajo unilateral.', 'Bajar controlado abriendo ligeramente los codos sin forzar los hombros.', 'Pecho', NULL),
    ('Press Inclinado con Barra', 'Empuje en banco inclinado (30º-45º) con barra enfocado en haz clavicular del pectoral.', 'Bajar la barra a la parte alta del pecho con control.', 'Pecho', NULL),
    ('Press Inclinado con Mancuernas', 'Empuje en banco inclinado con mancuernas para hipertrofia de la porción superior del pectoral.', 'Excelente para convergencia en la parte alta del movimiento.', 'Pecho', NULL),
    ('Press Declinado con Barra', 'Empuje en banco declinado con énfasis en la porción inferior del pectoral.', 'Cuidado con la descompresión al bloquear los codos.', 'Pecho', NULL),
    ('Press de Pecho en Máquina Convergente', 'Empuje en máquina guiada con trayectoria convergente.', 'Seguro para entrenar al fallo muscular sin necesidad de spotter.', 'Pecho', NULL),
    ('Aperturas con Mancuernas en Banco Plano', 'Aislamiento de pectoral en estiramiento con mancuernas.', 'Ligera flexión fija en los codos durante todo el recorrido.', 'Pecho', NULL),
    ('Aperturas en Máquina Contractora (Peck Deck)', 'Aislamiento guiado del pectoral con tensión constante.', 'Apretar 1 segundo en máxima contracción en el centro.', 'Pecho', NULL),
    ('Cruces en Polea Alta', 'Aislamiento de pectoral inferior y medio mediante cruce de cables.', 'Torso ligeramente inclinado hacia adelante y core firme.', 'Pecho', NULL),
    ('Cruces en Polea Baja', 'Aislamiento de pectoral superior llevando las manijas de abajo hacia arriba.', 'Mantener el pecho erguido y hombros atrás.', 'Pecho', NULL),
    ('Fondos en Paralelas para Pecho', 'Empuje con peso corporal inclinando el torso hacia adelante.', 'Bajar hasta formar un ángulo de 90º en el codo.', 'Pecho', NULL),
    ('Flexiones de Brazos (Push-Ups)', 'Empuje con peso corporal sobre el suelo.', 'Mantener el cuerpo como una tabla recta activando abdomen y glúteos.', 'Pecho', NULL),

    -- === ESPALDA ===
    ('Dominadas Pronadas', 'Tracción vertical con agarre prono abierto para desarrollo de dorsales.', 'Rango de movimiento completo desde el bloqueo hasta la barbilla sobre la barra.', 'Espalda', NULL),
    ('Dominadas Supinadas (Chin-Ups)', 'Tracción vertical con agarre supino con gran implicación del bíceps.', 'Tirar con los codos hacia abajo y hacia el torso.', 'Espalda', NULL),
    ('Dominadas Neutras', 'Tracción vertical con palmas enfrentadas, muy amigable con los hombros.', 'Gran activación del dorsal y braquial.', 'Espalda', NULL),
    ('Jalón al Pecho en Polea Alta (Agarre Ancho)', 'Tracción vertical guiada para amplitud dorsal.', 'Llevar la barra a la parte alta del esternón sin balanceos exagerados.', 'Espalda', NULL),
    ('Jalón al Pecho con Agarre Neutro/Estrecho', 'Tracción vertical con agarre cerrado enfocado en el dorsal medio y bajo.', 'Permite una tracción profunda con mayor recorrido.', 'Espalda', NULL),
    ('Remo con Barra a 45º', 'Tracción horizontal básica pesada para densidad de espalda y trapecios.', 'Mantener espalda neutra y tirar hacia la cintura o ombligo.', 'Espalda', NULL),
    ('Remo Pendlay con Barra', 'Remo con salida desde el suelo en cada repetición para potencia.', 'Espalda estrictamente paralela al suelo.', 'Espalda', NULL),
    ('Remo con Mancuerna a Una Mano', 'Tracción unilateral con apoyo en banco para dorsal y romboides.', 'Tirar con el codo hacia la cadera sin rotar bruscamente el torso.', 'Espalda', NULL),
    ('Remo en Polea Baja (Gironda)', 'Tracción horizontal en polea sentado con agarre estrecho.', 'Pecho erguido, estirar bien adelante y apretar atrás.', 'Espalda', NULL),
    ('Remo en Máquina Hammer Strength', 'Remo guiado en máquina con palanca y apoyo en el pecho.', 'Elimina la fatiga lumbar para aislar la espalda al máximo.', 'Espalda', NULL),
    ('Remo en Barra T con Apoyo de Pecho', 'Remo en barra en T apoyado en banco inclinado.', 'Máximo trabajo de romboides y trapecios medios sin carga espinal.', 'Espalda', NULL),
    ('Pullover en Polea Alta con Cuerda / Barra', 'Aislamiento de dorsales en empuje/tracción recta con brazos estirados.', 'Gran estiramiento del dorsal ancho sin flexionar los codos.', 'Espalda', NULL),
    ('Peso Muerto Convencional con Barra', 'El rey de la cadena posterior: erectores espinales, glúteos, isquios e isometría completa.', 'Barra pegada a las tibias, bloquear empujando el suelo con las piernas.', 'Espalda', NULL),
    ('Hiperextensiones Lumbar a 45º', 'Fortalecimiento de erectores espinales y cadena posterior.', 'Extender hasta alinear el torso sin hiperextender bruscamente.', 'Espalda', NULL),

    -- === HOMBROS ===
    ('Press Militar con Barra de Pie', 'Empuje vertical multiarticular básico de fuerza para deltoides.', 'Apretar glúteos y abdomen, pasar la cabeza bajo la barra al subir.', 'Hombro', NULL),
    ('Press Militar con Barra Sentado', 'Empuje vertical sentado para deltoides anterior y lateral con menor demanda de equilibrio.', 'Bajar la barra justo por debajo del mentón.', 'Hombro', NULL),
    ('Press de Hombros con Mancuernas', 'Empuje vertical sentado con mancuernas para recorrido independiente.', 'Evitar arquear excesivamente la zona lumbar.', 'Hombro', NULL),
    ('Press de Hombros en Máquina', 'Empuje vertical en máquina guiada para trabajo seguro y pesado.', 'Ajustar la altura del asiento para que los agarres queden a la altura de las orejas.', 'Hombro', NULL),
    ('Elevaciones Laterales con Mancuernas', 'Aislamiento imprescindible para el deltoides lateral (amplitud de hombro).', 'Ligeramente inclinado hacia adelante, subir guiando con los codos.', 'Hombro', NULL),
    ('Elevaciones Laterales en Polea Baja', 'Aislamiento lateral con tensión continua en todo el rango.', 'Cruzar el cable por detrás o delante del cuerpo.', 'Hombro', NULL),
    ('Pájaros con Mancuernas (Deltoides Posterior)', 'Aislamiento del deltoides posterior y romboides con torso inclinado.', 'Separar los brazos como alas manteniendo codos ligeramente flexionados.', 'Hombro', NULL),
    ('Deltoides Posterior en Máquina Contractora Inversa', 'Máquina peck deck en reversa para aislamiento posterior guiado.', 'Mantener hombros deprimidos para evitar que domine el trapecio superior.', 'Hombro', NULL),
    ('Face Pull en Polea con Cuerda', 'Salud del hombro, rotadores externos y deltoides posterior.', 'Tirar de la cuerda hacia los ojos abriendo las manos al final.', 'Hombro', NULL),
    ('Elevaciones Frontales con Mancuerna / Disco', 'Aislamiento de la porción anterior del deltoides.', 'Subir hasta la altura de los ojos de forma controlada.', 'Hombro', NULL),
    ('Encogimientos de Hombros con Mancuernas / Barra', 'Sobrecarga y aislamiento del trapecio superior.', 'Subir los hombros en línea recta hacia las orejas sin rotar.', 'Hombro', NULL),

    -- === PIERNAS: CUÁDRICEPS, ISQUIOS, GLÚTEO, GEMELOS ===
    ('Sentadilla Trasera con Barra', 'El ejercicio rey del tren inferior: cuádriceps, glúteos, aductores y core.', 'Romper el paralelo manteniendo la espalda neutra y rodillas alineadas.', 'Pierna', NULL),
    ('Sentadilla Frontal con Barra', 'Sentadilla con barra apoyada en deltoides frontales, mayor énfasis en cuádriceps.', 'Torso completamente vertical y codos bien altos.', 'Pierna', NULL),
    ('Prensa de Piernas Inclinada a 45º', 'Sobrecarga masiva de cuádriceps y glúteos en máquina guiada.', 'Bajar profundo sin despegar el sacro del respaldo.', 'Pierna', NULL),
    ('Sentadilla Hack en Máquina', 'Sentadilla guiada sobre rieles para aislamiento supremo de cuádriceps.', 'Permite profundidad extrema con máxima seguridad lumbar.', 'Pierna', NULL),
    ('Extensiones de Cuádriceps en Máquina', 'Aislamiento puro de los cuatro vientres del cuádriceps.', 'Pausar 1 segundo arriba en máxima contracción.', 'Pierna', NULL),
    ('Sentadilla Búlgara con Mancuernas', 'Ejercicio unilateral demoledor para cuádriceps y glúteo.', 'Pie trasero apoyado en banco, bajar vertical con control.', 'Pierna', NULL),
    ('Zancadas Caminando con Mancuernas', 'Trabajo dinámico unilateral para fuerza y estabilidad.', 'Pasos amplios y rodilla trasera casi tocando el suelo.', 'Pierna', NULL),
    ('Peso Muerto Rumano con Barra', 'Estiramiento y carga excéntrica máxima en isquiosurales y glúteos.', 'Empujar la cadera hacia atrás manteniendo las rodillas semi-flexionadas fijas.', 'Pierna', NULL),
    ('Peso Muerto Rumano con Mancuernas', 'Variante con mancuernas para mayor libertad en el agarre y postura.', 'Bajar las mancuernas pegadas a las piernas sintiendo el estiramiento.', 'Pierna', NULL),
    ('Curl Femoral Tumbado en Máquina', 'Aislamiento de isquiosurales en flexión de rodilla recostado.', 'Mantener la pelvis pegada al banco sin arquear la espalda.', 'Pierna', NULL),
    ('Curl Femoral Sentado en Máquina', 'Aislamiento de isquiosurales con cadera en flexión (mayor estiramiento del bíceps femoral).', 'Uno de los ejercicios más efectivos para hipertrofia de isquios.', 'Pierna', NULL),
    ('Hip Thrust con Barra en Banco', 'Máxima activación y sobrecarga del glúteo mayor.', 'Bloquear arriba apretando glúteos con la pelvis neutra y barbilla al pecho.', 'Pierna', NULL),
    ('Hip Thrust en Máquina', 'Versión guiada en máquina para comodidad de carga en cadera.', 'Excelente para repeticiones al fallo sin molestias de barra.', 'Pierna', NULL),
    ('Abductores en Máquina Sentado', 'Aislamiento para glúteo medio y menor.', 'Abrir completamente y controlar la fase de retorno.', 'Pierna', NULL),
    ('Aductores en Máquina Sentado', 'Aislamiento para la cara interna del muslo (aductores).', 'Cerrar con control y apretar al final.', 'Pierna', NULL),
    ('Elevación de Talones de Pie en Máquina / Multipower', 'Sobrecarga del gastrocnemio (gemelos) con rodillas extendidas.', 'Bajar a estiramiento completo y subir hasta la punta de los dedos.', 'Pierna', NULL),
    ('Elevación de Talones Sentado en Máquina', 'Aislamiento del músculo sóleo con rodillas flexionadas a 90º.', 'Pausa de 2 segundos en el fondo del estiramiento.', 'Pierna', NULL),

    -- === BRAZOS: BÍCEPS Y TRÍCEPS ===
    ('Curl de Bíceps con Barra Recta', 'Sobrecarga básica con barra para masa de bíceps.', 'Codos pegados al cuerpo, sin balanceos de torso.', 'Bíceps', NULL),
    ('Curl de Bíceps con Barra Z', 'Más ergonómico para muñecas y antebrazos que la barra recta.', 'Excelente para series pesadas.', 'Bíceps', NULL),
    ('Curl de Bíceps Alterno con Mancuernas', 'Trabajo unilateral con supinación de muñeca durante el ascenso.', 'Girar la palma hacia arriba en la subida para máxima contracción.', 'Bíceps', NULL),
    ('Curl Martillo con Mancuernas', 'Énfasis en braquiorradial y braquial anterior (grosor de brazo).', 'Palmas mirándose entre sí durante todo el trayecto.', 'Bíceps', NULL),
    ('Curl de Bíceps en Banco Scott / Predicador', 'Aislamiento estricto impidiendo cualquier ayuda del hombro o espalda.', 'Bajar con control sin llegar a hiper-extender de golpe.', 'Bíceps', NULL),
    ('Curl Concentrado con Mancuerna Sentado', 'Aislamiento clásico para el pico del bíceps con codo apoyado en el muslo.', 'Subir hasta tocar el pectoral superior sin mover el codo.', 'Bíceps', NULL),
    ('Curl en Polea Baja con Barra / Cuerda', 'Tensión continua durante todo el recorrido gracias al cable.', 'Mantener la tensión incluso al inicio de la repetición.', 'Bíceps', NULL),
    ('Extensiones de Tríceps en Polea Alta con Cuerda', 'Aislamiento de la cabeza lateral y medial del tríceps.', 'Abrir la cuerda en la parte inferior contrayendo fuerte.', 'Tríceps', NULL),
    ('Extensiones de Tríceps en Polea con Barra Recta / V', 'Permite manejar más peso para sobrecarga de tríceps.', 'Codos pegados a los costados y torso ligeramente inclinado.', 'Tríceps', NULL),
    ('Press Francés con Barra Z en Banco Plano', 'Aislamiento para la cabeza larga del tríceps.', 'Bajar la barra hacia la frente o coronilla manteniendo codos cerrados.', 'Tríceps', NULL),
    ('Extensión de Tríceps sobre la Cabeza con Mancuerna (Copa)', 'Gran estiramiento de la cabeza larga del tríceps.', 'Sujetar la mancuerna con ambas manos tras la cabeza.', 'Tríceps', NULL),
    ('Extensión de Tríceps en Polea sobre la Cabeza', 'Variante con cable para tensión continua en la cabeza larga.', 'Mantener el codo apuntando al frente.', 'Tríceps', NULL),
    ('Fondos entre Bancos para Tríceps', 'Empuje con peso corporal sobre banco plano.', 'Mantener la espalda pegada al banco para no forzar los hombros.', 'Tríceps', NULL),

    -- === ABDOMEN Y CORE ===
    ('Plancha Abdominal Frontal', 'Estabilidad isométrica de transverso abdominal y pared central.', 'Cuerpo recto alineado de cabeza a talones, glúteos y core apretados.', 'Core', NULL),
    ('Plancha Lateral', 'Estabilidad isométrica de oblicuos y cuadrado lumbar.', 'Apoyo en antebrazo y lateral del pie manteniendo cadera arriba.', 'Core', NULL),
    ('Rueda Abdominal (Ab Wheel)', 'Ejercicio avanzado de anti-extensión del core con enorme tensión excéntrica.', 'Mantener la pelvis en retroversión, no arquear la zona lumbar.', 'Core', NULL),
    ('Elevaciones de Piernas Colgado en Barra', 'Flexión de cadera y columna lumbar para abdomen inferior.', 'Subir las rodillas o pies hacia el pecho sin columpiarse.', 'Core', NULL),
    ('Crunch Abdominal en Polea Alta', 'Crunch con resistencia progresiva arrodillado frente a la polea.', 'Flexionar la columna enrollando el torso hacia la pelvis.', 'Core', NULL),
    ('Crunch en Máquina Abdominal', 'Trabajo guiado con selector de placas para hipertrofia abdominal.', 'Movimiento lento y contracción sostenida.', 'Core', NULL),
    ('Vacío Abdominal (Stomach Vacuum)', 'Activación profunda del músculo transverso para cintura estrecha.', 'Expulsar todo el aire y meter el ombligo hacia la columna.', 'Core', NULL)
ON CONFLICT DO NOTHING;


-- 4. CATÁLOGO COMPLETO DE ALIMENTOS CON INFORMACIÓN NUTRICIONAL POR 100g
INSERT INTO public.food (name, brand, calories, protein, carbs, fat, fiber, serving_size, created_by) VALUES
    -- === CARNES Y AVES ===
    ('Pechuga de Pollo', 'Fresco', 120.0, 23.5, 0.0, 2.6, 0.0, '100g', NULL),
    ('Pechuga de Pavo', 'Fresco', 111.0, 24.1, 0.0, 1.6, 0.0, '100g', NULL),
    ('Ternera Magra (Filete/Solomillo)', 'Fresco', 135.0, 22.0, 0.0, 5.0, 0.0, '100g', NULL),
    ('Carne Picada de Ternera 95/5', 'Fresco', 137.0, 21.4, 0.0, 5.0, 0.0, '100g', NULL),
    ('Lomo de Cerdo Magro', 'Fresco', 143.0, 21.8, 0.0, 6.0, 0.0, '100g', NULL),
    ('Muslo de Pollo sin Piel', 'Fresco', 165.0, 19.5, 0.0, 9.0, 0.0, '100g', NULL),
    ('Jamón Serrano / Ibérico', 'Genérico', 240.0, 30.5, 0.5, 12.0, 0.0, '50g', NULL),
    ('Fiambre de Pavo (>90% carne)', 'Genérico', 89.0, 17.5, 1.5, 1.2, 0.0, '100g', NULL),

    -- === PESCADOS Y MARISCOS ===
    ('Salmón Fresco', 'Fresco', 208.0, 20.4, 0.0, 13.4, 0.0, '100g', NULL),
    ('Atún Claro al Natural', 'En Conserva', 101.0, 23.5, 0.0, 0.8, 0.0, '1 lata (80g escurrido)', NULL),
    ('Merluza Fresca / Congelada', 'Fresco', 71.0, 16.5, 0.0, 0.7, 0.0, '100g', NULL),
    ('Bacalao Fresco / Desmigado', 'Fresco', 82.0, 18.0, 0.0, 0.7, 0.0, '100g', NULL),
    ('Lubina / Dorada', 'Fresco', 97.0, 19.0, 0.0, 2.5, 0.0, '100g', NULL),
    ('Langostinos / Gambas Cocidas', 'Fresco', 85.0, 18.2, 0.8, 0.9, 0.0, '100g', NULL),
    ('Sardinas en Aceite de Oliva', 'En Conserva', 208.0, 24.6, 0.0, 12.0, 0.0, '1 lata (85g)', NULL),
    ('Sepia / Calamar a la Plancha', 'Fresco', 80.0, 16.1, 1.0, 1.4, 0.0, '100g', NULL),

    -- === HUEVOS Y LÁCTEOS ===
    ('Huevo Entero Clase L', 'Genérico', 143.0, 12.6, 0.7, 9.5, 0.0, '1 unidad (~60g)', NULL),
    ('Clara de Huevo Pasteurizada', 'Genérico', 50.0, 11.0, 0.7, 0.2, 0.0, '100ml', NULL),
    ('Queso Fresco Batido 0% M.G.', 'Genérico', 48.0, 8.5, 3.5, 0.1, 0.0, '100g', NULL),
    ('Yogur Griego Natural (Auténtico)', 'Genérico', 115.0, 9.0, 3.8, 7.0, 0.0, '125g', NULL),
    ('Yogur Griego Ligero 0%', 'Genérico', 58.0, 10.3, 4.0, 0.2, 0.0, '125g', NULL),
    ('Queso Cottage', 'Genérico', 98.0, 11.5, 3.4, 4.3, 0.0, '100g', NULL),
    ('Queso Mozzarella Light', 'Genérico', 165.0, 19.0, 1.5, 9.0, 0.0, '100g', NULL),
    ('Leche Semidesnatada', 'Genérico', 46.0, 3.2, 4.8, 1.6, 0.0, '100ml', NULL),
    ('Leche Entera', 'Genérico', 62.0, 3.1, 4.7, 3.5, 0.0, '100ml', NULL),
    ('Bebida de Almendras sin Azúcar', 'Genérico', 13.0, 0.4, 0.2, 1.1, 0.4, '100ml', NULL),
    ('Proteína Whey en Polvo (Concentrado)', 'Genérico', 390.0, 78.0, 6.0, 6.0, 1.5, '1 cazo (30g)', NULL),
    ('Proteína Whey Aislada (Isolate)', 'Genérico', 370.0, 88.0, 1.5, 1.0, 0.5, '1 cazo (30g)', NULL),

    -- === CEREALES, GRANOS Y TUBÉRCULOS ===
    ('Arroz Blanco', 'Grano Seco', 360.0, 7.0, 79.0, 0.8, 1.2, '100g en seco', NULL),
    ('Arroz Blanco Cocido', 'Preparado', 130.0, 2.7, 28.2, 0.3, 0.4, '100g cocido', NULL),
    ('Arroz Integral', 'Grano Seco', 362.0, 7.5, 76.0, 2.7, 3.5, '100g en seco', NULL),
    ('Copos de Avena Integrales', 'Genérico', 375.0, 13.5, 60.0, 7.0, 10.0, '100g', NULL),
    ('Pasta de Trigo (Macarrones/Espaguetis)', 'En Seco', 355.0, 12.0, 72.0, 1.5, 3.0, '100g en seco', NULL),
    ('Pasta Integral', 'En Seco', 348.0, 13.0, 65.0, 2.5, 8.0, '100g en seco', NULL),
    ('Patata Cocida / Asada', 'Tubérculo', 77.0, 2.0, 17.5, 0.1, 2.2, '100g', NULL),
    ('Boniato / Batata Asada', 'Tubérculo', 86.0, 1.6, 20.1, 0.1, 3.0, '100g', NULL),
    ('Pan Integral 100%', 'Panadería', 250.0, 9.5, 45.0, 2.8, 6.5, '1 rebanada (40g)', NULL),
    ('Pan de Centeno 100%', 'Panadería', 215.0, 6.8, 41.0, 1.5, 8.0, '1 rebanada (50g)', NULL),
    ('Tortitas de Arroz Inflado', 'Snack', 385.0, 8.0, 82.0, 2.5, 2.8, '1 unidad (~8g)', NULL),
    ('Quinoa en Grano', 'Grano Seco', 368.0, 14.1, 64.2, 6.1, 7.0, '100g en seco', NULL),
    ('Cuscús de Trigo', 'En Seco', 360.0, 12.5, 73.0, 1.0, 3.5, '100g en seco', NULL),

    -- === LEGUMBRES ===
    ('Lentejas Cocidas', 'En Conserva', 116.0, 9.0, 20.0, 0.4, 7.9, '100g cocido', NULL),
    ('Garbanzos Cocidos', 'En Conserva', 139.0, 7.5, 22.0, 2.6, 6.5, '100g cocido', NULL),
    ('Alubias Blancas Cocidas', 'En Conserva', 118.0, 8.2, 19.5, 0.5, 6.8, '100g cocido', NULL),
    ('Soja Texturizada Fina', 'En Seco', 345.0, 50.0, 20.0, 2.0, 18.0, '100g en seco', NULL),
    ('Edamame (Soja tierna)', 'Fresco / Congelado', 122.0, 11.0, 8.9, 5.2, 5.2, '100g', NULL),
    ('Tofu Firme', 'Genérico', 144.0, 15.5, 2.5, 8.0, 1.5, '100g', NULL),

    -- === FRUTAS ===
    ('Plátano', 'Fresco', 89.0, 1.1, 23.0, 0.3, 2.6, '1 unidad mediana (~110g)', NULL),
    ('Manzana (con piel)', 'Fresco', 52.0, 0.3, 14.0, 0.2, 2.4, '1 unidad mediana (~160g)', NULL),
    ('Fresas Frescas', 'Fresco', 32.0, 0.7, 7.7, 0.3, 2.0, '100g', NULL),
    ('Arándanos Frescos', 'Fresco', 57.0, 0.7, 14.5, 0.3, 2.4, '100g', NULL),
    ('Naranja', 'Fresco', 47.0, 0.9, 11.8, 0.1, 2.4, '1 unidad (~150g)', NULL),
    ('Kiwi', 'Fresco', 61.0, 1.1, 14.7, 0.5, 3.0, '1 unidad (~80g)', NULL),
    ('Sandía', 'Fresco', 30.0, 0.6, 7.5, 0.2, 0.4, '100g', NULL),
    ('Aguacate Hass', 'Fresco', 160.0, 2.0, 8.5, 14.7, 6.7, '1/2 unidad (~80g)', NULL),
    ('Dátiles Medjool', 'Fruto Seco', 277.0, 1.8, 75.0, 0.2, 6.7, '1 unidad (~20g)', NULL),

    -- === VERDURAS Y HORTALIZAS ===
    ('Brócoli al Vapor / Crudo', 'Fresco', 34.0, 2.8, 6.6, 0.4, 2.6, '100g', NULL),
    ('Espinacas Frescas', 'Fresco', 23.0, 2.9, 3.6, 0.4, 2.2, '100g', NULL),
    ('Espárragos Verdes', 'Fresco', 20.0, 2.2, 3.9, 0.1, 2.1, '100g', NULL),
    ('Tomate de Ensalada', 'Fresco', 18.0, 0.9, 3.9, 0.2, 1.2, '100g', NULL),
    ('Pepino', 'Fresco', 15.0, 0.7, 3.6, 0.1, 0.5, '100g', NULL),
    ('Zanahoria Cruda', 'Fresco', 41.0, 0.9, 9.6, 0.2, 2.8, '100g', NULL),
    ('Champiñones / Setas', 'Fresco', 22.0, 3.1, 3.3, 0.3, 1.0, '100g', NULL),
    ('Calabacín con Piel', 'Fresco', 17.0, 1.2, 3.1, 0.3, 1.0, '100g', NULL),
    ('Pimiento Rojo', 'Fresco', 31.0, 1.0, 6.0, 0.3, 2.1, '100g', NULL),
    ('Pimiento Verde', 'Fresco', 20.0, 0.9, 4.6, 0.2, 1.7, '100g', NULL),
    ('Lechuga Romana / Iceberg', 'Fresco', 15.0, 1.4, 2.9, 0.2, 1.3, '100g', NULL),
    ('Cebolla', 'Fresco', 40.0, 1.1, 9.3, 0.1, 1.7, '100g', NULL),

    -- === FRUTOS SECOS Y GRASAS SALUDABLES ===
    ('Aceite de Oliva Virgen Extra (AOVE)', 'Genérico', 884.0, 0.0, 0.0, 100.0, 0.0, '1 cucharada (10ml = 88kcal)', NULL),
    ('Nueces Peladas', 'Genérico', 654.0, 15.2, 13.7, 65.2, 6.7, '25g', NULL),
    ('Almendras Naturales / Tostadas', 'Genérico', 579.0, 21.2, 21.6, 49.9, 12.5, '25g', NULL),
    ('Mantequilla de Cacahuete 100%', 'Genérico', 588.0, 25.0, 20.0, 50.0, 8.0, '1 cucharada (15g)', NULL),
    ('Semillas de Chía', 'Genérico', 486.0, 16.5, 42.1, 30.7, 34.4, '15g', NULL),
    ('Semillas de Lino Dorado', 'Genérico', 534.0, 18.3, 28.9, 42.2, 27.3, '15g', NULL),
    ('Chocolate Negro 85% Cacao', 'Genérico', 580.0, 9.5, 20.0, 48.0, 11.0, '1 onza (20g)', NULL)
ON CONFLICT DO NOTHING;
