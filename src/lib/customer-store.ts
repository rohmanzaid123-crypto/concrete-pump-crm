/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Customer Relationship Management (CRM) Store & Service Layer
 * Supabase PostgreSQL + Resilient Local Persistence
 */

import * as XLSX from 'xlsx';
import {
  Customer,
  CustomerContact,
  CustomerFollowup,
  CustomerBookingSummary,
  CustomerSegment,
  CustomerStatus,
} from '../types/database';
import { validateIndonesianWA, normalizeWA, formatDisplayWA } from './whatsapp';
import { getSupabaseClient, recordAuditLog } from './supabase';

const STORAGE_CUSTOMERS = 'cpms_crm_customers';
const STORAGE_CONTACTS = 'cpms_crm_contacts';
const STORAGE_FOLLOWUPS = 'cpms_crm_followups';
const STORAGE_BOOKINGS = 'cpms_crm_bookings';

// ==============================================================================
// SEED DATA FOR PREVIEW / DEMO (EMPTY IN PRODUCTION, INITIAL SEED WITH ZERO TRANS)
// ==============================================================================
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-uuid-001',
    customer_code: 'CUST-2026-0001',
    company_name: 'PT Wijaya Karya (Persero) Tbk',
    pic_name: 'Ir. Hendra Kusuma',
    whatsapp_number: '6281288991122',
    secondary_phone: '021-8508610',
    email: 'hendra.k@wika-proyek.co.id',
    address: 'Proyek LRT Jabodebek Tahap 2, Koridor Dukuh Atas',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postal_code: '12920',
    segment: 'kontraktor_bumn',
    status: 'aktif',
    tax_id: '01.001.614.5-093.000',
    credit_limit: 250000000,
    payment_term_days: 30,
    total_transaction_value: 0,
    total_paid: 0,
    total_outstanding: 0,
    notes: 'Kebutuhan utama: Pompa Long Boom 37–42m dan Super Long Boom untuk pier jembatan.',
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'cust-uuid-002',
    customer_code: 'CUST-2026-0002',
    company_name: 'PT SCG Readymix Indonesia (Jayamix)',
    pic_name: 'Bambang Soeprapto',
    whatsapp_number: '6281311223344',
    secondary_phone: '021-29532800',
    email: 'bambang.s@scg-jayamix.co.id',
    address: 'Batching Plant Cakung, Jl. Raya Bekasi KM 23',
    city: 'Jakarta Timur',
    province: 'DKI Jakarta',
    postal_code: '13910',
    segment: 'batching_plant',
    status: 'aktif',
    tax_id: '01.328.771.0-058.000',
    credit_limit: 150000000,
    payment_term_days: 14,
    total_transaction_value: 0,
    total_paid: 0,
    total_outstanding: 0,
    notes: 'Mitra batching plant rujukan cor retail dan proyek gedung Jabodetabek.',
    created_at: '2026-01-15T09:30:00Z',
    updated_at: '2026-01-15T09:30:00Z',
  },
  {
    id: 'cust-uuid-003',
    customer_code: 'CUST-2026-0003',
    company_name: 'PT Total Bangun Persada Tbk',
    pic_name: 'Agus Santoso, ST',
    whatsapp_number: '628170099881',
    secondary_phone: '021-5666999',
    email: 'agus.santoso@totalbp.com',
    address: 'Proyek Apartemen Silk Town Tower B, Serpong',
    city: 'Tangerang Selatan',
    province: 'Banten',
    postal_code: '15325',
    segment: 'kontraktor_swasta',
    status: 'aktif',
    tax_id: '01.329.812.1-032.000',
    credit_limit: 100000000,
    payment_term_days: 14,
    total_transaction_value: 0,
    total_paid: 0,
    total_outstanding: 0,
    notes: 'Sewa pompa Standar 28m & 32m untuk pengecoran pelat lantai dan kolom.',
    created_at: '2026-02-01T11:00:00Z',
    updated_at: '2026-02-01T11:00:00Z',
  },
  {
    id: 'cust-uuid-004',
    customer_code: 'CUST-2026-0004',
    company_name: 'Mandor Supardi Cor Bersama',
    pic_name: 'H. Supardi',
    whatsapp_number: '6285211998877',
    secondary_phone: '',
    email: '',
    address: 'Perumahan Grand Galaxy City Cluster Victoria Blok C',
    city: 'Bekasi',
    province: 'Jawa Barat',
    postal_code: '17147',
    segment: 'mandor_perorangan',
    status: 'aktif',
    tax_id: '',
    credit_limit: 20000000,
    payment_term_days: 7,
    total_transaction_value: 0,
    total_paid: 0,
    total_outstanding: 0,
    notes: 'Pengecoran dak rumah tinggal lantai 2 & 3. Sering membutuhkan Pompa Mini.',
    created_at: '2026-02-12T14:20:00Z',
    updated_at: '2026-02-12T14:20:00Z',
  },
];

