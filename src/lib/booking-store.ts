/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Booking & Smart Scheduling Store & Engine
 * Tahap 4: Projects, Bookings, Flexible Pricing Calculator & Conflict Engine
 */

import {
  Booking,
  BookingStatus,
  ConflictCheckResult,
  PricingModelType,
  PricingRule,
  Project,
  PumpCategoryCode,
  PumpUnit,
} from '../types/database';
import { getSupabaseClient, recordAuditLog } from './supabase';
import { fetchFleetUnits, updatePumpUnit } from './fleet-store';

const STORAGE_PROJECTS = 'cpms_projects';
const STORAGE_PRICING_RULES = 'cpms_pricing_rules';
const STORAGE_BOOKINGS = 'cpms_bookings';

// ==============================================================================
// 1. SEED PRICING RULES (Standar Tarif Sewa Pompa Beton Indonesia)
// ==============================================================================
export const DEFAULT_PRICING_RULES: PricingRule[] = [
  {
    id: 'pr-std-24-36',
    category_code: 'standard_24_36m',
    name: 'Tarif Standar Concrete Pump 24–36 Meter',
    base_min_hours: 8,
    base_min_m3: 50,
    base_package_price: 4500000, // Rp 4.500.000 (Paket 8 Jam / 50 m³)
    extra_price_per_m3: 60000,    // Rp 60.000 / m³ kelebihan volume
    overtime_price_per_hour: 500000, // Rp 500.000 / jam lembur
    mobilization_base_price: 1000000, // Rp 1.000.000 mobilisasi dalam kota
    pipe_rental_per_bar: 100000, // Rp 100.000 / batang pipa (3m)
  },
  {
    id: 'pr-long-37-42',
    category_code: 'long_boom_37_42m',
    name: 'Tarif Long Boom Concrete Pump 37–42 Meter',
    base_min_hours: 8,
    base_min_m3: 50,
    base_package_price: 6000000, // Rp 6.000.000
    extra_price_per_m3: 75000,    // Rp 75.000 / m³
    overtime_price_per_hour: 650000, // Rp 650.000 / jam
    mobilization_base_price: 1500000, // Rp 1.500.000
    pipe_rental_per_bar: 100000,
  },
  {
    id: 'pr-super-long',
    category_code: 'super_long_boom',
    name: 'Tarif Super Long Boom Concrete Pump (>42 Meter)',
    base_min_hours: 8,
    base_min_m3: 50,
    base_package_price: 8500000, // Rp 8.500.000
    extra_price_per_m3: 90000,    // Rp 90.000 / m³
    overtime_price_per_hour: 850000, // Rp 850.000 / jam
    mobilization_base_price: 2000000, // Rp 2.000.000
    pipe_rental_per_bar: 120000,
  },
  {
    id: 'pr-mini',
    category_code: 'mini_pump',
    name: 'Tarif Mini / City Concrete Pump (18–21 Meter)',
    base_min_hours: 8,
    base_min_m3: 35,
    base_package_price: 3800000, // Rp 3.800.000
    extra_price_per_m3: 55000,    // Rp 55.000 / m³
    overtime_price_per_hour: 450000, // Rp 450.000 / jam
    mobilization_base_price: 800000, // Rp 800.000
    pipe_rental_per_bar: 90000,
  },
  {
    id: 'pr-kodok',
    category_code: 'kodok_portable',
    name: 'Tarif Pompa Kodok / Portable / Stationary Pump',
    base_min_hours: 8,
    base_min_m3: 50,
    base_package_price: 5500000, // Rp 5.500.000
    extra_price_per_m3: 65000,    // Rp 65000 / m³
    overtime_price_per_hour: 600000, // Rp 600.000 / jam
    mobilization_base_price: 1200000, // Rp 1.200.000
    pipe_rental_per_bar: 120000,
  },
  {
    id: 'pr-custom',
    category_code: 'custom',
    name: 'Tarif Khusus / Proyek Spesialisasi',
    base_min_hours: 8,
    base_min_m3: 50,
    base_package_price: 7000000,
    extra_price_per_m3: 80000,
    overtime_price_per_hour: 750000,
    mobilization_base_price: 1800000,
    pipe_rental_per_bar: 120000,
  },
];

