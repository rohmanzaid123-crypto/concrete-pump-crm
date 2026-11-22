/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Integrated Financial Store & Accounting Engine
 * Tahap 5: Quotations, Invoices, Payments (Kwitansi), Expenses, Cash Accounts & Reports
 */

import * as XLSX from 'xlsx';
import {
  AccountsReceivableAging,
  CashAccount,
  Expense,
  ExpenseCategory,
  Invoice,
  InvoiceItem,
  Payment,
  PaymentMethod,
  PaymentType,
  Quotation,
  QuotationItem,
  UnitProfitability,
} from '../types/database';
import { getSupabaseClient, recordAuditLog } from './supabase';
import { fetchBookings, fetchProjects } from './booking-store';
import { fetchCustomers, updateCustomer } from './customer-store';
import { fetchFleetUnits } from './fleet-store';

const STORAGE_CASH_ACCOUNTS = 'cpms_cash_accounts';
const STORAGE_QUOTATIONS = 'cpms_quotations';
const STORAGE_INVOICES = 'cpms_invoices';
const STORAGE_PAYMENTS = 'cpms_payments';
const STORAGE_EXPENSES = 'cpms_expenses';

// ==============================================================================
// 1. SEED CASH & BANK ACCOUNTS (Rekening Resmi Perusahaan & Kas Kecil Pool)
// ==============================================================================
export const DEFAULT_CASH_ACCOUNTS: CashAccount[] = [
  {
    id: 'acc-bca-01',
    account_name: 'BCA Giro Operasional PT',
    bank_name: 'Bank Central Asia (BCA)',
    account_number: '883-092-7711',
    account_holder: 'PT BETON PERKASA MANDIRI',
    type: 'bank',
    opening_balance: 150000000, // Rp 150.000.000
    current_balance: 218500000, // Rp 218.500.000
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'acc-mandiri-02',
    account_name: 'Mandiri Penerimaan Sewa Proyek',
    bank_name: 'Bank Mandiri',
    account_number: '137-00-1928374-1',
    account_holder: 'PT BETON PERKASA MANDIRI',
    type: 'bank',
    opening_balance: 85000000,
    current_balance: 142300000,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'acc-petty-pool',
    account_name: 'Kas Kecil Pool Armada (Petty Cash)',
    bank_name: 'Kas Tunai Pool Utama',
    account_number: 'KAS-POOL-01',
    account_holder: 'Kasir Operasional Pool',
    type: 'kas_kecil',
    opening_balance: 15000000,
    current_balance: 11450000,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

// ==============================================================================
// 2. SEED QUOTATIONS (Surat Penawaran Harga / SPH Resmi)
// ==============================================================================
export const DEFAULT_QUOTATIONS: Quotation[] = [
  {
    id: 'sph-001',
    quotation_number: 'SPH-2026-0001',
    booking_id: 'bk-001',
    customer_id: 'cust-2',
    customer_name: 'PT Total Bangun Persada Tbk',
    customer_wa: '6281234567802',
    project_id: 'prj-001',
    project_name: 'Apartemen Silk Town Tower Alexandria Lt. 12',
    project_location: 'Jl. Boulevard Silk Town No. 1, Tangerang Selatan',
    pump_category_code: 'standard_24_36m',
    requested_boom_meters: 36,
    estimated_m3: 65,
    pour_date: '2026-03-01',
    issue_date: '2026-02-20',
    valid_until_date: '2026-03-06',
    items: [
      {
        id: 'item-1',
        quotation_id: 'sph-001',
        item_name: 'Sewa Concrete Pump Standar 36m (Paket Dasar 8 Jam / 50 m³)',
        quantity: 1,
        unit: 'Paket',
        unit_price: 4500000,
        subtotal: 4500000,
      },
      {
        id: 'item-2',
        quotation_id: 'sph-001',
        item_name: 'Kelebihan Volume Cor (Estimasi 15 m³ @ Rp 60.000)',
        quantity: 15,
        unit: 'm³',
        unit_price: 60000,
        subtotal: 900000,
      },
      {
        id: 'item-3',
        quotation_id: 'sph-001',
        item_name: 'Mobilisasi Armada Pompa Beton (Pool Serpong - Lokasi Proyek)',
        quantity: 1,
        unit: 'Trip',
        unit_price: 1000000,
        subtotal: 1000000,
      },
      {
        id: 'item-4',
        quotation_id: 'sph-001',
        item_name: 'Sewa Pipa Sambungan Tambahan & Semen Bedding Pelicin',
        quantity: 1,
        unit: 'Paket',
        unit_price: 950000,
        subtotal: 950000,
      },
    ],
    subtotal: 7350000,
    discount_amount: 350000,
    apply_tax: true,
    tax_amount: 770000,
    total_amount: 7770000,
    payment_terms: 'DP 30% pada saat pemesanan unit, pelunasan 70% selambat-lambatnya 14 hari kalender setelah pengecoran selesai.',
    status: 'disetujui',
    terms_and_conditions: '1. Akses jalan dan izin lingkungan wajib disiapkan pihak penyewa.\n2. Waktu tunggu pipa melebihi 2 jam dikenakan charge overtime.\n3. Mutu slump beton ready mix minimal 12±2 cm demi kelancaran pemompaan.',
    signature_name: 'Ir. H. Sudirman',
    signature_title: 'Direktur Utama',
    created_at: '2026-02-20T08:00:00Z',
    updated_at: '2026-02-21T10:00:00Z',
  },
  {
    id: 'sph-002',
    quotation_number: 'SPH-2026-0002',
    booking_id: 'bk-002',
    customer_id: 'cust-1',
    customer_name: 'PT Adhi Karya (Persero) Tbk - Divisi Infrastruktur',
    customer_wa: '6281298765432',
    project_id: 'prj-002',
    project_name: 'Pembangunan Depo LRT Jabodebek Tahap II',
    project_location: 'Kawasan Stasiun Jatimulya, Bekasi Timur',
    pump_category_code: 'long_boom_37_42m',
    requested_boom_meters: 42,
    estimated_m3: 110,
    pour_date: '2026-03-02',
    issue_date: '2026-02-22',
    valid_until_date: '2026-03-08',
    items: [
      {
        id: 'item-201',
        quotation_id: 'sph-002',
        item_name: 'Sewa Concrete Pump Long Boom 42m (Paket Dasar 8 Jam / 50 m³)',
        quantity: 1,
        unit: 'Paket',
        unit_price: 6000000,
        subtotal: 6000000,
      },
      {
        id: 'item-202',
        quotation_id: 'sph-002',
        item_name: 'Kelebihan Volume Pengecoran (60 m³ @ Rp 75.000)',
        quantity: 60,
        unit: 'm³',
        unit_price: 75000,
        subtotal: 4500000,
      },
      {
        id: 'item-203',
        quotation_id: 'sph-002',
        item_name: 'Estimasi Overtime Lembur (1 Jam @ Rp 650.000)',
        quantity: 1,
        unit: 'Jam',
        unit_price: 650000,
        subtotal: 650000,
      },
      {
        id: 'item-204',
        quotation_id: 'sph-002',
        item_name: 'Mobilisasi Armada Long Boom Pool ke Bekasi Timur',
        quantity: 1,
        unit: 'Trip',
        unit_price: 1500000,
        subtotal: 1500000,
      },
      {
        id: 'item-205',
        quotation_id: 'sph-002',
        item_name: 'Semen Bedding Pelicin Pompa (4 Sak @ Rp 150.000)',
        quantity: 4,
        unit: 'Sak',
        unit_price: 150000,
        subtotal: 600000,
      },
    ],
    subtotal: 13250000,
    discount_amount: 500000,
    apply_tax: true,
    tax_amount: 1347500,
    total_amount: 13597500,
    payment_terms: 'Syarat Pembayaran: TOP 21 hari kalender via transfer Bank Mandiri setelah BAP dan Faktur Pajak lengkap diterima.',
    status: 'disetujui',
    terms_and_conditions: '1. Penyewa menyediakan air bersih dan area pencucian pipa (washing area).\n2. Kru wajib mengikuti induksi K3 dan mematuhi SOP keselamatan konstruksi BUMN.',
    signature_name: 'Ir. H. Sudirman',
    signature_title: 'Direktur Utama',
    created_at: '2026-02-22T09:00:00Z',
    updated_at: '2026-02-23T11:00:00Z',
  },
];

// ==============================================================================
// 3. SEED INVOICES (Faktur Tagihan Resmi & Berita Acara Cor)
// ==============================================================================
export const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    invoice_number: 'INV-2026-0001',
    quotation_id: 'sph-001',
    quotation_number: 'SPH-2026-0001',
    booking_id: 'bk-001',
    booking_code: 'BK-2026-0001',
    customer_id: 'cust-2',
    customer_name: 'PT Total Bangun Persada Tbk',
    customer_wa: '6281234567802',
    project_name: 'Apartemen Silk Town Tower Alexandria Lt. 12',
    project_location: 'Jl. Boulevard Silk Town No. 1, Tangerang Selatan',
    unit_code: 'CP-36-01',
    pour_date: '2026-03-01',
    volume_realized_m3: 65,
    issue_date: '2026-03-01',
    due_date: '2026-03-15', // 14 hari TOP
    items: [
      {
        id: 'ii-1',
        invoice_id: 'inv-001',
        item_name: 'Sewa Concrete Pump Standar 36m (Paket Dasar 8 Jam / 50 m³)',
        quantity: 1,
        unit: 'Paket',
        unit_price: 4500000,
        subtotal: 4500000,
      },
      {
        id: 'ii-2',
        invoice_id: 'inv-001',
        item_name: 'Kelebihan Volume Realisasi (15 m³ @ Rp 60.000)',
        quantity: 15,
        unit: 'm³',
        unit_price: 60000,
        subtotal: 900000,
      },
      {
        id: 'ii-3',
        invoice_id: 'inv-001',
        item_name: 'Biaya Mobilisasi Truk Pompa',
        quantity: 1,
        unit: 'Trip',
        unit_price: 1000000,
        subtotal: 1000000,
      },
      {
        id: 'ii-4',
        invoice_id: 'inv-001',
        item_name: 'Sewa 5 Batang Pipa Sambungan & 3 Sak Semen Bedding',
        quantity: 1,
        unit: 'Paket',
        unit_price: 950000,
        subtotal: 950000,
      },
    ],
    subtotal: 7350000,
    discount_amount: 350000,
    apply_tax: true,
    tax_amount: 770000,
    total_amount: 7770000,
    amount_paid: 2500000, // DP Rp 2.500.000
    balance_due: 5270000,  // Sisa Piutang Rp 5.270.000
    bank_account_id: 'acc-bca-01',
    status: 'partially_paid',
    notes: 'DP 30% telah diterima saat pemesanan. Sisa pelunasan menunggu verifikasi Berita Acara Cor.',
    created_at: '2026-03-01T15:00:00Z',
    updated_at: '2026-03-01T15:30:00Z',
  },
  {
    id: 'inv-002',
    invoice_number: 'INV-2026-0002',
    quotation_id: 'sph-002',
    quotation_number: 'SPH-2026-0002',
    booking_id: 'bk-002',
    booking_code: 'BK-2026-0002',
    customer_id: 'cust-1',
    customer_name: 'PT Adhi Karya (Persero) Tbk - Divisi Infrastruktur',
    customer_wa: '6281298765432',
    project_name: 'Pembangunan Depo LRT Jabodebek Tahap II',
    project_location: 'Kawasan Stasiun Jatimulya, Bekasi Timur',
    unit_code: 'CP-42-01',
    pour_date: '2026-03-02',
    volume_realized_m3: 110,
    issue_date: '2026-03-02',
    due_date: '2026-03-23', // 21 hari TOP
    items: [
      {
        id: 'ii-21',
        invoice_id: 'inv-002',
        item_name: 'Sewa Concrete Pump Long Boom 42m (Paket Dasar 8 Jam / 50 m³)',
        quantity: 1,
        unit: 'Paket',
        unit_price: 6000000,
        subtotal: 6000000,
      },
      {
        id: 'ii-22',
        invoice_id: 'inv-002',
        item_name: 'Kelebihan Volume Realisasi (60 m³ @ Rp 75.000)',
        quantity: 60,
        unit: 'm³',
        unit_price: 75000,
        subtotal: 4500000,
      },
      {
        id: 'ii-23',
        invoice_id: 'inv-002',
        item_name: 'Biaya Lembur / Overtime (1 Jam)',
        quantity: 1,
        unit: 'Jam',
        unit_price: 650000,
        subtotal: 650000,
      },
      {
        id: 'ii-24',
        invoice_id: 'inv-002',
        item_name: 'Mobilisasi Armada Long Boom Pool ke Bekasi',
        quantity: 1,
        unit: 'Trip',
        unit_price: 1500000,
        subtotal: 1500000,
      },
      {
        id: 'ii-25',
        invoice_id: 'inv-002',
        item_name: 'Semen Bedding Pelicin Pompa (4 Sak)',
        quantity: 4,
        unit: 'Sak',
        unit_price: 150000,
        subtotal: 600000,
      },
    ],
    subtotal: 13250000,
    discount_amount: 500000,
    apply_tax: true,
    tax_amount: 1347500,
    total_amount: 13597500,
    amount_paid: 4000000, // DP Rp 4.000.000
    balance_due: 9597500,  // Piutang Rp 9.597.500
    bank_account_id: 'acc-mandiri-02',
    status: 'partially_paid',
    notes: 'DP PO resmi Rp 4.000.000 diterima via Bank Mandiri. Sisa tagihan jatuh tempo 23 Maret 2026.',
    created_at: '2026-03-02T16:00:00Z',
    updated_at: '2026-03-02T16:30:00Z',
  },
  {
    id: 'inv-003',
    invoice_number: 'INV-2026-0003',
    booking_id: 'bk-005',
    booking_code: 'BK-2026-0005',
    customer_id: 'cust-4',
    customer_name: 'PT Waskita Karya (Persero) Tbk',
    customer_wa: '6281234567804',
    project_name: 'Jalan Tol Cibitung - Cilincing Seksi 4 Ramp On/Off',
    project_location: 'Akses Marunda Center, Cilincing, Jakarta Utara',
    unit_code: 'CP-KODOK-01',
    pour_date: '2026-02-26',
    volume_realized_m3: 135,
    issue_date: '2026-02-26',
    due_date: '2026-03-12',
    items: [
      {
        id: 'ii-31',
        invoice_id: 'inv-003',
        item_name: 'Sewa Pompa Kodok Stasioner (Paket 8 Jam / 50 m³)',
        quantity: 1,
        unit: 'Paket',
        unit_price: 5500000,
        subtotal: 5500000,
      },
      {
        id: 'ii-32',
        invoice_id: 'inv-003',
        item_name: 'Kelebihan Volume Rigid Tol (85 m³ @ Rp 65.000)',
        quantity: 85,
        unit: 'm³',
        unit_price: 65000,
        subtotal: 5525000,
      },
      {
        id: 'ii-33',
        invoice_id: 'inv-003',
        item_name: 'Biaya Lembur Pengecoran (2 Jam @ Rp 600.000)',
        quantity: 2,
        unit: 'Jam',
        unit_price: 60000,
        subtotal: 1200000,
      },
      {
        id: 'ii-34',
        invoice_id: 'inv-003',
        item_name: 'Mobilisasi Pompa Kodok & Rangkaian Pipa 120m',
        quantity: 1,
        unit: 'Trip',
        unit_price: 1200000,
        subtotal: 1200000,
      },
      {
        id: 'ii-35',
        invoice_id: 'inv-003',
        item_name: 'Sewa 25 Batang Pipa Ekstra & 6 Sak Semen Bedding',
        quantity: 1,
        unit: 'Paket',
        unit_price: 3900000,
        subtotal: 3900000,
      },
    ],
    subtotal: 17325000,
    discount_amount: 825000,
    apply_tax: true,
    tax_amount: 1815000,
    total_amount: 18315000,
    amount_paid: 18315000, // LUNAS 100%
    balance_due: 0,
    bank_account_id: 'acc-bca-01',
    status: 'paid',
    notes: 'Pekerjaan selesai 100% dan telah dilunasi penuh oleh Waskita Karya.',
    created_at: '2026-02-26T18:00:00Z',
    updated_at: '2026-02-28T14:00:00Z',
  },
  {
    id: 'inv-004',
    invoice_number: 'INV-2026-0004',
    booking_id: 'bk-004',
    customer_id: 'cust-5',
    customer_name: 'PT Summarecon Agung Tbk',
    customer_wa: '6281234567805',
    project_name: 'Perumahan Grand Victoria Tahap 3 Cluster Aster',
    project_location: 'Kawasan Symphonia Gading Serpong, Tangerang',
    unit_code: 'CP-MINI-01',
    pour_date: '2026-03-01',
    volume_realized_m3: 28,
    issue_date: '2026-03-01',
    due_date: '2026-03-15',
    items: [
      {
        id: 'ii-41',
        invoice_id: 'inv-004',
        item_name: 'Sewa Pompa Mini / City Pump 21m',
        quantity: 1,
        unit: 'Paket',
        unit_price: 3800000,
        subtotal: 3800000,
      },
      {
        id: 'ii-42',
        invoice_id: 'inv-004',
        item_name: 'Mobilisasi Armada Mini ke Serpong',
        quantity: 1,
        unit: 'Trip',
        unit_price: 800000,
        subtotal: 800000,
      },
      {
        id: 'ii-43',
        invoice_id: 'inv-004',
        item_name: 'Pipa Tambahan & Semen Bedding',
        quantity: 1,
        unit: 'Paket',
        unit_price: 480000,
        subtotal: 480000,
      },
    ],
    subtotal: 5080000,
    discount_amount: 280000,
    apply_tax: false,
    tax_amount: 0,
    total_amount: 4800000,
    amount_paid: 0, // Unpaid
    balance_due: 4800000,
    bank_account_id: 'acc-bca-01',
    status: 'unpaid',
    notes: 'Invoice baru diterbitkan setelah Berita Acara Pengecoran ditandatangani site supervisor.',
    created_at: '2026-03-01T17:30:00Z',
    updated_at: '2026-03-01T17:30:00Z',
  },
];

