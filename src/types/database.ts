/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Database Types & Domain Models
 */

export type UserRole = 'owner' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  legal_name?: string; // PT / CV
  phone_number: string;
  whatsapp_number: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postal_code?: string;
  tax_id?: string; // NPWP Perusahaan
  bank_name: string; // BCA, Mandiri, BRI, BNI
  bank_account_name: string;
  bank_account_number: string;
  default_payment_terms_days: number;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  user_role: UserRole;
  action: string; // e.g., 'AUTH_LOGIN', 'AUTH_LOGOUT', 'UPDATE_COMPANY_SETTINGS', 'SWITCH_ROLE'
  entity_type: string; // 'auth', 'company_settings', 'profiles', 'fleet', 'booking', etc.
  entity_id?: string;
  details?: Record<string, unknown> | string;
  created_at: string;
}

// Concrete Pump Types & Tariff Structure
export type PumpType =
  | 'standard_24_36m'   // Standar 24-36 Meter
  | 'long_boom_37_42m'  // Long Boom 37-42 Meter
  | 'super_long_boom'   // Super Long Boom >42 Meter
  | 'mini_pump'         // Mini / City Pump
  | 'kodok_portable';   // Pompa Kodok / Stationary / Portable Pump

export type PricingModel = 'per_project' | 'per_hour' | 'per_m3' | 'hybrid';

// ==============================================================================
// CRM & CUSTOMER ENTITIES
// ==============================================================================

export type CustomerSegment =
  | 'kontraktor_bumn'     // Kontraktor BUMN (WIKA, Adhi Karya, PP, Waskita, Hutama Karya)
  | 'kontraktor_swasta'   // Kontraktor Swasta (Total Bangun Persada, Jaya Konstruksi, dll)
  | 'batching_plant'      // Batching Plant Mitra (Jayamix, Holcim/SMC, Pionir, Merak Jaya, dll)
  | 'developer'           // Developer & Pengembang Properti
  | 'mandor_perorangan';  // Mandor / Subkon Cor / Pemilik Rumah

export type CustomerStatus =
  | 'aktif'       // Rutin menyewa pompa
  | 'prospek'     // Sedang penjajakan / belum ada transaksi
  | 'macet'       // Piutang macet / blacklist
  | 'nonaktif';   // Tidak aktif

export interface CustomerContact {
  id: string;
  customer_id: string;
  name: string;
  position: string; // Site Manager, Project Manager, Logistik/Pengadaan, Mandor, dsb
  phone_number: string;
  whatsapp_number: string;
  email?: string;
  is_primary: boolean;
  notes?: string;
  created_at: string;
}

export interface CustomerFollowup {
  id: string;
  customer_id: string;
  date: string;
  author_name: string;
  author_role: UserRole;
  method: 'whatsapp' | 'telepon' | 'survei_lapangan' | 'meeting' | 'email';
  notes: string;
  next_action_date?: string;
  status: 'selesai' | 'perlu_tindak_lanjut';
  created_at: string;
}

export interface CustomerBookingSummary {
  id: string;
  customer_id: string;
  booking_code: string;
  project_name: string;
  pump_type: PumpType;
  boom_length_meters: number;
  pour_date: string;
  volume_m3: number;
  total_amount: number;
  payment_status: 'lunas' | 'belum_lunas' | 'dp';
}

export interface Customer {
  id: string;
  customer_code: string; // e.g. CUST-2026-0001
  company_name: string;  // Nama PT / CV / Nama Usaha Mandor
  pic_name: string;      // Nama PIC Utama
  whatsapp_number: string; // Format baku 628xxxxxxxxxx
  secondary_phone?: string;
  email?: string;
  address: string;
  city: string;
  province: string;
  postal_code?: string;
  segment: CustomerSegment;
  status: CustomerStatus;
  tax_id?: string; // NPWP
  credit_limit: number; // Plafon piutang
  payment_term_days: number; // TOP (e.g. 14 hari)
  
  // Agregasi Finansial Riil (IDR)
  total_transaction_value: number; // Total nilai transaksi sewa pompa (Rp)
  total_paid: number;              // Total pembayaran yang sudah diterima (Rp)
  total_outstanding: number;       // Total piutang yang belum terbayar (Rp)
  
