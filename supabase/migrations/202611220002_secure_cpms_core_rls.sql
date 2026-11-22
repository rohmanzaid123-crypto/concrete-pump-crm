-- Restrict the owner helper to signed-in users and keep it SECURITY INVOKER.
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'owner'
  );
$function$;

REVOKE ALL ON FUNCTION public.is_owner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_owner() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated, service_role;

-- Legacy business tables: allow only authenticated CPMS owner/admin profiles.
DO $policies$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['customers', 'bookings', 'fleets'] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_owner_admin_access', table_name);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_owner() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = ''admin'')) WITH CHECK (public.is_owner() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = ''admin''))',
        table_name || '_owner_admin_access', table_name
      );
    END IF;
  END LOOP;

  IF to_regclass('public.finances') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS finances_owner_only ON public.finances';
    EXECUTE 'CREATE POLICY finances_owner_only ON public.finances FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner())';
  END IF;
END
$policies$;
