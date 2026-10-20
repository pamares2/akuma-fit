-- 001: tipos enumerados protegidos
DO $$ BEGIN
    CREATE TYPE public.adherence AS ENUM ('Totalmente', 'Parcialmente', 'Nada');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.gender AS ENUM ('Hombre', 'Mujer', 'Prefiero no decirlo');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.role AS ENUM ('admin', 'coach', 'client');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 002: tablas del esquema public, ordenadas por dependencias de claves foráneas.

CREATE TABLE public.profile (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    user_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name text NOT NULL DEFAULT 'no name'::text,
    surname text NOT NULL DEFAULT 'no surname'::text,
    role public.role NOT NULL DEFAULT 'client'::public.role,
    birthdate date,
    gender public.gender,
    CONSTRAINT profile_pkey PRIMARY KEY (id),
    CONSTRAINT profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.initial_assessment (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    goals character varying,
    deadline character varying,
    motivation_level smallint,
    past character varying,
    current_level character varying,
    training_freq character varying,
    time_per_session character varying,
    "where" character varying,
    equipment character varying,
    disease character varying,
    medication character varying,
    current_injuries character varying,
    medical_restrictions character varying,
    daily_activity character varying,
    sleep_time character varying,
    current_stress_level smallint,
    current_diet character varying,
    food_restrictions character varying,
    water character varying,
    expected_adherence smallint,
    profile_id bigint UNIQUE,
    height double precision NOT NULL,
    data_consent boolean NOT NULL DEFAULT false,
    CONSTRAINT initial_assessment_pkey PRIMARY KEY (id),
    CONSTRAINT initial_assessment_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);

CREATE TABLE public.measurement (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    weight double precision NOT NULL,
    profile_id bigint NOT NULL,
    chest double precision,
    waist double precision,
    hip double precision,
    CONSTRAINT measurement_pkey PRIMARY KEY (id),
    CONSTRAINT measurement_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);

CREATE TABLE public.check_in (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    how_do_you_feel character varying NOT NULL,
    hunger_level smallint NOT NULL,
    rest_quality smallint NOT NULL,
    comments character varying,
    profile_id bigint NOT NULL,
    diet_adherence public.adherence NOT NULL,
    training_adherence public.adherence NOT NULL,
    diet_adherence_reason text,
    training_adherence_reason text,
    gym_performance integer NOT NULL,
    avg_daily_steps text,
    cardio_adherence text NOT NULL,
    avg_sleep_hours text,
    energy_level integer NOT NULL,
    next_week_goal text,
    CONSTRAINT check_in_pkey PRIMARY KEY (id),
    CONSTRAINT check_in_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);

CREATE TABLE public.exercise_template (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    exercise_name character varying,
    description character varying,
    comments character varying,
    category character varying,
    creator bigint,
    CONSTRAINT exercise_template_pkey PRIMARY KEY (id),
    CONSTRAINT exercise_template_creator_fkey FOREIGN KEY (creator) REFERENCES public.profile(id)
);

CREATE TABLE public.avatar (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    profile_id bigint,
    avatar_uid uuid DEFAULT gen_random_uuid(),
    CONSTRAINT avatar_pkey PRIMARY KEY (id),
    CONSTRAINT avatar_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);

CREATE TABLE public.body_photo (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    profile_id bigint,
    position text,
    storage_path text,
    taken_at date NOT NULL,
    CONSTRAINT body_photo_pkey PRIMARY KEY (id),
    CONSTRAINT body_photo_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);

CREATE TABLE public.routine (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    title character varying,
    coach_comment character varying,
    creator bigint,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT routine_pkey PRIMARY KEY (id),
    CONSTRAINT rutine_creator_fkey FOREIGN KEY (creator) REFERENCES public.profile(id)
);

CREATE TABLE public.set_template (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    "order" bigint NOT NULL,
    reps character varying NOT NULL,
    kg character varying,
    type character varying NOT NULL,
    CONSTRAINT set_template_pkey PRIMARY KEY (id)
);

CREATE TABLE public.routine_has_exercise_template (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    routine bigint NOT NULL,
    exercise_template bigint NOT NULL,
    position integer NOT NULL DEFAULT 1,
    CONSTRAINT routine_has_exercise_template_pkey PRIMARY KEY (id),
    CONSTRAINT rutine_has_exercise_template_rutine_fkey FOREIGN KEY (routine) REFERENCES public.routine(id),
    CONSTRAINT rutine_has_exercise_template_exercise_template_fkey FOREIGN KEY (exercise_template) REFERENCES public.exercise_template(id)
);

CREATE TABLE public.exercise_template_has_set_template (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    exercise_template bigint NOT NULL,
    set_template bigint NOT NULL,
    CONSTRAINT exercise_template_has_set_template_pkey PRIMARY KEY (id),
    CONSTRAINT exercise_template_has_set_template_exercise_template_fkey FOREIGN KEY (exercise_template) REFERENCES public.exercise_template(id),
    CONSTRAINT exercise_template_has_set_template_set_template_fkey FOREIGN KEY (set_template) REFERENCES public.set_template(id)
);

CREATE TABLE public.profile_has_routine (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    profile bigint,
    routine bigint,
    CONSTRAINT profile_has_routine_pkey PRIMARY KEY (id),
    CONSTRAINT profile_has_routine_profile_fkey FOREIGN KEY (profile) REFERENCES public.profile(id),
    CONSTRAINT profile_has_routine_routine_fkey FOREIGN KEY (routine) REFERENCES public.routine(id)
);

CREATE TABLE public.tag (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    name character varying NOT NULL UNIQUE,
    category character varying,
    CONSTRAINT tag_pkey PRIMARY KEY (id)
);

CREATE TABLE public.exercise_template_has_tag (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    exercise_template bigint NOT NULL,
    tag bigint NOT NULL,
    CONSTRAINT exercise_template_has_tag_pkey PRIMARY KEY (id),
    CONSTRAINT exercise_template_has_tag_exercise_template_fkey FOREIGN KEY (exercise_template) REFERENCES public.exercise_template(id),
    CONSTRAINT exercise_template_has_tag_tag_fkey FOREIGN KEY (tag) REFERENCES public.tag(id)
);

CREATE TABLE public.training_session (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    profile_id bigint NOT NULL,
    routine_id bigint NOT NULL,
    started_at timestamp with time zone NOT NULL DEFAULT now(),
    ended_at timestamp with time zone,
    completed boolean NOT NULL DEFAULT false,
    status character varying NOT NULL DEFAULT 'active'::character varying
        CHECK (status::text = ANY (ARRAY['active'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
    feeling character varying,
    notes text,
    CONSTRAINT training_session_pkey PRIMARY KEY (id),
    CONSTRAINT training_session_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id),
    CONSTRAINT training_session_routine_id_fkey FOREIGN KEY (routine_id) REFERENCES public.routine(id)
);

CREATE TABLE public.completed_exercise (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    session_id bigint NOT NULL,
    exercise_template_id bigint NOT NULL,
    exercise_order integer NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    completed_at timestamp with time zone,
    rpe integer,
    CONSTRAINT completed_exercise_pkey PRIMARY KEY (id),
    CONSTRAINT completed_exercise_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.training_session(id),
    CONSTRAINT completed_exercise_exercise_template_id_fkey FOREIGN KEY (exercise_template_id) REFERENCES public.exercise_template(id)
);

CREATE TABLE public.completed_set (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    completed_exercise_id bigint NOT NULL,
    set_order integer NOT NULL,
    reps_completed integer,
    kg_used double precision,
    type character varying NOT NULL,
    CONSTRAINT completed_set_pkey PRIMARY KEY (id),
    CONSTRAINT completed_set_completed_exercise_id_fkey FOREIGN KEY (completed_exercise_id) REFERENCES public.completed_exercise(id)
);

CREATE TABLE public.food (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    name character varying NOT NULL,
    brand character varying,
    calories double precision,
    protein double precision,
    carbs double precision,
    fat double precision,
    fiber double precision,
    serving_size character varying,
    created_by bigint,
    CONSTRAINT food_pkey PRIMARY KEY (id),
    CONSTRAINT food_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profile(id)
);

CREATE TABLE public.food_has_tag (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    food_id bigint NOT NULL,
    tag_id bigint NOT NULL,
    CONSTRAINT food_has_tag_pkey PRIMARY KEY (id),
    CONSTRAINT food_has_tag_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.food(id),
    CONSTRAINT food_has_tag_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tag(id)
);

CREATE TABLE public.recipe (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    name character varying NOT NULL,
    description text,
    instructions text,
    preparation_time integer,
    servings integer NOT NULL DEFAULT 1,
    created_by bigint,
    CONSTRAINT recipe_pkey PRIMARY KEY (id),
    CONSTRAINT recipe_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profile(id)
);

CREATE TABLE public.recipe_food (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    recipe_id bigint NOT NULL,
    food_id bigint NOT NULL,
    quantity_g double precision NOT NULL,
    notes character varying,
    CONSTRAINT recipe_food_pkey PRIMARY KEY (id),
    CONSTRAINT recipe_food_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id),
    CONSTRAINT recipe_food_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.food(id)
);

CREATE TABLE public.recipe_has_tag (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    recipe_id bigint NOT NULL,
    tag_id bigint NOT NULL,
    CONSTRAINT recipe_has_tag_pkey PRIMARY KEY (id),
    CONSTRAINT recipe_has_tag_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id),
    CONSTRAINT recipe_has_tag_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tag(id)
);

CREATE TABLE public.meal_plan (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    title character varying NOT NULL,
    description text,
    target_calories double precision,
    target_protein double precision,
    target_carbs double precision,
    target_fat double precision,
    created_by bigint,
    CONSTRAINT meal_plan_pkey PRIMARY KEY (id),
    CONSTRAINT meal_plan_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profile(id)
);

CREATE TABLE public.profile_has_meal_plan (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    profile_id bigint NOT NULL,
    meal_plan_id bigint NOT NULL,
    CONSTRAINT profile_has_meal_plan_pkey PRIMARY KEY (id),
    CONSTRAINT profile_has_meal_plan_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id),
    CONSTRAINT profile_has_meal_plan_meal_plan_id_fkey FOREIGN KEY (meal_plan_id) REFERENCES public.meal_plan(id)
);