  notes?: string;
  contacts?: CustomerContact[];
  followups?: CustomerFollowup[];
  bookings?: CustomerBookingSummary[];
  created_at: string;
  updated_at: string;
}

// Leads Pipeline
export type LeadStage = 'inquiry' | 'survei' | 'penawaran_sph' | 'deal' | 'lost';

export interface Lead {
  id: string;
  lead_code: string;
  contact_name: string;
  company_name: string;
  whatsapp_number: string;
  source: 'whatsapp' | 'telepon' | 'referensi' | 'website' | 'kunjungan';
  stage: LeadStage;
  estimated_m3: number;
  target_pump_type: PumpType;
  project_location: string;
  notes?: string;
  customer_id?: string; // Jika terkonversi ke customer
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// FLEET MANAGEMENT & CONCRETE PUMP ENTITIES (TAHAP 3)
// ==============================================================================

export type PumpCategoryCode =
  | 'standard_24_36m'   // Concrete Pump 24–36 meter
  | 'long_boom_37_42m'  // Concrete Pump 37–42 meter
  | 'super_long_boom'   // Concrete Pump Long Boom (>42m s/d 56m)
  | 'mini_pump'         // Concrete Pump Mini (City Pump 18–21m)
  | 'kodok_portable'    // Concrete Pump Kodok / Portable / Stationary
  | 'custom';           // Custom / Khusus

export interface PumpCategory {
  id: string;
  code: PumpCategoryCode;
  name: string;
  description: string;
  boom_range_label: string;
}

export type PumpUnitStatus =
  | 'available'       // Tersedia di pool armada, siap dispatch
  | 'reserved'        // Telah dibooking jadwal cor (terkunci kalender)
  | 'rented'          // Sedang beroperasi di lokasi proyek pengecoran
  | 'maintenance'     // Sedang dalam perawatan rutin / bengkel
  | 'out_of_service'; // Rusak berat / tidak beroperasi

export interface PumpUnit {
  id: string;
  unit_code: string; // e.g. CP-28-01, CP-36-02, CP-42-01, CP-KODOK-01
  category_code: PumpCategoryCode;
  name: string; // e.g. Putzmeister BSF 36.16H
  brand_chassis: string; // Hino 500, Isuzu Giga, Mitsubishi Fuso, Mercedes Actros
  brand_pump: string; // Putzmeister, Sany, Zoomlion, Schwing, Everdigm, Junjin
  boom_length_meters: number; // 24, 28, 32, 36, 38, 42, 46, 52, 0 (kodok)
  boom_sections: string; // "4-Section Z-Fold", "5-Section RZ-Fold", "Stationary Pipe"
  output_capacity_m3_hour: number; // Kapasitas m³/jam (e.g. 120, 140, 160)
  max_pressure_bar: number; // Tekanan hidrolik bar (e.g. 85 bar)
  plate_number: string; // Plat Nomor Indonesia: e.g. B 9123 UXT
  year_manufactured: number;
  engine_hours: number; // Jam kerja mesin (Hour Meter)
  
  // Data Operator & Kru Ditugaskan
  primary_operator_id?: string;
  primary_operator_name: string;
  secondary_operator_name?: string;
  driver_name?: string;
  
  // Status Operasional
  status: PumpUnitStatus;
  current_project_location?: string;
  
  // Jadwal Servis & Perawatan
  next_service_date: string;
  next_service_engine_hours: number;
  total_maintenance_cost: number; // Akumulasi biaya servis (IDR)
  
  // Dokumen Legal Kendaraan & Kelayakan Dishub
  stnk_expiry_date: string;
  kir_expiry_date: string;
  insurance_expiry_date?: string;
  