// ==============================================================================
// 2. SEED PROJECTS (Proyek Konstruksi Riil di Indonesia)
// ==============================================================================
export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'prj-001',
    project_code: 'PRJ-2026-001',
    project_name: 'Apartemen Silk Town Tower Alexandria Lt. 12',
    customer_id: 'cust-2',
    customer_name: 'PT Total Bangun Persada Tbk',
    address: 'Jl. Boulevard Silk Town No. 1, Pondok Jagung Timur',
    city: 'Tangerang Selatan',
    site_manager_name: 'Ir. Bambang Triadi',
    site_manager_phone: '081234567802',
    batching_plant_partner: 'Jayamix by SCG - Plant Serpong',
    target_volume_m3: 450,
    realized_volume_m3: 180,
    status: 'aktif',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'prj-002',
    project_code: 'PRJ-2026-002',
    project_name: 'Pembangunan Depo LRT Jabodebek Tahap II',
    customer_id: 'cust-1',
    customer_name: 'PT Adhi Karya (Persero) Tbk - Divisi Infrastruktur',
    address: 'Kawasan Stasiun Jatimulya, Bekasi Timur',
    city: 'Bekasi',
    site_manager_name: 'Hendra Gunawan, ST',
    site_manager_phone: '081298765432',
    batching_plant_partner: 'Adhi Persada Beton Plant Bekasi',
    target_volume_m3: 1200,
    realized_volume_m3: 420,
    status: 'aktif',
    created_at: '2026-01-15T09:00:00Z',
  },
  {
    id: 'prj-003',
    project_code: 'PRJ-2026-003',
    project_name: 'Jalan Tol Cibitung - Cilincing Seksi 4 Ramp On/Off',
    customer_id: 'cust-4',
    customer_name: 'PT Waskita Karya (Persero) Tbk',
    address: 'Akses Marunda Center, Cilincing',
    city: 'Jakarta Utara',
    site_manager_name: 'Agus Sulistyo, ST',
    site_manager_phone: '081234567804',
    batching_plant_partner: 'Waskita Beton Precast Marunda',
    target_volume_m3: 850,
    realized_volume_m3: 310,
    status: 'aktif',
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 'prj-004',
    project_code: 'PRJ-2026-004',
    project_name: 'Perumahan Grand Victoria Tahap 3 Cluster Aster',
    customer_id: 'cust-5',
    customer_name: 'PT Summarecon Agung Tbk',
    address: 'Kawasan Symphonia Gading Serpong',
    city: 'Tangerang',
    site_manager_name: 'Dani Setiawan',
    site_manager_phone: '081234567805',
    batching_plant_partner: 'Pionirbeton Industri Plant Gading Serpong',
    target_volume_m3: 280,
    realized_volume_m3: 95,
    status: 'aktif',
    created_at: '2026-02-01T08:30:00Z',
  },
  {
    id: 'prj-005',
    project_code: 'PRJ-2026-005',
    project_name: 'Menara BNI Slipi Lt. 18-22 Core Wall',
    customer_id: 'cust-3',
    customer_name: 'PT Wijaya Karya (Persero) Tbk',
    address: 'Jl. Letjen S. Parman Kav. 28, Palmerah',
    city: 'Jakarta Barat',
    site_manager_name: 'Eko Prasetyo, MT',
    site_manager_phone: '081234567803',
    batching_plant_partner: 'Holcim / Solusi Bangun Indonesia Pluit',
    target_volume_m3: 650,
    realized_volume_m3: 240,
    status: 'aktif',
    created_at: '2026-02-05T11:00:00Z',
  },
];

// Helper to format date relative to today (YYYY-MM-DD)
function getRelativeDateStr(dayOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split('T')[0];
}