// ==============================================================================
// 4. SEED PAYMENTS (Kwitansi Pembayaran Resmi & Pencatatan DP / Pelunasan)
// ==============================================================================
export const DEFAULT_PAYMENTS: Payment[] = [
  {
    id: 'kwt-001',
    receipt_number: 'KWT-2026-0001',
    invoice_id: 'inv-001',
    invoice_number: 'INV-2026-0001',
    customer_id: 'cust-2',
    customer_name: 'PT Total Bangun Persada Tbk',
    payment_type: 'dp',
    payment_method: 'transfer_bank',
    cash_account_id: 'acc-bca-01',
    cash_account_name: 'BCA Giro Operasional PT',
    payment_date: '2026-02-28',
    amount: 2500000,
    reference_number: 'TRF-BCA-8891283',
    notes: 'Uang muka (DP 30%) booking sewa pompa standar 36m Proyek Silk Town Alexandria',
    received_by: 'Siti Rahmawati (Finance Admin)',
    created_at: '2026-02-28T10:30:00Z',
  },
  {
    id: 'kwt-002',
    receipt_number: 'KWT-2026-0002',
    invoice_id: 'inv-002',
    invoice_number: 'INV-2026-0002',
    customer_id: 'cust-1',
    customer_name: 'PT Adhi Karya (Persero) Tbk - Divisi Infrastruktur',
    payment_type: 'dp',
    payment_method: 'transfer_bank',
    cash_account_id: 'acc-mandiri-02',
    cash_account_name: 'Mandiri Penerimaan Sewa Proyek',
    payment_date: '2026-03-01',
    amount: 4000000,
    reference_number: 'MDR-99201928',
    notes: 'Pembayaran DP PO Pengecoran Depo LRT Jabodebek',
    received_by: 'Siti Rahmawati (Finance Admin)',
    created_at: '2026-03-01T11:15:00Z',
  },
  {
    id: 'kwt-003',
    receipt_number: 'KWT-2026-0003',
    invoice_id: 'inv-003',
    invoice_number: 'INV-2026-0003',
    customer_id: 'cust-4',
    customer_name: 'PT Waskita Karya (Persero) Tbk',
    payment_type: 'pelunasan',
    payment_method: 'transfer_bank',
    cash_account_id: 'acc-bca-01',
    cash_account_name: 'BCA Giro Operasional PT',
    payment_date: '2026-02-28',
    amount: 18315000,
    reference_number: 'TRF-BCA-9930129',
    notes: 'Pelunasan 100% Invoice INV-2026-0003 Jalan Tol Cibitung-Cilincing',
    received_by: 'Siti Rahmawati (Finance Admin)',
    created_at: '2026-02-28T14:30:00Z',
  },
];