  total_rental_hours?: number;
  total_m3_pumped?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type OperatorRole = 'operator_boom' | 'driver' | 'helper_pipa';
export type OperatorStatus = 'aktif' | 'cuti' | 'standby';

export interface Operator {
  id: string;
  name: string;
  role_type: OperatorRole;
  phone_number: string;
  whatsapp_number: string;
  sio_number: string; // Surat Izin Operator (Kemenaker)
  sio_expiry_date: string;
  sim_type: string; // 'B2 UMUM' | 'B1' | 'A'
  assigned_unit_id?: string;
  assigned_unit_code?: string;
  status: OperatorStatus;
  total_pour_projects: number;
  created_at: string;
}

export type MaintenanceServiceType =
  | 'servis_berkala'      // Servis Berkala (Ganti Oli Mesin & Filter)
  | 'ganti_oli_hidrolik'  // Kuras & Ganti Oli Hidrolik ISO VG 46/68
  | 'wear_plate_ring'     // Ganti Wear Plate & Cutting Ring (Batu Cincin)
  | 'piston_sekat'        // Ganti Piston Ram / Sekat Karet Pompa
  | 'perbaikan_boom'      // Perbaikan Silinder & Pipa Boom
  | 'overhaul_mesin'      // Overhaul Mesin Sasis Truk
  | 'emergency_repair';   // Perbaikan Darurat di Lapangan

export interface MaintenanceRecord {
  id: string;
  unit_id: string;
  unit_code: string;
  service_date: string;
  service_type: MaintenanceServiceType;
  description: string;
  workshop_technician: string; // Nama bengkel / mekanik internal
  cost_amount: number; // Biaya servis (Rupiah IDR)
  engine_hour_at_service: number;
  damage_notes?: string;
  replaced_parts?: string;
  next_recommended_service_date?: string;
  created_at: string;
}

export interface RentalHistoryRecord {
  id: string;
  unit_id: string;
  booking_code: string;
  project_name: string;
  customer_name: string;
  pour_date: string;
  volume_m3: number;
  operating_hours: number;
  revenue_idr: number;
}

// ==============================================================================
// TAHAP 4: BOOKINGS, SMART SCHEDULING & PRICING RULES
// ==============================================================================

export type BookingStatus =
  | 'inquiry'               // Permintaan awal masuk
  | 'quotation'             // Diterbitkan Surat Penawaran Harga (SPH)
  | 'pending_confirmation'  // Menunggu konfirmasi kontraktor / PO
  | 'confirmed'             // Terkonfirmasi & DP diterima
  | 'scheduled'             // Armada & Operator dialokasikan di kalender
  | 'on_progress'           // Sedang mobilisasi / pengecoran di lokasi
  | 'completed'             // Selesai pengecoran & siap penagihan
  | 'cancelled';            // Dibatalkan / batal sewa

export interface Project {
  id: string;
  project_code: string;
  project_name: string;
  customer_id: string;
  customer_name: string;
  address: string;
  city: string;
  site_manager_name: string;
  site_manager_phone: string;
  batching_plant_partner?: string;
  target_volume_m3: number;
  realized_volume_m3: number;
  status: 'aktif' | 'selesai' | 'tunda';
  created_at: string;
}

export type PricingModelType = 'paket' | 'per_jam' | 'per_m3' | 'kombinasi';

export interface PricingRule {
  id: string;
  category_code: PumpCategoryCode;
  name: string;
  base_min_hours: number; // e.g. 8 jam kerja standar
  base_min_m3: number; // e.g. 50 m³ batas paket minimum
  base_package_price: number; // Tarif minimum dasar paket (IDR)
  extra_price_per_m3: number; // Tarif kelebihan volume (IDR / m³)
  overtime_price_per_hour: number; // Biaya lembur per jam (IDR / jam)
  mobilization_base_price: number; // Biaya mobilisasi armada standar (IDR)
  pipe_rental_per_bar: number; // Sewa pipa tambahan per batang (IDR)
}

export interface Booking {
  id: string;
  booking_code: string; // e.g. BK-2026-0001
  customer_id: string;
  customer_name: string;
  customer_wa: string;
  project_id: string;
  project_name: string;
  project_location: string;
  
  // Spesifikasi Pompa & Jadwal Cor
  pump_category_code: PumpCategoryCode;
  requested_boom_meters: number;
  pour_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM e.g. "08:00"
  end_time: string; // HH:MM e.g. "14:00"
  estimated_duration_hours: number;
  mobilization_buffer_hours: number; // Buffer waktu perjalanan e.g. 2 jam
  
  // Volume & Bahan
  volume_m3: number;
  concrete_grade: string; // K-250, K-300, K-350, FS-45
  extra_pipes_count: number; // Jumlah batang pipa tambahan
  cement_bedding_sacks: number; // Sak semen pelicin pipa cor
  
