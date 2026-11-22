-- CPMS fleet persistence migration
-- Safe to run more than once. This migration only creates/repairs the fleet
-- tables used by src/lib/fleet-store.ts; it does not copy demo/localStorage data.

DO $$ BEGIN
  CREATE TYPE public.pump_category_code AS ENUM (
    'standard_24_36m', 'long_boom_37_42m', 'super_long_boom',
    'mini_pump', 'kodok_portable', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.pump_unit_status AS ENUM (
    'available', 'reserved', 'rented', 'maintenance', 'out_of_service'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.pump_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code public.pump_category_code NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  boom_range_label TEXT NOT NULL DEFAULT ''
);

INSERT INTO public.pump_categories (code, name, description, boom_range_label)
VALUES
  ('standard_24_36m', 'Concrete Pump Standar', 'Armada untuk pengecoran umum', '24–36 Meter'),
  ('long_boom_37_42m', 'Concrete Pump Long Boom', 'Armada jangkauan tinggi', '37–42 Meter'),
  ('super_long_boom', 'Concrete Pump Super Long Boom', 'Armada boom ekstra panjang', '>42 Meter'),
  ('mini_pump', 'Concrete Pump Mini / City', 'Armada untuk akses jalan sempit', '18–21 Meter'),
  ('kodok_portable', 'Concrete Pump Kodok / Portable', 'Pompa stasioner/portable', 'Portable'),
  ('custom', 'Custom / Spesialis Khusus', 'Unit dengan spesifikasi khusus', 'Custom')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role_type TEXT NOT NULL DEFAULT 'operator_boom',
  phone_number TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  sio_number TEXT NOT NULL DEFAULT '',
  sio_expiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sim_type TEXT NOT NULL DEFAULT 'B2 UMUM',
  assigned_unit_id UUID,
  assigned_unit_code TEXT,
  status TEXT NOT NULL DEFAULT 'aktif',
  total_pour_projects INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Existing early/manual setup may have created a simplified operators table.
-- Add only the CPMS operator columns if they are missing.
-- Preserve any existing operator names from a previous simplified table.
DO $ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'operators' AND column_name = 'operator_name'
  ) THEN
    EXECUTE 'UPDATE public.operators SET name = operator_name WHERE name IS NULL';
  END IF;
END $;
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS name TEXT;
UPDATE public.operators SET name = COALESCE(name, assigned_unit_code, 'Operator') WHERE name IS NULL;
ALTER TABLE public.operators ALTER COLUMN name SET NOT NULL;
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS role_type TEXT NOT NULL DEFAULT 'operator_boom';
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '';
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NOT NULL DEFAULT '';
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS sio_number TEXT NOT NULL DEFAULT '';
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS sio_expiry_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS sim_type TEXT NOT NULL DEFAULT 'B2 UMUM';
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS assigned_unit_id UUID;
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS assigned_unit_code TEXT;
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aktif';
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS total_pour_projects INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.pump_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code TEXT NOT NULL UNIQUE,
  category_code public.pump_category_code NOT NULL DEFAULT 'standard_24_36m',
  name TEXT NOT NULL,
  brand_chassis TEXT NOT NULL,
  brand_pump TEXT NOT NULL,
  boom_length_meters NUMERIC(5,2) NOT NULL DEFAULT 32.00,
  boom_sections TEXT NOT NULL DEFAULT '4-Section Z-Fold',
  output_capacity_m3_hour NUMERIC(6,2) NOT NULL DEFAULT 120.00,
  max_pressure_bar NUMERIC(6,2) NOT NULL DEFAULT 85.00,
  plate_number TEXT NOT NULL UNIQUE,
  year_manufactured INTEGER NOT NULL DEFAULT 2021,
  engine_hours NUMERIC(10,2) NOT NULL DEFAULT 2500.00,
  primary_operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
  primary_operator_name TEXT NOT NULL,
  secondary_operator_name TEXT,
  driver_name TEXT,
  status public.pump_unit_status NOT NULL DEFAULT 'available',
  current_project_location TEXT,
  next_service_date DATE NOT NULL,
  next_service_engine_hours NUMERIC(10,2) NOT NULL DEFAULT 3000.00,
  total_maintenance_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  stnk_expiry_date DATE NOT NULL,
  kir_expiry_date DATE NOT NULL,
  insurance_expiry_date DATE,
  total_rental_hours NUMERIC(10,2) DEFAULT 0.00,
  total_m3_pumped NUMERIC(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Complete missing columns when an earlier manual setup created pump_units
-- with a reduced field list. Existing rows remain intact.
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS category_code public.pump_category_code NOT NULL DEFAULT 'standard_24_36m';
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS brand_chassis TEXT NOT NULL DEFAULT '';
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS brand_pump TEXT NOT NULL DEFAULT '';
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS boom_length_meters NUMERIC(5,2) NOT NULL DEFAULT 32.00;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS boom_sections TEXT NOT NULL DEFAULT '4-Section Z-Fold';
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS output_capacity_m3_hour NUMERIC(6,2) NOT NULL DEFAULT 120.00;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS max_pressure_bar NUMERIC(6,2) NOT NULL DEFAULT 85.00;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS year_manufactured INTEGER NOT NULL DEFAULT 2021;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS engine_hours NUMERIC(10,2) NOT NULL DEFAULT 2500.00;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS primary_operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS primary_operator_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS secondary_operator_name TEXT;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS current_project_location TEXT;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS next_service_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS next_service_engine_hours NUMERIC(10,2) NOT NULL DEFAULT 3000.00;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS total_maintenance_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS stnk_expiry_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS kir_expiry_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS total_rental_hours NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS total_m3_pumped NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.pump_units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_pump_units_code ON public.pump_units(unit_code);
CREATE INDEX IF NOT EXISTS idx_pump_units_status ON public.pump_units(status);
CREATE INDEX IF NOT EXISTS idx_pump_units_category ON public.pump_units(category_code);
CREATE INDEX IF NOT EXISTS idx_pump_units_plate ON public.pump_units(plate_number);
CREATE INDEX IF NOT EXISTS idx_operators_status ON public.operators(status);

-- Owner check used by the delete policy below.
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'owner'
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.pump_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pump_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view fleet categories" ON public.pump_categories;
CREATE POLICY "Authenticated users can view fleet categories"
  ON public.pump_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage operators" ON public.operators;
CREATE POLICY "Authenticated users can manage operators"
  ON public.operators FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can view pump units" ON public.pump_units;
CREATE POLICY "Authenticated users can view pump units"
  ON public.pump_units FOR SELECT TO authenticated USING (true);

-- Replace the former FOR ALL policy: it unintentionally allowed all users to delete.
DROP POLICY IF EXISTS "Authenticated users can insert or update pump units" ON public.pump_units;
DROP POLICY IF EXISTS "Only owners can delete pump units" ON public.pump_units;
DROP POLICY IF EXISTS "Authenticated users can insert pump units" ON public.pump_units;
DROP POLICY IF EXISTS "Authenticated users can update pump units" ON public.pump_units;

CREATE POLICY "Authenticated users can insert pump units"
  ON public.pump_units FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update pump units"
  ON public.pump_units FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Only owners can delete pump units"
  ON public.pump_units FOR DELETE TO authenticated USING (public.is_owner());
