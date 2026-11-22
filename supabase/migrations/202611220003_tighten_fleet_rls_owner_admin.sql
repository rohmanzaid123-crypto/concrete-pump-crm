-- Fleet management is available only to authenticated CPMS owner/admin profiles.
DROP POLICY IF EXISTS "Authenticated users can manage operators" ON public.operators;
DROP POLICY IF EXISTS "Authenticated users can manage maintenance records" ON public.maintenance_records;
DROP POLICY IF EXISTS "Authenticated users can insert or update pump units" ON public.pump_units;
DROP POLICY IF EXISTS "Authenticated users can update pump units" ON public.pump_units;
DROP POLICY IF EXISTS "Authenticated users can view pump units" ON public.pump_units;
DROP POLICY IF EXISTS "Only owners can delete pump units" ON public.pump_units;

CREATE POLICY operators_owner_admin_manage ON public.operators
FOR ALL TO authenticated
USING (public.is_owner() OR EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
))
WITH CHECK (public.is_owner() OR EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
));

CREATE POLICY maintenance_owner_admin_manage ON public.maintenance_records
FOR ALL TO authenticated
USING (public.is_owner() OR EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
))
WITH CHECK (public.is_owner() OR EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
));

CREATE POLICY pump_units_owner_admin_manage ON public.pump_units
FOR ALL TO authenticated
USING (public.is_owner() OR EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
))
WITH CHECK (public.is_owner() OR EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = (SELECT auth.uid()) AND p.role = 'admin'
));