const INITIAL_CONTACTS: CustomerContact[] = [
  {
    id: 'cnt-01',
    customer_id: 'cust-uuid-001',
    name: 'Ir. Hendra Kusuma',
    position: 'Project Manager (WIKA)',
    phone_number: '081288991122',
    whatsapp_number: '6281288991122',
    email: 'hendra.k@wika-proyek.co.id',
    is_primary: true,
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'cnt-02',
    customer_id: 'cust-uuid-001',
    name: 'Wahyudi, ST',
    position: 'Site Engineer & Logistik Lapangan',
    phone_number: '081399887766',
    whatsapp_number: '6281399887766',
    email: 'wahyudi.site@wika-proyek.co.id',
    is_primary: false,
    notes: 'PIC untuk penerimaan pompa beton dan cek akses jalan masuk mixer di lokasi',
    created_at: '2026-01-12T10:00:00Z',
  },
];

const INITIAL_FOLLOWUPS: CustomerFollowup[] = [
  {
    id: 'fol-01',
    customer_id: 'cust-uuid-001',
    date: '2026-02-10T09:00:00Z',
    author_name: 'Budi Santoso',
    author_role: 'admin',
    method: 'whatsapp',
    notes: 'Konfirmasi rencana pengecoran pier P-24 minggu depan. Membutuhkan Long Boom 42m dan 20 batang pipa tambahan.',
    next_action_date: '2026-02-16',
    status: 'perlu_tindak_lanjut',
    created_at: '2026-02-10T09:00:00Z',
  },
  {
    id: 'fol-02',
    customer_id: 'cust-uuid-002',
    date: '2026-02-05T14:30:00Z',
    author_name: 'Ir. H. Sudirman',
    author_role: 'owner',
    method: 'meeting',
    notes: 'Pertemuan tahunan evaluasi tarif sewa armada pompa CPMS dengan manajemen batching plant Jayamix.',
    status: 'selesai',
    created_at: '2026-02-05T14:30:00Z',
  },
];

