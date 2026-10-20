-- ==============================================================================
-- SOLUCIÓN DEFINITIVA: VISIBILIDAD DE EJERCICIOS EN AKUMA FIT
-- ==============================================================================

-- 1. Eliminar la restricción que ocultaba ejercicios globales sin creador
DROP POLICY IF EXISTS "exercise_template_select_own" ON public.exercise_template;
DROP POLICY IF EXISTS "exercise_template_select_all" ON public.exercise_template;
DROP POLICY IF EXISTS "exercise_template_read_all" ON public.exercise_template;

-- 2. Permitir que cualquier usuario autenticado (entrenador y clientes) vea TODOS los ejercicios
CREATE POLICY "exercise_template_select_all" ON public.exercise_template 
FOR SELECT TO authenticated 
USING (true);

-- 3. Permitir inserciones a usuarios autenticados
DROP POLICY IF EXISTS "exercise_template_insert_all" ON public.exercise_template;
CREATE POLICY "exercise_template_insert_all" ON public.exercise_template 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- 4. Limpiar ejercicios anteriores sin afectar a rutinas existentes
DELETE FROM public.exercise_template 
WHERE id NOT IN (
    SELECT COALESCE(exercise_template, 0) FROM public.routine_has_exercise_template
);

-- 5. Insertar el catálogo completo de 74 ejercicios organizados por grupo muscular
INSERT INTO public.exercise_template (exercise_name, description, comments, category) VALUES
    ('Press de Banca Plano con Barra', 'Ejercicio básico multiarticular de empuje horizontal con barra recta.', 'Mantener retracción escapular, arco lumbar natural y pies firmes.', 'Pecho'),
    ('Press de Banca con Mancuernas', 'Empuje horizontal con mancuernas para mayor rango de movimiento y trabajo unilateral.', 'Bajar controlado abriendo ligeramente los codos sin forzar los hombros.', 'Pecho'),
    ('Press Inclinado con Barra', 'Empuje en banco inclinado (30º-45º) con barra enfocado en haz clavicular del pectoral.', 'Bajar la barra a la parte alta del pecho con control.', 'Pecho'),
    ('Press Inclinado con Mancuernas', 'Empuje en banco inclinado con mancuernas para hipertrofia de la porción superior del pectoral.', 'Excelente para convergencia en la parte alta del movimiento.', 'Pecho'),
    ('Press Declinado con Barra', 'Empuje en banco declinado con énfasis en la porción inferior del pectoral.', 'Cuidado con la descompresión al bloquear los codos.', 'Pecho'),
    ('Press de Pecho en Máquina Convergente', 'Empuje en máquina guiada con trayectoria convergente.', 'Seguro para entrenar al fallo muscular sin necesidad de spotter.', 'Pecho'),
    ('Aperturas con Mancuernas en Banco Plano', 'Aislamiento de pectoral en estiramiento con mancuernas.', 'Ligera flexión fija en los codos durante todo el recorrido.', 'Pecho'),
    ('Aperturas en Máquina Contractora (Peck Deck)', 'Aislamiento guiado del pectoral con tensión constante.', 'Apretar 1 segundo en máxima contracción en el centro.', 'Pecho'),
    ('Cruces en Polea Alta', 'Aislamiento de pectoral inferior y medio mediante cruce de cables.', 'Torso ligeramente inclinado hacia adelante y core firme.', 'Pecho'),
    ('Cruces en Polea Baja', 'Aislamiento de pectoral superior llevando las manijas de abajo hacia arriba.', 'Mantener el pecho erguido y hombros atrás.', 'Pecho'),
    ('Fondos en Paralelas para Pecho', 'Empuje con peso corporal inclinando el torso hacia adelante.', 'Bajar hasta formar un ángulo de 90º en el codo.', 'Pecho'),
    ('Flexiones de Brazos (Push-Ups)', 'Empuje con peso corporal sobre el suelo.', 'Mantener el cuerpo como una tabla recta activando abdomen y glúteos.', 'Pecho'),
    ('Dominadas Pronadas', 'Tracción vertical con agarre prono abierto para desarrollo de dorsales.', 'Rango de movimiento completo desde el bloqueo hasta la barbilla sobre la barra.', 'Espalda'),
    ('Dominadas Supinadas (Chin-Ups)', 'Tracción vertical con agarre supino con gran implicación del bíceps.', 'Tirar con los codos hacia abajo y hacia el torso.', 'Espalda'),
    ('Dominadas Neutras', 'Tracción vertical con palmas enfrentadas, muy amigable con los hombros.', 'Gran activación del dorsal y braquial.', 'Espalda'),
    ('Jalón al Pecho en Polea Alta (Agarre Ancho)', 'Tracción vertical guiada para amplitud dorsal.', 'Llevar la barra a la parte alta del esternón sin balanceos exagerados.', 'Espalda'),
    ('Jalón al Pecho con Agarre Neutro/Estrecho', 'Tracción vertical con agarre cerrado enfocado en el dorsal medio y bajo.', 'Permite una tracción profunda con mayor recorrido.', 'Espalda'),
    ('Remo con Barra a 45º', 'Tracción horizontal básica pesada para densidad de espalda y trapecios.', 'Mantener espalda neutra y tirar hacia la cintura o ombligo.', 'Espalda'),
    ('Remo Pendlay con Barra', 'Remo con salida desde el suelo en cada repetición para potencia.', 'Espalda estrictamente paralela al suelo.', 'Espalda'),
    ('Remo con Mancuerna a Una Mano', 'Tracción unilateral con apoyo en banco para dorsal y romboides.', 'Tirar con el codo hacia la cadera sin rotar bruscamente el torso.', 'Espalda'),
    ('Remo en Polea Baja (Gironda)', 'Tracción horizontal en polea sentado con agarre estrecho.', 'Pecho erguido, estirar bien adelante y apretar atrás.', 'Espalda'),
    ('Remo en Máquina Hammer Strength', 'Remo guiado en máquina con palanca y apoyo en el pecho.', 'Elimina la fatiga lumbar para aislar la espalda al máximo.', 'Espalda'),
    ('Remo en Barra T con Apoyo de Pecho', 'Remo en barra en T apoyado en banco inclinado.', 'Máximo trabajo de romboides y trapecios medios sin carga espinal.', 'Espalda'),
    ('Pullover en Polea Alta con Cuerda / Barra', 'Aislamiento de dorsales en empuje/tracción recta con brazos estirados.', 'Gran estiramiento del dorsal ancho sin flexionar los codos.', 'Espalda'),
    ('Peso Muerto Convencional con Barra', 'El rey de la cadena posterior: erectores espinales, glúteos, isquios e isometría completa.', 'Barra pegada a las tibias, bloquear empujando el suelo con las piernas.', 'Espalda'),
    ('Hiperextensiones Lumbar a 45º', 'Fortalecimiento de erectores espinales y cadena posterior.', 'Extender hasta alinear el torso sin hiperextender bruscamente.', 'Espalda'),
    ('Press Militar con Barra de Pie', 'Empuje vertical multiarticular básico de fuerza para deltoides.', 'Apretar glúteos y abdomen, pasar la cabeza bajo la barra al subir.', 'Hombro'),
    ('Press Militar con Barra Sentado', 'Empuje vertical sentado para deltoides anterior y lateral con menor demanda de equilibrio.', 'Bajar la barra justo por debajo del mentón.', 'Hombro'),
    ('Press de Hombros con Mancuernas', 'Empuje vertical sentado con mancuernas para recorrido independiente.', 'Evitar arquear excesivamente la zona lumbar.', 'Hombro'),
    ('Press de Hombros en Máquina', 'Empuje vertical en máquina guiada para trabajo seguro y pesado.', 'Ajustar la altura del asiento para que los agarres queden a la altura de las orejas.', 'Hombro'),
    ('Elevaciones Laterales con Mancuernas', 'Aislamiento imprescindible para el deltoides lateral (amplitud de hombro).', 'Ligeramente inclinado hacia adelante, subir guiando con los codos.', 'Hombro'),
    ('Elevaciones Laterales en Polea Baja', 'Aislamiento lateral con tensión continua en todo el rango.', 'Cruzar el cable por detrás o delante del cuerpo.', 'Hombro'),
    ('Pájaros con Mancuernas (Deltoides Posterior)', 'Aislamiento del deltoides posterior y romboides con torso inclinado.', 'Separar los brazos como alas manteniendo codos ligeramente flexionados.', 'Hombro'),
    ('Deltoides Posterior en Máquina Contractora Inversa', 'Máquina peck deck en reversa para aislamiento posterior guiado.', 'Mantener hombros deprimidos para evitar que domine el trapecio superior.', 'Hombro'),
    ('Face Pull en Polea con Cuerda', 'Salud del hombro, rotadores externos y deltoides posterior.', 'Tirar de la cuerda hacia los ojos abriendo las manos al final.', 'Hombro'),
    ('Elevaciones Frontales con Mancuerna / Disco', 'Aislamiento de la porción anterior del deltoides.', 'Subir hasta la altura de los ojos de forma controlada.', 'Hombro'),
    ('Encogimientos de Hombros con Mancuernas / Barra', 'Sobrecarga y aislamiento del trapecio superior.', 'Subir los hombros en línea recta hacia las orejas sin rotar.', 'Hombro'),
    ('Sentadilla Trasera con Barra', 'El ejercicio rey del tren inferior: cuádriceps, glúteos, aductores y core.', 'Romper el paralelo manteniendo la espalda neutra y rodillas alineadas.', 'Pierna'),
    ('Sentadilla Frontal con Barra', 'Sentadilla con barra apoyada en deltoides frontales, mayor énfasis en cuádriceps.', 'Torso completamente vertical y codos bien altos.', 'Pierna'),
    ('Prensa de Piernas Inclinada a 45º', 'Sobrecarga masiva de cuádriceps y glúteos en máquina guiada.', 'Bajar profundo sin despegar el sacro del respaldo.', 'Pierna'),
    ('Sentadilla Hack en Máquina', 'Sentadilla guiada sobre rieles para aislamiento supremo de cuádriceps.', 'Permite profundidad extrema con máxima seguridad lumbar.', 'Pierna'),
    ('Extensiones de Cuádriceps en Máquina', 'Aislamiento puro de los cuatro vientres del cuádriceps.', 'Pausar 1 segundo arriba en máxima contracción.', 'Pierna'),
    ('Sentadilla Búlgara con Mancuernas', 'Ejercicio unilateral demoledor para cuádriceps y glúteo.', 'Pie trasero apoyado en banco, bajar vertical con control.', 'Pierna'),
    ('Zancadas Caminando con Mancuernas', 'Trabajo dinámico unilateral para fuerza y estabilidad.', 'Pasos amplios y rodilla trasera casi tocando el suelo.', 'Pierna'),
    ('Peso Muerto Rumano con Barra', 'Estiramiento y carga excéntrica máxima en isquiosurales y glúteos.', 'Empujar la cadera hacia atrás manteniendo las rodillas semi-flexionadas fijas.', 'Pierna'),
    ('Peso Muerto Rumano con Mancuernas', 'Variante con mancuernas para mayor libertad en el agarre y postura.', 'Bajar las mancuernas pegadas a las piernas sintiendo el estiramiento.', 'Pierna'),
    ('Curl Femoral Tumbado en Máquina', 'Aislamiento de isquiosurales en flexión de rodilla recostado.', 'Mantener la pelvis pegada al banco sin arquear la espalda.', 'Pierna'),
    ('Curl Femoral Sentado en Máquina', 'Aislamiento de isquiosurales con cadera en flexión.', 'Uno de los ejercicios más efectivos para hipertrofia de isquios.', 'Pierna'),
    ('Hip Thrust con Barra en Banco', 'Máxima activación y sobrecarga del glúteo mayor.', 'Bloquear arriba apretando glúteos con la pelvis neutra y barbilla al pecho.', 'Pierna'),
    ('Hip Thrust en Máquina', 'Versión guiada en máquina para comodidad de carga en cadera.', 'Excelente para repeticiones al fallo sin molestias de barra.', 'Pierna'),
    ('Abductores en Máquina Sentado', 'Aislamiento para glúteo medio y menor.', 'Abrir completamente y controlar la fase de retorno.', 'Pierna'),
    ('Aductores en Máquina Sentado', 'Aislamiento para la cara interna del muslo (aductores).', 'Cerrar con control y apretar al final.', 'Pierna'),
    ('Elevación de Talones de Pie en Máquina', 'Sobrecarga del gastrocnemio (gemelos) con rodillas extendidas.', 'Bajar a estiramiento completo y subir hasta la punta de los dedos.', 'Pierna'),
    ('Elevación de Talones Sentado en Máquina', 'Aislamiento del músculo sóleo con rodillas flexionadas a 90º.', 'Pausa de 2 segundos en el fondo del estiramiento.', 'Pierna'),
    ('Curl de Bíceps con Barra Recta', 'Sobrecarga básica con barra para masa de bíceps.', 'Codos pegados al cuerpo, sin balanceos de torso.', 'Bíceps'),
    ('Curl de Bíceps con Barra Z', 'Más ergonómico para muñecas y antebrazos que la barra recta.', 'Excelente para series pesadas.', 'Bíceps'),
    ('Curl de Bíceps Alterno con Mancuernas', 'Trabajo unilateral con supinación de muñeca durante el ascenso.', 'Girar la palma hacia arriba en la subida para máxima contracción.', 'Bíceps'),
    ('Curl Martillo con Mancuernas', 'Énfasis en braquiorradial y braquial anterior (grosor de brazo).', 'Palmas mirándose entre sí durante todo el trayecto.', 'Bíceps'),
    ('Curl de Bíceps en Banco Scott / Predicador', 'Aislamiento estricto impidiendo cualquier ayuda del hombro o espalda.', 'Bajar con control sin llegar a hiper-extender de golpe.', 'Bíceps'),
    ('Curl Concentrado con Mancuerna Sentado', 'Aislamiento clásico para el pico del bíceps con codo apoyado en el muslo.', 'Subir hasta tocar el pectoral superior sin mover el codo.', 'Bíceps'),
    ('Curl en Polea Baja con Barra / Cuerda', 'Tensión continua durante todo el recorrido gracias al cable.', 'Mantener la tensión incluso al inicio de la repetición.', 'Bíceps'),
    ('Extensiones de Tríceps en Polea Alta con Cuerda', 'Aislamiento de la cabeza lateral y medial del tríceps.', 'Abrir la cuerda en la parte inferior contrayendo fuerte.', 'Tríceps'),
    ('Extensiones de Tríceps en Polea con Barra', 'Permite manejar más peso para sobrecarga de tríceps.', 'Codos pegados a los costados y torso ligeramente inclinado.', 'Tríceps'),
    ('Press Francés con Barra Z en Banco Plano', 'Aislamiento para la cabeza larga del tríceps.', 'Bajar la barra hacia la frente o coronilla manteniendo codos cerrados.', 'Tríceps'),
    ('Extensión de Tríceps sobre la Cabeza con Mancuerna', 'Gran estiramiento de la cabeza larga del tríceps.', 'Sujetar la mancuerna con ambas manos tras la cabeza.', 'Tríceps'),
    ('Extensión de Tríceps en Polea sobre la Cabeza', 'Variante con cable para tensión continua en la cabeza larga.', 'Mantener el codo apuntando al frente.', 'Tríceps'),
    ('Fondos entre Bancos para Tríceps', 'Empuje con peso corporal sobre banco plano.', 'Mantener la espalda pegada al banco para no forzar los hombros.', 'Tríceps'),
    ('Plancha Abdominal Frontal', 'Estabilidad isométrica de transverso abdominal y pared central.', 'Cuerpo recto alineado de cabeza a talones, glúteos y core apretados.', 'Core'),
    ('Plancha Lateral', 'Estabilidad isométrica de oblicuos y cuadrado lumbar.', 'Apoyo en antebrazo y lateral del pie manteniendo cadera arriba.', 'Core'),
    ('Rueda Abdominal (Ab Wheel)', 'Ejercicio avanzado de anti-extensión del core con enorme tensión excéntrica.', 'Mantener la pelvis en retroversión, no arquear la zona lumbar.', 'Core'),
    ('Elevaciones de Piernas Colgado en Barra', 'Flexión de cadera y columna lumbar para abdomen inferior.', 'Subir las rodillas o pies hacia el pecho sin columpiarse.', 'Core'),
    ('Crunch Abdominal en Polea Alta', 'Crunch con resistencia progresiva arrodillado frente a la polea.', 'Flexionar la columna enrollando el torso hacia la pelvis.', 'Core'),
    ('Crunch en Máquina Abdominal', 'Trabajo guiado con selector de placas para hipertrofia abdominal.', 'Movimiento lento y contracción sostenida.', 'Core'),
    ('Vacío Abdominal (Stomach Vacuum)', 'Activación profunda del músculo transverso para cintura estrecha.', 'Expulsar todo el aire y meter el ombligo hacia la columna.', 'Core');
