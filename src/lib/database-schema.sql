-- ==============================================================================
-- CONCRETE PUMP MANAGEMENT SYSTEM (CPMS) - DATABASE MIGRATION SCRIPT
-- Supabase PostgreSQL Initial Migration: Profiles, Company Settings, Audit Logs
-- ==============================================================================

-- 1. Create User Role Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'admin',
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Company Settings Table (Singular company profile for the CP rental business)
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'PT Beton Perkasa Mandiri',
    legal_name TEXT,
    phone_number TEXT NOT NULL DEFAULT '+6281234567890',
    whatsapp_number TEXT NOT NULL DEFAULT '+6281234567890',
    email TEXT NOT NULL DEFAULT 'operasional@cpms.co.id',
    address TEXT NOT NULL DEFAULT 'Jl. Raya Industri Beton No. 88, Kawasan Pergudangan Armada',
    city TEXT NOT NULL DEFAULT 'Jakarta Timur',
    province TEXT NOT NULL DEFAULT 'DKI Jakarta',
    postal_code TEXT DEFAULT '13930',
    tax_id TEXT, -- NPWP
    bank_name TEXT NOT NULL DEFAULT 'Bank Central Asia (BCA)',
    bank_account_name TEXT NOT NULL DEFAULT 'PT BETON PERKASA MANDIRI',
    bank_account_number TEXT NOT NULL DEFAULT '8820192831',
    default_payment_terms_days INTEGER NOT NULL DEFAULT 14,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Audit Logs Table (Immutable log for compliance, operational, and financial traceability)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for searching audit logs by date and user
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Only owners can change user roles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_owner());

-- Company Settings Policies
CREATE POLICY "Company settings are viewable by all authenticated users"
    ON public.company_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only owners can insert or update company settings"
    ON public.company_settings FOR ALL
    TO authenticated
    USING (public.is_owner())
    WITH CHECK (public.is_owner());

-- Audit Logs Policies
CREATE POLICY "Authenticated users can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- NO UPDATE OR DELETE ON AUDIT LOGS (Immutable security)
-- (No policies granted for UPDATE/DELETE ensures records cannot be tampered with)

-- ==============================================================================
-- TRIGGER FOR AUTOMATIC PROFILE CREATION ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'admin'::user_role)
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed initial single company settings row if empty
INSERT INTO public.company_settings (company_name, phone_number, whatsapp_number, email, address, city, province, bank_name, bank_account_name, bank_account_number)
SELECT 'PT Beton Perkasa Mandiri', '+6281234567890', '+6281234567890', 'operasional@cpms.co.id', 'Jl. Raya Industri Beton No. 88', 'Jakarta Timur', 'DKI Jakarta', 'BCA', 'PT BETON PERKASA MANDIRI', '8820192831'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);

-- ==============================================================================
-- TAHAP 2: CUSTOMER RELATIONSHIP MANAGEMENT (CRM) SCHEMA
-- ==============================================================================