// Helper to get customers from persistent store
function loadStoredCustomers(): Customer[] {
  // Never surface seeded/demo data in production.
  if (import.meta.env.PROD) return [];
  const raw = localStorage.getItem(STORAGE_CUSTOMERS);
  if (!raw) {
    localStorage.setItem(STORAGE_CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    return INITIAL_CUSTOMERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

function saveStoredCustomers(customers: Customer[]): void {
  localStorage.setItem(STORAGE_CUSTOMERS, JSON.stringify(customers));
}

function loadStoredContacts(): CustomerContact[] {
  // Never surface seeded/demo data in production.
  if (import.meta.env.PROD) return [];
  const raw = localStorage.getItem(STORAGE_CONTACTS);
  if (!raw) {
    localStorage.setItem(STORAGE_CONTACTS, JSON.stringify(INITIAL_CONTACTS));
    return INITIAL_CONTACTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_CONTACTS;
  }
}

function saveStoredContacts(contacts: CustomerContact[]): void {
  localStorage.setItem(STORAGE_CONTACTS, JSON.stringify(contacts));
}

function loadStoredFollowups(): CustomerFollowup[] {
  // Never surface seeded/demo data in production.
  if (import.meta.env.PROD) return [];
  const raw = localStorage.getItem(STORAGE_FOLLOWUPS);
  if (!raw) {
    localStorage.setItem(STORAGE_FOLLOWUPS, JSON.stringify(INITIAL_FOLLOWUPS));
    return INITIAL_FOLLOWUPS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_FOLLOWUPS;
  }
}

function saveStoredFollowups(followups: CustomerFollowup[]): void {
  localStorage.setItem(STORAGE_FOLLOWUPS, JSON.stringify(followups));
}

// Generate sequential customer code: CUST-YYYY-XXXX
export function generateNextCustomerCode(existingCustomers: Customer[]): string {
  const currentYear = new Date().getFullYear();
  const prefix = `CUST-${currentYear}-`;

  let maxNum = 0;
  for (const c of existingCustomers) {
    if (c.customer_code?.startsWith(prefix)) {
      const numPart = parseInt(c.customer_code.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
}

// ==============================================================================
// CUSTOMER CRUD OPERATIONS
// ==============================================================================

export interface CustomerFilters {
  query?: string;
  segment?: string;
  status?: string;
  city?: string;
}

export async function fetchCustomers(filters?: CustomerFilters): Promise<Customer[]> {
  const client = getSupabaseClient();
  let customers: Customer[] = [];

  if (client) {
    try {
      let query = client.from('customers').select('*').order('created_at', { ascending: false });

      if (filters?.segment && filters.segment !== 'all') {
        query = query.eq('segment', filters.segment);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.city && filters.city !== 'all') {
        query = query.ilike('city', `%${filters.city}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        customers = data as Customer[];
      } else {
        customers = loadStoredCustomers();
      }
    } catch {
      customers = loadStoredCustomers();
    }
  } else {
    customers = loadStoredCustomers();
  }

  // Filter in memory for search query across multiple fields (name, WA, company, code)
  if (filters?.query) {
    const q = filters.query.toLowerCase().trim();
    customers = customers.filter(
      (c) =>
        c.company_name.toLowerCase().includes(q) ||
        c.pic_name.toLowerCase().includes(q) ||
        c.whatsapp_number.includes(q) ||
        c.customer_code.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }

  if (filters?.segment && filters.segment !== 'all') {
    customers = customers.filter((c) => c.segment === filters.segment);
  }

  if (filters?.status && filters.status !== 'all') {
    customers = customers.filter((c) => c.status === filters.status);
  }

  if (filters?.city && filters.city !== 'all') {
    customers = customers.filter((c) => c.city.toLowerCase().includes(filters.city!.toLowerCase()));
  }

  return customers;
}

export async function fetchCustomerById(id: string): Promise<Customer | null> {
  const all = await fetchCustomers();
  const customer = all.find((c) => c.id === id);
  if (!customer) return null;

  // Attach contacts and followups
  const contacts = loadStoredContacts().filter((cnt) => cnt.customer_id === id);
  const followups = loadStoredFollowups().filter((f) => f.customer_id === id);

  return {
    ...customer,
    contacts,
    followups,
  };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedField?: 'whatsapp' | 'company' | 'code';
  existingCustomer?: Customer;
}

export function checkDuplicateCustomer(
  whatsapp: string,
  companyName: string,
  excludeId?: string,
  customerList?: Customer[]
): DuplicateCheckResult {
  const customers = customerList || loadStoredCustomers();
  const normalizedTargetWA = normalizeWA(whatsapp);
  const normalizedTargetName = companyName.trim().toLowerCase();

  for (const c of customers) {
    if (excludeId && c.id === excludeId) continue;

    // Check WA match
    if (normalizedTargetWA && normalizeWA(c.whatsapp_number) === normalizedTargetWA) {
      return {
        isDuplicate: true,
        matchedField: 'whatsapp',
        existingCustomer: c,
      };
    }

    // Check Company Name exact or high similarity match
    if (normalizedTargetName && c.company_name.trim().toLowerCase() === normalizedTargetName) {
      return {
        isDuplicate: true,
        matchedField: 'company',
        existingCustomer: c,
      };
    }
  }

  return { isDuplicate: false };
}

export async function createCustomer(
  data: Omit<Customer, 'id' | 'customer_code' | 'created_at' | 'updated_at'>,
  userEmail: string,
  userRole: string
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  // 1. WhatsApp Validation
  const waCheck = validateIndonesianWA(data.whatsapp_number);
  if (!waCheck.isValid) {
    return { success: false, error: `WhatsApp Error: ${waCheck.error}` };
  }

  const customers = loadStoredCustomers();

  // 2. Duplicate Check
  const dupCheck = checkDuplicateCustomer(waCheck.normalized, data.company_name, undefined, customers);
  if (dupCheck.isDuplicate) {
    const reason =
      dupCheck.matchedField === 'whatsapp'
        ? `Nomor WhatsApp (${waCheck.formatted}) sudah terdaftar pada customer: "${dupCheck.existingCustomer?.company_name}" (${dupCheck.existingCustomer?.customer_code})`
        : `Nama perusahaan "${data.company_name}" sudah terdaftar dengan kode ${dupCheck.existingCustomer?.customer_code}`;
    return { success: false, error: reason };
  }

  // 3. Generate Code
  const code = generateNextCustomerCode(customers);
  const now = new Date().toISOString();

  const newCustomer: Customer = {
    ...data,
    id: crypto.randomUUID ? crypto.randomUUID() : `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    customer_code: code,
    whatsapp_number: waCheck.normalized,
    total_transaction_value: Number(data.total_transaction_value) || 0,
    total_paid: Number(data.total_paid) || 0,
    total_outstanding: Number(data.total_outstanding) || 0,
    credit_limit: Number(data.credit_limit) || 50000000,
    payment_term_days: Number(data.payment_term_days) || 14,
    created_at: now,
    updated_at: now,
  };

  // Try Supabase insert
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('customers').insert(newCustomer);
    } catch (err) {
      console.warn('Supabase insert customer warning:', err);
    }
  }

  customers.unshift(newCustomer);
  saveStoredCustomers(customers);

  // If primary contact info provided, create default CustomerContact
  const contacts = loadStoredContacts();
  contacts.push({
    id: `cnt_${Date.now()}`,
    customer_id: newCustomer.id,
    name: newCustomer.pic_name,
    position: 'PIC Utama Lapangan / Pengadaan',
    phone_number: newCustomer.whatsapp_number,
    whatsapp_number: newCustomer.whatsapp_number,
    email: newCustomer.email,
    is_primary: true,
    created_at: now,
  });
  saveStoredContacts(contacts);

  // Audit Log
  await recordAuditLog({
    user_id: userEmail,
    user_email: userEmail,
    user_role: userRole as 'owner' | 'admin',
    action: 'CREATE_CUSTOMER',
    entity_type: 'customers',
    entity_id: newCustomer.id,
    details: {
      customer_code: newCustomer.customer_code,
      company_name: newCustomer.company_name,
      segment: newCustomer.segment,
    },
  });

  return { success: true, customer: newCustomer };
}

export async function updateCustomer(
  id: string,
  updates: Partial<Customer>,
  userEmail: string = 'system@cpms-indonesia.com',
  userRole: string = 'owner'
): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  const customers = loadStoredCustomers();
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) {
    return { success: false, error: 'Customer tidak ditemukan.' };
  }

  const existing = customers[index];

  // If WhatsApp is changing, validate it
  let finalWA = existing.whatsapp_number;
  if (updates.whatsapp_number && updates.whatsapp_number !== existing.whatsapp_number) {
    const waCheck = validateIndonesianWA(updates.whatsapp_number);
    if (!waCheck.isValid) {
      return { success: false, error: `WhatsApp Error: ${waCheck.error}` };
    }
    // Check duplicate
    const dupCheck = checkDuplicateCustomer(waCheck.normalized, updates.company_name || existing.company_name, id, customers);
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        error: `Nomor WhatsApp sudah digunakan oleh customer ${dupCheck.existingCustomer?.company_name} (${dupCheck.existingCustomer?.customer_code})`,
      };
    }
    finalWA = waCheck.normalized;
  }

  const updated: Customer = {
    ...existing,
    ...updates,
    whatsapp_number: finalWA,
    updated_at: new Date().toISOString(),
  };

  customers[index] = updated;
  saveStoredCustomers(customers);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('customers').update(updated).eq('id', id);
    } catch (err) {
      console.warn('Supabase update customer warning:', err);
    }
  }

  await recordAuditLog({
    user_id: userEmail,
    user_email: userEmail,
    user_role: userRole as 'owner' | 'admin',
    action: 'UPDATE_CUSTOMER',
    entity_type: 'customers',
    entity_id: updated.id,
    details: { customer_code: updated.customer_code, updated_fields: Object.keys(updates) },
  });

  return { success: true, customer: updated };
}

export async function deleteCustomer(
  id: string,
  userEmail: string,
  userRole: string
): Promise<{ success: boolean; error?: string }> {
  // Security rule: Only OWNER can delete customer records to protect transaction integrity
  if (userRole !== 'owner') {
    return {
      success: false,
      error: 'Penghapusan customer hanya dapat diotorisasi oleh peran OWNER untuk melindungi catatan audit bisnis.',
    };
  }

  const customers = loadStoredCustomers();
  const target = customers.find((c) => c.id === id);
  if (!target) {
    return { success: false, error: 'Customer tidak ditemukan.' };
  }

  // Prevent deleting if there are active outstanding debts
  if (target.total_outstanding > 0) {
    return {
      success: false,
      error: `Customer ini memiliki piutang berjalan sebesar Rp ${target.total_outstanding.toLocaleString('id-ID')}. Selesaikan tagihan terlebih dahulu sebelum menghapus.`,
    };
  }

  const filtered = customers.filter((c) => c.id !== id);
  saveStoredCustomers(filtered);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('customers').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete customer warning:', err);
    }
  }

  await recordAuditLog({
    user_id: userEmail,
    user_email: userEmail,
    user_role: 'owner',
    action: 'DELETE_CUSTOMER',
    entity_type: 'customers',
    entity_id: id,
    details: {
      deleted_code: target.customer_code,
      deleted_company: target.company_name,
    },
  });

  return { success: true };
}