CREATE TABLE public.meal_plan_day (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    meal_plan_id bigint NOT NULL,
    day_order integer NOT NULL,
    label character varying,
    CONSTRAINT meal_plan_day_pkey PRIMARY KEY (id),
    CONSTRAINT meal_plan_day_meal_plan_id_fkey FOREIGN KEY (meal_plan_id) REFERENCES public.meal_plan(id)
);

CREATE TABLE public.meal_plan_slot (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    day_id bigint NOT NULL,
    slot_order integer NOT NULL,
    label character varying NOT NULL,
    CONSTRAINT meal_plan_slot_pkey PRIMARY KEY (id),
    CONSTRAINT meal_plan_slot_day_id_fkey FOREIGN KEY (day_id) REFERENCES public.meal_plan_day(id)
);

CREATE TABLE public.meal_plan_item (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    slot_id bigint NOT NULL,
    item_order integer NOT NULL,
    recipe_id bigint,
    food_id bigint,
    quantity_g double precision,
    servings double precision,
    notes character varying,
    CONSTRAINT meal_plan_item_pkey PRIMARY KEY (id),
    CONSTRAINT meal_plan_item_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.meal_plan_slot(id),
    CONSTRAINT meal_plan_item_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipe(id),
    CONSTRAINT meal_plan_item_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.food(id)
);

-- Módulo de eventos / calendario.
--
-- `calendar_event` es el evento "maestro": almacena la regla de recurrencia
-- (RFC 5545 RRULE) o, si `freq` es NULL o 'once', un evento único. Los eventos
-- fijos del sistema (mediciones semanales el lunes y check-in el domingo) no se
-- persisten: se generan en el cliente.
--
-- `calendar_event_exception` modela EXDATE (status 'cancelled') y los
-- overrides RECURRENCE-ID (status 'modified') por ocurrencia concreta.
CREATE TABLE public.calendar_event (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    profile_id bigint NOT NULL,
    created_by bigint,
    event_type text NOT NULL,
    title text NOT NULL,
    description text,
    dtstart date NOT NULL,
    start_time time without time zone,
    freq text,
    recurrence_interval smallint NOT NULL DEFAULT 1,
    byday smallint,
    bymonthday smallint,
    bymonth smallint,
    count integer,
    until date,
    routine_id bigint,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT calendar_event_pkey PRIMARY KEY (id),
    CONSTRAINT calendar_event_event_type_check CHECK (event_type = ANY (ARRAY['training'::text, 'info'::text, 'photos'::text])),
    CONSTRAINT calendar_event_freq_check CHECK (freq IS NULL OR freq = ANY (ARRAY['once'::text, 'weekly'::text, 'monthly'::text, 'yearly'::text])),
    CONSTRAINT calendar_event_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id),
    CONSTRAINT calendar_event_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profile(id),
    CONSTRAINT calendar_event_routine_id_fkey FOREIGN KEY (routine_id) REFERENCES public.routine(id)
);

CREATE TABLE public.calendar_event_exception (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    event_id bigint NOT NULL,
    recurrence_id date NOT NULL,
    status text NOT NULL,
    new_date date,
    new_start_time time without time zone,
    title text,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT calendar_event_exception_pkey PRIMARY KEY (id),
    CONSTRAINT calendar_event_exception_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.calendar_event(id),
    CONSTRAINT calendar_event_exception_event_id_recurrence_id_key UNIQUE (event_id, recurrence_id),
    CONSTRAINT calendar_event_exception_status_check CHECK (status = ANY (ARRAY['cancelled'::text, 'modified'::text]))
);
-- 003: funciones. Deben crearse antes de las políticas RLS que las usan.

-- Id del perfil del usuario autenticado.
CREATE OR REPLACE FUNCTION public.get_profile_id()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT id FROM public.profile WHERE user_id = auth.uid();
$function$;

-- Indica si el usuario autenticado tiene rol coach.
CREATE OR REPLACE FUNCTION public.is_coach()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.profile
        WHERE user_id = auth.uid() AND role = 'coach'
    );
$function$;

-- Últimos N check-ins de cada perfil indicado.
CREATE OR REPLACE FUNCTION public.get_recent_checkins_per_profile(p_profile_ids bigint[], p_limit_per_profile integer DEFAULT 3)
 RETURNS SETOF check_in
 LANGUAGE sql
 STABLE
