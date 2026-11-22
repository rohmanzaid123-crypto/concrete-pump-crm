-- Add indexes for frequently joined foreign keys.
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_fleet_id ON public.bookings(fleet_id);
CREATE INDEX IF NOT EXISTS idx_finances_booking_id ON public.finances(booking_id);
CREATE INDEX IF NOT EXISTS idx_pump_units_primary_operator_id ON public.pump_units(primary_operator_id);

-- Evaluate auth.uid() once per statement instead of once per profile row.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = id);