// ==============================================================================
// CONTACTS & FOLLOWUPS
// ==============================================================================

export async function addCustomerContact(
  contact: Omit<CustomerContact, 'id' | 'created_at'>
): Promise<CustomerContact> {
  const contacts = loadStoredContacts();
  const waCheck = validateIndonesianWA(contact.whatsapp_number);

  const newContact: CustomerContact = {
    ...contact,
    id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    whatsapp_number: waCheck.isValid ? waCheck.normalized : contact.whatsapp_number,
    created_at: new Date().toISOString(),
  };

  contacts.push(newContact);
  saveStoredContacts(contacts);
  return newContact;
}

export async function addCustomerFollowup(
  followup: Omit<CustomerFollowup, 'id' | 'created_at'>
): Promise<CustomerFollowup> {
  const followups = loadStoredFollowups();
  const newFollowup: CustomerFollowup = {
    ...followup,
    id: `fol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  followups.unshift(newFollowup);
  saveStoredFollowups(followups);
  return newFollowup;
}

// ==============================================================================
// IMPORT & EXPORT EXCEL ENGINE
// ==============================================================================

export interface ExcelImportRow {
  rowNumber: number;
  companyName: string;
  picName: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  segment: CustomerSegment;
  taxId: string;
  creditLimit: number;
  paymentTermDays: number;
  // Validation status
  isValidWA: boolean;
  waError?: string;
  isDuplicate: boolean;
  matchedExisting?: Customer;
}

export interface ImportResultSummary {
  totalProcessed: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: { row: number; company: string; reason: string }[];
}

export function parseExcelBuffer(buffer: ArrayBuffer): {
  sheets: string[];
  headers: string[];
  rawRows: Record<string, unknown>[];
} {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0] || '';
  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    return { sheets: workbook.SheetNames, headers: [], rawRows: [] };
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

  return {
    sheets: workbook.SheetNames,
    headers,
    rawRows,
  };
}

// Auto map header names to CPMS database columns
export function autoDetectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {
    companyName: '',
    picName: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    segment: '',
    taxId: '',
  };

  const clean = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, '');

  headers.forEach((h) => {
    const c = clean(h);
    if (!mapping.companyName && (c.includes('perusahaan') || c.includes('pt') || c.includes('company') || c.includes('customer') || c.includes('nama'))) {
      mapping.companyName = h;
    } else if (!mapping.picName && (c.includes('pic') || c.includes('kontak') || c.includes('contact') || c.includes('person'))) {
      mapping.picName = h;
    } else if (!mapping.whatsapp && (c.includes('wa') || c.includes('whatsapp') || c.includes('hp') || c.includes('telepon') || c.includes('phone') || c.includes('no'))) {
      mapping.whatsapp = h;
    } else if (!mapping.email && c.includes('email')) {
      mapping.email = h;
    } else if (!mapping.address && (c.includes('alamat') || c.includes('address') || c.includes('lokasi'))) {
      mapping.address = h;
    } else if (!mapping.city && (c.includes('kota') || c.includes('city') || c.includes('daerah'))) {
      mapping.city = h;
    } else if (!mapping.segment && (c.includes('segment') || c.includes('kategori') || c.includes('jenis'))) {
      mapping.segment = h;
    } else if (!mapping.taxId && (c.includes('npwp') || c.includes('tax'))) {
      mapping.taxId = h;
    }
  });

  return mapping;
}

export function normalizeSegment(raw: string): CustomerSegment {
  const r = (raw || '').toLowerCase().trim();
  if (r.includes('bumn')) return 'kontraktor_bumn';
  if (r.includes('batching') || r.includes('plant') || r.includes('readymix') || r.includes('jayamix')) return 'batching_plant';
  if (r.includes('developer') || r.includes('properti')) return 'developer';
  if (r.includes('mandor') || r.includes('perorangan') || r.includes('subkon')) return 'mandor_perorangan';
  return 'kontraktor_swasta';
}

// Prepare preview with WhatsApp validation & Duplicate detection
export function previewExcelRows(
  rawRows: Record<string, unknown>[],
  columnMap: Record<string, string>,
  existingCustomers: Customer[]
): ExcelImportRow[] {
  return rawRows.map((row, idx) => {
    const companyName = String(row[columnMap.companyName] || '').trim();
    const picName = String(row[columnMap.picName] || companyName).trim();
    const rawWA = String(row[columnMap.whatsapp] || '').trim();
    const email = String(row[columnMap.email] || '').trim();
    const address = String(row[columnMap.address] || '-').trim();
    const city = String(row[columnMap.city] || 'Jakarta').trim();
    const rawSegment = String(row[columnMap.segment] || '').trim();
    const taxId = String(row[columnMap.taxId] || '').trim();

    const waCheck = validateIndonesianWA(rawWA);
    const dupCheck = checkDuplicateCustomer(
      waCheck.isValid ? waCheck.normalized : rawWA,
      companyName,
      undefined,
      existingCustomers
    );

    return {
      rowNumber: idx + 2, // 1-indexed Excel row (row 1 is header)
      companyName,
      picName,
      whatsapp: rawWA,
      email,
      address,
      city,
      segment: normalizeSegment(rawSegment),
      taxId,
      creditLimit: 50000000,
      paymentTermDays: 14,
      isValidWA: waCheck.isValid,
      waError: waCheck.error,
      isDuplicate: dupCheck.isDuplicate,
      matchedExisting: dupCheck.existingCustomer,
    };
  });
}

// Execute Import without deleting old records
export async function executeCustomerImport(
  previewRows: ExcelImportRow[],
  duplicateMode: 'skip' | 'update',
  userEmail: string,
  userRole: string
): Promise<ImportResultSummary> {
  const currentCustomers = loadStoredCustomers();
  const summary: ImportResultSummary = {
    totalProcessed: previewRows.length,
    importedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: [],
  };

  for (const item of previewRows) {
    if (!item.companyName) {
      summary.errorCount++;
      summary.errors.push({
        row: item.rowNumber,
        company: '(Kosong)',
        reason: 'Nama perusahaan tidak boleh kosong',
      });
      continue;
    }

    if (!item.isValidWA) {
      summary.errorCount++;
      summary.errors.push({
        row: item.rowNumber,
        company: item.companyName,
        reason: item.waError || 'Nomor WhatsApp tidak valid untuk standar Indonesia',
      });
      continue;
    }

    const normWA = normalizeWA(item.whatsapp);

    // Check if duplicate in current batch or database
    const existingIndex = currentCustomers.findIndex(
      (c) => normalizeWA(c.whatsapp_number) === normWA || c.company_name.toLowerCase() === item.companyName.toLowerCase()
    );

    if (existingIndex !== -1) {
      if (duplicateMode === 'skip') {
        summary.skippedCount++;
        continue;
      } else {
        // Update existing record without deleting
        const existing = currentCustomers[existingIndex];
        currentCustomers[existingIndex] = {
          ...existing,
          pic_name: item.picName || existing.pic_name,
          email: item.email || existing.email,
          address: item.address !== '-' ? item.address : existing.address,
          city: item.city || existing.city,
          segment: item.segment || existing.segment,
          tax_id: item.taxId || existing.tax_id,
          updated_at: new Date().toISOString(),
        };
        summary.updatedCount++;
        continue;
      }
    }

    // New Customer
    const code = generateNextCustomerCode(currentCustomers);
    const now = new Date().toISOString();
    const newCust: Customer = {
      id: crypto.randomUUID ? crypto.randomUUID() : `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customer_code: code,
      company_name: item.companyName,
      pic_name: item.picName,
      whatsapp_number: normWA,
      email: item.email,
      address: item.address,
      city: item.city,
      province: 'DKI Jakarta',
      segment: item.segment,
      status: 'aktif',
      tax_id: item.taxId,
      credit_limit: item.creditLimit,
      payment_term_days: item.paymentTermDays,
      total_transaction_value: 0,
      total_paid: 0,
      total_outstanding: 0,
      created_at: now,
      updated_at: now,
    };

    currentCustomers.unshift(newCust);
    summary.importedCount++;
  }

  saveStoredCustomers(currentCustomers);

  // Record Audit Log
  await recordAuditLog({
    user_id: userEmail,
    user_email: userEmail,
    user_role: userRole as 'owner' | 'admin',
    action: 'IMPORT_CUSTOMERS_EXCEL',
    entity_type: 'customers',
    details: {
      total_processed: summary.totalProcessed,
      imported: summary.importedCount,
      updated: summary.updatedCount,
      skipped: summary.skippedCount,
      errors: summary.errorCount,
    },
  });

  return summary;
}