// ==============================================================================
// 3. SEED BOOKINGS (Skenario Operasional Pompa Beton Indonesia)
// ==============================================================================
export const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 'bk-001',
    booking_code: 'BK-2026-0001',
    customer_id: 'cust-2',
    customer_name: 'PT Total Bangun Persada Tbk',
    customer_wa: '6281234567802',
    project_id: 'prj-001',
    project_name: 'Apartemen Silk Town Tower Alexandria Lt. 12',
    project_location: 'Jl. Boulevard Silk Town No. 1, Tangerang Selatan',
    pump_category_code: 'standard_24_36m',
    requested_boom_meters: 36,
    pour_date: getRelativeDateStr(0), // Hari ini
    start_time: '08:00',
    end_time: '15:00',
    estimated_duration_hours: 7,
    mobilization_buffer_hours: 2,
    volume_m3: 65,
    concrete_grade: 'K-350 Slump 12±2',
    extra_pipes_count: 5,
    cement_bedding_sacks: 3,
    assigned_unit_id: 'unit-cp-36-01',
    assigned_unit_code: 'CP-36-01',
    assigned_operator_name: 'Wahyudi Pratama (SIO Kemenaker)',
    assigned_driver_name: 'Supardi Hartono',
    pricing_model: 'paket',
    base_price: 4500000,
    extra_volume_price: 900000, // 15 m³ * 60k
    extra_hour_price: 0,
    mobilization_price: 1000000,
    additional_costs: 950000, // (5 pipa * 100k) + (3 semen * 150k)
    discount_amount: 350000,
    subtotal: 7000000,
    apply_tax: true,
    tax_amount: 770000, // 11% PPN
    total_price: 7770000,
    status: 'on_progress',
    notes: 'Pengecoran plat lantai 12. Pipa vertikal shaft lift sudah terpasang.',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bk-002',
    booking_code: 'BK-2026-0002',
    customer_id: 'cust-1',
    customer_name: 'PT Adhi Karya (Persero) Tbk - Divisi Infrastruktur',
    customer_wa: '6281298765432',
    project_id: 'prj-002',
    project_name: 'Pembangunan Depo LRT Jabodebek Tahap II',
    project_location: 'Kawasan Stasiun Jatimulya, Bekasi Timur',
    pump_category_code: 'long_boom_37_42m',
    requested_boom_meters: 42,
    pour_date: getRelativeDateStr(1), // Besok
    start_time: '07:30',
    end_time: '16:30',
    estimated_duration_hours: 9,
    mobilization_buffer_hours: 2,
    volume_m3: 110,
    concrete_grade: 'K-400 Slump 14±2',
    extra_pipes_count: 0,
    cement_bedding_sacks: 4,
    assigned_unit_id: 'unit-cp-42-01',
    assigned_unit_code: 'CP-42-01',
    assigned_operator_name: 'Dedi Kurniawan',
    assigned_driver_name: 'Teguh Prasetya',
    pricing_model: 'paket',
    base_price: 6000000,
    extra_volume_price: 4500000, // 60 m³ * 75k
    extra_hour_price: 650000,   // 1 jam lembur
    mobilization_price: 1500000,
    additional_costs: 600000,   // 4 semen * 150k
    discount_amount: 500000,
    subtotal: 12250000,
    apply_tax: true,
    tax_amount: 1347500,
    total_price: 13597500,
    status: 'scheduled',
    notes: 'Pengecoran pierhead jembatan bentang panjang. Wajib APD lengkap rompi K3.',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bk-003',
    booking_code: 'BK-2026-0003',
    customer_id: 'cust-3',
    customer_name: 'PT Wijaya Karya (Persero) Tbk',
    customer_wa: '6281234567803',
    project_id: 'prj-005',
    project_name: 'Menara BNI Slipi Lt. 18-22 Core Wall',
    project_location: 'Jl. Letjen S. Parman Kav. 28, Jakarta Barat',
    pump_category_code: 'super_long_boom',
    requested_boom_meters: 48,
    pour_date: getRelativeDateStr(2), // Lusa
    start_time: '20:00',
    end_time: '04:00', // Pengecoran malam (night pour)
    estimated_duration_hours: 8,
    mobilization_buffer_hours: 2,
    volume_m3: 140,
    concrete_grade: 'K-500 Self Compacting Concrete',
    extra_pipes_count: 8,
    cement_bedding_sacks: 5,
    assigned_unit_id: 'unit-cp-48-01',
    assigned_unit_code: 'CP-48-01',
    assigned_operator_name: 'Rudi Hartono (Senior Boom Operator)',
    assigned_driver_name: 'Suhartono',
    pricing_model: 'paket',
    base_price: 8500000,
    extra_volume_price: 8100000, // 90 m³ * 90k
    extra_hour_price: 0,
    mobilization_price: 2000000,
    additional_costs: 1710000, // 8 pipa (960k) + 5 semen (750k)
    discount_amount: 1000000,
    subtotal: 19310000,
    apply_tax: true,
    tax_amount: 2124100,
    total_price: 21434100,
    status: 'confirmed',
    notes: 'Pengecoran malam hari demi menghindari kemacetan Jalan S. Parman.',
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bk-004',
    booking_code: 'BK-2026-0004',
    customer_id: 'cust-5',
    customer_name: 'PT Summarecon Agung Tbk',
    customer_wa: '6281234567805',
    project_id: 'prj-004',
    project_name: 'Perumahan Grand Victoria Tahap 3 Cluster Aster',
    project_location: 'Kawasan Symphonia Gading Serpong, Tangerang',
    pump_category_code: 'mini_pump',
    requested_boom_meters: 21,
    pour_date: getRelativeDateStr(0), // Hari ini
    start_time: '13:00',
    end_time: '17:00',
    estimated_duration_hours: 4,
    mobilization_buffer_hours: 1.5,
    volume_m3: 28,
    concrete_grade: 'K-250 Slump 10±2',
    extra_pipes_count: 2,
    cement_bedding_sacks: 2,
    assigned_unit_id: 'unit-cp-mini-01',
    assigned_unit_code: 'CP-MINI-01',
    assigned_operator_name: 'Ahmad Fauzi',
    assigned_driver_name: 'Budi Santoso',
    pricing_model: 'paket',
    base_price: 3800000,
    extra_volume_price: 0,
    extra_hour_price: 0,
    mobilization_price: 800000,
    additional_costs: 480000,
    discount_amount: 280000,
    subtotal: 4800000,
    apply_tax: false,
    tax_amount: 0,
    total_price: 4800000,
    status: 'scheduled',
    notes: 'Akses jalan perumahan paving block, wajib pakai pelat bantalan outrigger.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'bk-005',
    booking_code: 'BK-2026-0005',
    customer_id: 'cust-4',
    customer_name: 'PT Waskita Karya (Persero) Tbk',
    customer_wa: '6281234567804',
    project_id: 'prj-003',
    project_name: 'Jalan Tol Cibitung - Cilincing Seksi 4 Ramp On/Off',
    project_location: 'Akses Marunda Center, Cilincing, Jakarta Utara',
    pump_category_code: 'kodok_portable',
    requested_boom_meters: 0,
    pour_date: getRelativeDateStr(-2), // 2 hari lalu (selesai)
    start_time: '08:00',
    end_time: '18:00',
    estimated_duration_hours: 10,
    mobilization_buffer_hours: 2,
    volume_m3: 135,
    concrete_grade: 'FS-45 Rigid Pavement',
    extra_pipes_count: 25,
    cement_bedding_sacks: 6,
    assigned_unit_id: 'unit-cp-kodok-01',
    assigned_unit_code: 'CP-KODOK-01',
    assigned_operator_name: 'Koko Santoso',
    assigned_driver_name: 'Arman Maulana',
    pricing_model: 'paket',
    base_price: 5500000,
    extra_volume_price: 5525000, // 85 m³ * 65k
    extra_hour_price: 1200000,   // 2 jam lembur * 600k
    mobilization_price: 1200000,
    additional_costs: 3900000,   // 25 pipa (3jt) + 6 semen (900k)
    discount_amount: 825000,
    subtotal: 16500000,
    apply_tax: true,
    tax_amount: 1815000,
    total_price: 18315000,
    status: 'completed',
    notes: 'Pengecoran underpass menggunakan rangkaian pipa stasioner sepanjang 120 meter.',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'bk-006',
    booking_code: 'BK-2026-0006',
    customer_id: 'cust-1',
    customer_name: 'PT Adhi Karya (Persero) Tbk - Divisi Infrastruktur',
    customer_wa: '6281298765432',
    project_id: 'prj-002',
    project_name: 'Pembangunan Depo LRT Jabodebek Tahap II',
    project_location: 'Kawasan Stasiun Jatimulya, Bekasi Timur',
    pump_category_code: 'standard_24_36m',
    requested_boom_meters: 32,
    pour_date: getRelativeDateStr(3), // 3 hari ke depan
    start_time: '09:00',
    end_time: '15:00',
    estimated_duration_hours: 6,
    mobilization_buffer_hours: 2,
    volume_m3: 45,
    concrete_grade: 'K-300 Slump 12±2',
    extra_pipes_count: 0,
    cement_bedding_sacks: 2,
    assigned_unit_id: 'unit-cp-32-01',
    assigned_unit_code: 'CP-32-01',
    assigned_operator_name: 'Bambang Irawan',
    assigned_driver_name: 'Joko Widodo',
    pricing_model: 'paket',
    base_price: 4500000,
    extra_volume_price: 0,
    extra_hour_price: 0,
    mobilization_price: 1000000,
    additional_costs: 300000,
    discount_amount: 0,
    subtotal: 5800000,
    apply_tax: true,
    tax_amount: 638000,
    total_price: 6438000,
    status: 'pending_confirmation',
    notes: 'Menunggu Purchase Order (PO) resmi dari procurement Adhi Karya.',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ==============================================================================
