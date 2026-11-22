/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Fleet Management Store & Service Layer (20+ Units)
 */

import {
  PumpUnit,
  PumpCategory,
  PumpCategoryCode,
  PumpUnitStatus,
  Operator,
  MaintenanceRecord,
  RentalHistoryRecord,
} from '../types/database';
import { getSupabaseClient, recordAuditLog } from './supabase';

const STORAGE_FLEET_UNITS = 'cpms_fleet_units';
const STORAGE_OPERATORS = 'cpms_fleet_operators';
const STORAGE_MAINTENANCE = 'cpms_fleet_maintenance';

export const PUMP_CATEGORIES: PumpCategory[] = [
  {
    id: 'cat-1',
    code: 'standard_24_36m',
    name: 'Concrete Pump Standar (24–36m)',
    description: 'Armada paling umum untuk pengecoran dak rumah tinggal, ruko, dan gedung 3–5 lantai.',
    boom_range_label: '24 – 36 Meter',
  },
  {
    id: 'cat-2',
    code: 'long_boom_37_42m',
    name: 'Concrete Pump Long Boom (37–42m)',
    description: 'Armada jangkauan tinggi untuk gedung bertingkat, hotel, apartemen, dan lantai atas.',
    boom_range_label: '37 – 42 Meter',
  },
  {
    id: 'cat-3',
    code: 'super_long_boom',
    name: 'Concrete Pump Super Long Boom (>42m)',
    description: 'Armada boom ekstra panjang untuk infrastruktur flyover, jembatan, superblok, dan bendungan.',
    boom_range_label: '46 – 56 Meter',
  },
  {
    id: 'cat-4',
    code: 'mini_pump',
    name: 'Concrete Pump Mini / City (18–21m)',
    description: 'Truk sasis kompak untuk jalan perkampungan, perumahan padat, dan gang sempit.',
    boom_range_label: '18 – 21 Meter',
  },
  {
    id: 'cat-5',
    code: 'kodok_portable',
    name: 'Concrete Pump Kodok / Portable',
    description: 'Pompa stasioner untuk pipa horizontal panjang >100m, basement, dan terowongan/subway.',
    boom_range_label: 'Pipa Horisontal (>100m)',
  },
  {
    id: 'cat-6',
    code: 'custom',
    name: 'Custom / Spesialis Khusus',
    description: 'Unit pompa modifikasi khusus untuk tambang atau pengecoran bawah air.',
    boom_range_label: 'Custom Spec',
  },
];

// Initial realistic 22+ units
const SEED_OPERATORS: Operator[] = [
  {
    id: 'op-01',
    name: 'Agus Triono',
    role_type: 'operator_boom',
    phone_number: '081234567801',
    whatsapp_number: '6281234567801',
    sio_number: 'SIO.01/PUMP/BNSP/2023',
    sio_expiry_date: '2027-05-20',
    sim_type: 'B2 UMUM',
    assigned_unit_code: 'CP-36-01',
    status: 'aktif',
    total_pour_projects: 142,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'op-02',
    name: 'Wahyudi Santoso',
    role_type: 'operator_boom',
    phone_number: '081234567802',
    whatsapp_number: '6281234567802',
    sio_number: 'SIO.02/PUMP/BNSP/2022',
    sio_expiry_date: '2026-11-15',
    sim_type: 'B2 UMUM',
    assigned_unit_code: 'CP-42-01',
    status: 'aktif',
    total_pour_projects: 215,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'op-03',
    name: 'Supriyanto',
    role_type: 'operator_boom',
    phone_number: '081234567803',
    whatsapp_number: '6281234567803',
    sio_number: 'SIO.03/PUMP/BNSP/2024',
    sio_expiry_date: '2028-02-10',
    sim_type: 'B2 UMUM',
    assigned_unit_code: 'CP-52-01',
    status: 'aktif',
    total_pour_projects: 89,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'op-04',
    name: 'M. Sobri',
    role_type: 'operator_boom',
    phone_number: '081234567804',
    whatsapp_number: '6281234567804',
    sio_number: 'SIO.04/PUMP/BNSP/2023',
    sio_expiry_date: '2027-08-30',
    sim_type: 'B2 UMUM',
    assigned_unit_code: 'CP-MINI-01',
    status: 'aktif',
    total_pour_projects: 110,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'op-05',
    name: 'Bambang Irawan',
    role_type: 'operator_boom',
    phone_number: '081234567805',
    whatsapp_number: '6281234567805',
    sio_number: 'SIO.05/PUMP/BNSP/2023',
    sio_expiry_date: '2027-04-12',
    sim_type: 'B2 UMUM',
    assigned_unit_code: 'CP-KODOK-01',
    status: 'aktif',
    total_pour_projects: 95,
    created_at: '2026-01-01T00:00:00Z',
  },
];