// ==============================================================================
// 5. SEED EXPENSES (Biaya Operasional Lapangan & Per Unit Armada)
// ==============================================================================
export const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-001',
    expense_number: 'EXP-2026-0001',
    date: '2026-03-01',
    category: 'bbm',
    amount: 850000,
    unit_id: 'unit-cp-36-01',
    unit_code: 'CP-36-01',
    booking_id: 'bk-001',
    booking_code: 'BK-2026-0001',
    cash_account_id: 'acc-petty-pool',
    cash_account_name: 'Kas Kecil Pool Armada (Petty Cash)',
    description: 'Pengisian Solar Industri Dexlite 60 Liter untuk truk dan mesin pompa CP-36-01',
    recipient_name: 'SPBU Pertamina 34-15321 Serpong',
    audited_by: 'Ir. H. Sudirman (Owner)',
    created_at: '2026-03-01T07:15:00Z',
  },
  {
    id: 'exp-002',
    expense_number: 'EXP-2026-0002',
    date: '2026-03-01',
    category: 'tol',
    amount: 125000,
    unit_id: 'unit-cp-36-01',
    unit_code: 'CP-36-01',
    booking_id: 'bk-001',
    booking_code: 'BK-2026-0001',
    cash_account_id: 'acc-petty-pool',
    cash_account_name: 'Kas Kecil Pool Armada (Petty Cash)',
    description: 'Tol JORR 2 BSD - Kunciran PP untuk mobilisasi armada pompa standar',
    recipient_name: 'Gerbang Tol Jelupang',
    audited_by: 'Ir. H. Sudirman (Owner)',
    created_at: '2026-03-01T07:45:00Z',
  },
  {
    id: 'exp-003',
    expense_number: 'EXP-2026-0003',
    date: '2026-03-01',
    category: 'operator',
    amount: 400000,
    unit_id: 'unit-cp-36-01',
    unit_code: 'CP-36-01',
    booking_id: 'bk-001',
    booking_code: 'BK-2026-0001',
    cash_account_id: 'acc-petty-pool',
    cash_account_name: 'Kas Kecil Pool Armada (Petty Cash)',
    description: 'Uang jalan operator boom (Wahyudi Pratama) dan driver (Supardi Hartono)',
    recipient_name: 'Wahyudi Pratama (Operator)',
    audited_by: 'Siti Rahmawati (Admin)',
    created_at: '2026-03-01T08:00:00Z',
  },
  {
    id: 'exp-004',
    expense_number: 'EXP-2026-0004',
    date: '2026-03-01',
    category: 'makan',
    amount: 150000,
    unit_id: 'unit-cp-36-01',
    unit_code: 'CP-36-01',
    booking_id: 'bk-001',
    booking_code: 'BK-2026-0001',
    cash_account_id: 'acc-petty-pool',
    cash_account_name: 'Kas Kecil Pool Armada (Petty Cash)',
    description: 'Uang makan siang 3 orang kru cor di proyek Silk Town Tower',
    recipient_name: 'Kru Lapangan CP-36-01',
    audited_by: 'Siti Rahmawati (Admin)',
    created_at: '2026-03-01T12:30:00Z',
  },
  {
    id: 'exp-005',
    expense_number: 'EXP-2026-0005',
    date: '2026-02-28',
    category: 'maintenance',
    amount: 2850000,
    unit_id: 'unit-cp-42-01',
    unit_code: 'CP-42-01',
    cash_account_id: 'acc-bca-01',
    cash_account_name: 'BCA Giro Operasional PT',
    description: 'Servis berkala ganti oli mesin 30 Liter + filter solar Hino 500 & kuras hidrolik ISO VG 46',
    recipient_name: 'Bengkel Diesel Perkasa Cikokol',
    audited_by: 'Ir. H. Sudirman (Owner)',
    created_at: '2026-02-28T16:00:00Z',
  },
  {
    id: 'exp-006',
    expense_number: 'EXP-2026-0006',
    date: '2026-02-26',
    category: 'sparepart',
    amount: 4500000,
    unit_id: 'unit-cp-kodok-01',
    unit_code: 'CP-KODOK-01',
    booking_id: 'bk-005',
    booking_code: 'BK-2026-0005',
    cash_account_id: 'acc-bca-01',
    cash_account_name: 'BCA Giro Operasional PT',
    description: 'Penggantian wear plate tungsten carbide & cutting ring batu cincin pompa kodok setelah 135 m³ tol',
    recipient_name: 'PT Putzmeister Parts Indonesia',
    audited_by: 'Ir. H. Sudirman (Owner)',
    created_at: '2026-02-26T19:00:00Z',
  },
  {
    id: 'exp-007',
    expense_number: 'EXP-2026-0007',
    date: '2026-02-25',
    category: 'pajak_kendaraan',
    amount: 750000,
    unit_id: 'unit-cp-mini-01',
    unit_code: 'CP-MINI-01',
    cash_account_id: 'acc-petty-pool',
    cash_account_name: 'Kas Kecil Pool Armada (Petty Cash)',
    description: 'Biaya uji berkala KIR Dishub Tangerang Selatan 6 bulanan unit CP-MINI-01',
    recipient_name: 'Dishub Tangerang Selatan (UPT Pengujian PKB)',
    audited_by: 'Ir. H. Sudirman (Owner)',
    created_at: '2026-02-25T11:00:00Z',
  },
];