// 4. STORAGE HELPERS
// ==============================================================================
function getLocalProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
      return DEFAULT_PROJECTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROJECTS;
  }
}

function getLocalPricingRules(): PricingRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_PRICING_RULES);
    if (!raw) {
      localStorage.setItem(STORAGE_PRICING_RULES, JSON.stringify(DEFAULT_PRICING_RULES));
      return DEFAULT_PRICING_RULES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PRICING_RULES;
  }
}

function getLocalBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_BOOKINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(DEFAULT_BOOKINGS));
      return DEFAULT_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BOOKINGS;
  }
}

// ==============================================================================
// 5. FLEXIBLE PRICE CALCULATOR
// ==============================================================================
export interface PricingCalculationInput {
  category_code: PumpCategoryCode;
  pricing_model: PricingModelType;
  volume_m3: number;
  duration_hours: number;
  extra_pipes_count?: number;
  cement_bedding_sacks?: number;
  custom_mobilization_price?: number;
  discount_amount?: number;
  apply_tax?: boolean;
}

export interface PricingCalculationResult {
  base_price: number;
  extra_volume_price: number;
  extra_hour_price: number;
  mobilization_price: number;
  additional_costs: number;
  discount_amount: number;
  subtotal: number;
  tax_amount: number;
  total_price: number;
  pricing_rule_applied: PricingRule;
}