  // Alokasi Armada & Kru
  assigned_unit_id?: string;
  assigned_unit_code?: string;
  assigned_operator_name?: string;
  assigned_driver_name?: string;
  
  // Kalkulator Tarif Fleksibel (IDR)
  pricing_model: PricingModelType;
  base_price: number;
  extra_volume_price: number;
  extra_hour_price: number;
  mobilization_price: number;
  additional_costs: number;
  discount_amount: number;
  subtotal: number;
  apply_tax: boolean; // PPN 11%
  tax_amount: number;
  total_price: number; // Total Tagihan (Rupiah)
  
  status: BookingStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType?: 'unit_overlap' | 'operator_overlap' | 'maintenance' | 'document_expired' | 'mobilization_buffer';
  reason?: string;
  conflictingBooking?: Booking;
}

// ==============================================================================
// TAHAP 5: FINANCIAL & COMMERCIAL BILLING ENTITIES
// ==============================================================================

export type CashAccountType = 'bank' | 'kas_kecil' | 'giro';

export interface CashAccount {
  id: string;
  account_name: string; // e.g. "BCA Operasional PT", "Mandiri Penerimaan", "Kas Kecil Pool"
  bank_name: string; // BCA, Mandiri, BRI, BNI, Kas Tunai
  account_number: string;
  account_holder: string;
  type: CashAccountType;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

// --- QUOTATIONS (SURAT PENAWARAN HARGA / SPH) ---
export type QuotationStatus = 'draft' | 'terkirim' | 'disetujui' | 'ditolak' | 'kadaluarsa';

export interface QuotationItem {
  id: string;
  quotation_id: string;
  item_name: string; // e.g. "Sewa Concrete Pump Standar 36m (Paket 8 Jam / 50 m³)"
  description?: string;
  quantity: number;
  unit: string; // "Paket", "m³", "Jam", "Batang", "Sak"
  unit_price: number;
  subtotal: number;
}

export interface Quotation {
  id: string;
  quotation_number: string; // e.g. SPH-2026-0001
  booking_id?: string;
  customer_id: string;
  customer_name: string;
  customer_wa: string;
  project_id?: string;
  project_name: string;
  project_location: string;
  pump_category_code: PumpCategoryCode;
  requested_boom_meters: number;
  estimated_m3: number;
  pour_date?: string;
  issue_date: string;
  valid_until_date: string; // Masa berlaku penawaran (e.g. 14 hari)
  items: QuotationItem[];
  subtotal: number;
  discount_amount: number;
  apply_tax: boolean;
  tax_amount: number;
  total_amount: number;
  payment_terms: string; // e.g. "DP 30% saat booking, Pelunasan 70% setelah Berita Acara Cor"
  status: QuotationStatus;
  terms_and_conditions: string;
  signature_name: string;
  signature_title: string;
  created_at: string;
  updated_at: string;
}

// --- INVOICES (FAKTUR TAGIHAN & BERITA ACARA COR) ---
export type InvoiceStatus = 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoice_number: string; // e.g. INV-2026-0001
  quotation_id?: string;
  quotation_number?: string;
  booking_id?: string;
  booking_code?: string;
  customer_id: string;
  customer_name: string;
  customer_wa: string;
  project_name: string;
  project_location: string;
  unit_code?: string;
  pour_date: string;
  volume_realized_m3: number;
  issue_date: string;
  due_date: string; // Jatuh tempo pembayaran (TOP)
  items: InvoiceItem[];
  subtotal: number;
  discount_amount: number;
  apply_tax: boolean;
  tax_amount: number; // PPN 11%
  total_amount: number; // Nilai Total Tagihan (Rupiah)
  amount_paid: number; // Total pembayaran yang telah diterima (DP + Termin)
  balance_due: number; // Sisa Piutang yang belum terbayar
  bank_account_id: string; // Rekening tujuan transfer
  status: InvoiceStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- PAYMENTS (KWITANSI PEMBAYARAN RESMI) ---
export type PaymentType = 'dp' | 'termin' | 'pelunasan';
export type PaymentMethod = 'transfer_bank' | 'tunai' | 'giro' | 'cek';

export interface Payment {
  id: string;
  receipt_number: string; // e.g. KWT-2026-0001 (Nomor Kwitansi)
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  payment_type: PaymentType;
  payment_method: PaymentMethod;
  cash_account_id: string;
  cash_account_name: string;
  payment_date: string;
  amount: number; // Jumlah dibayarkan (IDR)
  reference_number?: string; // No. Ref Bank / No. Bukti Transfer
  notes?: string;
  received_by: string;
  created_at: string;
}

// --- EXPENSES (PENGELUARAN OPERASIONAL & BIAYA ARMADA) ---
export type ExpenseCategory =
  | 'bbm'             // Bahan Bakar Solar Industri
  | 'tol'             // Biaya Tol Trans Jawa / Dalam Kota
  | 'parkir'          // Parkir & Retribusi Lingkungan
  | 'mobilisasi'      // Biaya Mobilisasi & Pengawalan
  | 'operator'        // Uang Saku & Uang Jalan Kru Cor
  | 'makan'           // Uang Makan Kru / Lembur Malam
  | 'maintenance'     // Servis & Perawatan Bengkel
  | 'sparepart'       // Pembelian Suku Cadang Pompa & Pipa
  | 'pajak_kendaraan' // Uji KIR Dishub & Pajak STNK
  | 'lainnya';        // Biaya Operasional Lainnya

export interface Expense {
  id: string;
  expense_number: string; // e.g. EXP-2026-0001
  date: string;
  category: ExpenseCategory;
  amount: number; // Biaya (Rupiah)
  unit_id?: string; // Ditautkan ke armada pompa beton spesifik
  unit_code?: string;
  booking_id?: string;
  booking_code?: string;
  cash_account_id: string;
  cash_account_name: string;
  description: string;
  recipient_name: string; // Penerima (SPBU, Supir, Bengkel, Kru)
  receipt_file_url?: string;
  audited_by: string;
  created_at: string;
}

// --- FINANCIAL REPORTING DOMAIN MODELS ---
export interface UnitProfitability {
  unit_id: string;
  unit_code: string;
  category_name: string;
  boom_length: number;
  total_revenue: number; // Pendapatan dari booking unit ini
  total_expenses: number; // Pengeluaran operasional unit ini
  net_profit: number; // Laba Bersih Unit
  margin_percentage: number; // Profit Margin %
  total_pours: number; // Frekuensi pengecoran
  total_volume_m3: number; // Total m³ beton dipompa
}

export interface AccountsReceivableAging {
  customer_id: string;
  customer_code: string;
  customer_name: string;
  whatsapp_number: string;
  total_outstanding: number;
  current_0_14: number; // Belum jatuh tempo / <14 hari
  overdue_15_30: number; // Terlambat 15–30 hari
  overdue_31_60: number; // Terlambat 31–60 hari
  overdue_above_60: number; // Macet >60 hari
  invoice_count: number;
}

// ==============================================================================
// TAHAP 6: META WHATSAPP BUSINESS CLOUD API INTEGRATION & NOTIFICATIONS
// ==============================================================================

export type WhatsAppContactGroup =
  | 'kontraktor_bumn'
  | 'kontraktor_swasta'
  | 'mandor'
  | 'batching_plant'
  | 'operator';

export type WhatsAppOptInStatus = 'opted_in' | 'opted_out' | 'pending';

export interface WhatsAppContact {
  id: string;
  name: string;
  whatsapp_number: string; // Formatted 628xxxxxxxxxx
  company_name: string;
  customer_id?: string;
  group_tag: WhatsAppContactGroup;
  opt_in_status: WhatsAppOptInStatus;
  opt_in_date?: string;
  last_interaction_at?: string;
  created_at: string;
}

export type ConversationStatus = 'open' | 'resolved' | 'pending';

export interface WhatsAppConversation {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_wa: string;
  company_name?: string;
  last_message_text: string;
  last_message_time: string;
  unread_count: number;
  status: ConversationStatus;
  assigned_agent?: string;
  customer_id?: string;
  booking_id?: string;
  created_at: string;
  updated_at: string;
}

export type MessageDirection = 'inbound' | 'outbound';
export type MessageType = 'text' | 'template' | 'document' | 'image' | 'location';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  contact_wa: string;
  direction: MessageDirection;
  message_type: MessageType;
  body: string;
  media_url?: string;
  media_filename?: string;
  template_name?: string;
  template_variables?: Record<string, string>;
  meta_message_id?: string;
  status: MessageStatus;
  error_message?: string;
  created_at: string;
}

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface WhatsAppTemplate {
  id: string;
  template_name: string; // e.g. "konfirmasi_booking_cor"
  category: TemplateCategory;
  language: string; // 'id' (Bahasa Indonesia)
  header_text?: string;
  body_text: string; // Contains placeholders {{1}}, {{2}}, etc.
  footer_text?: string;
  variables_example?: string[];
  status: TemplateStatus;
  meta_template_id?: string;
  created_at: string;
}

export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';

export interface BroadcastCampaign {
  id: string;
  campaign_name: string;
  template_id: string;
  template_name: string;
  target_group: WhatsAppContactGroup | 'all';
  status: BroadcastStatus;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  scheduled_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BroadcastRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  contact_name: string;
  contact_wa: string;
  status: MessageStatus;
  meta_message_id?: string;
  error_message?: string;
  sent_at?: string;
}

export type NotificationType =
  | 'booking_alert'
  | 'schedule_reminder'
  | 'payment_reminder'
  | 'document_dispatch'
  | 'system';

export interface CPMSNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: string;
  channel: 'whatsapp' | 'in_app' | 'both';
  is_read: boolean;
  whatsapp_sent: boolean;
  sent_at: string;
}

export interface WhatsAppConfig {
  access_token: string;
  phone_number_id: string;
  business_account_id: string;
  verify_token: string;
  webhook_url: string;
  is_connected: boolean;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  last_tested_at?: string;
  test_error?: string;
}

// ==============================================================================
// 10. BUSINESS INTELLIGENCE (BI) & EXECUTIVE OWNER REPORTS (Tahap 8)
// ==============================================================================

export interface BIFilters {
  periodType: 'month' | 'quarter' | 'year' | 'custom';
  month?: string; // YYYY-MM
  year?: number;
  startDate?: string;
  endDate?: string;
  unitId?: string; // All or unit_id
  customerId?: string; // All or customer_id
  adminEmail?: string; // All or admin_email
}

export interface ExecutiveBIDashboard {
  period_label: string;
  total_omzet: number;
  pendapatan_diterima: number;
  piutang_berjalan: number;
  total_biaya_operasional: number;
  laba_bersih: number;
  net_margin_percentage: number;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  cancellation_rate_percentage: number;
  average_booking_value: number;
  total_volume_cor_m3: number;
  active_units_count: number;
  productivity_m3_per_unit: number;
  customer_baru_count: number;
  customer_berulang_count: number;
  repeat_customer_rate_percentage: number;
}

export interface PumpCategoryRevenue {
  category_code: string;
  category_name: string;
  total_jobs: number;
  volume_m3: number;
  revenue: number;
  percentage_of_total: number;
}

export interface MonthlyTrendItem {
  month_key: string; // YYYY-MM
  month_label: string; // "Jan 2026", "Feb 2026", etc.
  revenue: number;
  cash_collected: number;
  expenses: number;
  net_profit: number;
  bookings_count: number;
  volume_m3: number;
}

export interface CustomerAnalyticsItem {
  customer_id: string;
  customer_name: string;
  company_name?: string;
  whatsapp_number: string;
  segment: string;
  total_transactions: number;
  total_volume_m3: number;
  booking_count: number;
  last_booking_date: string;
  days_inactive: number;
  is_inactive: boolean; // > 60 days without booking
  outstanding_receivables: number;
}

export interface AdminPerformanceItem {
  admin_email: string;
  admin_name: string;
  role: string;
  chats_handled: number;
  followups_count: number;
  quotations_generated: number;
  bookings_closed: number;
  total_revenue_closed: number;
  conversion_rate_percentage: number;
}

export interface CustomerServiceAnalytics {
  total_chats: number;
  avg_response_time_minutes: number;
  total_followups: number;
  total_quotations: number;
  total_successful_bookings: number;
  overall_conversion_rate: number;
  unreplied_chats_count: number;
}




