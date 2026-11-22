-- CPMS additive fleet migration
-- Safe to run after the existing basic project tables.
-- This migration does NOT drop, rename, or modify public.fleets or its data.

DO $$ BEGIN
  CREATE TYPE pump_category_code AS ENUM (
    'standard_24_36m',
    'long_boom_37_42m',
    'super_long_boom',
    'mini_pump',
    'kodok_portable',
    'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pump_unit_status AS ENUM (
    'available',
    'reserved',
    'rented',
    'maintenance',
    'out_of_service'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.pump_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code pump_category_code NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  boom_range_label TEXT NOT NULL
);

INSERT INTO public.pump_categories (code, name, description, boom_range_label)
VALUES
  ('standard_24_36m', 'Concrete Pump Standar', 'Armada paling umum untuk pengecoran dak rumah, ruko, gedung 3-5 lantai', '24 – 36 Meter'),
  ('long_boom_37_42m', 'Concrete Pump Long Boom', 'Armada jangkauan tinggi untuk gedung komersial, hotel, dan struktur industri', '37 – 42 Meter'),
  ('super_long_boom', 'Concrete Pump Super Long Boom', 'Armada boom ekstra panjang untuk proyek infrastruktur, flyover, superblok', '>42 – 56 Meter'),
  ('mini_pump', 'Concrete Pump Mini / City', 'Truk sasis kompak untuk jalan perkampungan, perumahan padat, dan gang sempit', '18 – 21 Meter'),
  ('kodok_portable', 'Concrete Pump Kodok / Portable', 'Pompa stasioner untuk pipa horizontal panjang >100m, basement, dan terowongan', 'Tanpa Boom (Pipa Pipa)')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role_type TEXT NOT NULL DEFAULT 'operator_boom',
  phone_number TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  sio_number TEXT NOT NULL,
  sio_expiry_date DATE NOT NULL,
  sim_type TEXT NOT NULL DEFAULT 'B2 UMUM',
  assigned_unit_id UUID,
  assigned_unit_code TEXT,
  status TEXT NOT NULL DEFAULT 'aktif',
  total_pour_projects INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_operators_status ON public.operators(status);

CREATE TABLE IF NOT EXISTS public.pump_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code TEXT NOT NULL UNIQUE,
  category_code pump_category_code NOT NULL DEFAULT 'standard_24_36m',
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
  status pump_unit_status NOT NULL DEFAULT 'available',
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

CREATE INDEX IF NOT EXISTS idx_pump_units_code ON public.pump_units(unit_code);
CREATE INDEX IF NOT EXISTS idx_pump_units_status ON public.pump_units(status);
CREATE INDEX IF NOT EXISTS idx_pump_units_category ON public.pump_units(category_code);
CREATE INDEX IF NOT EXISTS idx_pump_units_plate ON public.pump_units(plate_number);

CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.pump_units(id) ON DELETE CASCADE,
  unit_code TEXT NOT NULL,
  service_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  service_type TEXT NOT NULL DEFAULT 'servis_berkala',
  description TEXT NOT NULL,
  workshop_technician TEXT NOT NULL,
  cost_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  engine_hour_at_service NUMERIC(10,2) NOT NULL,
  damage_notes TEXT,
  replaced_parts TEXT,
  next_recommended_service_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_unit_id ON public.maintenance_records(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_date ON public.maintenance_records(service_date DESC);

ALTER TABLE public.pump_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pump_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can view fleet categories"
    ON public.pump_categories FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can manage operators"
    ON public.operators FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can view pump units"
    ON public.pump_units FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert or update pump units"
    ON public.pump_units FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update pump units"
    ON public.pump_units FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only owners can delete pump units"
    ON public.pump_units FOR DELETE TO authenticated USING (public.is_owner());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can manage maintenance records"
    ON public.maintenance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Refresh PostgREST schema cache so the newly created tables are available.
NOTIFY pgrst, 'reload schema';
