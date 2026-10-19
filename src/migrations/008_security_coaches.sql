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