AS $function$
    SELECT
        ci.id,
        ci.created_at,
        ci.how_do_you_feel,
        ci.hunger_level,
        ci.rest_quality,
        ci.comments,
        ci.profile_id,
        ci.diet_adherence,
        ci.training_adherence,
        ci.diet_adherence_reason,
        ci.training_adherence_reason,
        ci.gym_performance,
        ci.avg_daily_steps,
        ci.cardio_adherence,
        ci.avg_sleep_hours,
        ci.energy_level,
        ci.next_week_goal
    FROM (
        SELECT
            c.*,
            ROW_NUMBER() OVER (
                PARTITION BY c.profile_id
                ORDER BY c.created_at DESC
            ) AS rn
        FROM public.check_in c
        WHERE c.profile_id = ANY(p_profile_ids)
    ) ci
    WHERE ci.rn <= p_limit_per_profile;
$function$;

-- Parte una serie recurrente en dos ("editar esta y las siguientes").
-- Corta el maestro original con `until` justo antes de `p_from_date` y crea un
-- maestro nuevo a partir de esa fecha con los valores indicados, de forma
-- atómica (una sola transacción).
CREATE OR REPLACE FUNCTION public.split_calendar_event(p_event_id bigint, p_from_date date, p_title text, p_description text, p_start_time time without time zone, p_freq text, p_interval smallint, p_byday smallint, p_bymonthday smallint, p_bymonth smallint, p_count integer, p_until date, p_routine_id bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_original public.calendar_event%ROWTYPE;
    v_new_id bigint;
BEGIN
    SELECT * INTO v_original FROM public.calendar_event WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evento no encontrado';
    END IF;

    UPDATE public.calendar_event
       SET until = p_from_date - 1
     WHERE id = p_event_id;

    INSERT INTO public.calendar_event (
        profile_id, created_by, event_type, title, description,
        dtstart, start_time, freq, recurrence_interval, byday, bymonthday, bymonth,
        count, until, routine_id, active
    )
    VALUES (
        v_original.profile_id,
        v_original.created_by,
        v_original.event_type,
        p_title,
        p_description,
        p_from_date,
        p_start_time,
        p_freq,
        p_interval,
        p_byday,
        p_bymonthday,
        p_bymonth,
        p_count,
        p_until,
        p_routine_id,
        true
    )
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$function$;

-- Crea una sesión de entrenamiento y precarga sus ejercicios desde la rutina.
CREATE OR REPLACE FUNCTION public.create_training_session(p_profile_id bigint, p_routine_id bigint)
 RETURNS training_session
 LANGUAGE plpgsql
AS $function$
declare
    v_session training_session;
begin
    insert into training_session (profile_id, routine_id, started_at, status)
    values (p_profile_id, p_routine_id, now(), 'active')
    returning * into v_session;

    insert into completed_exercise (session_id, exercise_template_id, exercise_order, completed)
    select
        v_session.id,
        rhe.exercise_template,
        row_number() over (order by rhe.position),
        false
    from routine_has_exercise_template rhe
    where rhe.routine = p_routine_id;

    return v_session;
end;
$function$;

-- Función auxiliar de Supabase que habilita RLS automáticamente en tablas
-- nuevas de `public`. El event trigger que la usa no está incluido en el
-- volcado de triggers; es opcional porque 004 ya activa RLS explícitamente
-- en todas las tablas. Descomenta si quieres replicar ese comportamiento.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

-- CREATE EVENT TRIGGER rls_auto_enable ON ddl_command_end
--   WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
--   EXECUTE FUNCTION public.rls_auto_enable();
-- 004: activar RLS en todas las tablas de public y crear sus políticas.
-- Requiere 003 (is_coach, get_profile_id).

ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initial_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_photo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_has_exercise_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_template_has_set_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_has_routine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_template_has_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_exercise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_set ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_has_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_food ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_has_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_has_meal_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_day ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_slot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_exception ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profile
-- ---------------------------------------------------------------------------
CREATE POLICY "profile_insert_own" ON public.profile AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profile_select_own" ON public.profile AS PERMISSIVE FOR SELECT TO public
    USING (user_id = auth.uid());
CREATE POLICY "profile_update_own" ON public.profile AS PERMISSIVE FOR UPDATE TO public
    USING (user_id = auth.uid());
CREATE POLICY "Coaches can view all profiles" ON public.profile AS PERMISSIVE FOR SELECT TO public
    USING (is_coach());
CREATE POLICY "Enable read for users based on user_id" ON public.profile AS PERMISSIVE FOR SELECT TO public
    USING (user_id = auth.uid());
CREATE POLICY "Enable insert for users based on user_id" ON public.profile AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "Enable update for users based on user_id" ON public.profile AS PERMISSIVE FOR UPDATE TO public
    USING (user_id = auth.uid());
CREATE POLICY "Enable delete for users based on user_id" ON public.profile AS PERMISSIVE FOR DELETE TO public
    USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- initial_assessment
-- ---------------------------------------------------------------------------
CREATE POLICY "assessment_insert_own" ON public.initial_assessment AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "assessment_select_own" ON public.initial_assessment AS PERMISSIVE FOR SELECT TO public
    USING (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "assessment_update_own" ON public.initial_assessment AS PERMISSIVE FOR UPDATE TO public
    USING (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- measurement
-- ---------------------------------------------------------------------------
CREATE POLICY "measurement_insert_own" ON public.measurement AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "measurement_select_own" ON public.measurement AS PERMISSIVE FOR SELECT TO public
    USING (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "measurement_update_own" ON public.measurement AS PERMISSIVE FOR UPDATE TO public
    USING (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "measurement_select_coach" ON public.measurement AS PERMISSIVE FOR SELECT TO public
    USING (is_coach());

-- ---------------------------------------------------------------------------
-- check_in
-- ---------------------------------------------------------------------------
CREATE POLICY "check_in_insert_own" ON public.check_in AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "check_in_select_own" ON public.check_in AS PERMISSIVE FOR SELECT TO public
    USING (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "check_in_update_own" ON public.check_in AS PERMISSIVE FOR UPDATE TO public
    USING (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "Coaches can view all check-ins" ON public.check_in AS PERMISSIVE FOR SELECT TO public
    USING (is_coach());

-- ---------------------------------------------------------------------------
-- avatar
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own avatar" ON public.avatar AS PERMISSIVE FOR SELECT TO public
    USING (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "Users can insert own avatar" ON public.avatar AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "Users can update own avatar" ON public.avatar AS PERMISSIVE FOR UPDATE TO public
    USING (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "Users can delete own avatar" ON public.avatar AS PERMISSIVE FOR DELETE TO public
    USING (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- body_photo
-- ---------------------------------------------------------------------------
CREATE POLICY "Clients can view own photos" ON public.body_photo AS PERMISSIVE FOR SELECT TO public
    USING (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "Clients can insert own photos" ON public.body_photo AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "Clients can delete own photos" ON public.body_photo AS PERMISSIVE FOR DELETE TO public
    USING (profile_id IN (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "Coaches can view client photos" ON public.body_photo AS PERMISSIVE FOR SELECT TO public
    USING (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "body_photo_select_coach" ON public.body_photo AS PERMISSIVE FOR SELECT TO public
    USING (is_coach());

-- ---------------------------------------------------------------------------
-- training_session
-- ---------------------------------------------------------------------------
CREATE POLICY "training_session_select_own" ON public.training_session AS PERMISSIVE FOR SELECT TO authenticated
    USING (profile_id = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "training_session_insert_own" ON public.training_session AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK (profile_id = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "training_session_update_own" ON public.training_session AS PERMISSIVE FOR UPDATE TO authenticated
    USING (profile_id = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()))
    WITH CHECK (profile_id = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "training_session_delete_own" ON public.training_session AS PERMISSIVE FOR DELETE TO authenticated
    USING (profile_id = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- completed_exercise
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view their own completed exercises" ON public.completed_exercise AS PERMISSIVE FOR SELECT TO public
    USING (EXISTS (
        SELECT 1 FROM training_session ts JOIN profile p ON ts.profile_id = p.id
        WHERE ts.id = completed_exercise.session_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can insert completed exercises for their sessions" ON public.completed_exercise AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (EXISTS (
        SELECT 1 FROM training_session ts JOIN profile p ON ts.profile_id = p.id
        WHERE ts.id = completed_exercise.session_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can update their own completed exercises" ON public.completed_exercise AS PERMISSIVE FOR UPDATE TO public
    USING (EXISTS (
        SELECT 1 FROM training_session ts JOIN profile p ON ts.profile_id = p.id
        WHERE ts.id = completed_exercise.session_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (
        SELECT 1 FROM training_session ts JOIN profile p ON ts.profile_id = p.id
        WHERE ts.id = completed_exercise.session_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can delete their own completed exercises" ON public.completed_exercise AS PERMISSIVE FOR DELETE TO public
    USING (EXISTS (
        SELECT 1 FROM training_session ts JOIN profile p ON ts.profile_id = p.id
        WHERE ts.id = completed_exercise.session_id AND p.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- completed_set
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view their own completed sets" ON public.completed_set AS PERMISSIVE FOR SELECT TO public
    USING (EXISTS (
        SELECT 1 FROM completed_exercise ce
            JOIN training_session ts ON ce.session_id = ts.id
            JOIN profile p ON ts.profile_id = p.id
        WHERE ce.id = completed_set.completed_exercise_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can insert completed sets for their exercises" ON public.completed_set AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (EXISTS (
        SELECT 1 FROM completed_exercise ce
            JOIN training_session ts ON ce.session_id = ts.id
            JOIN profile p ON ts.profile_id = p.id
        WHERE ce.id = completed_set.completed_exercise_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can update their own completed sets" ON public.completed_set AS PERMISSIVE FOR UPDATE TO public
    USING (EXISTS (
        SELECT 1 FROM completed_exercise ce
            JOIN training_session ts ON ce.session_id = ts.id
            JOIN profile p ON ts.profile_id = p.id
        WHERE ce.id = completed_set.completed_exercise_id AND p.user_id = auth.uid()))
    WITH CHECK (EXISTS (
        SELECT 1 FROM completed_exercise ce
            JOIN training_session ts ON ce.session_id = ts.id
            JOIN profile p ON ts.profile_id = p.id
        WHERE ce.id = completed_set.completed_exercise_id AND p.user_id = auth.uid()));
CREATE POLICY "Users can delete their own completed sets" ON public.completed_set AS PERMISSIVE FOR DELETE TO public
    USING (EXISTS (
        SELECT 1 FROM completed_exercise ce
            JOIN training_session ts ON ce.session_id = ts.id
            JOIN profile p ON ts.profile_id = p.id
        WHERE ce.id = completed_set.completed_exercise_id AND p.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- calendar_event
-- ---------------------------------------------------------------------------
CREATE POLICY "Coaches can select all calendar_events" ON public.calendar_event AS PERMISSIVE FOR SELECT TO public
    USING (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "Coaches can insert calendar_events" ON public.calendar_event AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "Coaches can update calendar_events" ON public.calendar_event AS PERMISSIVE FOR UPDATE TO public
    USING (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role))
    WITH CHECK (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "Coaches can delete calendar_events" ON public.calendar_event AS PERMISSIVE FOR DELETE TO public
    USING (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "Users can select their own calendar_events" ON public.calendar_event AS PERMISSIVE FOR SELECT TO public
    USING ((SELECT profile.user_id FROM profile WHERE profile.id = calendar_event.profile_id) = auth.uid());
CREATE POLICY "Users can insert calendar_events for their profile" ON public.calendar_event AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (
        (SELECT profile.user_id FROM profile WHERE profile.id = calendar_event.profile_id) = auth.uid()
        AND (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()) = created_by);
CREATE POLICY "Users can update their own calendar_events" ON public.calendar_event AS PERMISSIVE FOR UPDATE TO public
    USING ((SELECT profile.user_id FROM profile WHERE profile.id = calendar_event.profile_id) = auth.uid())
    WITH CHECK (
        (SELECT profile.user_id FROM profile WHERE profile.id = calendar_event.profile_id) = auth.uid()
        AND created_by = (
            SELECT calendar_event_old.created_by FROM calendar_event calendar_event_old
            WHERE calendar_event_old.id = calendar_event.id));
CREATE POLICY "Users can delete their own calendar_events" ON public.calendar_event AS PERMISSIVE FOR DELETE TO public
    USING ((SELECT profile.user_id FROM profile WHERE profile.id = calendar_event.profile_id) = auth.uid());

-- ---------------------------------------------------------------------------
-- calendar_event_exception
-- ---------------------------------------------------------------------------
CREATE POLICY "Coaches can select calendar_event_exceptions" ON public.calendar_event_exception AS PERMISSIVE FOR SELECT TO public
    USING (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "Coaches can insert calendar_event_exceptions" ON public.calendar_event_exception AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "Coaches can update calendar_event_exceptions" ON public.calendar_event_exception AS PERMISSIVE FOR UPDATE TO public
    USING (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role))
    WITH CHECK (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "Coaches can delete calendar_event_exceptions" ON public.calendar_event_exception AS PERMISSIVE FOR DELETE TO public
    USING (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "Users can select calendar_event_exceptions for their events" ON public.calendar_event_exception AS PERMISSIVE FOR SELECT TO public
    USING ((
        SELECT profile.user_id FROM profile
        WHERE profile.id = (SELECT calendar_event.profile_id FROM calendar_event WHERE calendar_event.id = calendar_event_exception.event_id)
    ) = auth.uid());
CREATE POLICY "Users can insert calendar_event_exceptions for their events" ON public.calendar_event_exception AS PERMISSIVE FOR INSERT TO public
    WITH CHECK ((
        SELECT profile.user_id FROM profile
        WHERE profile.id = (SELECT calendar_event.profile_id FROM calendar_event WHERE calendar_event.id = calendar_event_exception.event_id)
    ) = auth.uid());
CREATE POLICY "Users can update calendar_event_exceptions for their events" ON public.calendar_event_exception AS PERMISSIVE FOR UPDATE TO public
    USING ((
        SELECT profile.user_id FROM profile
        WHERE profile.id = (SELECT calendar_event.profile_id FROM calendar_event WHERE calendar_event.id = calendar_event_exception.event_id)
    ) = auth.uid())
    WITH CHECK (
        (
            SELECT profile.user_id FROM profile
            WHERE profile.id = (SELECT calendar_event.profile_id FROM calendar_event WHERE calendar_event.id = calendar_event_exception.event_id)
        ) = auth.uid()
        AND event_id = (
            SELECT calendar_event_exception_old.event_id FROM calendar_event_exception calendar_event_exception_old
            WHERE calendar_event_exception_old.id = calendar_event_exception.id));
CREATE POLICY "Users can delete calendar_event_exceptions for their events" ON public.calendar_event_exception AS PERMISSIVE FOR DELETE TO public
    USING ((
        SELECT profile.user_id FROM profile
        WHERE profile.id = (SELECT calendar_event.profile_id FROM calendar_event WHERE calendar_event.id = calendar_event_exception.event_id)
    ) = auth.uid());

-- ---------------------------------------------------------------------------
-- Nutrición: food, food_has_tag, recipe, recipe_food, recipe_has_tag,
-- meal_plan, meal_plan_day, meal_plan_slot, meal_plan_item, profile_has_meal_plan
-- ---------------------------------------------------------------------------
CREATE POLICY "food_coach_all" ON public.food AS PERMISSIVE FOR ALL TO public
    USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "food_client_select" ON public.food AS PERMISSIVE FOR SELECT TO public
    USING (
        id IN (
            SELECT mpi.food_id
            FROM meal_plan_item mpi
                JOIN meal_plan_slot ms ON ms.id = mpi.slot_id
                JOIN meal_plan_day md ON md.id = ms.day_id
                JOIN profile_has_meal_plan phm ON phm.meal_plan_id = md.meal_plan_id
            WHERE phm.profile_id = get_profile_id() AND mpi.food_id IS NOT NULL)
        OR id IN (
            SELECT rf.food_id
            FROM recipe_food rf
                JOIN meal_plan_item mpi ON mpi.recipe_id = rf.recipe_id
                JOIN meal_plan_slot ms ON ms.id = mpi.slot_id
                JOIN meal_plan_day md ON md.id = ms.day_id
                JOIN profile_has_meal_plan phm ON phm.meal_plan_id = md.meal_plan_id
            WHERE phm.profile_id = get_profile_id()));

CREATE POLICY "food_has_tag_coach_all" ON public.food_has_tag AS PERMISSIVE FOR ALL TO public
    USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "food_has_tag_client_select" ON public.food_has_tag AS PERMISSIVE FOR SELECT TO public
    USING (
        food_id IN (
            SELECT mpi.food_id
            FROM meal_plan_item mpi
                JOIN meal_plan_slot ms ON ms.id = mpi.slot_id
                JOIN meal_plan_day md ON md.id = ms.day_id
                JOIN profile_has_meal_plan phm ON phm.meal_plan_id = md.meal_plan_id
            WHERE phm.profile_id = get_profile_id() AND mpi.food_id IS NOT NULL)
        OR food_id IN (
            SELECT rf.food_id
            FROM recipe_food rf
                JOIN meal_plan_item mpi ON mpi.recipe_id = rf.recipe_id
                JOIN meal_plan_slot ms ON ms.id = mpi.slot_id
                JOIN meal_plan_day md ON md.id = ms.day_id
                JOIN profile_has_meal_plan phm ON phm.meal_plan_id = md.meal_plan_id
            WHERE phm.profile_id = get_profile_id()));

CREATE POLICY "recipe_coach_all" ON public.recipe AS PERMISSIVE FOR ALL TO public
    USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "recipe_client_select" ON public.recipe AS PERMISSIVE FOR SELECT TO public
    USING (id IN (
        SELECT mpi.recipe_id
        FROM meal_plan_item mpi
            JOIN meal_plan_slot ms ON ms.id = mpi.slot_id
            JOIN meal_plan_day md ON md.id = ms.day_id
            JOIN profile_has_meal_plan phm ON phm.meal_plan_id = md.meal_plan_id
        WHERE phm.profile_id = get_profile_id() AND mpi.recipe_id IS NOT NULL));

CREATE POLICY "recipe_food_coach_all" ON public.recipe_food AS PERMISSIVE FOR ALL TO public
    USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "recipe_food_client_select" ON public.recipe_food AS PERMISSIVE FOR SELECT TO public
    USING (recipe_id IN (
        SELECT mpi.recipe_id
        FROM meal_plan_item mpi
            JOIN meal_plan_slot ms ON ms.id = mpi.slot_id
            JOIN meal_plan_day md ON md.id = ms.day_id
            JOIN profile_has_meal_plan phm ON phm.meal_plan_id = md.meal_plan_id
        WHERE phm.profile_id = get_profile_id() AND mpi.recipe_id IS NOT NULL));

CREATE POLICY "recipe_has_tag_coach_all" ON public.recipe_has_tag AS PERMISSIVE FOR ALL TO public
    USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "recipe_has_tag_client_select" ON public.recipe_has_tag AS PERMISSIVE FOR SELECT TO public
    USING (recipe_id IN (
        SELECT mpi.recipe_id
        FROM meal_plan_item mpi
            JOIN meal_plan_slot ms ON ms.id = mpi.slot_id
            JOIN meal_plan_day md ON md.id = ms.day_id
            JOIN profile_has_meal_plan phm ON phm.meal_plan_id = md.meal_plan_id
        WHERE phm.profile_id = get_profile_id() AND mpi.recipe_id IS NOT NULL));

CREATE POLICY "meal_plan_coach_all" ON public.meal_plan AS PERMISSIVE FOR ALL TO public
    USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "meal_plan_client_select" ON public.meal_plan AS PERMISSIVE FOR SELECT TO public
    USING (id IN (SELECT phm.meal_plan_id FROM profile_has_meal_plan phm WHERE phm.profile_id = get_profile_id()));

CREATE POLICY "meal_plan_day_coach_all" ON public.meal_plan_day AS PERMISSIVE FOR ALL TO public
    USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "meal_plan_day_client_select" ON public.meal_plan_day AS PERMISSIVE FOR SELECT TO public
    USING (meal_plan_id IN (SELECT phm.meal_plan_id FROM profile_has_meal_plan phm WHERE phm.profile_id = get_profile_id()));

CREATE POLICY "meal_plan_slot_coach_all" ON public.meal_plan_slot AS PERMISSIVE FOR ALL TO public
    USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "meal_plan_slot_client_select" ON public.meal_plan_slot AS PERMISSIVE FOR SELECT TO public
    USING (day_id IN (
        SELECT md.id
        FROM meal_plan_day md
            JOIN profile_has_meal_plan phm ON phm.meal_plan_id = md.meal_plan_id
        WHERE phm.profile_id = get_profile_id()));

CREATE POLICY "meal_plan_item_coach_all" ON public.meal_plan_item AS PERMISSIVE FOR ALL TO public
    USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "meal_plan_item_client_select" ON public.meal_plan_item AS PERMISSIVE FOR SELECT TO public
    USING (slot_id IN (
        SELECT ms.id
        FROM meal_plan_slot ms
            JOIN meal_plan_day md ON md.id = ms.day_id
            JOIN profile_has_meal_plan phm ON phm.meal_plan_id = md.meal_plan_id
        WHERE phm.profile_id = get_profile_id()));

CREATE POLICY "profile_has_meal_plan_coach_all" ON public.profile_has_meal_plan AS PERMISSIVE FOR ALL TO public
    USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "profile_has_meal_plan_client_select" ON public.profile_has_meal_plan AS PERMISSIVE FOR SELECT TO public
    USING (profile_id = get_profile_id());

-- ---------------------------------------------------------------------------
-- Entrenamiento: exercise_template, routine, set_template, tag y tablas puente
-- ---------------------------------------------------------------------------
CREATE POLICY "exercise_template_select_own" ON public.exercise_template AS PERMISSIVE FOR SELECT TO authenticated
    USING (creator IS NULL OR creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()) OR is_coach());
CREATE POLICY "exercise_template_insert_own" ON public.exercise_template AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK (creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "exercise_template_update_own" ON public.exercise_template AS PERMISSIVE FOR UPDATE TO authenticated
    USING (creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()))
    WITH CHECK (creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "exercise_template_delete_own" ON public.exercise_template AS PERMISSIVE FOR DELETE TO authenticated
    USING (creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "exercise_template_select_assigned" ON public.exercise_template AS PERMISSIVE FOR SELECT TO authenticated
    USING (id IN (
        SELECT routine_has_exercise_template.exercise_template
        FROM routine_has_exercise_template
        WHERE routine_has_exercise_template.routine IN (
            SELECT profile_has_routine.routine
            FROM profile_has_routine
            WHERE profile_has_routine.profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()))));

CREATE POLICY "routine_select_own" ON public.routine AS PERMISSIVE FOR SELECT TO authenticated
    USING (creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "routine_insert_own" ON public.routine AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK (creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "routine_update_own" ON public.routine AS PERMISSIVE FOR UPDATE TO authenticated
    USING (creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()))
    WITH CHECK (creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "routine_delete_own" ON public.routine AS PERMISSIVE FOR DELETE TO authenticated
    USING (creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "routine_select_assigned" ON public.routine AS PERMISSIVE FOR SELECT TO authenticated
    USING (id IN (
        SELECT profile_has_routine.routine
        FROM profile_has_routine
        WHERE profile_has_routine.profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));

CREATE POLICY "set_template_select_all" ON public.set_template AS PERMISSIVE FOR SELECT TO authenticated
    USING (true);
CREATE POLICY "set_template_insert_all" ON public.set_template AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK (true);
CREATE POLICY "set_template_update_all" ON public.set_template AS PERMISSIVE FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);
CREATE POLICY "set_template_delete_all" ON public.set_template AS PERMISSIVE FOR DELETE TO authenticated
    USING (true);
CREATE POLICY "set_template_select_assigned" ON public.set_template AS PERMISSIVE FOR SELECT TO authenticated
    USING (id IN (
        SELECT exercise_template_has_set_template.set_template
        FROM exercise_template_has_set_template
        WHERE exercise_template_has_set_template.exercise_template IN (
            SELECT routine_has_exercise_template.exercise_template
            FROM routine_has_exercise_template
            WHERE routine_has_exercise_template.routine IN (
                SELECT profile_has_routine.routine
                FROM profile_has_routine
                WHERE profile_has_routine.profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())))));

CREATE POLICY "tag_select_all" ON public.tag AS PERMISSIVE FOR SELECT TO authenticated
    USING (true);
CREATE POLICY "tag_insert_all" ON public.tag AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK (true);
CREATE POLICY "tag_update_all" ON public.tag AS PERMISSIVE FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);
CREATE POLICY "tag_delete_all" ON public.tag AS PERMISSIVE FOR DELETE TO authenticated
    USING (true);

CREATE POLICY "profile_has_routine_select_access" ON public.profile_has_routine AS PERMISSIVE FOR SELECT TO authenticated
    USING (
        profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "profile_has_routine_insert_access" ON public.profile_has_routine AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK (
        profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "profile_has_routine_update_access" ON public.profile_has_routine AS PERMISSIVE FOR UPDATE TO authenticated
    USING (
        profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role))
    WITH CHECK (
        profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "profile_has_routine_delete_access" ON public.profile_has_routine AS PERMISSIVE FOR DELETE TO authenticated
    USING (
        profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));

CREATE POLICY "routine_has_exercise_template_select_own" ON public.routine_has_exercise_template AS PERMISSIVE FOR SELECT TO authenticated
    USING (routine IN (
        SELECT r.id FROM routine r JOIN profile_has_routine phr ON phr.routine = r.id
        WHERE phr.profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
CREATE POLICY "routine_has_exercise_template_insert_own" ON public.routine_has_exercise_template AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK (routine IN (
        SELECT r.id FROM routine r JOIN profile_has_routine phr ON phr.routine = r.id
        WHERE phr.profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
CREATE POLICY "routine_has_exercise_template_update_own" ON public.routine_has_exercise_template AS PERMISSIVE FOR UPDATE TO authenticated
    USING (routine IN (
        SELECT r.id FROM routine r JOIN profile_has_routine phr ON phr.routine = r.id
        WHERE phr.profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())))
    WITH CHECK (routine IN (
        SELECT r.id FROM routine r JOIN profile_has_routine phr ON phr.routine = r.id
        WHERE phr.profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
CREATE POLICY "routine_has_exercise_template_delete_own" ON public.routine_has_exercise_template AS PERMISSIVE FOR DELETE TO authenticated
    USING (routine IN (
        SELECT r.id FROM routine r JOIN profile_has_routine phr ON phr.routine = r.id
        WHERE phr.profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
CREATE POLICY "routine_has_exercise_template_select_all" ON public.routine_has_exercise_template AS PERMISSIVE FOR SELECT TO authenticated
    USING (true);
CREATE POLICY "routine_has_exercise_template_insert_coach" ON public.routine_has_exercise_template AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "routine_has_exercise_template_update_coach" ON public.routine_has_exercise_template AS PERMISSIVE FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role))
    WITH CHECK (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "routine_has_exercise_template_delete_coach" ON public.routine_has_exercise_template AS PERMISSIVE FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM profile WHERE profile.user_id = auth.uid() AND profile.role = 'coach'::role));
CREATE POLICY "routine_has_exercise_template_select_assigned" ON public.routine_has_exercise_template AS PERMISSIVE FOR SELECT TO authenticated
    USING (routine IN (
        SELECT profile_has_routine.routine
        FROM profile_has_routine
        WHERE profile_has_routine.profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));

CREATE POLICY "exercise_template_has_set_template_select_own" ON public.exercise_template_has_set_template AS PERMISSIVE FOR SELECT TO authenticated
    USING (exercise_template IN (
        SELECT et.id FROM exercise_template et
        WHERE et.creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
CREATE POLICY "exercise_template_has_set_template_insert_own" ON public.exercise_template_has_set_template AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK (exercise_template IN (
        SELECT et.id FROM exercise_template et
        WHERE et.creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
CREATE POLICY "exercise_template_has_set_template_update_own" ON public.exercise_template_has_set_template AS PERMISSIVE FOR UPDATE TO authenticated
    USING (exercise_template IN (
        SELECT et.id FROM exercise_template et
        WHERE et.creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())))
    WITH CHECK (exercise_template IN (
        SELECT et.id FROM exercise_template et
        WHERE et.creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
CREATE POLICY "exercise_template_has_set_template_delete_own" ON public.exercise_template_has_set_template AS PERMISSIVE FOR DELETE TO authenticated
    USING (exercise_template IN (
        SELECT et.id FROM exercise_template et
        WHERE et.creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
CREATE POLICY "exercise_template_has_set_template_select_assigned" ON public.exercise_template_has_set_template AS PERMISSIVE FOR SELECT TO authenticated
    USING (exercise_template IN (
        SELECT routine_has_exercise_template.exercise_template
        FROM routine_has_exercise_template
        WHERE routine_has_exercise_template.routine IN (
            SELECT profile_has_routine.routine
            FROM profile_has_routine
            WHERE profile_has_routine.profile = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid()))));

CREATE POLICY "exercise_template_has_tag_select_own" ON public.exercise_template_has_tag AS PERMISSIVE FOR SELECT TO authenticated
    USING (exercise_template IN (
        SELECT et.id FROM exercise_template et
        WHERE et.creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
CREATE POLICY "exercise_template_has_tag_insert_own" ON public.exercise_template_has_tag AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK (exercise_template IN (
        SELECT et.id FROM exercise_template et
        WHERE et.creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
CREATE POLICY "exercise_template_has_tag_update_own" ON public.exercise_template_has_tag AS PERMISSIVE FOR UPDATE TO authenticated
    USING (exercise_template IN (
        SELECT et.id FROM exercise_template et
        WHERE et.creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())))
    WITH CHECK (exercise_template IN (
        SELECT et.id FROM exercise_template et
        WHERE et.creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
CREATE POLICY "exercise_template_has_tag_delete_own" ON public.exercise_template_has_tag AS PERMISSIVE FOR DELETE TO authenticated
    USING (exercise_template IN (
        SELECT et.id FROM exercise_template et
        WHERE et.creator = (SELECT profile.id FROM profile WHERE profile.user_id = auth.uid())));
-- 005: buckets de Storage y sus políticas sobre storage.objects.
-- Todos los buckets son privados; el acceso se rige por las políticas.
-- En los buckets con carpeta por perfil, el primer segmento de la ruta es el
-- id del perfil (`<profile_id>/<archivo>`).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('avatars', 'avatars', false, 5242880, NULL),
    ('body-photos', 'body-photos', false, NULL, NULL),
    ('exercise-video', 'exercise-video', false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- avatars
CREATE POLICY "avatars_select_public" ON storage.objects AS PERMISSIVE FOR SELECT TO public
    USING (bucket_id = 'avatars'::text);
CREATE POLICY "avatars_insert_own" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'::text
        AND (storage.foldername(name))[1] IN (
            SELECT (profile.id)::text AS id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "avatars_update_own" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars'::text
        AND (storage.foldername(name))[1] IN (
            SELECT (profile.id)::text AS id FROM profile WHERE profile.user_id = auth.uid()))
    WITH CHECK (
        bucket_id = 'avatars'::text
        AND (storage.foldername(name))[1] IN (
            SELECT (profile.id)::text AS id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "avatars_delete_own" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
    USING (
        bucket_id = 'avatars'::text
        AND (storage.foldername(name))[1] IN (
            SELECT (profile.id)::text AS id FROM profile WHERE profile.user_id = auth.uid()));

-- body-photos
CREATE POLICY "body-photos: select - public access" ON storage.objects AS PERMISSIVE FOR SELECT TO public
    USING (bucket_id = 'body-photos'::text);
CREATE POLICY "body-photos: insert - own profile only" ON storage.objects AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (
        bucket_id = 'body-photos'::text
        AND (storage.foldername(name))[1] = (
            SELECT (profile.id)::text AS id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "body-photos: update - own profile only" ON storage.objects AS PERMISSIVE FOR UPDATE TO public
    USING (
        bucket_id = 'body-photos'::text
        AND (storage.foldername(name))[1] = (
            SELECT (profile.id)::text AS id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "body-photos: delete - own profile only" ON storage.objects AS PERMISSIVE FOR DELETE TO public
    USING (
        bucket_id = 'body-photos'::text
        AND (storage.foldername(name))[1] = (
            SELECT (profile.id)::text AS id FROM profile WHERE profile.user_id = auth.uid()));

-- exercise-video
CREATE POLICY "exercise-video: select - public access" ON storage.objects AS PERMISSIVE FOR SELECT TO public
    USING (bucket_id = 'exercise-video'::text);
CREATE POLICY "exercise_video_select_authenticated" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
    USING (bucket_id = 'exercise-video'::text);
CREATE POLICY "exercise-video: insert - own profile only" ON storage.objects AS PERMISSIVE FOR INSERT TO public
    WITH CHECK (
        bucket_id = 'exercise-video'::text
        AND (storage.foldername(name))[1] = (
            SELECT (profile.id)::text AS id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "exercise-video: update - own profile only" ON storage.objects AS PERMISSIVE FOR UPDATE TO public
    USING (
        bucket_id = 'exercise-video'::text
        AND (storage.foldername(name))[1] = (
            SELECT (profile.id)::text AS id FROM profile WHERE profile.user_id = auth.uid()));
CREATE POLICY "exercise-video: delete - own profile only" ON storage.objects AS PERMISSIVE FOR DELETE TO public
    USING (
        bucket_id = 'exercise-video'::text
        AND (storage.foldername(name))[1] = (
            SELECT (profile.id)::text AS id FROM profile WHERE profile.user_id = auth.uid()));
-- 006: acciones ON DELETE de las FK, UNIQUE compuestos, CHECK e índices
-- (reflejan lo que existe en producción)

-- ---------------------------------------------------------------
-- 1. Foreign keys: se recrean con su acción ON DELETE
-- ---------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- tabla, constraint, columna, tabla referenciada, acción
      ('initial_assessment', 'initial_assessment_profile_id_fkey', 'profile_id', 'profile', 'CASCADE'),
      ('measurement', 'measurement_profile_id_fkey', 'profile_id', 'profile', 'CASCADE'),
      ('check_in', 'check_in_profile_id_fkey', 'profile_id', 'profile', 'CASCADE'),
      ('avatar', 'avatar_profile_id_fkey', 'profile_id', 'profile', 'CASCADE'),
      ('body_photo', 'body_photo_profile_id_fkey', 'profile_id', 'profile', 'CASCADE'),
      ('routine_has_exercise_template', 'rutine_has_exercise_template_rutine_fkey', 'routine', 'routine', 'CASCADE'),
      ('routine_has_exercise_template', 'rutine_has_exercise_template_exercise_template_fkey', 'exercise_template', 'exercise_template', 'CASCADE'),
      ('exercise_template_has_set_template', 'exercise_template_has_set_template_exercise_template_fkey', 'exercise_template', 'exercise_template', 'CASCADE'),
      ('profile_has_routine', 'profile_has_routine_profile_fkey', 'profile', 'profile', 'CASCADE'),
      ('profile_has_routine', 'profile_has_routine_routine_fkey', 'routine', 'routine', 'CASCADE'),
      ('exercise_template_has_tag', 'exercise_template_has_tag_exercise_template_fkey', 'exercise_template', 'exercise_template', 'CASCADE'),
      ('training_session', 'training_session_profile_id_fkey', 'profile_id', 'profile', 'CASCADE'),
      ('completed_exercise', 'completed_exercise_session_id_fkey', 'session_id', 'training_session', 'CASCADE'),
      ('completed_set', 'completed_set_completed_exercise_id_fkey', 'completed_exercise_id', 'completed_exercise', 'CASCADE'),
      ('food_has_tag', 'food_has_tag_food_id_fkey', 'food_id', 'food', 'CASCADE'),
      ('food_has_tag', 'food_has_tag_tag_id_fkey', 'tag_id', 'tag', 'CASCADE'),
      ('recipe_food', 'recipe_food_recipe_id_fkey', 'recipe_id', 'recipe', 'CASCADE'),
      ('recipe_has_tag', 'recipe_has_tag_recipe_id_fkey', 'recipe_id', 'recipe', 'CASCADE'),
      ('recipe_has_tag', 'recipe_has_tag_tag_id_fkey', 'tag_id', 'tag', 'CASCADE'),
      ('profile_has_meal_plan', 'profile_has_meal_plan_profile_id_fkey', 'profile_id', 'profile', 'CASCADE'),
      ('profile_has_meal_plan', 'profile_has_meal_plan_meal_plan_id_fkey', 'meal_plan_id', 'meal_plan', 'CASCADE'),
      ('meal_plan_day', 'meal_plan_day_meal_plan_id_fkey', 'meal_plan_id', 'meal_plan', 'CASCADE'),
      ('meal_plan_slot', 'meal_plan_slot_day_id_fkey', 'day_id', 'meal_plan_day', 'CASCADE'),
      ('meal_plan_item', 'meal_plan_item_slot_id_fkey', 'slot_id', 'meal_plan_slot', 'CASCADE'),
      ('calendar_event', 'calendar_event_profile_id_fkey', 'profile_id', 'profile', 'CASCADE'),
      ('calendar_event_exception', 'calendar_event_exception_event_id_fkey', 'event_id', 'calendar_event', 'CASCADE'),
      ('exercise_template', 'exercise_template_creator_fkey', 'creator', 'profile', 'SET NULL'),
      ('routine', 'rutine_creator_fkey', 'creator', 'profile', 'SET NULL'),
      ('food', 'food_created_by_fkey', 'created_by', 'profile', 'SET NULL'),
      ('recipe', 'recipe_created_by_fkey', 'created_by', 'profile', 'SET NULL'),
      ('meal_plan', 'meal_plan_created_by_fkey', 'created_by', 'profile', 'SET NULL'),
      ('calendar_event', 'calendar_event_created_by_fkey', 'created_by', 'profile', 'SET NULL'),
      ('calendar_event', 'calendar_event_routine_id_fkey', 'routine_id', 'routine', 'SET NULL'),
      ('meal_plan_item', 'meal_plan_item_food_id_fkey', 'food_id', 'food', 'SET NULL'),
      ('meal_plan_item', 'meal_plan_item_recipe_id_fkey', 'recipe_id', 'recipe', 'SET NULL')
    ) AS t(tbl, con, col, ref, act)
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.tbl, r.con);
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id) ON DELETE %s',
      r.tbl, r.con, r.col, r.ref, r.act
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------
-- 2. UNIQUE compuestos y CHECK
-- ---------------------------------------------------------------
ALTER TABLE public.exercise_template_has_tag
  ADD CONSTRAINT exercise_template_has_tag_exercise_template_tag_key UNIQUE (exercise_template, tag);
ALTER TABLE public.completed_exercise
  ADD CONSTRAINT completed_exercise_unique_per_session UNIQUE (session_id, exercise_template_id);
ALTER TABLE public.completed_set
  ADD CONSTRAINT completed_set_unique_per_exercise UNIQUE (completed_exercise_id, set_order);
ALTER TABLE public.food_has_tag
  ADD CONSTRAINT food_has_tag_unique UNIQUE (food_id, tag_id);
ALTER TABLE public.recipe_food
  ADD CONSTRAINT recipe_food_unique UNIQUE (recipe_id, food_id);
ALTER TABLE public.recipe_has_tag
  ADD CONSTRAINT recipe_has_tag_unique UNIQUE (recipe_id, tag_id);
ALTER TABLE public.profile_has_meal_plan
  ADD CONSTRAINT profile_has_meal_plan_unique UNIQUE (profile_id, meal_plan_id);
ALTER TABLE public.meal_plan_day
  ADD CONSTRAINT meal_plan_day_unique_order UNIQUE (meal_plan_id, day_order);
ALTER TABLE public.meal_plan_slot
  ADD CONSTRAINT meal_plan_slot_unique_order UNIQUE (day_id, slot_order);
ALTER TABLE public.meal_plan_item
  ADD CONSTRAINT meal_plan_item_unique_order UNIQUE (slot_id, item_order);

ALTER TABLE public.meal_plan_item
  ADD CONSTRAINT meal_plan_item_check CHECK (recipe_id IS NOT NULL OR food_id IS NOT NULL);

-- ---------------------------------------------------------------
-- 3. Índices
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_body_photo_profile_id ON public.body_photo USING btree (profile_id);
CREATE INDEX IF NOT EXISTS idx_body_photo_taken_at ON public.body_photo USING btree (taken_at);
CREATE INDEX IF NOT EXISTS idx_calendar_event_profile_dtstart ON public.calendar_event USING btree (profile_id, dtstart);
CREATE INDEX IF NOT EXISTS idx_calendar_event_exception_event ON public.calendar_event_exception USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_check_in_profile_created ON public.check_in USING btree (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_role ON public.profile USING btree (role);
CREATE INDEX IF NOT EXISTS training_session_profile_status_idx ON public.training_session USING btree (profile_id, status);
-- ============================================================================
-- 007_seed.sql: Datos iniciales de arranque para Akuma Fit
-- ============================================================================

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
-- ============================================================================
-- 008_security_coaches.sql: Seguridad de fotos corporales y relación Coach-Cliente
-- ============================================================================

-- 1. CORRECCIÓN DE PRIVACIDAD EN STORAGE (BODY-PHOTOS)
-- Retira el acceso público a fotos corporales y lo restringe a usuario autenticado (dueño) o entrenador.
DROP POLICY IF EXISTS "body-photos: select - public access" ON storage.objects;

CREATE POLICY "body-photos: select - authenticated own or coach"
ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
USING (
    bucket_id = 'body-photos'
    AND (
        (storage.foldername(name))[1] IN (
            SELECT (profile.id)::text FROM public.profile WHERE profile.user_id = auth.uid()
        )
        OR public.is_coach()
    )
);

-- 2. TABLA DE ASIGNACIÓN ENTRENADOR - CLIENTE
CREATE TABLE IF NOT EXISTS public.coach_has_client (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    coach_id bigint NOT NULL,
    client_id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    status character varying NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'finished')),
    notes text,
    CONSTRAINT coach_has_client_pkey PRIMARY KEY (id),
    CONSTRAINT coach_has_client_coach_fkey FOREIGN KEY (coach_id) REFERENCES public.profile(id) ON DELETE CASCADE,
    CONSTRAINT coach_has_client_client_fkey FOREIGN KEY (client_id) REFERENCES public.profile(id) ON DELETE CASCADE,
    CONSTRAINT coach_has_client_unique UNIQUE (coach_id, client_id)
);

-- Activar RLS en coach_has_client
ALTER TABLE public.coach_has_client ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_has_client_select" ON public.coach_has_client AS PERMISSIVE FOR SELECT TO authenticated
USING (
    coach_id = public.get_profile_id()
    OR client_id = public.get_profile_id()
    OR public.is_coach()
);

CREATE POLICY "coach_has_client_insert" ON public.coach_has_client AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (public.is_coach());

CREATE POLICY "coach_has_client_update" ON public.coach_has_client AS PERMISSIVE FOR UPDATE TO authenticated
USING (public.is_coach());

CREATE POLICY "coach_has_client_delete" ON public.coach_has_client AS PERMISSIVE FOR DELETE TO authenticated
USING (public.is_coach());

-- Promover usuario inicial a coach
SELECT public.promote_to_coach('pmares050203@gmail.com');
