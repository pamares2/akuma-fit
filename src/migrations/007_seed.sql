-- ============================================================================
-- 007_seed.sql: Datos iniciales de arranque para Akuma Fit
-- ============================================================================

-- 1. ETIQUETAS (TAGS) BÁSICAS PARA EJERCICIOS Y ALIMENTOS
INSERT INTO public.tag (name, category) VALUES
    ('Pecho', 'Muscular'),
    ('Espalda', 'Muscular'),
    ('Pierna', 'Muscular'),
    ('Hombro', 'Muscular'),
    ('Bíceps', 'Muscular'),
    ('Tríceps', 'Muscular'),
    ('Core', 'Muscular'),
    ('Fuerza', 'Objetivo'),
    ('Hipertrofia', 'Objetivo'),
    ('Proteína', 'Nutrición'),
    ('Carbohidratos', 'Nutrición'),
    ('Grasas Saludables', 'Nutrición'),
    ('Fruta', 'Nutrición'),
    ('Verdura', 'Nutrición'),
    ('Lácteo', 'Nutrición'),
    ('Vegano', 'Preferencia')
ON CONFLICT (name) DO NOTHING;

-- 2. BIBLIOTECA BASE DE EJERCICIOS (exercise_template)
INSERT INTO public.exercise_template (exercise_name, description, comments, category, creator) VALUES
    ('Press de Banca Plano', 'Ejercicio básico multiarticular de empuje horizontal para pectoral, tríceps y deltoides anterior.', 'Mantener retracción escapular y pies firmes en el suelo.', 'Pecho', NULL),
    ('Sentadilla Trasera con Barra', 'Ejercicio rey del tren inferior enfocado en cuádriceps, glúteos y core.', 'Romper el paralelo manteniendo la espalda neutra.', 'Pierna', NULL),
    ('Peso Muerto Convencional', 'Ejercicio de cadena posterior para isquiosurales, glúteos y espalda completa.', 'Barra pegada a las tibias; extender caderas y rodillas simultáneamente.', 'Espalda', NULL),
    ('Dominadas Pronas', 'Tracción vertical para el desarrollo de dorsales, bíceps y antebrazos.', 'Rango de movimiento completo, desde bloqueo hasta barbilla sobre la barra.', 'Espalda', NULL),
    ('Press Militar con Barra', 'Empuje vertical de pie para hombros, tríceps y estabilidad del core.', 'Apretar glúteos y abdomen durante todo el movimiento.', 'Hombro', NULL),
    ('Remo con Barra 45°', 'Tracción horizontal para espalda media, dorsal ancho y trapecio.', 'Tirar hacia la cadera manteniendo el torso estable.', 'Espalda', NULL),
    ('Fondos en Paralelas', 'Empuje en barras paralelas para pectoral inferior y tríceps.', 'Inclinarse ligeramente hacia adelante para mayor énfasis en pecho.', 'Pecho', NULL),
    ('Elevaciones Laterales con Mancuernas', 'Aislamiento para la cabeza lateral del deltoides.', 'Ligera flexión de codos y dirigir el codo hacia arriba.', 'Hombro', NULL),
    ('Curl de Bíceps con Barra Z', 'Aislamiento para flexores de codo.', 'Mantener codos pegados a los costados sin balanceo de cadera.', 'Bíceps', NULL),
    ('Extensiones de Tríceps en Polea', 'Aislamiento de la cabeza lateral y medial del tríceps.', 'Extender completamente abajo abriendo la cuerda.', 'Tríceps', NULL),
    ('Prensa de Piernas 45°', 'Trabajo guiado para cuádriceps y glúteos.', 'Pies a anchura de hombros; no bloquear rodillas al final.', 'Pierna', NULL),
    ('Hip Thrust con Barra', 'Aislamiento y sobrecarga máxima para glúteo mayor.', 'Bloquear arriba contrayendo glúteos con la pelvis neutra.', 'Pierna', NULL),
    ('Plancha Abdominal', 'Ejercicio isométrico para fortalecimiento del core profundo.', 'Línea recta cabeza-talones; activar glúteos y transverso.', 'Core', NULL)
ON CONFLICT DO NOTHING;

-- 3. ALIMENTOS BÁSICOS CON VALORES NUTRICIONALES POR 100g (food)
INSERT INTO public.food (name, brand, calories, protein, carbs, fat, fiber, serving_size, created_by) VALUES
    ('Pechuga de Pollo', 'Genérico', 120, 22.5, 0.0, 2.6, 0.0, '100g', NULL),
    ('Arroz Blanco', 'Genérico', 130, 2.7, 28.2, 0.3, 0.4, '100g cocido', NULL),
    ('Huevo Entero', 'Genérico', 143, 12.6, 0.7, 9.5, 0.0, '1 unidad (~55g)', NULL),
    ('Avena en Copos', 'Genérico', 389, 16.9, 66.3, 6.9, 10.6, '100g', NULL),
    ('Salmón Fresco', 'Genérico', 208, 20.4, 0.0, 13.4, 0.0, '100g', NULL),
    ('Ternera Magra', 'Genérico', 143, 21.5, 0.0, 5.8, 0.0, '100g', NULL),
    ('Plátano', 'Genérico', 89, 1.1, 22.8, 0.3, 2.6, '1 unidad mediana', NULL),
    ('Aceite de Oliva Virgen Extra', 'Genérico', 884, 0.0, 0.0, 100.0, 0.0, '1 cucharada (15ml)', NULL),
    ('Almendras Naturales', 'Genérico', 579, 21.2, 21.6, 49.9, 12.5, '30g', NULL),
    ('Yogur Griego Natural', 'Genérico', 97, 9.0, 3.6, 5.0, 0.0, '125g', NULL),
    ('Atún Claro al Natural', 'Genérico', 101, 23.5, 0.0, 0.8, 0.0, 'Lata escurrida (60g)', NULL),
    ('Patata Cocida', 'Genérico', 86, 1.7, 20.0, 0.1, 1.8, '100g', NULL),
    ('Brócoli al Vapor', 'Genérico', 34, 2.8, 6.6, 0.4, 2.6, '100g', NULL),
    ('Aguacate', 'Genérico', 160, 2.0, 8.5, 14.7, 6.7, '100g', NULL)
ON CONFLICT DO NOTHING;

-- 4. FUNCIÓN AUXILIAR PARA ASCENDER CUALQUIER USUARIO A ENTRENADOR (COACH)
-- Uso en el SQL Editor de Supabase:
-- SELECT public.promote_to_coach('tu_email@ejemplo.com');
CREATE OR REPLACE FUNCTION public.promote_to_coach(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_profile_id bigint;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    IF v_user_id IS NULL THEN
        RETURN 'Error: No se encontró ningún usuario registrado con el email ' || p_email;
    END IF;

    SELECT id INTO v_profile_id FROM public.profile WHERE user_id = v_user_id;
    IF v_profile_id IS NULL THEN
        INSERT INTO public.profile (user_id, name, surname, role)
        VALUES (v_user_id, split_part(p_email, '@', 1), '', 'coach')
        RETURNING id INTO v_profile_id;
        RETURN 'Perfil creado exitosamente como coach para ' || p_email;
    ELSE
        UPDATE public.profile SET role = 'coach' WHERE id = v_profile_id;
        RETURN 'El perfil de ' || p_email || ' ha sido actualizado al rol "coach" exitosamente.';
    END IF;
END;
$$;