export function calculateBookingPrice(input: PricingCalculationInput): PricingCalculationResult {
  const rules = getLocalPricingRules();
  const rule = rules.find((r) => r.category_code === input.category_code) || rules[0];

  const vol = Math.max(0, input.volume_m3 || 0);
  const hours = Math.max(1, input.duration_hours || 0);
  const extraPipes = Math.max(0, input.extra_pipes_count || 0);
  const cementSacks = Math.max(0, input.cement_bedding_sacks || 0);
  const discount = Math.max(0, input.discount_amount || 0);
  const applyTax = input.apply_tax ?? true;

  let basePrice = 0;
  let extraVolPrice = 0;
  let extraHourPrice = 0;

  if (input.pricing_model === 'per_m3') {
    // Pure per m³ model
    const minM3 = rule.base_min_m3;
    const billedM3 = Math.max(vol, minM3);
    basePrice = minM3 * rule.extra_price_per_m3;
    extraVolPrice = Math.max(0, vol - minM3) * rule.extra_price_per_m3;
  } else if (input.pricing_model === 'per_jam') {
    // Pure per hour model
    const minHours = rule.base_min_hours;
    basePrice = minHours * rule.overtime_price_per_hour;
    extraHourPrice = Math.max(0, hours - minHours) * rule.overtime_price_per_hour;
    // Extra volume still applies if exceeded
    if (vol > rule.base_min_m3) {
      extraVolPrice = (vol - rule.base_min_m3) * rule.extra_price_per_m3;
    }
  } else {
    // Paket Standar / Kombinasi (Default di Indonesia)
    // Paket mencakup hingga base_min_hours dan base_min_m3
    basePrice = rule.base_package_price;

    if (vol > rule.base_min_m3) {
      extraVolPrice = (vol - rule.base_min_m3) * rule.extra_price_per_m3;
    }

    if (hours > rule.base_min_hours) {
      extraHourPrice = (hours - rule.base_min_hours) * rule.overtime_price_per_hour;
    }
  }

  const mobPrice = input.custom_mobilization_price !== undefined
    ? input.custom_mobilization_price
    : rule.mobilization_base_price;

  // Additional: Pipa @ 100k - 120k, Semen Bedding @ 150k
  const pipeCost = extraPipes * rule.pipe_rental_per_bar;
  const cementCost = cementSacks * 150000;
  const additionalCosts = pipeCost + cementCost;

  const subtotalBeforeDiscount = basePrice + extraVolPrice + extraHourPrice + mobPrice + additionalCosts;
  const subtotal = Math.max(0, subtotalBeforeDiscount - discount);
  const taxAmount = applyTax ? Math.round(subtotal * 0.11) : 0; // PPN 11%
  const totalPrice = subtotal + taxAmount;

  return {
    base_price: basePrice,
    extra_volume_price: extraVolPrice,
    extra_hour_price: extraHourPrice,
    mobilization_price: mobPrice,
    additional_costs: additionalCosts,
    discount_amount: discount,
    subtotal,
    tax_amount: taxAmount,
    total_price: totalPrice,
    pricing_rule_applied: rule,
  };
}

// ==============================================================================
// 6. SMART CONFLICT PREVENTION ENGINE (Pencegahan Bentrok & Exclusion Logic)
// ==============================================================================

/**
 * Converts date string (YYYY-MM-DD) and time (HH:MM) to epoch timestamp
 */
function toTimestamp(dateStr: string, timeStr: string): number {
  return new Date(`${dateStr}T${timeStr}:00`).getTime();
}

/**
 * Validates whether a proposed booking conflicts with:
 * 1. Unit schedule overlap (including mobilization buffer time)
 * 2. Maintenance / Workshop downtime
 * 3. Expired vehicle legal documents (KIR Dishub)
 * 4. Operator double-booking
 */