-- 5. Customer Segment & Status Enums
DO $$ BEGIN
    CREATE TYPE customer_segment AS ENUM (
      'kontraktor_bumn',
      'kontraktor_swasta',
      'batching_plant',
      'developer',
      'mandor_perorangan'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE customer_status AS ENUM ('aktif', 'prospek', 'macet', 'nonaktif');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    pic_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    secondary_phone TEXT,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL DEFAULT 'DKI Jakarta',
    postal_code TEXT,
    segment customer_segment NOT NULL DEFAULT 'kontraktor_swasta',
    status customer_status NOT NULL DEFAULT 'aktif',
    tax_id TEXT, -- NPWP
    credit_limit NUMERIC(15,2) NOT NULL DEFAULT 50000000.00,
    payment_term_days INTEGER NOT NULL DEFAULT 14,
    total_transaction_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_paid NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_outstanding NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_wa ON public.customers(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON public.customers(segment);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

-- 7. Customer Contacts Table (Multiple PICs per customer)
CREATE TABLE IF NOT EXISTS public.customer_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    email TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_contacts_cust_id ON public.customer_contacts(customer_id);

-- 8. Customer Followups Table (Communication & Follow-up History)
CREATE TABLE IF NOT EXISTS public.customer_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    method TEXT NOT NULL, -- 'whatsapp', 'telepon', 'survei_lapangan', 'meeting', 'email'
    notes TEXT NOT NULL,
    next_action_date DATE,
    status TEXT NOT NULL DEFAULT 'selesai', -- 'selesai', 'perlu_tindak_lanjut'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_followups_cust_id ON public.customer_followups(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_followups_date ON public.customer_followups(date DESC);

-- 9. Leads Table (Sales Pipeline)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_code TEXT NOT NULL UNIQUE,
    contact_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'whatsapp',
    stage TEXT NOT NULL DEFAULT 'inquiry',
    estimated_m3 NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    target_pump_type TEXT NOT NULL DEFAULT 'standard_24_36m',
    project_location TEXT NOT NULL,
    notes TEXT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);

-- RLS for CRM Tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customers"
    ON public.customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert customers"
    ON public.customers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
    ON public.customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Only owners can delete customers"
    ON public.customers FOR DELETE TO authenticated USING (public.is_owner());

CREATE POLICY "Authenticated users can manage customer contacts"
    ON public.customer_contacts FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage customer followups"
    ON public.customer_followups FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage leads"
    ON public.leads FOR ALL TO authenticated USING (true);

-- ==============================================================================
-- TAHAP 3: FLEET MANAGEMENT SCHEMA (20+ UNIT ARMADA POMPA BETON)
-- ==============================================================================

-- 10. Pump Category & Unit Status Enums
DO $$ BEGIN
    CREATE TYPE pump_category_code AS ENUM (
      'standard_24_36m',
      'long_boom_37_42m',
      'super_long_boom',
      'mini_pump',
      'kodok_portable',
      'custom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pump_unit_status AS ENUM (
      'available',
      'reserved',
      'rented',
      'maintenance',
      'out_of_service'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 11. Pump Categories Table
CREATE TABLE IF NOT EXISTS public.pump_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code pump_category_code NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    boom_range_label TEXT NOT NULL
);

-- Seed Initial Categories
INSERT INTO public.pump_categories (code, name, description, boom_range_label)
VALUES
  ('standard_24_36m', 'Concrete Pump Standar', 'Armada paling umum untuk pengecoran dak rumah, ruko, gedung 3-5 lantai', '24 – 36 Meter'),
  ('long_boom_37_42m', 'Concrete Pump Long Boom', 'Armada jangkauan tinggi untuk gedung komersial, hotel, dan struktur industri', '37 – 42 Meter'),
  ('super_long_boom', 'Concrete Pump Super Long Boom', 'Armada boom ekstra panjang untuk proyek infrastruktur, flyover, superblok', '>42 – 56 Meter'),
  ('mini_pump', 'Concrete Pump Mini / City', 'Truk sasis kompak untuk jalan perkampungan, perumahan padat, dan gang sempit', '18 – 21 Meter'),
  ('kodok_portable', 'Concrete Pump Kodok / Portable', 'Pompa stasioner untuk pipa horizontal panjang >100m, basement, dan terowongan', 'Tanpa Boom (Pipa Pipa)')
ON CONFLICT (code) DO NOTHING;

-- 12. Operators Table
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role_type TEXT NOT NULL DEFAULT 'operator_boom',
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    sio_number TEXT NOT NULL, -- SIO Kemenaker
    sio_expiry_date DATE NOT NULL,
    sim_type TEXT NOT NULL DEFAULT 'B2 UMUM',
    assigned_unit_id UUID,
    assigned_unit_code TEXT,
    status TEXT NOT NULL DEFAULT 'aktif',
    total_pour_projects INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_operators_status ON public.operators(status);

-- 13. Pump Units Table (20+ Unit Armada)
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

-- 14. Maintenance Records Table
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

-- RLS for Fleet Management
ALTER TABLE public.pump_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pump_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view fleet categories"
    ON public.pump_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage operators"
    ON public.operators FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view pump units"
    ON public.pump_units FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert or update pump units"
    ON public.pump_units FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Only owners can delete pump units"
    ON public.pump_units FOR DELETE TO authenticated USING (public.is_owner());

CREATE POLICY "Authenticated users can manage maintenance records"
    ON public.maintenance_records FOR ALL TO authenticated USING (true);

-- ==============================================================================
-- TAHAP 4: BOOKING, SCHEDULING, PRICING RULES & CONFLICT PREVENTION
-- ==============================================================================

-- 15. Projects Table (Proyek Konstruksi Pelanggan)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code TEXT UNIQUE NOT NULL,
    project_name TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    site_manager_name TEXT NOT NULL,
    site_manager_phone TEXT NOT NULL,
    batching_plant_partner TEXT,
    target_volume_m3 NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    realized_volume_m3 NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'aktif', -- 'aktif', 'selesai', 'tunda'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON public.projects(customer_id);

-- 16. Pricing Rules Table (Aturan Tarif Fleksibel Sewa Pompa Beton)
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code TEXT NOT NULL,
    name TEXT NOT NULL,
    base_min_hours INTEGER NOT NULL DEFAULT 8,
    base_min_m3 INTEGER NOT NULL DEFAULT 50,
    base_package_price NUMERIC(15,2) NOT NULL DEFAULT 4500000.00,
    extra_price_per_m3 NUMERIC(15,2) NOT NULL DEFAULT 60000.00,
    overtime_price_per_hour NUMERIC(15,2) NOT NULL DEFAULT 500000.00,
    mobilization_base_price NUMERIC(15,2) NOT NULL DEFAULT 1000000.00,
    pipe_rental_per_bar NUMERIC(15,2) NOT NULL DEFAULT 100000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 17. Bookings Table (Pemesanan & Jadwal Sewa Pompa Beton)
CREATE TYPE booking_status_type AS ENUM (
    'inquiry',
    'quotation',
    'pending_confirmation',
    'confirmed',
    'scheduled',
    'on_progress',
    'completed',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_wa TEXT NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT NOT NULL,
    project_location TEXT NOT NULL,
    pump_category_code TEXT NOT NULL,
    requested_boom_meters INTEGER NOT NULL DEFAULT 0,
    pour_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    estimated_duration_hours NUMERIC(5,2) NOT NULL DEFAULT 8.00,
    mobilization_buffer_hours NUMERIC(4,2) NOT NULL DEFAULT 2.00,
    volume_m3 NUMERIC(10,2) NOT NULL DEFAULT 50.00,
    concrete_grade TEXT NOT NULL DEFAULT 'K-300',
    extra_pipes_count INTEGER NOT NULL DEFAULT 0,
    cement_bedding_sacks INTEGER NOT NULL DEFAULT 2,
    assigned_unit_id UUID REFERENCES public.pump_units(id) ON DELETE SET NULL,
    assigned_unit_code TEXT,
    assigned_operator_name TEXT,
    assigned_driver_name TEXT,
    pricing_model TEXT NOT NULL DEFAULT 'paket',
    base_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    extra_volume_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    extra_hour_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    mobilization_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    additional_costs NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    apply_tax BOOLEAN NOT NULL DEFAULT true,
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status booking_status_type NOT NULL DEFAULT 'inquiry',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_pour_date ON public.bookings(pour_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_unit_id ON public.bookings(assigned_unit_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);

-- PostgreSQL BTree / GiST index representation for conflict prevention
-- (Exclusion Constraint for no overlapping active bookings per unit)
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
-- ALTER TABLE public.bookings ADD CONSTRAINT no_overlapping_unit_schedules 
-- EXCLUDE USING gist (
--   assigned_unit_id WITH =,
--   tsrange(
--     (pour_date + start_time - interval '2 hours'),
--     (pour_date + end_time + interval '2 hours')
--   ) WITH &&
-- ) WHERE (status NOT IN ('cancelled', 'completed'));

-- 18. Booking Assignments & Schedules Table
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES public.pump_units(id) ON DELETE SET NULL,
    operator_name TEXT,
    driver_name TEXT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    buffer_start TIMESTAMPTZ NOT NULL,
    buffer_end TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_schedules_unit_time ON public.schedules(unit_id, scheduled_start, scheduled_end);

-- RLS for Booking & Scheduling
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage projects"
    ON public.projects FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view pricing rules"
    ON public.pricing_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage bookings"
    ON public.bookings FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage schedules"
    ON public.schedules FOR ALL TO authenticated USING (true);

-- ==============================================================================
-- TAHAP 5: FINANCIAL MANAGEMENT, BILLING, EXPENSES & CASH ACCOUNTS
-- ==============================================================================

-- 19. Cash Accounts Table (Rekening Bank & Kas Kecil Pool)
CREATE TABLE IF NOT EXISTS public.cash_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'bank', -- 'bank', 'kas_kecil', 'giro'
    opening_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 20. Quotations Table (Surat Penawaran Harga / SPH)
CREATE TYPE quotation_status_type AS ENUM ('draft', 'terkirim', 'disetujui', 'ditolak', 'kadaluarsa');

CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number TEXT UNIQUE NOT NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_wa TEXT NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT NOT NULL,
    project_location TEXT NOT NULL,
    pump_category_code TEXT NOT NULL,
    requested_boom_meters INTEGER NOT NULL DEFAULT 0,
    estimated_m3 NUMERIC(10,2) NOT NULL DEFAULT 50.00,
    pour_date DATE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until_date DATE NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    apply_tax BOOLEAN NOT NULL DEFAULT true,
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    payment_terms TEXT NOT NULL,
    status quotation_status_type NOT NULL DEFAULT 'draft',
    terms_and_conditions TEXT NOT NULL,
    signature_name TEXT NOT NULL,
    signature_title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_quotations_num ON public.quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotations_cust ON public.quotations(customer_id);

-- 21. Quotation Items Table
CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit TEXT NOT NULL DEFAULT 'Paket',
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_qid ON public.quotation_items(quotation_id);

-- 22. Invoices Table (Faktur Penagihan & Berita Acara)
CREATE TYPE invoice_status_type AS ENUM ('draft', 'unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled');

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    quotation_number TEXT,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    booking_code TEXT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_wa TEXT NOT NULL,
    project_name TEXT NOT NULL,
    project_location TEXT NOT NULL,
    unit_code TEXT,
    pour_date DATE NOT NULL,
    volume_realized_m3 NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    apply_tax BOOLEAN NOT NULL DEFAULT true,
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    bank_account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL,
    status invoice_status_type NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invoices_num ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_cust ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- 23. Invoice Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit TEXT NOT NULL DEFAULT 'Paket',
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_iid ON public.invoice_items(invoice_id);

-- 24. Payments Table (Kwitansi Pembayaran Resmi)
CREATE TYPE payment_type_enum AS ENUM ('dp', 'termin', 'pelunasan');
CREATE TYPE payment_method_enum AS ENUM ('transfer_bank', 'tunai', 'giro', 'cek');

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL, -- KWT-2026-XXXX
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    payment_type payment_type_enum NOT NULL DEFAULT 'dp',
    payment_method payment_method_enum NOT NULL DEFAULT 'transfer_bank',
    cash_account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL,
    cash_account_name TEXT NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    reference_number TEXT,
    notes TEXT,
    received_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_receipt ON public.payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_cust ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date DESC);

-- 25. Expenses Table (Biaya Operasional Lapangan & Per Unit Armada)
CREATE TYPE expense_category_enum AS ENUM (
    'bbm',
    'tol',
    'parkir',
    'mobilisasi',
    'operator',
    'makan',
    'maintenance',
    'sparepart',
    'pajak_kendaraan',
    'lainnya'
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number TEXT UNIQUE NOT NULL, -- EXP-2026-XXXX
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category expense_category_enum NOT NULL DEFAULT 'bbm',
    amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    unit_id UUID REFERENCES public.pump_units(id) ON DELETE SET NULL,
    unit_code TEXT,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    booking_code TEXT,
    cash_account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL,
    cash_account_name TEXT NOT NULL,
    description TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    receipt_file_url TEXT,
    audited_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_expenses_unit ON public.expenses(unit_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);

-- RLS for Financial Entities
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage cash accounts"
    ON public.cash_accounts FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage quotations"
    ON public.quotations FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage quotation items"
    ON public.quotation_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage invoices"
    ON public.invoices FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage invoice items"
    ON public.invoice_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage payments"
    ON public.payments FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage expenses"
    ON public.expenses FOR ALL TO authenticated USING (true);

-- ==============================================================================
-- TAHAP 6: META WHATSAPP BUSINESS CLOUD API INTEGRATION & NOTIFICATIONS
-- ==============================================================================

-- 26. WhatsApp Contacts Table
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    whatsapp_number TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    group_tag TEXT NOT NULL DEFAULT 'kontraktor_swasta',
    opt_in_status TEXT NOT NULL DEFAULT 'opted_in', -- 'opted_in', 'opted_out', 'pending'
    opt_in_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    last_interaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_wa_contacts_num ON public.whatsapp_contacts(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_group ON public.whatsapp_contacts(group_tag);

-- 27. WhatsApp Conversations Table (Unified Inbox Threads)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_wa TEXT NOT NULL,
    company_name TEXT,
    last_message_text TEXT NOT NULL,
    last_message_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    unread_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'resolved', 'pending'
    assigned_agent TEXT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_wa_conv_contact ON public.whatsapp_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_wa_conv_wa ON public.whatsapp_conversations(contact_wa);
CREATE INDEX IF NOT EXISTS idx_wa_conv_time ON public.whatsapp_conversations(last_message_time DESC);

-- 28. WhatsApp Messages Table (Inbound & Outbound History)
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
    contact_wa TEXT NOT NULL,
    direction TEXT NOT NULL, -- 'inbound', 'outbound'
    message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'template', 'document', 'image', 'location'
    body TEXT NOT NULL,
    media_url TEXT,
    media_filename TEXT,
    template_name TEXT,
    template_variables JSONB,
    meta_message_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_wa_msg_conv ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_wa_msg_meta ON public.whatsapp_messages(meta_message_id);
CREATE INDEX IF NOT EXISTS idx_wa_msg_created ON public.whatsapp_messages(created_at DESC);

-- 29. WhatsApp Templates Table (Approved Meta Message Templates)
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'UTILITY', -- 'MARKETING', 'UTILITY', 'AUTHENTICATION'
    language TEXT NOT NULL DEFAULT 'id',
    header_text TEXT,
    body_text TEXT NOT NULL,
    footer_text TEXT,
    variables_example JSONB,
    status TEXT NOT NULL DEFAULT 'APPROVED', -- 'APPROVED', 'PENDING', 'REJECTED'
    meta_template_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 30. Broadcast Campaigns Table
CREATE TABLE IF NOT EXISTS public.broadcast_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name TEXT NOT NULL,
    template_id UUID REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
    template_name TEXT NOT NULL,
    target_group TEXT NOT NULL DEFAULT 'all',
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'cancelled'
    total_recipients INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    delivered_count INTEGER NOT NULL DEFAULT 0,
    read_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    scheduled_at TIMESTAMPTZ,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 31. Broadcast Recipients Table
CREATE TABLE IF NOT EXISTS public.broadcast_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL,
    contact_name TEXT NOT NULL,
    contact_wa TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    meta_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bc_rec_campaign ON public.broadcast_recipients(campaign_id);

-- 32. System & Operational Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'booking_alert', 'schedule_reminder', 'payment_reminder', 'document_dispatch', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_id TEXT,
    reference_type TEXT,
    channel TEXT NOT NULL DEFAULT 'both', -- 'whatsapp', 'in_app', 'both'
    is_read BOOLEAN NOT NULL DEFAULT false,
    whatsapp_sent BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_sent ON public.notifications(sent_at DESC);

-- RLS for WhatsApp & Notifications
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage whatsapp contacts"
    ON public.whatsapp_contacts FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage whatsapp conversations"
    ON public.whatsapp_conversations FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage whatsapp messages"
    ON public.whatsapp_messages FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage whatsapp templates"
    ON public.whatsapp_templates FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage broadcast campaigns"
    ON public.broadcast_campaigns FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage broadcast recipients"
    ON public.broadcast_recipients FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage notifications"
    ON public.notifications FOR ALL TO authenticated USING (true);

-- ==============================================================================
-- 33. TABEL DAILY_BI_SNAPSHOTS (Business Intelligence & Executive Analytics)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_bi_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL UNIQUE,
    total_omzet NUMERIC(15, 2) NOT NULL DEFAULT 0,
    pendapatan_diterima NUMERIC(15, 2) NOT NULL DEFAULT 0,
    piutang_berjalan NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_biaya_operasional NUMERIC(15, 2) NOT NULL DEFAULT 0,
    laba_bersih NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_bookings INTEGER NOT NULL DEFAULT 0,
    completed_bookings INTEGER NOT NULL DEFAULT 0,
    cancelled_bookings INTEGER NOT NULL DEFAULT 0,
    cancellation_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    average_booking_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_volume_cor_m3 NUMERIC(10, 2) NOT NULL DEFAULT 0,
    active_units INTEGER NOT NULL DEFAULT 22,
    productivity_m3_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0,
    customer_baru_count INTEGER NOT NULL DEFAULT 0,
    customer_berulang_count INTEGER NOT NULL DEFAULT 0,
    repeat_customer_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    chats_handled INTEGER NOT NULL DEFAULT 0,
    avg_response_time_minutes NUMERIC(5, 2) NOT NULL DEFAULT 0,
    quotations_generated INTEGER NOT NULL DEFAULT 0,
    successful_bookings INTEGER NOT NULL DEFAULT 0,
    conversion_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    unreplied_chats INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bi_snapshots_date ON public.daily_bi_snapshots(snapshot_date);
ALTER TABLE public.daily_bi_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read and manage bi snapshots"
    ON public.daily_bi_snapshots FOR ALL TO authenticated USING (true);