// Export Customers to XLSX or CSV
export function exportCustomersToFile(customers: Customer[], fileFormat: 'xlsx' | 'csv'): void {
  const exportData = customers.map((c) => ({
    'Kode Customer': c.customer_code,
    'Nama Perusahaan': c.company_name,
    'PIC Lapangan': c.pic_name,
    'Nomor WhatsApp': formatDisplayWA(c.whatsapp_number),
    'WhatsApp Baku (Meta)': c.whatsapp_number,
    'Email': c.email || '-',
    'Alamat': c.address,
    'Kota': c.city,
    'Provinsi': c.province,
    'Segmentasi': c.segment.replace('_', ' ').toUpperCase(),
    'Status': c.status.toUpperCase(),
    'NPWP': c.tax_id || '-',
    'Plafon Kredit (IDR)': c.credit_limit,
    'Termin Pembayaran (Hari)': c.payment_term_days,
    'Total Transaksi Sewa (IDR)': c.total_transaction_value,
    'Total Terbayar (IDR)': c.total_paid,
    'Sisa Piutang (IDR)': c.total_outstanding,
    'Tanggal Daftar': new Date(c.created_at).toLocaleDateString('id-ID'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Customer CPMS');

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `CPMS_Customer_Export_${timestamp}.${fileFormat}`;

  if (fileFormat === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
  }
}

// Generate Isolated Sample Excel for Testing Import
export function generateSampleExcelFile(): Uint8Array {
  const sampleData = [
    {
      'Nama Perusahaan': 'PT PP (Persero) Tbk - Divisi Gedung',
      'PIC / Kontak': 'H. Darmawan, ST',
      'No WhatsApp': '081234567890',
      'Email': 'darmawan@ptpp-proyek.co.id',
      'Alamat': 'Proyek Menara BNI Pejompongan',
      'Kota': 'Jakarta Pusat',
      'Kategori Customer': 'Kontraktor BUMN',
      'NPWP': '01.001.614.5-093.000',
    },
    {
      'Nama Perusahaan': 'PT Merak Jaya Beton (Batching Plant)',
      'PIC / Kontak': 'Rudy Hartono',
      'No WhatsApp': '081398765432',
      'Email': 'rudy.h@merakjaya.co.id',
      'Alamat': 'Batching Plant Marunda Center',
      'Kota': 'Jakarta Utara',
      'Kategori Customer': 'Batching Plant Mitra',
      'NPWP': '01.554.218.9-041.000',
    },
    {
      'Nama Perusahaan': 'CV Bangun Sejahtera Mandor Cor',
      'PIC / Kontak': 'Pak Yanto Mandor',
      'No WhatsApp': '085712345678',
      'Email': '',
      'Alamat': 'Jl. Bintaro Utama Sektor 9',
      'Kota': 'Tangerang Selatan',
      'Kategori Customer': 'Mandor / Perorangan',
      'NPWP': '',
    },
    {
      'Nama Perusahaan': 'PT Sinarmas Land Development',
      'PIC / Kontak': 'Kevin Wijaya',
      'No WhatsApp': '081877665544',
      'Email': 'kevin.w@sinarmasland.com',
      'Alamat': 'Kawasan BSD City CBD',
      'Kota': 'Tangerang',
      'Kategori Customer': 'Developer Properti',
      'NPWP': '01.442.998.1-011.000',
    },
    {
      'Nama Perusahaan': 'PT Wijaya Karya (Persero) Tbk', // Duplikat test
      'PIC / Kontak': 'Ir. Hendra Kusuma',
      'No WhatsApp': '081288991122', // Nomor WA yang sudah ada di sistem
      'Email': 'hendra.k@wika-proyek.co.id',
      'Alamat': 'Proyek LRT Jabodebek',
      'Kota': 'Jakarta Selatan',
      'Kategori Customer': 'Kontraktor BUMN',
      'NPWP': '01.001.614.5-093.000',
    },
    {
      'Nama Perusahaan': 'Kontraktor Sample Nomor Salah', // Invalid WA test
      'PIC / Kontak': 'Ujang',
      'No WhatsApp': '021-12345', // Nomor tidak valid (bukan HP Indonesia)
      'Email': '',
      'Alamat': 'Jl. Kenanga No 1',
      'Kota': 'Depok',
      'Kategori Customer': 'Mandor / Perorangan',
      'NPWP': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contoh Import Customer');
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}