const SEED_PUMP_UNITS: PumpUnit[] = [
  // Standar 24–36m (7 units)
  {
    id: 'unit-01',
    unit_code: 'CP-28-01',
    category_code: 'standard_24_36m',
    name: 'Putzmeister BSF 28.14H',
    brand_chassis: 'Hino 500 FG 235 JJ',
    brand_pump: 'Putzmeister (Germany)',
    boom_length_meters: 28,
    boom_sections: '4-Section Z-Fold',
    output_capacity_m3_hour: 110,
    max_pressure_bar: 85,
    plate_number: 'B 9142 TYA',
    year_manufactured: 2021,
    engine_hours: 2840,
    primary_operator_name: 'Agus Triono',
    secondary_operator_name: 'Joko P.',
    driver_name: 'Sutrisno',
    status: 'available',
    next_service_date: '2026-12-15',
    next_service_engine_hours: 3000,
    total_maintenance_cost: 38500000,
    stnk_expiry_date: '2027-06-20',
    kir_expiry_date: '2026-12-10',
    total_rental_hours: 1420,
    total_m3_pumped: 18500,
    notes: 'Kondisi wear plate 85%. Pipa boom pipa kembar masih sangat baik.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-02',
    unit_code: 'CP-32-01',
    category_code: 'standard_24_36m',
    name: 'Sany SYG5230THB 32',
    brand_chassis: 'Isuzu Giga FVM 240',
    brand_pump: 'Sany Heavy Industry',
    boom_length_meters: 32,
    boom_sections: '4-Section Z-Fold',
    output_capacity_m3_hour: 125,
    max_pressure_bar: 85,
    plate_number: 'B 9283 PQR',
    year_manufactured: 2022,
    engine_hours: 2150,
    primary_operator_name: 'Ahmad Yani',
    driver_name: 'Rudi H.',
    status: 'available',
    next_service_date: '2026-11-30',
    next_service_engine_hours: 2500,
    total_maintenance_cost: 29000000,
    stnk_expiry_date: '2027-04-15',
    kir_expiry_date: '2026-11-20',
    notes: 'Unit favorit untuk proyek ruko dan perumahan 3 lantai.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-03',
    unit_code: 'CP-36-01',
    category_code: 'standard_24_36m',
    name: 'Everdigm ECP 36ZX',
    brand_chassis: 'Hino 500 FM 260 JD',
    brand_pump: 'Everdigm (Korea)',
    boom_length_meters: 36,
    boom_sections: '4-Section ZX-Fold',
    output_capacity_m3_hour: 140,
    max_pressure_bar: 85,
    plate_number: 'B 9871 UXT',
    year_manufactured: 2020,
    engine_hours: 3950,
    primary_operator_name: 'Agus Triono',
    driver_name: 'Hadi',
    status: 'rented',
    current_project_location: 'Proyek Apartemen Silk Town Serpong (PT Total BP)',
    next_service_date: '2026-11-25',
    next_service_engine_hours: 4000,
    total_maintenance_cost: 54000000,
    stnk_expiry_date: '2027-02-18',
    kir_expiry_date: '2026-12-05',
    notes: 'Sedang beroperasi cor malam ini di Serpong (volume estimasi 240 m³).',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-04',
    unit_code: 'CP-36-02',
    category_code: 'standard_24_36m',
    name: 'Zoomlion 36X-4Z',
    brand_chassis: 'Mitsubishi Fuso Fighter FN 62',
    brand_pump: 'Zoomlion Heavy Industry',
    boom_length_meters: 36,
    boom_sections: '4-Section Z-Fold',
    output_capacity_m3_hour: 130,
    max_pressure_bar: 85,
    plate_number: 'B 9345 BCD',
    year_manufactured: 2021,
    engine_hours: 2600,
    primary_operator_name: 'Dedi Kurniawan',
    driver_name: 'Iwan',
    status: 'reserved',
    current_project_location: 'Booking H-1: Proyek Kampus UNJ Rawamangun',
    next_service_date: '2026-12-20',
    next_service_engine_hours: 3000,
    total_maintenance_cost: 32000000,
    stnk_expiry_date: '2027-05-12',
    kir_expiry_date: '2026-12-28',
    notes: 'Kesiapan unit sudah divalidasi tim mekanik siang tadi.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-05',
    unit_code: 'CP-36-03',
    category_code: 'standard_24_36m',
    name: 'Schwing S 36 X',
    brand_chassis: 'Mercedes-Benz Actros 2636',
    brand_pump: 'Schwing Stetter (Germany)',
    boom_length_meters: 36,
    boom_sections: '4-Section Roll-and-Fold',
    output_capacity_m3_hour: 135,
    max_pressure_bar: 90,
    plate_number: 'B 9654 KLM',
    year_manufactured: 2019,
    engine_hours: 4620,
    primary_operator_name: 'Hendri Saputra',
    driver_name: 'Wawan',
    status: 'maintenance',
    next_service_date: '2026-11-12',
    next_service_engine_hours: 4700,
    total_maintenance_cost: 68000000,
    stnk_expiry_date: '2026-12-30',
    kir_expiry_date: '2026-11-18',
    notes: 'Sedang penggantian seal kit hidrolik dan wear ring di bengkel pool.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-06',
    unit_code: 'CP-24-01',
    category_code: 'standard_24_36m',
    name: 'Sany SYG5180THB 24',
    brand_chassis: 'Hino 500 FC 190 J',
    brand_pump: 'Sany Heavy Industry',
    boom_length_meters: 24,
    boom_sections: '3-Section Z-Fold',
    output_capacity_m3_hour: 95,
    max_pressure_bar: 75,
    plate_number: 'B 9112 ZYX',
    year_manufactured: 2022,
    engine_hours: 1850,
    primary_operator_name: 'Rahmat Hidayat',
    driver_name: 'Samsul',
    status: 'available',
    next_service_date: '2026-12-30',
    next_service_engine_hours: 2200,
    total_maintenance_cost: 18000000,
    stnk_expiry_date: '2027-09-08',
    kir_expiry_date: '2027-01-14',
    notes: 'Unit ringkas sangat cocok untuk jalan 2 lajur dan jembatan beban terbatas.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-07',
    unit_code: 'CP-32-02',
    category_code: 'standard_24_36m',
    name: 'Putzmeister BSF 32.14H',
    brand_chassis: 'Isuzu Giga FVM 240',
    brand_pump: 'Putzmeister (Germany)',
    boom_length_meters: 32,
    boom_sections: '4-Section Z-Fold',
    output_capacity_m3_hour: 120,
    max_pressure_bar: 85,
    plate_number: 'B 9789 NOP',
    year_manufactured: 2021,
    engine_hours: 2950,
    primary_operator_name: 'Yusuf Maulana',
    driver_name: 'Anto',
    status: 'available',
    next_service_date: '2026-12-18',
    next_service_engine_hours: 3200,
    total_maintenance_cost: 34000000,
    stnk_expiry_date: '2027-03-24',
    kir_expiry_date: '2026-12-15',
    notes: 'Semua sistem hidrolik normal. Remote control radio baru dikalibrasi.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },

  // Long Boom 37–42m (5 units)
  {
    id: 'unit-08',
    unit_code: 'CP-38-01',
    category_code: 'long_boom_37_42m',
    name: 'Sany SYG5280THB 38',
    brand_chassis: 'Hino 500 FM 260 JD',
    brand_pump: 'Sany Heavy Industry',
    boom_length_meters: 38,
    boom_sections: '5-Section RZ-Fold',
    output_capacity_m3_hour: 140,
    max_pressure_bar: 85,
    plate_number: 'B 9234 QWE',
    year_manufactured: 2022,
    engine_hours: 2420,
    primary_operator_name: 'Wahyudi Santoso',
    driver_name: 'Kusnan',
    status: 'available',
    next_service_date: '2026-12-08',
    next_service_engine_hours: 2800,
    total_maintenance_cost: 31000000,
    stnk_expiry_date: '2027-07-19',
    kir_expiry_date: '2027-01-10',
    notes: 'Sistem RZ-Fold memungkinkan pembukaan boom pada ruang vertikal terbatas.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-09',
    unit_code: 'CP-40-01',
    category_code: 'long_boom_37_42m',
    name: 'Zoomlion 40X-5RZ',
    brand_chassis: 'Mercedes-Benz Actros 3336',
    brand_pump: 'Zoomlion Heavy Industry',
    boom_length_meters: 40,
    boom_sections: '5-Section RZ-Fold',
    output_capacity_m3_hour: 150,
    max_pressure_bar: 85,
    plate_number: 'B 9555 ASD',
    year_manufactured: 2023,
    engine_hours: 1650,
    primary_operator_name: 'Budi Raharjo',
    driver_name: 'Darto',
    status: 'rented',
    current_project_location: 'Proyek LRT Jabodebek Tahap 2 (PT Wijaya Karya)',
    next_service_date: '2027-01-15',
    next_service_engine_hours: 2000,
    total_maintenance_cost: 21000000,
    stnk_expiry_date: '2028-01-10',
    kir_expiry_date: '2027-03-05',
    notes: 'Sedang bertugas pengecoran pier jembatan koridor Rasuna Said.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-10',
    unit_code: 'CP-42-01',
    category_code: 'long_boom_37_42m',
    name: 'Putzmeister BSF 42.16H',
    brand_chassis: 'Volvo FMX 400 8x4',
    brand_pump: 'Putzmeister (Germany)',
    boom_length_meters: 42,
    boom_sections: '5-Section RZ-Fold',
    output_capacity_m3_hour: 160,
    max_pressure_bar: 90,
    plate_number: 'B 9901 ZXC',
    year_manufactured: 2021,
    engine_hours: 3120,
    primary_operator_name: 'Wahyudi Santoso',
    driver_name: 'Rahmat',
    status: 'available',
    next_service_date: '2026-12-10',
    next_service_engine_hours: 3500,
    total_maintenance_cost: 58000000,
    stnk_expiry_date: '2027-05-30',
    kir_expiry_date: '2026-12-22',
    notes: 'Kapasitas pompa besar 160 m³/jam, sangat handal untuk pengecoran massal masif.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-11',
    unit_code: 'CP-42-02',
    category_code: 'long_boom_37_42m',
    name: 'Everdigm ECP 42CS',
    brand_chassis: 'Hino 500 Profia 8x4',
    brand_pump: 'Everdigm (Korea)',
    boom_length_meters: 42,
    boom_sections: '5-Section RZ-Fold',
    output_capacity_m3_hour: 160,
    max_pressure_bar: 85,
    plate_number: 'B 9812 FGH',
    year_manufactured: 2022,
    engine_hours: 2380,
    primary_operator_name: 'Teguh Prakoso',
    driver_name: 'Suratman',
    status: 'available',
    next_service_date: '2026-12-28',
    next_service_engine_hours: 2700,
    total_maintenance_cost: 36000000,
    stnk_expiry_date: '2027-08-15',
    kir_expiry_date: '2027-01-18',
    notes: 'Kondisi prima. Outrigger X-style sangat stabil pada permukaan miring.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-12',
    unit_code: 'CP-42-03',
    category_code: 'long_boom_37_42m',
    name: 'Sany SYG5330THB 42',
    brand_chassis: 'Isuzu Giga CYZ 8x4',
    brand_pump: 'Sany Heavy Industry',
    boom_length_meters: 42,
    boom_sections: '5-Section RZ-Fold',
    output_capacity_m3_hour: 160,
    max_pressure_bar: 85,
    plate_number: 'B 9441 JKL',
    year_manufactured: 2020,
    engine_hours: 4100,
    primary_operator_name: 'Danang Tri',
    driver_name: 'Gito',
    status: 'out_of_service',
    next_service_date: '2026-11-10',
    next_service_engine_hours: 4200,
    total_maintenance_cost: 82000000,
    stnk_expiry_date: '2026-11-28',
    kir_expiry_date: '2026-11-15',
    notes: 'Menunggu penggantian pompa hidrolik utama (Main Hydraulic Pump A4VG180 Rexroth).',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },

  // Super Long Boom >42m (3 units)
  {
    id: 'unit-13',
    unit_code: 'CP-46-01',
    category_code: 'super_long_boom',
    name: 'Putzmeister BSF 46.16H',
    brand_chassis: 'Mercedes-Benz Actros 4141 8x4',
    brand_pump: 'Putzmeister (Germany)',
    boom_length_meters: 46,
    boom_sections: '5-Section RZ-Fold',
    output_capacity_m3_hour: 160,
    max_pressure_bar: 95,
    plate_number: 'B 9100 SLB',
    year_manufactured: 2022,
    engine_hours: 2100,
    primary_operator_name: 'Supriyanto',
    driver_name: 'Yanto',
    status: 'available',
    next_service_date: '2027-01-20',
    next_service_engine_hours: 2500,
    total_maintenance_cost: 48000000,
    stnk_expiry_date: '2027-10-12',
    kir_expiry_date: '2027-02-14',
    notes: 'Unit andalan jangkauan gedung perkantoran tinggi & struktur flyover.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-14',
    unit_code: 'CP-52-01',
    category_code: 'super_long_boom',
    name: 'Sany SYG5440THB 52',
    brand_chassis: 'Scania P410 8x4',
    brand_pump: 'Sany Heavy Industry',
    boom_length_meters: 52,
    boom_sections: '6-Section RZ-Fold',
    output_capacity_m3_hour: 170,
    max_pressure_bar: 100,
    plate_number: 'B 9520 SLB',
    year_manufactured: 2023,
    engine_hours: 1450,
    primary_operator_name: 'Supriyanto',
    driver_name: 'Eko S.',
    status: 'reserved',
    current_project_location: 'Booking Lusa: Pengecoran Slab Tower Thamrin Nine',
    next_service_date: '2027-02-10',
    next_service_engine_hours: 1800,
    total_maintenance_cost: 35000000,
    stnk_expiry_date: '2028-04-18',
    kir_expiry_date: '2027-04-02',
    notes: 'Boom 52 meter membutuhkan area stabilisator outrigger minimal 9.5 meter.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-15',
    unit_code: 'CP-56-01',
    category_code: 'super_long_boom',
    name: 'Zoomlion 56X-6RZ',
    brand_chassis: 'Volvo FMX 460 10x4',
    brand_pump: 'Zoomlion Heavy Industry',
    boom_length_meters: 56,
    boom_sections: '6-Section RZ-Fold',
    output_capacity_m3_hour: 180,
    max_pressure_bar: 110,
    plate_number: 'B 9560 SLB',
    year_manufactured: 2023,
    engine_hours: 1120,
    primary_operator_name: 'Kurnia Ramadhan',
    driver_name: 'Agil',
    status: 'available',
    next_service_date: '2027-03-01',
    next_service_engine_hours: 1500,
    total_maintenance_cost: 28000000,
    stnk_expiry_date: '2028-06-15',
    kir_expiry_date: '2027-05-18',
    notes: 'Unit flagship terbesar dengan jangkauan 56 meter vertikal.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },

  // Concrete Pump Mini / City (4 units)
  {
    id: 'unit-16',
    unit_code: 'CP-MINI-01',
    category_code: 'mini_pump',
    name: 'IHI City Pump IPG 18-3Z',
    brand_chassis: 'Hino Dutro 130 HD',
    brand_pump: 'IHI Corporation (Japan)',
    boom_length_meters: 18,
    boom_sections: '3-Section Z-Fold',
    output_capacity_m3_hour: 65,
    max_pressure_bar: 60,
    plate_number: 'B 9011 MNI',
    year_manufactured: 2021,
    engine_hours: 3200,
    primary_operator_name: 'M. Sobri',
    driver_name: 'Karjo',
    status: 'rented',
    current_project_location: 'Pengecoran Dak Rumah Cluster Victoria Bekasi',
    next_service_date: '2026-12-05',
    next_service_engine_hours: 3500,
    total_maintenance_cost: 24000000,
    stnk_expiry_date: '2027-03-11',
    kir_expiry_date: '2026-12-01',
    notes: 'Sasis 2 gandar pendek, dapat bermanuver di jalan perumahan lebar 3 meter.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-17',
    unit_code: 'CP-MINI-02',
    category_code: 'mini_pump',
    name: 'Sany SYG5120THB 21 City',
    brand_chassis: 'Isuzu Elf NMR 71 HD',
    brand_pump: 'Sany Heavy Industry',
    boom_length_meters: 21,
    boom_sections: '3-Section Z-Fold',
    output_capacity_m3_hour: 75,
    max_pressure_bar: 65,
    plate_number: 'B 9022 MNI',
    year_manufactured: 2022,
    engine_hours: 2450,
    primary_operator_name: 'M. Sobri',
    driver_name: 'Gani',
    status: 'available',
    next_service_date: '2026-12-22',
    next_service_engine_hours: 2800,
    total_maintenance_cost: 19500000,
    stnk_expiry_date: '2027-06-25',
    kir_expiry_date: '2027-01-08',
    notes: 'Tinggi un-folding boom sangat rendah, bisa masuk bawah kabel PLN rendah.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-18',
    unit_code: 'CP-MINI-03',
    category_code: 'mini_pump',
    name: 'Junjin JXZ 20-3.11HP',
    brand_chassis: 'Mitsubishi Colt Diesel Canter HD',
    brand_pump: 'Junjin (Korea)',
    boom_length_meters: 20,
    boom_sections: '3-Section Z-Fold',
    output_capacity_m3_hour: 70,
    max_pressure_bar: 65,
    plate_number: 'B 9033 MNI',
    year_manufactured: 2020,
    engine_hours: 3800,
    primary_operator_name: 'Fauzi Rahman',
    driver_name: 'Bari',
    status: 'available',
    next_service_date: '2026-11-28',
    next_service_engine_hours: 4000,
    total_maintenance_cost: 31000000,
    stnk_expiry_date: '2026-12-14',
    kir_expiry_date: '2026-11-25',
    notes: 'Kondisi mesin terawat baik. Piston cor baru diganti 2 bulan lalu.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-19',
    unit_code: 'CP-MINI-04',
    category_code: 'mini_pump',
    name: 'Everdigm ECP 21 Mini',
    brand_chassis: 'Hino Dutro 130 HD',
    brand_pump: 'Everdigm (Korea)',
    boom_length_meters: 21,
    boom_sections: '3-Section Z-Fold',
    output_capacity_m3_hour: 75,
    max_pressure_bar: 65,
    plate_number: 'B 9044 MNI',
    year_manufactured: 2023,
    engine_hours: 1250,
    primary_operator_name: 'Dadan Suhendar',
    driver_name: 'Jaya',
    status: 'available',
    next_service_date: '2027-02-15',
    next_service_engine_hours: 1600,
    total_maintenance_cost: 14000000,
    stnk_expiry_date: '2028-02-20',
    kir_expiry_date: '2027-03-12',
    notes: 'Armada mini terbaru, efisiensi bahan bakar sangat tinggi.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },

  // Concrete Pump Kodok / Portable / Stationary (3 units)
  {
    id: 'unit-20',
    unit_code: 'CP-KODOK-01',
    category_code: 'kodok_portable',
    name: 'Putzmeister BSA 1409 D (Stationary)',
    brand_chassis: 'Trailer Mounted (Deutz Diesel Engine)',
    brand_pump: 'Putzmeister (Germany)',
    boom_length_meters: 0,
    boom_sections: 'Pipa Manual (>120 Meter)',
    output_capacity_m3_hour: 90,
    max_pressure_bar: 130,
    plate_number: 'B 9191 KDK',
    year_manufactured: 2021,
    engine_hours: 2750,
    primary_operator_name: 'Bambang Irawan',
    driver_name: 'Soleh (Towing)',
    status: 'available',
    next_service_date: '2026-12-12',
    next_service_engine_hours: 3000,
    total_maintenance_cost: 41000000,
    stnk_expiry_date: '2027-05-18',
    kir_expiry_date: '2026-12-19',
    notes: 'Dilengkapi 45 batang pipa galvanis 3 meter, 10 elbow 90°, dan 2 kran pengalih.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-21',
    unit_code: 'CP-KODOK-02',
    category_code: 'kodok_portable',
    name: 'Schwing SP 1800 Trailer Pump',
    brand_chassis: 'Trailer Mounted (Cummins Turbo Diesel)',
    brand_pump: 'Schwing Stetter (Germany)',
    boom_length_meters: 0,
    boom_sections: 'Pipa Manual (>150 Meter)',
    output_capacity_m3_hour: 100,
    max_pressure_bar: 140,
    plate_number: 'B 9292 KDK',
    year_manufactured: 2022,
    engine_hours: 1980,
    primary_operator_name: 'Bambang Irawan',
    driver_name: 'Towing Unit',
    status: 'rented',
    current_project_location: 'Proyek Terowongan Subway & Basement MRT Glodok',
    next_service_date: '2027-01-10',
    next_service_engine_hours: 2300,
    total_maintenance_cost: 26000000,
    stnk_expiry_date: '2027-08-20',
    kir_expiry_date: '2027-02-14',
    notes: 'Sedang terpasang untuk pengecoran struktur dinding diafragma bawah tanah.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'unit-22',
    unit_code: 'CP-KODOK-03',
    category_code: 'kodok_portable',
    name: 'Sany HBT80C-1818D',
    brand_chassis: 'Trailer Mounted (Deutz Engine)',
    brand_pump: 'Sany Heavy Industry',
    boom_length_meters: 0,
    boom_sections: 'Pipa Manual (>100 Meter)',
    output_capacity_m3_hour: 85,
    max_pressure_bar: 120,
    plate_number: 'B 9393 KDK',
    year_manufactured: 2020,
    engine_hours: 3600,
    primary_operator_name: 'Yudi Hartono',
    driver_name: 'Towing Unit',
    status: 'maintenance',
    next_service_date: '2026-11-15',
    next_service_engine_hours: 3800,
    total_maintenance_cost: 38000000,
    stnk_expiry_date: '2026-12-10',
    kir_expiry_date: '2026-11-20',
    notes: 'Sedang servis s-tube valve dan pembersihan kerak beton dalam hopper.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const SEED_MAINTENANCE_RECORDS: MaintenanceRecord[] = [
  {
    id: 'maint-01',
    unit_id: 'unit-05',
    unit_code: 'CP-36-03',
    service_date: '2026-11-08T09:00:00Z',
    service_type: 'wear_plate_ring',
    description: 'Penggantian wear plate tungsten carbide & cutting ring karena celah aus >2mm.',
    workshop_technician: 'Mekanik Ruslan (Bengkel Utama Pool)',
    cost_amount: 14500000,
    engine_hour_at_service: 4620,
    damage_notes: 'Keausan wajar akibat gesekan pasir silika tajam.',
    replaced_parts: 'Wear Plate Tungsten 200mm, Cutting Ring, O-Ring Seal Kit',
    next_recommended_service_date: '2027-05-10',
    created_at: '2026-11-08T09:00:00Z',
  },
  {
    id: 'maint-02',
    unit_id: 'unit-01',
    unit_code: 'CP-28-01',
    service_date: '2026-10-15T10:30:00Z',
    service_type: 'ganti_oli_hidrolik',
    description: 'Kuras tangki oli hidrolik 400L, ganti filter hisap & filter balik hidrolik.',
    workshop_technician: 'Mekanik Ruslan & Tim',
    cost_amount: 16800000,
    engine_hour_at_service: 2600,
    damage_notes: 'Warna oli mulai keruh setelah 600 jam kerja pemompaan.',
    replaced_parts: 'Oli Hidrolik Shell Tellus S2 V 46 (400 Liter), Element Filter Rexroth',
    next_recommended_service_date: '2027-04-15',
    created_at: '2026-10-15T10:30:00Z',
  },
  {
    id: 'maint-03',
    unit_id: 'unit-12',
    unit_code: 'CP-42-03',
    service_date: '2026-11-02T13:00:00Z',
    service_type: 'emergency_repair',
    description: 'Pengecekan anomali tekanan hidrolik drop saat boom dinaikkan ke stage 4.',
    workshop_technician: 'Service Resmi Sany Jaya Perkasa',
    cost_amount: 8500000,
    engine_hour_at_service: 4100,
    damage_notes: 'Kerusakan internal pada seal swashplate main pump Rexroth.',
    replaced_parts: 'Sedang menunggu inden unit pompa hidrolik baru dari agen resmi',
    created_at: '2026-11-02T13:00:00Z',
  },
];

// Helper functions for persistent storage
function loadStoredUnits(): PumpUnit[] {
  // Never surface seeded/demo data in production.
  if (import.meta.env.PROD) return [];
  const raw = localStorage.getItem(STORAGE_FLEET_UNITS);
  if (!raw) {
    localStorage.setItem(STORAGE_FLEET_UNITS, JSON.stringify(SEED_PUMP_UNITS));
    return SEED_PUMP_UNITS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEED_PUMP_UNITS;
  }
}

function saveStoredUnits(units: PumpUnit[]): void {
  localStorage.setItem(STORAGE_FLEET_UNITS, JSON.stringify(units));
}

function loadStoredOperators(): Operator[] {
  // Never surface seeded/demo data in production.
  if (import.meta.env.PROD) return [];
  const raw = localStorage.getItem(STORAGE_OPERATORS);
  if (!raw) {
    localStorage.setItem(STORAGE_OPERATORS, JSON.stringify(SEED_OPERATORS));
    return SEED_OPERATORS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEED_OPERATORS;
  }
}

function saveStoredOperators(ops: Operator[]): void {
  localStorage.setItem(STORAGE_OPERATORS, JSON.stringify(ops));
}

function loadStoredMaintenance(): MaintenanceRecord[] {
  // Never surface seeded/demo data in production.
  if (import.meta.env.PROD) return [];
  const raw = localStorage.getItem(STORAGE_MAINTENANCE);
  if (!raw) {
    localStorage.setItem(STORAGE_MAINTENANCE, JSON.stringify(SEED_MAINTENANCE_RECORDS));
    return SEED_MAINTENANCE_RECORDS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEED_MAINTENANCE_RECORDS;
  }
}

function saveStoredMaintenance(records: MaintenanceRecord[]): void {
  localStorage.setItem(STORAGE_MAINTENANCE, JSON.stringify(records));
}

// ==============================================================================
// FLEET MANAGEMENT API
// ==============================================================================

export interface FleetFilters {
  query?: string;
  category?: string;
  status?: string;
}

export async function fetchFleetUnits(filters?: FleetFilters): Promise<PumpUnit[]> {
  const client = getSupabaseClient();
  let units: PumpUnit[];

  if (client) {
    const { data, error } = await client
      .from('pump_units')
      .select('*')
      .order('unit_code', { ascending: true });

    if (error) {
      console.error('Supabase fetch fleet units error:', error);
      throw new Error(`Gagal memuat data armada dari Supabase: ${error.message}`);
    }

    // An empty Supabase table is a valid empty result. Do not silently show
    // demo/local seed records when the real database has no units.
    units = (data || []) as PumpUnit[];
    saveStoredUnits(units);
  } else {
    // Only use local cache when Supabase has not been configured at all.
    units = loadStoredUnits();
  }

  if (filters?.query) {
    const q = filters.query.toLowerCase().trim();
    units = units.filter(
      (u) =>
        u.unit_code.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.plate_number.toLowerCase().includes(q) ||
        u.brand_chassis.toLowerCase().includes(q) ||
        u.brand_pump.toLowerCase().includes(q) ||
        u.primary_operator_name.toLowerCase().includes(q)
    );
  }

  if (filters?.category && filters.category !== 'all') {
    units = units.filter((u) => u.category_code === filters.category);
  }

  if (filters?.status && filters.status !== 'all') {
    units = units.filter((u) => u.status === filters.status);
  }

  return units;
}

export async function fetchUnitById(id: string): Promise<PumpUnit | null> {
  const units = await fetchFleetUnits();
  return units.find((u) => u.id === id) || null;
}

export async function fetchUnitMaintenance(unitId: string): Promise<MaintenanceRecord[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('maintenance_records')
      .select('*')
      .eq('unit_id', unitId)
      .order('service_date', { ascending: false });
    if (error) {
      console.error('Supabase fetch maintenance error:', error);
      throw new Error(`Gagal memuat riwayat servis dari Supabase: ${error.message}`);
    }
    const records = (data || []) as MaintenanceRecord[];
    const stored = loadStoredMaintenance().filter((record) => record.unit_id !== unitId);
    saveStoredMaintenance([...stored, ...records]);
    return records;
  }

  return loadStoredMaintenance().filter((record) => record.unit_id === unitId);
}

export async function fetchOperators(): Promise<Operator[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('operators')
      .select('*')
      .order('name', { ascending: true });
    if (error) {
      console.error('Supabase fetch operators error:', error);
      throw new Error(`Gagal memuat operator dari Supabase: ${error.message}`);
    }
    const operators = (data || []) as Operator[];
    saveStoredOperators(operators);
    return operators;
  }
  return loadStoredOperators();
}

// Generate sequential unit code based on category: e.g. CP-36-04, CP-MINI-05, CP-KODOK-04
export function generateUnitCode(categoryCode: PumpCategoryCode, boomLength: number, existingUnits: PumpUnit[]): string {
  let prefix = 'CP-STD-';
  if (categoryCode === 'mini_pump') {
    prefix = 'CP-MINI-';
  } else if (categoryCode === 'kodok_portable') {
    prefix = 'CP-KODOK-';
  } else if (categoryCode === 'super_long_boom') {
    prefix = `CP-${boomLength || 46}-`;
  } else if (boomLength > 0) {
    prefix = `CP-${boomLength}-`;
  }

  const matches = existingUnits.filter((u) => u.unit_code.startsWith(prefix));
  const nextNum = matches.length + 1;
  return `${prefix}${nextNum.toString().padStart(2, '0')}`;
}
export async function createPumpUnit(
  unitData: Omit<PumpUnit, 'id' | 'created_at' | 'updated_at'>,
  userEmail: string,
  userRole: string
): Promise<{ success: boolean; unit?: PumpUnit; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase belum dikonfigurasi. Periksa URL dan anon key pada Pengaturan.',
    };
  }

  try {
    // Check duplicates against the database, not the demo/local seed cache.
    const normalizedPlate = unitData.plate_number.replace(/\\s/g, '').toUpperCase();
    const { data: duplicate, error: duplicateError } = await client
      .from('pump_units')
      .select('id, unit_code, name, plate_number')
      .ilike('plate_number', unitData.plate_number.trim())
      .maybeSingle();

    if (duplicateError) {
      return {
        success: false,
        error: `Gagal memeriksa nomor polisi di Supabase: ${duplicateError.message}`,
      };
    }

    if (duplicate && String(duplicate.plate_number || '').replace(/\\s/g, '').toUpperCase() === normalizedPlate) {
      return {
        success: false,
        error: `Nomor polisi ${unitData.plate_number} sudah terdaftar pada unit ${duplicate.unit_code} (${duplicate.name})`,
      };
    }

    const { data: newUnit, error } = await client
      .from('pump_units')
      .insert(unitData)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase insert unit error:', error);
      return {
        success: false,
        error: `Gagal menyimpan unit ke Supabase: ${error.message}`,
      };
    }

    if (!newUnit) {
      return {
        success: false,
        error: 'Supabase tidak mengembalikan data unit setelah penyimpanan.',
      };
    }

    // Refresh cache from the canonical remote result.
    const cachedUnits = loadStoredUnits().filter((unit) => unit.id !== newUnit.id);
    cachedUnits.unshift(newUnit as PumpUnit);
    saveStoredUnits(cachedUnits);

    try {
      await recordAuditLog({
        user_id: userEmail,
        user_email: userEmail,
        user_role: userRole as 'owner' | 'admin',
        action: 'CREATE_PUMP_UNIT',
        entity_type: 'fleet',
        entity_id: newUnit.id,
        details: {
          unit_code: newUnit.unit_code,
          name: newUnit.name,
          boom_length: newUnit.boom_length_meters,
          plate_number: newUnit.plate_number,
        },
      });
    } catch (auditError) {
      console.error('Unit saved, but audit log failed:', auditError);
    }

    return { success: true, unit: newUnit as PumpUnit };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Supabase create unit exception:', err);
    return { success: false, error: `Gagal menyimpan unit ke Supabase: ${message}` };
  }
}