export async function validateBookingConflict(params: {
  bookingId?: string; // If editing existing booking, exclude self
  unitId?: string;
  unitCode?: string;
  operatorName?: string;
  pourDate: string;
  startTime: string;
  endTime: string;
  mobilizationBufferHours?: number;
}): Promise<ConflictCheckResult> {
  const allBookings = await fetchBookings();
  const allUnits = await fetchFleetUnits();

  const bufferHours = params.mobilizationBufferHours || 2;
  const bufferMs = bufferHours * 3600 * 1000;

  const targetStart = toTimestamp(params.pourDate, params.startTime) - bufferMs;
  const targetEnd = toTimestamp(params.pourDate, params.endTime) + bufferMs;

  // 1. Check unit specific conditions
  if (params.unitId) {
    const unit = allUnits.find((u) => u.id === params.unitId || u.unit_code === params.unitCode);

    if (unit) {
      // 1a. Vehicle physical condition
      if (unit.status === 'out_of_service') {
        return {
          hasConflict: true,
          conflictType: 'maintenance',
          reason: `Unit ${unit.unit_code} sedang berstatus RUSAK BERAT (Out of Service) dan tidak dapat dialokasikan.`,
        };
      }

      if (unit.status === 'maintenance') {
        return {
          hasConflict: true,
          conflictType: 'maintenance',
          reason: `Unit ${unit.unit_code} sedang dalam perbaikan / perawatan berkala di bengkel pool.`,
        };
      }

      // 1b. Legal Document Validity (KIR Dishub)
      const bookingDate = new Date(params.pourDate);
      const kirExpiry = new Date(unit.kir_expiry_date);
      if (kirExpiry < bookingDate) {
        return {
          hasConflict: true,
          conflictType: 'document_expired',
          reason: `KIR Dishub unit ${unit.unit_code} telah kedaluwarsa pada ${unit.kir_expiry_date}. Truk dilarang keluar pool demi kepatuhan regulasi lalu lintas.`,
        };
      }
    }

    // 1c. Unit Schedule Overlap Check (with buffer window)
    for (const b of allBookings) {
      if (params.bookingId && b.id === params.bookingId) continue;
      if (b.status === 'cancelled' || b.status === 'completed') continue;

      if (b.assigned_unit_id === params.unitId || (params.unitCode && b.assigned_unit_code === params.unitCode)) {
        const bBufferMs = (b.mobilization_buffer_hours || 2) * 3600 * 1000;
        const bStart = toTimestamp(b.pour_date, b.start_time) - bBufferMs;
        const bEnd = toTimestamp(b.pour_date, b.end_time) + bBufferMs;

        // Check time interval intersection: [targetStart, targetEnd] overlaps [bStart, bEnd]
        if (targetStart < bEnd && targetEnd > bStart) {
          return {
            hasConflict: true,
            conflictType: 'unit_overlap',
            reason: `BENTROK WAKTU ARMADA: Unit ${b.assigned_unit_code} sudah dialokasikan untuk ${b.customer_name} pada proyek "${b.project_name}" (${b.pour_date} ${b.start_time} - ${b.end_time} + buffer ${b.mobilization_buffer_hours} jam).`,
            conflictingBooking: b,
          };
        }
      }
    }
  }

  // 2. Check Operator double-booking
  if (params.operatorName && params.operatorName.trim().length > 0) {
    for (const b of allBookings) {
      if (params.bookingId && b.id === params.bookingId) continue;
      if (b.status === 'cancelled' || b.status === 'completed') continue;

      if (
        b.assigned_operator_name &&
        b.assigned_operator_name.toLowerCase().includes(params.operatorName.toLowerCase())
      ) {
        const bBufferMs = (b.mobilization_buffer_hours || 2) * 3600 * 1000;
        const bStart = toTimestamp(b.pour_date, b.start_time) - bBufferMs;
        const bEnd = toTimestamp(b.pour_date, b.end_time) + bBufferMs;

        if (targetStart < bEnd && targetEnd > bStart) {
          return {
            hasConflict: true,
            conflictType: 'operator_overlap',
            reason: `BENTROK PENUGASAN OPERATOR: Operator ${b.assigned_operator_name} sedang bertugas pada booking ${b.booking_code} (${b.project_name}) di jam tersebut.`,
            conflictingBooking: b,
          };
        }
      }
    }
  }

  return {
    hasConflict: false,
  };
}

// ==============================================================================
// 7. SMART UNIT RECOMMENDATION ENGINE
// ==============================================================================
export interface UnitRecommendation {
  unit: PumpUnit;
  isRecommended: boolean;
  score: number;
  statusLabel: string;
  conflictResult: ConflictCheckResult;
}

export async function getRecommendedUnits(params: {
  categoryCode: PumpCategoryCode;
  requestedBoomMeters?: number;
  pourDate: string;
  startTime: string;
  endTime: string;
  mobilizationBufferHours?: number;
  excludeBookingId?: string;
}): Promise<UnitRecommendation[]> {
  const units = await fetchFleetUnits();

  const results: UnitRecommendation[] = [];

  for (const unit of units) {
    // Check conflicts for this unit
    const conflictResult = await validateBookingConflict({
      bookingId: params.excludeBookingId,
      unitId: unit.id,
      unitCode: unit.unit_code,
      pourDate: params.pourDate,
      startTime: params.startTime,
      endTime: params.endTime,
      mobilizationBufferHours: params.mobilizationBufferHours || 2,
    });

    let score = 0;
    let isCategoryMatch = unit.category_code === params.categoryCode;
    if (isCategoryMatch) score += 50;

    // Boom length match score
    if (params.requestedBoomMeters && params.requestedBoomMeters > 0) {
      if (unit.boom_length_meters >= params.requestedBoomMeters) {
        score += 30;
        // Perfect fit penalty if unnecessarily huge
        const diff = unit.boom_length_meters - params.requestedBoomMeters;
        if (diff <= 4) score += 15;
      }
    } else {
      score += 20;
    }

    // Availability penalty
    if (conflictResult.hasConflict) {
      score = -100;
    } else if (unit.status === 'available') {
      score += 20;
    }

    let statusLabel = 'Tersedia & Prima';
    if (conflictResult.hasConflict) {
      statusLabel = conflictResult.reason || 'Tidak Tersedia';
    } else if (unit.status === 'rented') {
      statusLabel = 'Saat ini di lapangan (akan kembali sebelum jadwal)';
    }

    results.push({
      unit,
      isRecommended: !conflictResult.hasConflict && isCategoryMatch,
      score,
      statusLabel,
      conflictResult,
    });
  }

  // Sort descending by score
  return results.sort((a, b) => b.score - a.score);
}