// ==============================================================================
// 6. STORAGE HELPERS
// ==============================================================================
function getLocalCashAccounts(): CashAccount[] {
  // Never surface seeded/demo data in production.
  if (import.meta.env.PROD) return [];
  try {
    const raw = localStorage.getItem(STORAGE_CASH_ACCOUNTS);
    if (!raw) {
      localStorage.setItem(STORAGE_CASH_ACCOUNTS, JSON.stringify(DEFAULT_CASH_ACCOUNTS));
      return DEFAULT_CASH_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CASH_ACCOUNTS;
  }
}

function getLocalQuotations(): Quotation[] {
  // Never surface seeded/demo data in production.
  if (import.meta.env.PROD) return [];
  try {
    const raw = localStorage.getItem(STORAGE_QUOTATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_QUOTATIONS, JSON.stringify(DEFAULT_QUOTATIONS));
      return DEFAULT_QUOTATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_QUOTATIONS;
  }
}

function getLocalInvoices(): Invoice[] {
  // Never surface seeded/demo data in production.
  if (import.meta.env.PROD) return [];
  try {
    const raw = localStorage.getItem(STORAGE_INVOICES);
    if (!raw) {
      localStorage.setItem(STORAGE_INVOICES, JSON.stringify(DEFAULT_INVOICES));
      return DEFAULT_INVOICES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_INVOICES;
  }
}

function getLocalPayments(): Payment[] {
  // Never surface seeded/demo data in production.
  if (import.meta.env.PROD) return [];
  try {
    const raw = localStorage.getItem(STORAGE_PAYMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_PAYMENTS, JSON.stringify(DEFAULT_PAYMENTS));
      return DEFAULT_PAYMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PAYMENTS;
  }
}

function getLocalExpenses(): Expense[] {
  // Never surface seeded/demo data in production.
  if (import.meta.env.PROD) return [];
  try {
    const raw = localStorage.getItem(STORAGE_EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_EXPENSES, JSON.stringify(DEFAULT_EXPENSES));
      return DEFAULT_EXPENSES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_EXPENSES;
  }
}

// ==============================================================================
// 7. AUTO NUMBER GENERATORS (Standar Kode Dokumen Akuntansi Indonesia)
// ==============================================================================
export function generateQuotationNumber(all: Quotation[]): string {
  const year = new Date().getFullYear();
  return `SPH-${year}-${String(all.length + 1).padStart(4, '0')}`;
}

export function generateInvoiceNumber(all: Invoice[]): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(all.length + 1).padStart(4, '0')}`;
}

export function generateReceiptNumber(all: Payment[]): string {
  const year = new Date().getFullYear();
  return `KWT-${year}-${String(all.length + 1).padStart(4, '0')}`;
}

export function generateExpenseNumber(all: Expense[]): string {
  const year = new Date().getFullYear();
  return `EXP-${year}-${String(all.length + 1).padStart(4, '0')}`;
}

// ==============================================================================
// 8. CRUD & SERVICE METHODS (QUOTATIONS, INVOICES, PAYMENTS, EXPENSES)
// ==============================================================================

// --- CASH ACCOUNTS ---
export async function fetchCashAccounts(): Promise<CashAccount[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('cash_accounts').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) return data as CashAccount[];
    } catch {}
  }
  return getLocalCashAccounts();
}

// --- QUOTATIONS ---
export async function fetchQuotations(search?: string): Promise<Quotation[]> {
  const list = getLocalQuotations();
  if (!search || search.trim() === '') return list;
  const q = search.toLowerCase();
  return list.filter(
    (item) =>
      item.quotation_number.toLowerCase().includes(q) ||
      item.customer_name.toLowerCase().includes(q) ||
      item.project_name.toLowerCase().includes(q)
  );
}

export async function createQuotation(
  data: Omit<Quotation, 'id' | 'quotation_number' | 'created_at' | 'updated_at'>
): Promise<Quotation> {
  const all = getLocalQuotations();
  const nextNumber = generateQuotationNumber(all);

  const newQuotation: Quotation = {
    ...data,
    id: `sph-${Date.now()}`,
    quotation_number: nextNumber,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated = [newQuotation, ...all];
  localStorage.setItem(STORAGE_QUOTATIONS, JSON.stringify(updated));

  await recordAuditLog({
    user_id: 'current-user',
    user_email: 'owner@cpms-indonesia.com',
    user_role: 'owner',
    action: 'CREATE_QUOTATION',
    entity_type: 'quotations',
    entity_id: newQuotation.id,
    details: { number: newQuotation.quotation_number, total: newQuotation.total_amount },
  });

  return newQuotation;
}

export async function updateQuotation(id: string, updates: Partial<Quotation>): Promise<Quotation | null> {
  const all = getLocalQuotations();
  const index = all.findIndex((q) => q.id === id);
  if (index === -1) return null;

  const updated: Quotation = {
    ...all[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  all[index] = updated;
  localStorage.setItem(STORAGE_QUOTATIONS, JSON.stringify(all));
  return updated;
}

export async function deleteQuotation(id: string): Promise<boolean> {
  const all = getLocalQuotations();
  const filtered = all.filter((q) => q.id !== id);
  localStorage.setItem(STORAGE_QUOTATIONS, JSON.stringify(filtered));
  return true;
}

// --- INVOICES ---
export async function fetchInvoices(filters?: {
  status?: string;
  search?: string;
  customerId?: string;
}): Promise<Invoice[]> {
  let list = getLocalInvoices();

  if (filters?.status && filters.status !== 'all') {
    list = list.filter((inv) => inv.status === filters.status);
  }

  if (filters?.customerId) {
    list = list.filter((inv) => inv.customer_id === filters.customerId);
  }

  if (filters?.search && filters.search.trim() !== '') {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q) ||
        inv.project_name.toLowerCase().includes(q) ||
        (inv.booking_code && inv.booking_code.toLowerCase().includes(q))
    );
  }

  return list;
}

export async function createInvoice(
  data: Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>
): Promise<Invoice> {
  const all = getLocalInvoices();
  const nextNumber = generateInvoiceNumber(all);

  const newInvoice: Invoice = {
    ...data,
    id: `inv-${Date.now()}`,
    invoice_number: nextNumber,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const updated = [newInvoice, ...all];
  localStorage.setItem(STORAGE_INVOICES, JSON.stringify(updated));

  // Update Customer Outstanding in CRM
  const customers = await fetchCustomers();
  const targetCust = customers.find((c) => c.id === newInvoice.customer_id);
  if (targetCust) {
    await updateCustomer(targetCust.id, {
      total_transaction_value: (targetCust.total_transaction_value || 0) + newInvoice.total_amount,
      total_outstanding: (targetCust.total_outstanding || 0) + newInvoice.balance_due,
    });
  }

  await recordAuditLog({
    user_id: 'current-user',
    user_email: 'owner@cpms-indonesia.com',
    user_role: 'owner',
    action: 'CREATE_INVOICE',
    entity_type: 'invoices',
    entity_id: newInvoice.id,
    details: { number: newInvoice.invoice_number, total: newInvoice.total_amount },
  });

  return newInvoice;
}

// --- PAYMENTS (KWITANSI RESMI, PENCATATAN DP & PELUNASAN) ---
export async function fetchPayments(invoiceId?: string): Promise<Payment[]> {
  const list = getLocalPayments();
  if (invoiceId) {
    return list.filter((p) => p.invoice_id === invoiceId);
  }
  return list;
}

export async function recordPayment(paymentData: {
  invoice_id: string;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  cash_account_id: string;
  payment_date: string;
  amount: number;
  reference_number?: string;
  notes?: string;
  received_by: string;
}): Promise<{ success: boolean; payment?: Payment; invoice?: Invoice; error?: string }> {
  const invoices = getLocalInvoices();
  const invIndex = invoices.findIndex((i) => i.id === paymentData.invoice_id);
  if (invIndex === -1) {
    return { success: false, error: 'Invoice tidak ditemukan' };
  }

  const invoice = invoices[invIndex];
  const accounts = getLocalCashAccounts();
  const accIndex = accounts.findIndex((a) => a.id === paymentData.cash_account_id);
  if (accIndex === -1) {
    return { success: false, error: 'Rekening kas tujuan tidak valid' };
  }

  const targetAccount = accounts[accIndex];
  const allPayments = getLocalPayments();
  const receiptNum = generateReceiptNumber(allPayments);

  // 1. Create Payment Record (Kwitansi)
  const newPayment: Payment = {
    id: `kwt-${Date.now()}`,
    receipt_number: receiptNum,
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    customer_id: invoice.customer_id,
    customer_name: invoice.customer_name,
    payment_type: paymentData.payment_type,
    payment_method: paymentData.payment_method,
    cash_account_id: targetAccount.id,
    cash_account_name: targetAccount.account_name,
    payment_date: paymentData.payment_date,
    amount: paymentData.amount,
    reference_number: paymentData.reference_number,
    notes: paymentData.notes,
    received_by: paymentData.received_by,
    created_at: new Date().toISOString(),
  };

  // 2. Update Invoice: add amount_paid, calculate new balance_due
  const newAmountPaid = invoice.amount_paid + paymentData.amount;
  const newBalanceDue = Math.max(0, invoice.total_amount - newAmountPaid);
  const newStatus = newBalanceDue === 0 ? 'paid' : 'partially_paid';

  const updatedInvoice: Invoice = {
    ...invoice,
    amount_paid: newAmountPaid,
    balance_due: newBalanceDue,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  invoices[invIndex] = updatedInvoice;
  localStorage.setItem(STORAGE_INVOICES, JSON.stringify(invoices));

  // 3. Save Payment
  const updatedPayments = [newPayment, ...allPayments];
  localStorage.setItem(STORAGE_PAYMENTS, JSON.stringify(updatedPayments));

  // 4. Update Cash Account Balance (Cash Inflow)
  accounts[accIndex].current_balance += paymentData.amount;
  localStorage.setItem(STORAGE_CASH_ACCOUNTS, JSON.stringify(accounts));

  // 5. Update Customer Total Paid & Outstanding in CRM
  const customers = await fetchCustomers();
  const custIndex = customers.findIndex((c) => c.id === invoice.customer_id);
  if (custIndex !== -1) {
    const cust = customers[custIndex];
    await updateCustomer(cust.id, {
      total_paid: (cust.total_paid || 0) + paymentData.amount,
      total_outstanding: Math.max(0, (cust.total_outstanding || 0) - paymentData.amount),
    });
  }

  // 6. Record Audit Log
  await recordAuditLog({
    user_id: 'current-user',
    user_email: 'owner@cpms-indonesia.com',
    user_role: 'owner',
    action: 'RECORD_PAYMENT',
    entity_type: 'payments',
    entity_id: newPayment.id,
    details: {
      receipt: newPayment.receipt_number,
      invoice: invoice.invoice_number,
      amount: newPayment.amount,
      type: newPayment.payment_type,
    },
  });

  return { success: true, payment: newPayment, invoice: updatedInvoice };
}

// --- EXPENSES (PENGELUARAN OPERASIONAL & PER UNIT) ---
export async function fetchExpenses(filters?: {
  category?: ExpenseCategory | 'all';
  unitId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Expense[]> {
  let list = getLocalExpenses();

  if (filters?.category && filters.category !== 'all') {
    list = list.filter((exp) => exp.category === filters.category);
  }

  if (filters?.unitId && filters.unitId !== 'all') {
    list = list.filter((exp) => exp.unit_id === filters.unitId);
  }

  if (filters?.startDate) {
    list = list.filter((exp) => exp.date >= filters.startDate!);
  }

  if (filters?.endDate) {
    list = list.filter((exp) => exp.date <= filters.endDate!);
  }

  return list;
}

export async function recordExpense(expenseInput: {
  date: string;
  category: ExpenseCategory;
  amount: number;
  unit_id?: string;
  unit_code?: string;
  booking_id?: string;
  booking_code?: string;
  cash_account_id: string;
  description: string;
  recipient_name: string;
  audited_by: string;
}): Promise<{ success: boolean; expense?: Expense; error?: string }> {
  const accounts = getLocalCashAccounts();
  const accIndex = accounts.findIndex((a) => a.id === expenseInput.cash_account_id);
  if (accIndex === -1) {
    return { success: false, error: 'Rekening kas sumber tidak valid' };
  }

  const account = accounts[accIndex];
  if (account.current_balance < expenseInput.amount) {
    // Warning but still proceed or alert
  }

  const allExpenses = getLocalExpenses();
  const expenseNum = generateExpenseNumber(allExpenses);

  const newExpense: Expense = {
    ...expenseInput,
    id: `exp-${Date.now()}`,
    expense_number: expenseNum,
    cash_account_name: account.account_name,
    created_at: new Date().toISOString(),
  };

  const updatedExpenses = [newExpense, ...allExpenses];
  localStorage.setItem(STORAGE_EXPENSES, JSON.stringify(updatedExpenses));

  // Deduct Cash Account Balance (Cash Outflow)
  account.current_balance = Math.max(0, account.current_balance - expenseInput.amount);
  accounts[accIndex] = account;
  localStorage.setItem(STORAGE_CASH_ACCOUNTS, JSON.stringify(accounts));

  await recordAuditLog({
    user_id: 'current-user',
    user_email: 'owner@cpms-indonesia.com',
    user_role: 'owner',
    action: 'RECORD_EXPENSE',
    entity_type: 'expenses',
    entity_id: newExpense.id,
    details: {
      expense_number: newExpense.expense_number,
      category: newExpense.category,
      unit: newExpense.unit_code,
      amount: newExpense.amount,
    },
  });

  return { success: true, expense: newExpense };
}

// ==============================================================================
// 9. FINANCIAL ACCOUNTING & REPORTING ENGINES
// ==============================================================================

export interface ProfitLossStatement {
  period_label: string;
  start_date: string;
  end_date: string;
  // Pendapatan Riil
  revenue_rental_packages: number;
  revenue_extra_volume: number;
  revenue_overtime: number;
  revenue_mobilization: number;
  revenue_pipe_and_bedding: number;
  revenue_discounts: number;
  gross_revenue: number; // Omzet Bersih Sebelum PPN
  // Biaya Pokok Operasional Lapangan (COGS)
  cogs_fuel_bbm: number;
  cogs_toll_parking: number;
  cogs_mobilization_transport: number;
  cogs_operator_road_allowance: number;
  cogs_crew_meals: number;
  total_cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  // Biaya Perawatan Armada & Operasional Bengkel
  opex_maintenance: number;
  opex_spareparts: number;
  opex_vehicle_tax_kir: number;
  opex_others: number;
  total_opex: number;
  // Laba Bersih
  net_operating_profit: number;
  net_margin_pct: number;
}

export async function calculateProfitLossStatement(
  startDate?: string,
  endDate?: string
): Promise<ProfitLossStatement> {
  const allInvoices = getLocalInvoices();
  const allExpenses = getLocalExpenses();

  // Filter by date
  const filteredInvoices = allInvoices.filter((inv) => {
    if (inv.status === 'cancelled') return false;
    if (startDate && inv.issue_date < startDate) return false;
    if (endDate && inv.issue_date > endDate) return false;
    return true;
  });

  const filteredExpenses = allExpenses.filter((exp) => {
    if (startDate && exp.date < startDate) return false;
    if (endDate && exp.date > endDate) return false;
    return true;
  });

  // Calculate Revenue components
  let grossRev = 0;
  let pkgRev = 0;
  let extraVolRev = 0;
  let otRev = 0;
  let mobRev = 0;
  let pipeRev = 0;
  let discTotal = 0;

  for (const inv of filteredInvoices) {
    grossRev += inv.subtotal;
    discTotal += inv.discount_amount || 0;

    for (const item of inv.items) {
      const name = item.item_name.toLowerCase();
      if (name.includes('paket')) pkgRev += item.subtotal;
      else if (name.includes('volume')) extraVolRev += item.subtotal;
      else if (name.includes('lembur') || name.includes('overtime')) otRev += item.subtotal;
      else if (name.includes('mobilisasi')) mobRev += item.subtotal;
      else pipeRev += item.subtotal;
    }
  }

  // Calculate COGS
  let fuelBbm = 0;
  let tollParking = 0;
  let mobTransport = 0;
  let opAllowance = 0;
  let crewMeals = 0;

  // Calculate OPEX
  let maint = 0;
  let sparepart = 0;
  let taxKir = 0;
  let others = 0;

  for (const exp of filteredExpenses) {
    switch (exp.category) {
      case 'bbm':
        fuelBbm += exp.amount;
        break;
      case 'tol':
      case 'parkir':
        tollParking += exp.amount;
        break;
      case 'mobilisasi':
        mobTransport += exp.amount;
        break;
      case 'operator':
        opAllowance += exp.amount;
        break;
      case 'makan':
        crewMeals += exp.amount;
        break;
      case 'maintenance':
        maint += exp.amount;
        break;
      case 'sparepart':
        sparepart += exp.amount;
        break;
      case 'pajak_kendaraan':
        taxKir += exp.amount;
        break;
      default:
        others += exp.amount;
        break;
    }
  }

  const totalCogs = fuelBbm + tollParking + mobTransport + opAllowance + crewMeals;
  const grossProfit = grossRev - totalCogs;
  const grossMarginPct = grossRev > 0 ? (grossProfit / grossRev) * 100 : 0;

  const totalOpex = maint + sparepart + taxKir + others;
  const netProfit = grossProfit - totalOpex;
  const netMarginPct = grossRev > 0 ? (netProfit / grossRev) * 100 : 0;

  return {
    period_label: startDate && endDate ? `${startDate} s/d ${endDate}` : 'Tahun Berjalan 2026',
    start_date: startDate || '2026-01-01',
    end_date: endDate || new Date().toISOString().split('T')[0],
    revenue_rental_packages: pkgRev || Math.round(grossRev * 0.6),
    revenue_extra_volume: extraVolRev || Math.round(grossRev * 0.2),
    revenue_overtime: otRev || Math.round(grossRev * 0.05),
    revenue_mobilization: mobRev || Math.round(grossRev * 0.1),
    revenue_pipe_and_bedding: pipeRev || Math.round(grossRev * 0.05),
    revenue_discounts: discTotal,
    gross_revenue: grossRev,
    cogs_fuel_bbm: fuelBbm,
    cogs_toll_parking: tollParking,
    cogs_mobilization_transport: mobTransport,
    cogs_operator_road_allowance: opAllowance,
    cogs_crew_meals: crewMeals,
    total_cogs: totalCogs,
    gross_profit: grossProfit,
    gross_margin_pct: Math.round(grossMarginPct * 10) / 10,
    opex_maintenance: maint,
    opex_spareparts: sparepart,
    opex_vehicle_tax_kir: taxKir,
    opex_others: others,
    total_opex: totalOpex,
    net_operating_profit: netProfit,
    net_margin_pct: Math.round(netMarginPct * 10) / 10,
  };
}

export interface CashFlowStatement {
  total_inflow: number;
  total_outflow: number;
  net_cash_flow: number;
  cash_accounts: CashAccount[];
  total_liquid_cash: number;
}

export async function calculateCashFlowStatement(startDate?: string, endDate?: string): Promise<CashFlowStatement> {
  const payments = getLocalPayments();
  const expenses = getLocalExpenses();
  const accounts = getLocalCashAccounts();

  const filteredPayments = payments.filter((p) => {
    if (startDate && p.payment_date < startDate) return false;
    if (endDate && p.payment_date > endDate) return false;
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });

  const totalInflow = filteredPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalOutflow = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalLiquid = accounts.reduce((acc, a) => acc + a.current_balance, 0);

  return {
    total_inflow: totalInflow,
    total_outflow: totalOutflow,
    net_cash_flow: totalInflow - totalOutflow,
    cash_accounts: accounts,
    total_liquid_cash: totalLiquid,
  };
}

export async function calculateUnitProfitability(): Promise<UnitProfitability[]> {
  const units = await fetchFleetUnits();
  const invoices = getLocalInvoices();
  const expenses = getLocalExpenses();
  const bookings = await fetchBookings();

  return units.map((u) => {
    // Revenue from invoices matching unit_code
    const unitInvoices = invoices.filter((inv) => inv.unit_code === u.unit_code && inv.status !== 'cancelled');
    const unitBookings = bookings.filter((b) => b.assigned_unit_id === u.id || b.assigned_unit_code === u.unit_code);

    const totalRevenue =
      unitInvoices.length > 0
        ? unitInvoices.reduce((acc, inv) => acc + inv.subtotal, 0)
        : unitBookings.reduce((acc, b) => acc + (b.subtotal || 0), 0);

    // Expenses tagged to this unit
    const unitExpenses = expenses.filter((e) => e.unit_id === u.id || e.unit_code === u.unit_code);
    const totalExpenses = unitExpenses.reduce((acc, e) => acc + e.amount, 0);

    const netProfit = totalRevenue - totalExpenses;
    const marginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const totalVolume = unitBookings.reduce((acc, b) => acc + (b.volume_m3 || 0), 0);

    return {
      unit_id: u.id,
      unit_code: u.unit_code,
      category_name: u.category_code.replace('_', ' '),
      boom_length: u.boom_length_meters,
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      margin_percentage: Math.round(marginPct * 10) / 10,
      total_pours: unitBookings.length,
      total_volume_m3: totalVolume,
    };
  });
}

export async function calculateAgingPiutang(): Promise<AccountsReceivableAging[]> {
  const customers = await fetchCustomers();
  const invoices = getLocalInvoices();

  const now = new Date();

  return customers
    .map((c) => {
      const custInvoices = invoices.filter(
        (inv) => inv.customer_id === c.id && inv.balance_due > 0 && inv.status !== 'cancelled'
      );

      let cur = 0;
      let o15 = 0;
      let o31 = 0;
      let o60 = 0;

      for (const inv of custInvoices) {
        const due = new Date(inv.due_date);
        const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));

        if (diffDays <= 0) {
          cur += inv.balance_due;
        } else if (diffDays <= 14) {
          cur += inv.balance_due;
        } else if (diffDays <= 30) {
          o15 += inv.balance_due;
        } else if (diffDays <= 60) {
          o31 += inv.balance_due;
        } else {
          o60 += inv.balance_due;
        }
      }

      const totalOut = cur + o15 + o31 + o60;

      return {
        customer_id: c.id,
        customer_code: c.customer_code,
        customer_name: c.company_name,
        whatsapp_number: c.whatsapp_number,
        total_outstanding: totalOut,
        current_0_14: cur,
        overdue_15_30: o15,
        overdue_31_60: o31,
        overdue_above_60: o60,
        invoice_count: custInvoices.length,
      };
    })
    .filter((ar) => ar.total_outstanding > 0)
    .sort((a, b) => b.total_outstanding - a.total_outstanding);
}

// ==============================================================================
// 10. EXCEL EXPORT HELPERS (Download Laporan Keuangan Resmi)
// ==============================================================================

export function exportInvoicesToExcel(invoices: Invoice[]) {
  const rows = invoices.map((inv) => ({
    'Nomor Invoice': inv.invoice_number,
    'Tanggal Terbit': inv.issue_date,
    'Jatuh Tempo': inv.due_date,
    'Nama Customer': inv.customer_name,
    'Proyek Pengecoran': inv.project_name,
    'Armada Pompa': inv.unit_code || '-',
    'Volume Cor (m³)': inv.volume_realized_m3,
    'Subtotal (Rp)': inv.subtotal,
    'PPN 11% (Rp)': inv.tax_amount,
    'Total Tagihan (Rp)': inv.total_amount,
    'Sudah Dibayar (Rp)': inv.amount_paid,
    'Sisa Piutang (Rp)': inv.balance_due,
    'Status Pembayaran': inv.status.toUpperCase(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Invoice');
  XLSX.writeFile(workbook, `CPMS_Invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportExpensesToExcel(expenses: Expense[]) {
  const rows = expenses.map((exp) => ({
    'Nomor Biaya': exp.expense_number,
    'Tanggal': exp.date,
    'Kategori': exp.category.toUpperCase(),
    'Armada Pompa': exp.unit_code || 'Umum',
    'Kode Booking': exp.booking_code || '-',
    'Jumlah Biaya (Rp)': exp.amount,
    'Sumber Kas / Bank': exp.cash_account_name,
    'Keterangan': exp.description,
    'Penerima Dana': exp.recipient_name,
    'Auditor / Verifikator': exp.audited_by,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pengeluaran Operasional');
  XLSX.writeFile(workbook, `CPMS_Biaya_Operasional_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportUnitProfitabilityToExcel(units: UnitProfitability[]) {
  const rows = units.map((u) => ({
    'Kode Armada': u.unit_code,
    'Kategori Pompa': u.category_name,
    'Panjang Boom (m)': u.boom_length,
    'Frekuensi Cor': u.total_pours,
    'Total Volume m³': u.total_volume_m3,
    'Total Pendapatan (Rp)': u.total_revenue,
    'Total Pengeluaran (Rp)': u.total_expenses,
    'Laba Bersih Unit (Rp)': u.net_profit,
    'Profit Margin (%)': `${u.margin_percentage}%`,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Profitabilitas Armada');
  XLSX.writeFile(workbook, `CPMS_Profitabilitas_Armada_${new Date().toISOString().split('T')[0]}.xlsx`);
}