export async function updatePumpUnit(
  id: string,
  updates: Partial<PumpUnit>,
  userEmail: string = 'system@cpms-indonesia.com',
  userRole: string = 'owner'
): Promise<{ success: boolean; unit?: PumpUnit; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase belum dikonfigurasi. Periksa URL dan anon key pada Pengaturan.' };
  }

  try {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    delete (payload as Partial<PumpUnit>).id;
    delete (payload as Partial<PumpUnit>).created_at;

    const { data, error } = await client
      .from('pump_units')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase update unit error:', error);
      return { success: false, error: `Gagal memperbarui unit di Supabase: ${error.message}` };
    }
    if (!data) return { success: false, error: 'Supabase tidak mengembalikan data unit setelah pembaruan.' };

    const updated = data as PumpUnit;
    const cached = loadStoredUnits().filter((unit) => unit.id !== id);
    cached.push(updated);
    saveStoredUnits(cached);

    try {
      await recordAuditLog({
        user_id: userEmail,
        user_email: userEmail,
        user_role: userRole as 'owner' | 'admin',
        action: 'UPDATE_PUMP_UNIT',
        entity_type: 'fleet',
        entity_id: id,
        details: { unit_code: updated.unit_code, updated_fields: Object.keys(updates) },
      });
    } catch (auditError) {
      console.error('Unit updated, but audit log failed:', auditError);
    }

    return { success: true, unit: updated };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Gagal memperbarui unit di Supabase: ${message}` };
  }
}

export async function recordMaintenance(
  record: Omit<MaintenanceRecord, 'id' | 'created_at'>,
  userEmail: string,
  userRole: string
): Promise<MaintenanceRecord> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum dikonfigurasi. Catatan servis tidak disimpan.');
  }

  const { data: savedRecord, error: insertError } = await client
    .from('maintenance_records')
    .insert(record)
    .select('*')
    .single();

  if (insertError) {
    console.error('Supabase insert maintenance error:', insertError);
    throw new Error(`Gagal menyimpan catatan servis ke Supabase: ${insertError.message}`);
  }
  if (!savedRecord) throw new Error('Supabase tidak mengembalikan catatan servis yang tersimpan.');

  const { data: currentUnit, error: unitReadError } = await client
    .from('pump_units')
    .select('total_maintenance_cost')
    .eq('id', record.unit_id)
    .single();

  if (unitReadError) {
    throw new Error(`Catatan servis tersimpan, tetapi total biaya unit gagal dibaca: ${unitReadError.message}`);
  }

  const unitUpdates: Partial<PumpUnit> = {
    total_maintenance_cost: Number(currentUnit?.total_maintenance_cost || 0) + Number(record.cost_amount || 0),
  };
  if (record.next_recommended_service_date) {
    unitUpdates.next_service_date = record.next_recommended_service_date;
  }

  const { error: unitUpdateError } = await client
    .from('pump_units')
    .update(unitUpdates)
    .eq('id', record.unit_id);

  if (unitUpdateError) {
    throw new Error(`Catatan servis tersimpan, tetapi ringkasan unit gagal diperbarui: ${unitUpdateError.message}`);
  }

  const newRecord = savedRecord as MaintenanceRecord;
  const records = loadStoredMaintenance().filter((item) => item.id !== newRecord.id);
  saveStoredMaintenance([newRecord, ...records]);

  const units = loadStoredUnits().map((unit) =>
    unit.id === record.unit_id
      ? { ...unit, ...unitUpdates, updated_at: new Date().toISOString() }
      : unit
  );
  saveStoredUnits(units);

  try {
    await recordAuditLog({
      user_id: userEmail,
      user_email: userEmail,
      user_role: userRole as 'owner' | 'admin',
      action: 'RECORD_MAINTENANCE',
      entity_type: 'maintenance',
      entity_id: newRecord.id,
      details: {
        unit_code: record.unit_code,
        service_type: record.service_type,
        cost_amount: record.cost_amount,
      },
    });
  } catch (auditError) {
    console.error('Maintenance saved, but audit log failed:', auditError);
  }

  return newRecord;
}

/**
 * Advanced Availability Engine (Pre-integrated with scheduling)
 * Calculates effective availability based on physical condition + scheduled bookings
 */
export function checkUnitAvailability(
  unit: PumpUnit,
  targetDate?: string
): { isAvailable: boolean; effectiveStatus: PumpUnitStatus; reason: string } {
  // 1. Mechanical check
  if (unit.status === 'out_of_service') {
    return {
      isAvailable: false,
      effectiveStatus: 'out_of_service',
      reason: 'Unit rusak berat / tidak dapat beroperasi (menunggu suku cadang).',
    };
  }

  if (unit.status === 'maintenance') {
    return {
      isAvailable: false,
      effectiveStatus: 'maintenance',
      reason: 'Unit sedang dalam perawatan rutin / bengkel pool.',
    };
  }

  // 2. Legal Document check
  const now = new Date();
  const kirDate = new Date(unit.kir_expiry_date);
  if (kirDate < now) {
    return {
      isAvailable: false,
      effectiveStatus: 'out_of_service',
      reason: `KIR Dishub telah kedaluwarsa (${unit.kir_expiry_date}). Wajib uji berkala sebelum keluar pool.`,
    };
  }

  // 3. Operational status
  if (unit.status === 'rented') {
    return {
      isAvailable: false,
      effectiveStatus: 'rented',
      reason: `Sedang beroperasi di proyek: ${unit.current_project_location || 'Lapangan'}.`,
    };
  }

  if (unit.status === 'reserved') {
    return {
      isAvailable: false,
      effectiveStatus: 'reserved',
      reason: 'Telah dialokasikan untuk jadwal cor yang terkonfirmasi.',
    };
  }

  return {
    isAvailable: true,
    effectiveStatus: 'available',
    reason: 'Unit prima, dokumen aktif, siap didelegasikan ke proyek.',
  };
}