// ==============================================================================
// 8. CRUD & SERVICE METHODS
// ==============================================================================

export async function fetchProjects(): Promise<Project[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Project[];
      }
    } catch {
      // fallback to local
    }
  }
  return getLocalProjects();
}

export async function createProject(projectData: Omit<Project, 'id' | 'project_code' | 'created_at'>): Promise<Project> {
  const projects = getLocalProjects();
  const nextNum = projects.length + 1;
  const projectCode = `PRJ-2026-${String(nextNum).padStart(3, '0')}`;

  const newProject: Project = {
    ...projectData,
    id: `prj-${Date.now()}`,
    project_code: projectCode,
    created_at: new Date().toISOString(),
  };

  const updated = [newProject, ...projects];
  localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('projects').insert([newProject]);
    } catch {
      // Local is already saved
    }
  }

  await recordAuditLog({
    user_id: 'current-user',
    user_email: 'owner@cpms-indonesia.com',
    user_role: 'owner',
    action: 'CREATE_PROJECT',
    entity_type: 'projects',
    entity_id: newProject.id,
    details: { project_code: newProject.project_code, project_name: newProject.project_name },
  });

  return newProject;
}

export async function fetchBookings(filters?: {
  status?: BookingStatus | 'all';
  search?: string;
  startDate?: string;
  endDate?: string;
  unitId?: string;
}): Promise<Booking[]> {
  const supabase = getSupabaseClient();
  let list: Booking[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('pour_date', { ascending: false });
      if (!error && data && data.length > 0) {
        list = data as Booking[];
      } else {
        list = getLocalBookings();
      }
    } catch {
      list = getLocalBookings();
    }
  } else {
    list = getLocalBookings();
  }

  if (!filters) return list;

  return list.filter((b) => {
    if (filters.status && filters.status !== 'all' && b.status !== filters.status) {
      return false;
    }
    if (filters.unitId && b.assigned_unit_id !== filters.unitId) {
      return false;
    }
    if (filters.startDate && b.pour_date < filters.startDate) {
      return false;
    }
    if (filters.endDate && b.pour_date > filters.endDate) {
      return false;
    }
    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase();
      const matchCode = b.booking_code.toLowerCase().includes(q);
      const matchCust = b.customer_name.toLowerCase().includes(q);
      const matchPrj = b.project_name.toLowerCase().includes(q);
      const matchUnit = (b.assigned_unit_code || '').toLowerCase().includes(q);
      if (!matchCode && !matchCust && !matchPrj && !matchUnit) {
        return false;
      }
    }
    return true;
  });
}

export function generateNextBookingCode(existingBookings: Booking[]): string {
  const year = new Date().getFullYear();
  const count = existingBookings.length + 1;
  return `BK-${year}-${String(count).padStart(4, '0')}`;
}

export async function createBooking(
  bookingInput: Omit<Booking, 'id' | 'booking_code' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; booking?: Booking; conflict?: ConflictCheckResult }> {
  // 1. Strict Conflict Verification
  const conflict = await validateBookingConflict({
    unitId: bookingInput.assigned_unit_id,
    unitCode: bookingInput.assigned_unit_code,
    operatorName: bookingInput.assigned_operator_name,
    pourDate: bookingInput.pour_date,
    startTime: bookingInput.start_time,
    endTime: bookingInput.end_time,
    mobilizationBufferHours: bookingInput.mobilization_buffer_hours,
  });

  if (conflict.hasConflict) {
    return { success: false, conflict };
  }

  const all = getLocalBookings();
  const nextCode = generateNextBookingCode(all);

  const newBooking: Booking = {
    ...bookingInput,
    id: `bk-${Date.now()}`,
    booking_code: nextCode,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated = [newBooking, ...all];
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(updated));

  // Sync Unit status if unit assigned
  if (newBooking.assigned_unit_id) {
    if (newBooking.status === 'on_progress') {
      await updatePumpUnit(newBooking.assigned_unit_id, {
        status: 'rented',
        current_project_location: newBooking.project_location,
      });
    } else if (newBooking.status === 'scheduled' || newBooking.status === 'confirmed') {
      await updatePumpUnit(newBooking.assigned_unit_id, {
        status: 'reserved',
      });
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('bookings').insert([newBooking]);
    } catch {
      // Local fallback
    }
  }

  await recordAuditLog({
    user_id: 'current-user',
    user_email: 'owner@cpms-indonesia.com',
    user_role: 'owner',
    action: 'CREATE_BOOKING',
    entity_type: 'bookings',
    entity_id: newBooking.id,
    details: {
      booking_code: newBooking.booking_code,
      customer: newBooking.customer_name,
      pour_date: newBooking.pour_date,
      unit: newBooking.assigned_unit_code,
      total_price: newBooking.total_price,
    },
  });

  return { success: true, booking: newBooking };
}

