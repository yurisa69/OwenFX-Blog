-- Keep privileged membership lookups outside PostgREST's exposed public schema.
CREATE SCHEMA IF NOT EXISTS private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_owenfx_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_members AS m
    WHERE m.user_id = auth.uid()
      AND m.active = true
      AND m.role IN ('owner', 'admin')
  );
$function$;

CREATE OR REPLACE FUNCTION private.is_owenfx_content_editor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_members AS m
    WHERE m.user_id = auth.uid()
      AND m.active = true
      AND m.role IN ('owner', 'admin', 'editor')
  );
$function$;

REVOKE ALL ON FUNCTION private.is_owenfx_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_owenfx_admin() TO authenticated, service_role;
REVOKE ALL ON FUNCTION private.is_owenfx_content_editor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_owenfx_content_editor() TO authenticated, service_role;

-- Keep the existing public RPC names for the app, but make the wrappers
-- SECURITY INVOKER. The privileged implementation is not exposed by PostgREST.
CREATE OR REPLACE FUNCTION public.is_owenfx_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO ''
AS $function$
  SELECT private.is_owenfx_admin();
$function$;

CREATE OR REPLACE FUNCTION public.is_owenfx_content_editor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO ''
AS $function$
  SELECT private.is_owenfx_content_editor();
$function$;

REVOKE ALL ON FUNCTION public.is_owenfx_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owenfx_admin() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_owenfx_content_editor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owenfx_content_editor() TO authenticated, service_role;
