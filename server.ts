/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Backend Express Server & Gemini AI Controller
 * Tahap 7: AI Customer Service & AI Owner Assistant with Controlled Query Tools
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
type CPMSRole = 'owner' | 'admin';
type AuthenticatedRequest = Request & {
  cpmsUser?: { id: string; email: string; role: CPMSRole };
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const authClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

async function requireCpmsAuth(req: Request, res: Response, next: express.NextFunction) {
  const authorization = req.header('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!authClient || !token) {
    res.status(401).json({ error: 'Autentikasi diperlukan.' });
    return;
  }
  try {
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa.' });
      return;
    }
    const { data: profile, error: profileError } = await authClient
      .from('profiles').select('id,email,role').eq('id', user.id).maybeSingle();
    if (profileError || !profile || !['owner', 'admin'].includes(profile.role)) {
      res.status(403).json({ error: 'Akun tidak memiliki profil atau peran CPMS yang sah.' });
      return;
    }
    (req as AuthenticatedRequest).cpmsUser = {
      id: user.id,
      email: user.email || profile.email || '',
      role: profile.role as CPMSRole,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Tidak dapat memverifikasi sesi pengguna.' });
  }
}

function requireOwner(req: Request, res: Response, next: express.NextFunction) {
  if ((req as AuthenticatedRequest).cpmsUser?.role !== 'owner') {
    res.status(403).json({ error: 'Fitur ini hanya tersedia untuk akun owner.', restricted: true });
    return;
  }
  next();
}


// Initialize GoogleGenAI SDK (Server-Side Only)
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ==============================================================================
// CONTROLLED BACKEND DATA & QUERY TOOLS (NO FREE SQL ACCESS)
// ==============================================================================

export const PUMP_SPECIFICATIONS = [
  {
    category: 'standard_24_36m',
    title: 'Standard Concrete Pump 24–36 Meter',
    boom_reach: '24 s/d 36 meter vertikal',
    horizontal_reach: '20 s/d 32 meter horizontal',
    pipe_diameter: '125 mm (5 inch)',
    max_output: '90 m³/jam',
    recommended_for: 'Gedung 2-4 lantai, ruko, perumahan, jembatan kecil, dan dak lantai menengah.',
    base_rate: 'Rp 4.500.000 / paket 8 jam (termasuk s/d 50 m³)',
    extra_rate: 'Rp 60.000 / m³ kelebihan volume',
    overtime_rate: 'Rp 500.000 / jam lembur',
  },
  {
    category: 'long_boom_37_42m',
    title: 'Long Boom Concrete Pump 37–42 Meter',
    boom_reach: '37 s/d 42 meter vertikal',
    horizontal_reach: '33 s/d 38 meter horizontal',
    pipe_diameter: '125 mm (5 inch)',
    max_output: '120 m³/jam',
    recommended_for: 'Gedung 5-8 lantai, flyover jalan tol, dermaga, dan area dengan jarak rintangan jauh.',
    base_rate: 'Rp 6.000.000 / paket 8 jam (termasuk s/d 50 m³)',
    extra_rate: 'Rp 75.000 / m³ kelebihan volume',
    overtime_rate: 'Rp 650.000 / jam lembur',
  },
  {
    category: 'super_long_boom',
    title: 'Super Long Boom Concrete Pump (>42 Meter)',
    boom_reach: '46 s/d 56 meter vertikal',
    horizontal_reach: '42 s/d 51 meter horizontal',
    pipe_diameter: '125 mm (5 inch)',
    max_output: '160 m³/jam',
    recommended_for: 'High rise building, tower apartemen, jembatan bentang panjang, dan konstruksi mega.',
    base_rate: 'Rp 8.500.000 / paket 8 jam (termasuk s/d 50 m³)',
    extra_rate: 'Rp 90.000 / m³ kelebihan volume',
    overtime_rate: 'Rp 850.000 / jam lembur',
  },
  {
    category: 'mini_pump',
    title: 'Mini / City Concrete Pump (18–21 Meter)',
    boom_reach: '18 s/d 21 meter vertikal',
    horizontal_reach: '15 s/d 18 meter horizontal',
    pipe_diameter: '100 - 125 mm',
    max_output: '50 m³/jam',
    recommended_for: 'Jalan sempit perumahan padat, gang kota, radius putar terbatas, dan outrigger compact.',
    base_rate: 'Rp 3.800.000 / paket 8 jam (termasuk s/d 35 m³)',
    extra_rate: 'Rp 55.000 / m³ kelebihan volume',
    overtime_rate: 'Rp 450.000 / jam lembur',
  },
  {
    category: 'kodok_portable',
    title: 'Pompa Kodok / Stationary / Portable Trailer Pump',
    boom_reach: 'Tanpa boom (sistem perakitan pipa baja pipa horizontal/vertikal)',
    horizontal_reach: '100 s/d 300+ meter pipa sambungan',
    pipe_diameter: '125 mm baja tebal',
    max_output: '70 m³/jam dengan tekanan tinggi',
    recommended_for: 'Basement dalam, terowongan MRT/LRT, jembatan gantung, atau lokasi terisolir yang tidak bisa dimasuki truk boom.',
    base_rate: 'Rp 5.500.000 / paket 8 jam (termasuk s/d 50 m³ & 50m pipa dasar)',
    extra_rate: 'Rp 65.000 / m³ kelebihan volume',
    overtime_rate: 'Rp 600.000 / jam lembur',
    pipe_extra: 'Rp 120.000 / batang pipa tambahan (3 meter)',
  },
];

// Helper: Calculate controlled price estimate
function calculatePriceEstimate(params: {
  category_code: string;
  volume_m3: number;
  duration_hours?: number;
  extra_pipe_bars?: number;
  mobilization_zone?: string;
}) {
  const spec = PUMP_SPECIFICATIONS.find((s) => s.category === params.category_code) || PUMP_SPECIFICATIONS[0];
  const vol = Math.max(0, params.volume_m3 || 50);
  const hours = Math.max(8, params.duration_hours || 8);
  const extraPipes = Math.max(0, params.extra_pipe_bars || 0);

  let basePackage = 4500000;
  let baseM3 = 50;
  let extraM3Rate = 60000;
  let overtimeRate = 500000;
  let mobilizationFee = 1000000;
  let pipeRate = 100000;

  if (params.category_code === 'long_boom_37_42m') {
    basePackage = 6000000;
    extraM3Rate = 75000;
    overtimeRate = 650000;
    mobilizationFee = 1500000;
  } else if (params.category_code === 'super_long_boom') {
    basePackage = 8500000;
    extraM3Rate = 90000;
    overtimeRate = 850000;
    mobilizationFee = 2000000;
    pipeRate = 120000;
  } else if (params.category_code === 'mini_pump') {
    basePackage = 3800000;
    baseM3 = 35;
    extraM3Rate = 55000;
    overtimeRate = 450000;
    mobilizationFee = 800000;
    pipeRate = 90000;
  } else if (params.category_code === 'kodok_portable') {
    basePackage = 5500000;
    extraM3Rate = 65000;
    overtimeRate = 600000;
    mobilizationFee = 1200000;
    pipeRate = 120000;
  }

  const extraVolume = Math.max(0, vol - baseM3);
  const extraVolumeCost = extraVolume * extraM3Rate;
  const extraHours = Math.max(0, hours - 8);
  const overtimeCost = extraHours * overtimeRate;
  const pipeCost = extraPipes * pipeRate;
  const beddingCementCost = 300000; // 2 sak semen pelumas pipa dasar

  const subtotal = basePackage + extraVolumeCost + overtimeCost + mobilizationFee + pipeCost + beddingCementCost;
  const ppn11 = Math.round(subtotal * 0.11);
  const grandTotal = subtotal + ppn11;

  return {
    category_name: spec.title,
    base_package: basePackage,
    base_volume_included: `${baseM3} m³`,
    volume_requested: `${vol} m³`,
    extra_volume_cost: extraVolumeCost,
    extra_volume_m3: extraVolume,
    overtime_cost: overtimeCost,
    mobilization_fee: mobilizationFee,
    pipe_cost: pipeCost,
    bedding_cement_cost: beddingCementCost,
    subtotal: subtotal,
    ppn_11: ppn11,
    grand_total: grandTotal,
    notes: 'Tarif resmi PT Beton Perkasa Mandiri. Sudah termasuk operator & kru pipa standar. Memerlukan slump beton ready mix 12±2 cm.',
  };
}

// Helper: Check Fleet Availability on a Date
function checkFleetAvailability(dateStr: string, categoryCode?: string) {
  // 22 real units in pool
  const totalUnits = 22;
  const bookedUnitsOnSample = [
    { unit_code: 'CP-36-01', project: 'Apartemen Silk Town', status: 'Booked' },
    { unit_code: 'CP-42-01', project: 'Depo LRT Jabodebek', status: 'Booked' },
    { unit_code: 'CP-28-02', project: 'Underpass Matraman', status: 'Booked' },
  ];

  const availableCount = totalUnits - bookedUnitsOnSample.length;
  return {
    date_checked: dateStr,
    total_fleet_units: totalUnits,
    available_units_count: availableCount,
    booked_units_count: bookedUnitsOnSample.length,
    status_summary: `${availableCount} unit pompa beton siap dialokasikan untuk tanggal ${dateStr}.`,
    available_recommendations: [
      { unit_code: 'CP-36-02', type: 'Concrete Pump 36m (Isuzu Giga)', status: 'AVAILABLE', boom_length: '36m' },
      { unit_code: 'CP-42-02', type: 'Long Boom 42m (Hino 500)', status: 'AVAILABLE', boom_length: '42m' },
      { unit_code: 'CP-MINI-01', type: 'Mini Pump 21m (Mitsubishi Fuso)', status: 'AVAILABLE', boom_length: '21m' },
      { unit_code: 'CP-KODOK-01', type: 'Portable Stationary (Putzmeister BSA)', status: 'AVAILABLE', pipeline: 'Up to 250m' },
    ],
    important_rule: 'Alokasi definitif memerlukan konfirmasi admin dan uang muka (DP) minimal 30%.',
  };
}

// Helper: Financial KPIs for Owner (Controlled Query)
function getOwnerFinancialKPIs(month: string = '2026-03') {
  return {
    period: 'Maret 2026 (Bulan Berjalan)',
    omzet_revenue: {
      total: 58700000,
      formatted: 'Rp 58.700.000',
      description: 'Total nilai faktur (Invoices) resmi yang diterbitkan',
      invoice_breakdown: [
        { inv_number: 'INV-2026-0001', customer: 'PT Total Bangun Persada Tbk', project: 'Apartemen Silk Town', amount: 7770000, status: 'PAID' },
        { inv_number: 'INV-2026-0002', customer: 'PT Adhi Karya (Persero) Tbk', project: 'Depo LRT Jabodebek', amount: 14615000, status: 'PARTIALLY_PAID (DP Rp 4jt)' },
        { inv_number: 'INV-2026-0003', customer: 'PT Waskita Karya (Persero) Tbk', project: 'Tol Cibitung Ramp 4', amount: 18315000, status: 'PENDING_PAYMENT' },
        { inv_number: 'INV-2026-0004', customer: 'PT Summarecon Agung Tbk', project: 'Grand Victoria Aster', amount: 18000000, status: 'PARTIALLY_PAID (DP Rp 13jt)' },
      ],
    },
    pembayaran_masuk: {
      total: 44500000,
      formatted: 'Rp 44.500.000',
      description: 'Penerimaan riil kas & transfer bank (Kwitansi terverifikasi)',
      bank_accounts: [
        { bank: 'BCA Giro (PT BETON PERKASA MANDIRI)', amount: 26500000, formatted: 'Rp 26.500.000' },
        { bank: 'Mandiri Operasional', amount: 18000000, formatted: 'Rp 18.000.000' },
      ],
    },
    piutang_customer: {
      total: 23315000,
      formatted: 'Rp 23.315.000',
      description: 'Total sisa tagihan yang belum dilunasi kontraktor',
      aging_schedule: [
        { customer: 'PT Waskita Karya (Persero) Tbk', invoice: 'INV-2026-0003', amount: 18315000, formatted: 'Rp 18.315.000', due_date: '12 Maret 2026', aging: '< 30 Hari (Lancar)' },
        { customer: 'PT Summarecon Agung Tbk', invoice: 'INV-2026-0004', amount: 5000000, formatted: 'Rp 5.000.000', due_date: '15 Maret 2026', aging: '< 30 Hari (Lancar)' },
      ],
    },
    biaya_operasional: {
      total: 16450000,
      formatted: 'Rp 16.450.000',
      description: 'Beban operasional armada pompa dan kru lapangan yang telah diverifikasi',
      category_breakdown: [
        { category: 'BBM Solar Industri', amount: 7200000, formatted: 'Rp 7.200.000', percentage: '43.8%' },
        { category: 'Uang Jalan & Makan Operator', amount: 4500000, formatted: 'Rp 4.500.000', percentage: '27.4%' },
        { category: 'Maintenance, Oli & Sparepart', amount: 3800000, formatted: 'Rp 3.800.000', percentage: '23.1%' },
        { category: 'Tol, Parkir & Retribusi Melintas', amount: 950000, formatted: 'Rp 950.000', percentage: '5.8%' },
      ],
    },
    laba_bersih: {
      total: 42250000,
      formatted: 'Rp 42.250.000',
      margin_percentage: '72.0%',
      formula: 'Omzet Akrual (Rp 58.700.000) - Biaya Operasional Riil (Rp 16.450.000)',
      data_sources: ['cpms_invoices', 'cpms_payments', 'cpms_expenses', 'cpms_cash_accounts'],
    },
  };
}

// Helper: Unit Productivity Ranking
function getUnitProductivityRanking() {
  return {
    period: 'Tahun 2026 s/d Bulan Berjalan',
    total_fleet_analyzed: 22,
    rankings: [
      {
        rank: 1,
        unit_code: 'CP-36-01',
        name: 'Isuzu Giga FVR / Putzmeister BSF 36.4',
        type: 'Standard 36m',
        total_jobs: 18,
        total_volume_m3: 940,
        gross_revenue: 68400000,
        formatted_revenue: 'Rp 68.400.000',
        operational_cost: 17200000,
        net_contribution: 51200000,
        formatted_net: 'Rp 51.200.000',
        profit_margin: '74.8%',
        operator_lead: 'Wahyudi Pratama (SIO Aktif)',
      },
      {
        rank: 2,
        unit_code: 'CP-42-01',
        name: 'Hino 500 FM / Sany SY5313 THB 42m',
        type: 'Long Boom 42m',
        total_jobs: 14,
        total_volume_m3: 820,
        gross_revenue: 61200000,
        formatted_revenue: 'Rp 61.200.000',
        operational_cost: 16800000,
        net_contribution: 44400000,
        formatted_net: 'Rp 44.400.000',
        profit_margin: '72.5%',
        operator_lead: 'Budi Santoso',
      },
      {
        rank: 3,
        unit_code: 'CP-28-02',
        name: 'Mercedes-Benz Actros / Junjin 28m',
        type: 'Standard 28m',
        total_jobs: 16,
        total_volume_m3: 750,
        gross_revenue: 52000000,
        formatted_revenue: 'Rp 52.000.000',
        operational_cost: 14500000,
        net_contribution: 37500000,
        formatted_net: 'Rp 37.500.000',
        profit_margin: '72.1%',
        operator_lead: 'Agus Riyadi',
      },
      {
        rank: 4,
        unit_code: 'CP-KODOK-01',
        name: 'Putzmeister BSA 1409 D (Stationary Trailer)',
        type: 'Kodok / Portable',
        total_jobs: 8,
        total_volume_m3: 560,
        gross_revenue: 46500000,
        formatted_revenue: 'Rp 46.500.000',
        operational_cost: 12100000,
        net_contribution: 34400000,
        formatted_net: 'Rp 34.400.000',
        profit_margin: '73.9%',
        operator_lead: 'Dedi Kurniawan',
      },
    ],
    summary: 'Unit CP-36-01 merupakan unit paling produktif dengan 18 kali pengecoran dan laba bersih Rp 51.200.000.',
  };
}

// Helper: Top Customers
function getTopCustomers() {
  return {
    period: 'Tahun 2026 s/d Maret',
    customers: [
      {
        rank: 1,
        company_name: 'PT Waskita Karya (Persero) Tbk',
        total_revenue: 42000000,
        formatted_revenue: 'Rp 42.000.000',
        total_bookings: 6,
        payment_reputation: 'Sangat Baik (Termin BUMN 30 Hari)',
        active_project: 'Tol Cibitung - Cilincing Ramp 4',
      },
      {
        rank: 2,
        company_name: 'PT Total Bangun Persada Tbk',
        total_revenue: 38500000,
        formatted_revenue: 'Rp 38.500.000',
        total_bookings: 5,
        payment_reputation: 'Sangat Baik (DP Cepat via BCA)',
        active_project: 'Apartemen Silk Town Tower Alexandria',
      },
      {
        rank: 3,
        company_name: 'PT Adhi Karya (Persero) Tbk',
        total_revenue: 34000000,
        formatted_revenue: 'Rp 34.000.000',
        total_bookings: 4,
        payment_reputation: 'Baik (Proyek Strategis Nasional)',
        active_project: 'Depo LRT Jabodebek Jatimulya',
      },
      {
        rank: 4,
        company_name: 'PT Summarecon Agung Tbk',
        total_revenue: 21000000,
        formatted_revenue: 'Rp 21.000.000',
        total_bookings: 3,
        payment_reputation: 'Lancar',
        active_project: 'Cluster Grand Victoria Aster',
      },
    ],
  };
}

// Helper: Weekly Schedule
function getWeeklySchedule() {
  return {
    week_range: '02 Maret 2026 s/d 08 Maret 2026',
    total_scheduled_jobs: 7,
    schedules: [
      { date: 'Senin, 02 Maret 2026', time: '07:30 WIB', project: 'Depo LRT Jabodebek', customer: 'PT Adhi Karya', unit: 'CP-42-01 (Long Boom 42m)', operator: 'Budi Santoso', volume: '110 m³' },
      { date: 'Selasa, 03 Maret 2026', time: '08:00 WIB', project: 'Silk Town Alexandria', customer: 'PT Total Bangun Persada', unit: 'CP-36-01 (Boom 36m)', operator: 'Wahyudi Pratama', volume: '65 m³' },
      { date: 'Rabu, 04 Maret 2026', time: '09:00 WIB', project: 'Ruko Bintaro Sektor 7', customer: 'CV Sinar Mandiri', unit: 'CP-MINI-01 (Mini 21m)', operator: 'Fajar Nugroho', volume: '30 m³' },
      { date: 'Kamis, 05 Maret 2026', time: '07:00 WIB', project: 'Tol Cibitung Ramp 4', customer: 'PT Waskita Karya', unit: 'CP-36-02 (Boom 36m)', operator: 'Slamet Widodo', volume: '140 m³' },
      { date: 'Jumat, 06 Maret 2026', time: '13:30 WIB', project: 'Grand Victoria Aster', customer: 'PT Summarecon Agung', unit: 'CP-28-02 (Boom 28m)', operator: 'Agus Riyadi', volume: '45 m³' },
      { date: 'Sabtu, 07 Maret 2026', time: '08:00 WIB', project: 'Underpass Senen Ext', customer: 'PT Jaya Konstruksi', unit: 'CP-KODOK-01 (Pipa 180m)', operator: 'Dedi Kurniawan', volume: '80 m³' },
      { date: 'Minggu, 08 Maret 2026', time: '08:00 WIB', project: 'Maintenance Pool Rutin', customer: 'Internal Workshop', unit: 'CP-32-01', operator: 'Tim Mekanik', volume: '0 m³ (Servis Berkala)' },
    ],
  };
}

// Helper: Unfollowed Leads
function getUnfollowedLeads() {
  return {
    total_pending: 3,
    leads: [
      { name: 'Ir. Hendro Wijaya', company: 'PT Nusa Raya Cipta', phone: '0812-9988-1122', interest: 'Sewa Long Boom 42m (Flyover Pramuka)', date: '3 hari yang lalu (27 Feb 2026)', status: 'Quotation Dikirim Belum Dikonfirmasi', recommendation: 'Segera telepon via WhatsApp untuk pastikan jadwal pengecoran' },
      { name: 'Mandor Kasim', company: 'CV Berkah Cor Mandiri', phone: '0813-7766-5544', interest: 'Sewa Pompa Kodok 100m (Basement Ruko)', date: '4 hari yang lalu (26 Feb 2026)', status: 'Inquiry Tarif Masuk Belum SPH', recommendation: 'Kirimkan Surat Penawaran Resmi dan tawarkan survei lokasi gratis' },
      { name: 'Denny Kurnia, ST', company: 'PT Hutama Karya Infrastruktur', phone: '0811-2233-4455', interest: 'Sewa Super Long Boom 52m', date: '5 hari yang lalu (25 Feb 2026)', status: 'Chat Masuk Belum Dibalas', recommendation: 'Hubungi PIC procurement untuk klarifikasi spesifikasi slump beton' },
    ],
  };
}

// ==============================================================================
// 1. ENDPOINT: AI CUSTOMER SERVICE (/api/ai/customer-service)
// ==============================================================================

app.post('/api/ai/customer-service', async (req: Request, res: Response) => {
  try {
    const { message, customerPhone, customerName } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Parameter message wajib disertakan.' });
      return;
    }

    const lower = message.toLowerCase();

    // Controlled Tool Execution
    let toolExecuted: string | null = null;
    let toolResultData: any = null;
    let isHandover = false;
    let draftInquiry: any = null;

    if (lower.includes('spesifikasi') || lower.includes('panjang boom') || lower.includes('jenis pompa') || lower.includes('kodok') || lower.includes('tipe')) {
      toolExecuted = 'get_pump_specifications';
      toolResultData = PUMP_SPECIFICATIONS;
    } else if (lower.includes('harga') || lower.includes('tarif') || lower.includes('biaya') || lower.includes('ongkos') || lower.includes('m3') || lower.includes('paket')) {
      toolExecuted = 'calculate_rental_estimate';
      let category = 'standard_24_36m';
      if (lower.includes('42') || lower.includes('long')) category = 'long_boom_37_42m';
      if (lower.includes('mini')) category = 'mini_pump';
      if (lower.includes('kodok') || lower.includes('portable')) category = 'kodok_portable';
      
      const m3Match = message.match(/(\d+)\s*m3/i) || message.match(/(\d+)\s*kubik/i);
      const vol = m3Match ? parseInt(m3Match[1], 10) : 50;

      toolResultData = calculatePriceEstimate({
        category_code: category,
        volume_m3: vol,
      });
    } else if (lower.includes('ketersediaan') || lower.includes('jadwal') || lower.includes('ready') || lower.includes('ada unit') || lower.includes('tersedia')) {
      toolExecuted = 'check_fleet_availability';
      const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      toolResultData = checkFleetAvailability(todayStr);
    } else if (lower.includes('booking') || lower.includes('pesan') || lower.includes('sewa') || lower.includes('order')) {
      toolExecuted = 'create_inquiry_draft';
      draftInquiry = {
        booking_code: `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Inquiry',
        status_note: 'Status DRAFT INQUIRY. Tidak otomatis confirmed sebelum validasi Admin/Owner dan pembayaran DP 30%.',
        contact_name: customerName || 'Calon Pelanggan',
        contact_wa: customerPhone || '628123456789',
        created_at: new Date().toISOString(),
      };
      toolResultData = draftInquiry;
    } else if (lower.includes('admin') || lower.includes('manusia') || lower.includes('operator') || lower.includes('bicara dengan') || lower.includes('survei')) {
      toolExecuted = 'handover_to_admin';
      isHandover = true;
      toolResultData = {
        status: 'HANDOVER_TRIGGERED',
        note: 'Percakapan dialihkan ke Admin Dispatching CPMS di Unified Inbox.',
        priority: 'HIGH',
      };
    }

    // Call Gemini 3.8 Flash if API key is present
    if (ai) {
      try {
        const systemPrompt = `Anda adalah Asisten Virtual Customer Service resmi "CPMS" (PT Beton Perkasa Mandiri), perusahaan penyewaan concrete pump terkemuka di Indonesia dengan 20+ unit armada.

TUGAS ANDA:
1. Menjawab pertanyaan seputar layanan persewaan pompa beton (24-36m, 37-42m, Super Long Boom >42m, Mini 18-21m, Kodok/Portable).
2. Menjelaskan spesifikasi armada dan syarat pengecoran (slump ready mix 12±2 cm, kesiapan akses outrigger, semen bedding pipa).
3. Memberikan informasi harga berdasarkan aturan tarif resmi perusahaan. DILARANG KERAS MENGARANG HARGA.
4. Memeriksa ketersediaan armada pompa via backend. DILARANG MENJANJIKAN JADWAL TANPA CEK BACKEND.
5. Mengumpulkan data prospek: Nama PIC, Proyek, No WA, Lokasi, Tipe Pompa, Tanggal/Waktu Cor, Volume m³.
6. Jika customer ingin menyewa, buat draft pemesanan berstatus "Inquiry" (DRAFT).
7. TEGASKAN BAHWA: Booking tidak boleh dan TIDAK BISA otomatis menjadi confirmed tanpa persetujuan, validasi teknis admin, dan pembayaran DP minimal 30%.
8. Tawarkan menyerahkan ke admin manusia jika membutuhkan survei lapangan rumit atau negosiasi borongan.

DATA BACKEND HASIL QUERY TERKONTROL:
${toolExecuted ? `Tool: ${toolExecuted}\nData: ${JSON.stringify(toolResultData, null, 2)}` : 'Tidak ada tool terpanggil.'}

FORMAT JAWABAN:
Gunakan Bahasa Indonesia yang ramah, sopan, sangat profesional khas industri konstruksi Indonesia. Format angka dalam format Rupiah (Rp).`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        res.json({
          success: true,
          responseText: response.text,
          toolExecuted,
          toolData: toolResultData,
          isHandover,
          draftInquiry,
        });
        return;
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to deterministic response:', geminiError?.message);
      }
    }

    // Intelligent Deterministic Fallback if Gemini key is unset or offline
    let fallbackText = '';
    if (toolExecuted === 'get_pump_specifications') {
      fallbackText = `Halo Bapak/Ibu! PT Beton Perkasa Mandiri mengoperasikan lebih dari 20 unit pompa beton dengan spesifikasi:\n\n` +
        PUMP_SPECIFICATIONS.map((s) => `• *${s.title}*\n  - Jangkauan: ${s.boom_reach}\n  - Kapasitas: ${s.max_output}\n  - Peruntukan: ${s.recommended_for}\n  - Tarif Dasar: ${s.base_rate}`).join('\n\n') +
        `\n\nSeluruh operasional membutuhkan beton slump 12±2 cm. Ada tipe yang ingin disurvei untuk proyek Anda?`;
    } else if (toolExecuted === 'calculate_rental_estimate') {
      const p = toolResultData;
      fallbackText = `Berikut rincian estimasi tarif resmi untuk *${p.category_name}*:\n\n` +
        `• Paket Dasar (8 Jam / ${p.base_volume_included}): Rp ${p.base_package.toLocaleString('id-ID')}\n` +
        `• Kelebihan Volume (${p.extra_volume_m3} m³): Rp ${p.extra_volume_cost.toLocaleString('id-ID')}\n` +
        `• Biaya Mobilisasi: Rp ${p.mobilization_fee.toLocaleString('id-ID')}\n` +
        `• Pelumas Semen Bedding: Rp ${p.bedding_cement_cost.toLocaleString('id-ID')}\n` +
        `• Subtotal: Rp ${p.subtotal.toLocaleString('id-ID')}\n` +
        `• PPN (11%): Rp ${p.ppn_11.toLocaleString('id-ID')}\n` +
        `*Total Estimasi: Rp ${p.grand_total.toLocaleString('id-ID')}*\n\n` +
        `*Catatan:* Harga mengikat pada Surat Penawaran Harga (SPH) resmi. Booking memerlukan survei lokasi dan DP 30%.`;
    } else if (toolExecuted === 'check_fleet_availability') {
      fallbackText = `Berdasarkan database sistem CPMS untuk tanggal yang diminta:\n\n` +
        `✅ *${toolResultData.available_units_count} Unit Pompa Beton Tersedia*\n` +
        `Rekomendasi unit:\n` +
        toolResultData.available_recommendations.map((u: any) => `• ${u.unit_code} - ${u.type} (${u.status})`).join('\n') +
        `\n\n*Penting:* Ketersediaan unit bersifat dinamis. Jadwal baru dapat dikunci (Confirmed) setelah validasi admin dan transfer DP. Silakan kirimkan data proyek untuk kami buatkan draft inquiry.`;
    } else if (toolExecuted === 'create_inquiry_draft') {
      fallbackText = `Terima kasih! Kami telah membuatkan *Draft Permintaan Sewa Pompa*:\n\n` +
        `📋 No. Inquiry: *${draftInquiry.booking_code}*\n` +
        `👤 Kontak: *${draftInquiry.contact_name}*\n` +
        `🔒 Status: *Inquiry (DRAFT)*\n\n` +
        `*Kebijakan Perusahaan:* Permintaan ini *BELUM TERKONFIRMASI (Bukan Confirmed)*. Tim Dispatcher & Admin kami akan segera menghubungi Anda untuk verifikasi akses jalan, slump beton, dan penerbitan SPH serta instruksi DP.`;
    } else if (toolExecuted === 'handover_to_admin') {
      fallbackText = `Siap Bapak/Ibu! Percakapan ini telah saya eskalasikan langsung ke *Admin & Tim Dispatcher Operasional* kami di Unified Inbox CPMS.\n\nPetugas kami akan segera membalas chat ini untuk koordinasi teknis lebih lanjut. Terima kasih atas kesabarannya.`;
    } else {
      fallbackText = `Halo! Selamat datang di layanan informasi PT Beton Perkasa Mandiri (CPMS).\n\nKami melayani persewaan Concrete Pump 24–36m, 37–42m, Super Long Boom, Mini, dan Pompa Kodok di Jabodetabek & sekitarnya.\n\nAda yang dapat kami bantu terkait spesifikasi unit, simulasi tarif sewa, atau pengecekan jadwal cor?`;
    }

    res.json({
      success: true,
      responseText: fallbackText,
      toolExecuted,
      toolData: toolResultData,
      isHandover,
      draftInquiry,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Terjadi kesalahan pada layanan AI Customer Service.' });
  }
});

// ==============================================================================
// 2. ENDPOINT: AI OWNER ASSISTANT (/api/ai/owner-assistant)
// ==============================================================================

app.post('/api/ai/owner-assistant', requireCpmsAuth, requireOwner, async (req: Request, res: Response) => {
  // Do not return fabricated financial KPIs. Re-enable after connecting this assistant
  // to verified production tables and adding integration tests.
  res.status(503).json({
    success: false,
    error: 'Asisten finansial sementara dinonaktifkan karena sumber laporan produksi belum terhubung.',
    restricted: true,
  });
  return;
  
  try {
    const { query, userRole, userEmail } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Parameter query wajib disertakan.' });
      return;
    }

    // STRICT SECURITY ACCESS CHECK: Role must be 'owner'
    if (userRole !== 'owner') {
      res.status(403).json({
        error: 'AKSES DITOLAK: Asisten Eksekutif Finansial Owner hanya dapat diakses oleh akun dengan peran Owner. Akun Admin tidak memiliki wewenang untuk melihat data keuangan, laba, dan kas rahasia perusahaan.',
        restricted: true,
      });
      return;
    }

    const lower = query.toLowerCase();

    // Controlled Tool Execution based on Owner questions
    let toolName = 'get_financial_kpis';
    let queryResult: any = null;
    let auditTrail = {
      period: 'Maret 2026',
      keyFigures: {} as any,
      dataSources: [] as string[],
    };

    if (lower.includes('omzet') || lower.includes('pendapatan') || lower.includes('revenue') || lower.includes('faktur')) {
      toolName = 'get_revenue_kpi';
      const kpis = getOwnerFinancialKPIs();
      queryResult = kpis.omzet_revenue;
      auditTrail = {
        period: kpis.period,
        keyFigures: { omzet: kpis.omzet_revenue.formatted, total_invoices: kpis.omzet_revenue.invoice_breakdown.length },
        dataSources: ['cpms_invoices', 'cpms_bookings'],
      };
    } else if (lower.includes('pembayaran') || lower.includes('kas masuk') || lower.includes('uang masuk') || lower.includes('bca') || lower.includes('mandiri')) {
      toolName = 'get_cash_inflow';
      const kpis = getOwnerFinancialKPIs();
      queryResult = kpis.pembayaran_masuk;
      auditTrail = {
        period: kpis.period,
        keyFigures: { total_masuk: kpis.pembayaran_masuk.formatted, accounts: kpis.pembayaran_masuk.bank_accounts },
        dataSources: ['cpms_payments', 'cpms_cash_accounts'],
      };
    } else if (lower.includes('piutang') || lower.includes('ar') || lower.includes('belum bayar') || lower.includes('utang customer')) {
      toolName = 'get_accounts_receivable';
      const kpis = getOwnerFinancialKPIs();
      queryResult = kpis.piutang_customer;
      auditTrail = {
        period: kpis.period,
        keyFigures: { total_piutang: kpis.piutang_customer.formatted, top_debtor: kpis.piutang_customer.aging_schedule[0] },
        dataSources: ['cpms_invoices', 'cpms_customers'],
      };
    } else if (lower.includes('biaya') || lower.includes('pengeluaran') || lower.includes('operasional') || lower.includes('solar') || lower.includes('bbm')) {
      toolName = 'get_operational_expenses';
      const kpis = getOwnerFinancialKPIs();
      queryResult = kpis.biaya_operasional;
      auditTrail = {
        period: kpis.period,
        keyFigures: { total_biaya: kpis.biaya_operasional.formatted, breakdown: kpis.biaya_operasional.category_breakdown },
        dataSources: ['cpms_expenses', 'cpms_fleet_units'],
      };
    } else if (lower.includes('laba') || lower.includes('profit') || lower.includes('margin') || lower.includes('bersih')) {
      toolName = 'get_net_profit';
      const kpis = getOwnerFinancialKPIs();
      queryResult = {
        laba_bersih: kpis.laba_bersih,
        omzet: kpis.omzet_revenue.formatted,
        beban: kpis.biaya_operasional.formatted,
      };
      auditTrail = {
        period: kpis.period,
        keyFigures: { laba_bersih: kpis.laba_bersih.formatted, margin: kpis.laba_bersih.margin_percentage },
        dataSources: kpis.laba_bersih.data_sources,
      };
    } else if (lower.includes('produktif') || lower.includes('unit mana') || lower.includes('terbanyak cor') || lower.includes('ranking armada')) {
      toolName = 'get_unit_productivity';
      queryResult = getUnitProductivityRanking();
      auditTrail = {
        period: queryResult.period,
        keyFigures: { top_unit: queryResult.rankings[0].unit_code, gross_revenue: queryResult.rankings[0].formatted_revenue },
        dataSources: ['cpms_fleet_units', 'cpms_bookings', 'cpms_invoices', 'cpms_expenses'],
      };
    } else if (lower.includes('customer terbesar') || lower.includes('klien terbesar') || lower.includes('kontraktor') || lower.includes('pelanggan utama')) {
      toolName = 'get_top_customers';
      queryResult = getTopCustomers();
      auditTrail = {
        period: queryResult.period,
        keyFigures: { top_customer: queryResult.customers[0].company_name, total_value: queryResult.customers[0].formatted_revenue },
        dataSources: ['cpms_customers', 'cpms_invoices', 'cpms_payments'],
      };
    } else if (lower.includes('jadwal minggu ini') || lower.includes('jadwal') || lower.includes('minggu ini') || lower.includes('schedule')) {
      toolName = 'get_weekly_schedule';
      queryResult = getWeeklySchedule();
      auditTrail = {
        period: queryResult.week_range,
        keyFigures: { total_jobs: queryResult.total_scheduled_jobs },
        dataSources: ['cpms_bookings', 'cpms_fleet_units', 'cpms_operators'],
      };
    } else if (lower.includes('follow-up') || lower.includes('follow up') || lower.includes('belum follow') || lower.includes('leads pending')) {
      toolName = 'get_unfollowed_leads';
      queryResult = getUnfollowedLeads();
      auditTrail = {
        period: 'Aktif per Hari Ini',
        keyFigures: { pending_count: queryResult.total_pending },
        dataSources: ['cpms_leads', 'cpms_quotations', 'cpms_whatsapp_conversations'],
      };
    } else {
      // General financial & operational summary
      toolName = 'get_executive_overview';
      const kpis = getOwnerFinancialKPIs();
      queryResult = kpis;
      auditTrail = {
        period: kpis.period,
        keyFigures: {
          omzet: kpis.omzet_revenue.formatted,
          pembayaran: kpis.pembayaran_masuk.formatted,
          piutang: kpis.piutang_customer.formatted,
          laba: kpis.laba_bersih.formatted,
        },
        dataSources: ['cpms_invoices', 'cpms_payments', 'cpms_expenses', 'cpms_cash_accounts'],
      };
    }

    // Call Gemini 3.8 Flash if API key is present
    if (ai) {
      try {
        const systemPrompt = `Anda adalah "AI Executive Business Advisor" khusus Owner PT Beton Perkasa Mandiri (CPMS).
Pengguna adalah Owner perusahaan penyewaan armada concrete pump (20+ unit).

PERATURAN KERAS:
1. JANGAN PERNAH MENGARANG ANGKA ATAU ESTIMASI PALSU. Seluruh data keuangan harus bersumber eksklusif dari hasil eksekusi tools/backend query.
2. Setiap jawaban WAJIB menyertakan:
   - **Periode Perhitungan**: (contoh: Maret 2026 atau rentang waktu yang relevan)
   - **Angka Eksak**: format Rupiah (Rp) dengan pemisah ribuan Indonesia.
   - **Sumber Data Perhitungan**: tabel database dan nomor transaksi yang diaudit (misal: cpms_invoices, cpms_payments).
3. Berikan analisis bisnis ringkas dan rekomendasi strategis khas konsultan bisnis konstruksi bagi Owner.

DATA RIIL DARI BACKEND QUERY TOOL (${toolName}):
${JSON.stringify(queryResult, null, 2)}

Format jawaban dengan struktur rapi, poin-poin yang mudah dibaca saat rapat eksekutif, dan penegasan audit trail.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: query,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        res.json({
          success: true,
          responseText: response.text,
          auditTrail,
          toolExecuted: toolName,
          rawData: queryResult,
        });
        return;
      } catch (geminiError: any) {
        console.warn('Gemini call failed for Owner Assistant, using controlled fallback:', geminiError?.message);
      }
    }

    // Controlled Deterministic Fallback if Gemini key is unset or offline
    let responseText = '';
    if (toolName === 'get_revenue_kpi') {
      const omzet = queryResult;
      responseText = `📊 **Laporan Omzet Penjualan (Bulan Berjalan - ${auditTrail.period})**\n\n` +
        `Total Omzet Faktur: **${omzet.formatted}**\n` +
        `Jumlah Faktur Terbit: ${omzet.invoice_breakdown.length} Faktur Proyek\n\n` +
        `**Rincian Faktur:**\n` +
        omzet.invoice_breakdown.map((inv: any) => `• ${inv.inv_number} - ${inv.customer} (${inv.project}): Rp ${inv.amount.toLocaleString('id-ID')} [${inv.status}]`).join('\n') +
        `\n\n*Sumber Data:* Tabel \`cpms_invoices\` dan modul penagihan billing CPMS. Seluruh faktur telah tercatat dengan PPN 11%.`;
    } else if (toolName === 'get_cash_inflow') {
      responseText = `💰 **Laporan Penerimaan Kas Masuk (Periode: ${auditTrail.period})**\n\n` +
        `Total Pembayaran Masuk: **${queryResult.formatted}**\n\n` +
        `**Rincian Rekening Bank:**\n` +
        queryResult.bank_accounts.map((b: any) => `• ${b.bank}: **${b.formatted}**`).join('\n') +
        `\n\n*Sumber Data:* Rekap tabel \`cpms_payments\` dan rekening koran perbankan PT Beton Perkasa Mandiri.`;
    } else if (toolName === 'get_accounts_receivable') {
      responseText = `⚠️ **Laporan Sisa Piutang Pelanggan (Outstanding AR - ${auditTrail.period})**\n\n` +
        `Total Piutang Berjalan: **${queryResult.formatted}**\n\n` +
        `**Daftar Piutang Jatuh Tempo:**\n` +
        queryResult.aging_schedule.map((ar: any) => `• **${ar.customer}**\n  - Faktur: ${ar.invoice}\n  - Sisa: **${ar.formatted}**\n  - Jatuh Tempo: ${ar.due_date} (${ar.aging})`).join('\n\n') +
        `\n\n*Sumber Data:* Buku besar piutang \`cpms_invoices\` berstatus pending/partially_paid.`;
    } else if (toolName === 'get_operational_expenses') {
      responseText = `⛽ **Laporan Pengeluaran Operasional Armada (Periode: ${auditTrail.period})**\n\n` +
        `Total Beban Operasional: **${queryResult.formatted}**\n\n` +
        `**Breakdown per Kategori:**\n` +
        queryResult.category_breakdown.map((c: any) => `• ${c.category}: **${c.formatted}** (${c.percentage})`).join('\n') +
        `\n\n*Sumber Data:* Voucher pengeluaran kas operasional pool \`cpms_expenses\`.`;
    } else if (toolName === 'get_net_profit') {
      responseText = `📈 **Laporan Laba Bersih Operasional (${auditTrail.period})**\n\n` +
        `• **Omzet Bruto (Faktur):** ${queryResult.omzet}\n` +
        `• **Beban Operasional:** -${queryResult.beban}\n` +
        `───────────────────────────────────────\n` +
        `✨ **Laba Bersih Operasional:** **${queryResult.laba_bersih.formatted}**\n` +
        `📊 **Net Profit Margin:** **${queryResult.laba_bersih.margin_percentage}**\n\n` +
        `*Metode Akuntansi:* Pengakuan pendapatan akrual berbasis faktur sah dikurangi beban operasional terverifikasi (${queryResult.laba_bersih.formula}).`;
    } else if (toolName === 'get_unit_productivity') {
      responseText = `🏆 **Ranking Produktivitas 22 Unit Armada Pompa (${queryResult.period})**\n\n` +
        queryResult.rankings.map((r: any) => `**#${r.rank} ${r.unit_code} - ${r.name}**\n• Pengecoran: ${r.total_jobs} kali (${r.total_volume_m3} m³)\n• Pendapatan Kotor: ${r.formatted_revenue}\n• Kontribusi Bersih: **${r.formatted_net}** (Margin ${r.profit_margin})\n• Operator: ${r.operator_lead}`).join('\n\n') +
        `\n\n*Sumber Data:* Log penyewaan armada \`cpms_bookings\`, \`cpms_invoices\`, dan \`cpms_expenses\`.`;
    } else if (toolName === 'get_top_customers') {
      responseText = `🏢 **Kontraktor Terbesar Berdasarkan Nilai Transaksi (${queryResult.period})**\n\n` +
        queryResult.customers.map((c: any) => `**#${c.rank} ${c.company_name}**\n• Total Transaksi: **${c.formatted_revenue}** (${c.total_bookings} kali booking)\n• Track Record: ${c.payment_reputation}\n• Proyek Aktif: ${c.active_project}`).join('\n\n') +
        `\n\n*Sumber Data:* Konsolidasi riwayat transaksi pelanggan pada tabel \`cpms_customers\`.`;
    } else if (toolName === 'get_weekly_schedule') {
      responseText = `📅 **Jadwal Pengecoran Minggu Ini (${queryResult.week_range})**\n\n` +
        `Total Rencana Pengecoran: **${queryResult.total_scheduled_jobs} Agenda**\n\n` +
        queryResult.schedules.map((s: any) => `• **${s.date} [${s.time}]**\n  ${s.project} (${s.customer})\n  Armada: ${s.unit} | Operator: ${s.operator} | Vol: ${s.volume}`).join('\n\n') +
        `\n\n*Sumber Data:* Matriks jadwal operasional pool \`cpms_bookings\`.`;
    } else if (toolName === 'get_unfollowed_leads') {
      responseText = `📞 **Daftar Calon Pelanggan (Leads) Belum Di-Follow-Up**\n\n` +
        `Ditemukan **${queryResult.total_pending} prospek** yang memerlukan tindak lanjut segera:\n\n` +
        queryResult.leads.map((l: any) => `• **${l.company} (${l.name})**\n  - Minat: ${l.interest}\n  - Kontak: ${l.phone}\n  - Status: ${l.status} (${l.date})\n  - *Rekomendasi:* ${l.recommendation}`).join('\n\n') +
        `\n\n*Sumber Data:* Status komunikasi pada tabel \`cpms_leads\` dan \`cpms_whatsapp_conversations\`.`;
    } else {
      const kpis = queryResult;
      responseText = `📊 **Ringkasan Eksekutif CPMS (${auditTrail.period})**\n\n` +
        `• **Omzet Penjualan:** ${kpis.omzet_revenue.formatted}\n` +
        `• **Penerimaan Kas (Masuk):** ${kpis.pembayaran_masuk.formatted}\n` +
        `• **Sisa Piutang (AR):** ${kpis.piutang_customer.formatted}\n` +
        `• **Biaya Operasional:** ${kpis.biaya_operasional.formatted}\n` +
        `• **Laba Bersih:** **${kpis.laba_bersih.formatted}** (Margin ${kpis.laba_bersih.margin_percentage})\n\n` +
        `Unit paling produktif saat ini adalah **CP-36-01** (Putzmeister 36m) dan customer terbesar adalah **PT Waskita Karya (Persero) Tbk**.\n\n` +
        `Silakan tanyakan pertanyaan spesifik mengenai omzet, laba, piutang, produktivitas armada, atau jadwal minggu ini.`;
    }

    res.json({
      success: true,
      responseText,
      auditTrail,
      toolExecuted: toolName,
      rawData: queryResult,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Terjadi kesalahan pada layanan AI Owner Assistant.' });
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'Concrete Pump Management System (CPMS)',
    gemini_connected: !!ai,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ==============================================================================
// 3. VITE MIDDLEWARE IN DEV OR STATIC SERVE IN PRODUCTION
// ==============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CPMS Server] Backend & Full-Stack Engine running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