export async function updateBooking(
  id: string,
  updates: Partial<Booking>
): Promise<{ success: boolean; booking?: Booking; conflict?: ConflictCheckResult }> {
  const all = getLocalBookings();
  const existing = all.find((b) => b.id === id);
  if (!existing) {
    return {
      success: false,
      conflict: { hasConflict: true, reason: 'Data booking tidak ditemukan' },
    };
  }

  const merged = { ...existing, ...updates };

  // If time, unit, or operator is changing, re-validate conflicts
  const isTimeOrResourceChanged =
    updates.pour_date !== undefined ||
    updates.start_time !== undefined ||
    updates.end_time !== undefined ||
    updates.assigned_unit_id !== undefined ||
    updates.assigned_operator_name !== undefined;

  if (isTimeOrResourceChanged) {
    const conflict = await validateBookingConflict({
      bookingId: id,
      unitId: merged.assigned_unit_id,
      unitCode: merged.assigned_unit_code,
      operatorName: merged.assigned_operator_name,
      pourDate: merged.pour_date,
      startTime: merged.start_time,
      endTime: merged.end_time,
      mobilizationBufferHours: merged.mobilization_buffer_hours,
    });

    if (conflict.hasConflict) {
      return { success: false, conflict };
    }
  }

  const updatedBooking: Booking = {
    ...merged,
    updated_at: new Date().toISOString(),
  };

  const newAll = all.map((b) => (b.id === id ? updatedBooking : b));
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(newAll));

  // Sync unit operational status
  if (updatedBooking.assigned_unit_id) {
    if (updatedBooking.status === 'on_progress') {
      await updatePumpUnit(updatedBooking.assigned_unit_id, {
        status: 'rented',
        current_project_location: updatedBooking.project_location,
      });
    } else if (updatedBooking.status === 'scheduled' || updatedBooking.status === 'confirmed') {
      await updatePumpUnit(updatedBooking.assigned_unit_id, {
        status: 'reserved',
      });
    } else if (updatedBooking.status === 'completed' || updatedBooking.status === 'cancelled') {
      await updatePumpUnit(updatedBooking.assigned_unit_id, {
        status: 'available',
        current_project_location: 'Pool Utama Armada',
      });
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('bookings').update(updatedBooking).eq('id', id);
    } catch {
      // Local fallback
    }
  }

  await recordAuditLog({
    user_id: 'current-user',
    user_email: 'owner@cpms-indonesia.com',
    user_role: 'owner',
    action: 'UPDATE_BOOKING',
    entity_type: 'bookings',
    entity_id: id,
    details: {
      booking_code: updatedBooking.booking_code,
      status: updatedBooking.status,
      unit: updatedBooking.assigned_unit_code,
    },
  });

  return { success: true, booking: updatedBooking };
}

export async function updateBookingStatus(
  id: string,
  newStatus: BookingStatus
): Promise<{ success: boolean; error?: string }> {
  const res = await updateBooking(id, { status: newStatus });
  if (!res.success) {
    return { success: false, error: res.conflict?.reason || 'Gagal mengubah status booking' };
  }
  return { success: true };
}

export async function deleteBooking(id: string): Promise<boolean> {
  const all = getLocalBookings();
  const existing = all.find((b) => b.id === id);
  if (!existing) return false;

  // Release unit if booked
  if (existing.assigned_unit_id) {
    await updatePumpUnit(existing.assigned_unit_id, {
      status: 'available',
    });
  }

  const filtered = all.filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(filtered));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('bookings').delete().eq('id', id);
    } catch {
      // Local
    }
  }

  await recordAuditLog({
    user_id: 'current-user',
    user_email: 'owner@cpms-indonesia.com',
    user_role: 'owner',
    action: 'DELETE_BOOKING',
    entity_type: 'bookings',
    entity_id: id,
    details: { booking_code: existing.booking_code },
  });

  return true;
}
