import React, { useState, useEffect } from 'react';
import {
  Truck,
  CalendarDays,
  Receipt,
  FileCheck2,
  Database,
  ArrowRight,
  Shield,
  Building2,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Code2,
  Copy,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah, formatTanggal, formatNumber } from '../../lib/formatters';
import { fetchCompanySettings, fetchAuditLogs, getStoredSupabaseConfig, testSupabaseConnection } from '../../lib/supabase';
import { fetchCustomers } from '../../lib/customer-store';
import { fetchFleetUnits } from '../../lib/fleet-store';
import { fetchBookings } from '../../lib/booking-store';
import { CompanySettings, AuditLog, Customer, PumpUnit, Booking } from '../../types/database';

interface DashboardPageProps {
  onNavigateTab: (tabId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateTab }) => {
  const { user, role } = useAuth();
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [units, setUnits] = useState<PumpUnit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [connectionTestStatus, setConnectionTestStatus] = useState<string | null>(null);

  const supabaseConfig = getStoredSupabaseConfig();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [settings, logs, custs, fleetUnits, bookingList] = await Promise.all([
          fetchCompanySettings(),
          fetchAuditLogs(10),
          fetchCustomers(),
          fetchFleetUnits(),
          fetchBookings(),
        ]);
        setCompanySettings(settings);
        setAuditLogs(logs);
        setCustomers(custs);
        setUnits(fleetUnits);
        setBookings(bookingList);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCopySql = () => {
    const sqlText = `-- CONCRETE PUMP MANAGEMENT SYSTEM (CPMS) - SUPABASE INITIAL SCHEMA
-- Salin dan jalankan di Supabase Dashboard -> SQL Editor
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleTestConnection = async () => {
    setConnectionTestStatus('Sedang menguji koneksi...');
    const result = await testSupabaseConnection();
    setConnectionTestStatus(result.message);
    setTimeout(() => setConnectionTestStatus(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0A192F] via-[#0F2444] to-[#1E3A8A] text-white rounded-xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono tracking-wider uppercase text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded border border-orange-500/30">
                Pusat Kendali Tahap 1
              </span>
              <span className="text-xs text-slate-300">
                {companySettings?.company_name || 'PT Beton Perkasa Mandiri'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Selamat datang, {user?.full_name || 'Owner'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Fondasi sistem operasional persewaan pompa beton (CPMS) telah aktif dengan proteksi peran{' '}
              <span className="font-semibold text-orange-400 uppercase font-mono">{role}</span> dan arsitektur database Supabase PostgreSQL.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-orange-400" />
              <span>Lihat Skema SQL</span>
            </button>
            <button
              onClick={() => onNavigateTab('settings')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Pengaturan Perusahaan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Metric KPI Cards (No Fake Transactions - Honest Zero Baseline) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Fleet */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Unit Armada Aktif</span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">{units.length}</span>
            <span className="text-xs text-slate-400">/ 20+ Unit Armada</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {units.filter((u) => u.status === 'available').length} unit siap dispatch di pool
          </p>
        </div>

        {/* Metric 2: Scheduling */}
        <div
          onClick={() => onNavigateTab('scheduling')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-orange-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Jadwal Cor Hari Ini</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {bookings.filter((b) => b.pour_date === new Date().toISOString().split('T')[0] && b.status !== 'cancelled').length}
            </span>
            <span className="text-xs text-slate-400">Pekerjaan Lapangan</span>
          </div>
          <p className="text-[11px] text-blue-600 mt-2 flex items-center gap-1 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {bookings.filter((b) => b.status === 'on_progress').length} unit sedang cor saat ini
          </p>
        </div>

        {/* Metric 3: Volume */}
        <div
          onClick={() => onNavigateTab('bookings')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-orange-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Akumulasi Volume Cor</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatNumber(bookings.reduce((acc, b) => acc + (b.volume_m3 || 0), 0))}
            </span>
            <span className="text-xs text-slate-500 font-medium">m³ beton</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {bookings.length} booking terdaftar di sistem
          </p>
        </div>

        {/* Metric 4: Finance (Rupiah) */}
        <div
          onClick={() => onNavigateTab('invoices')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-orange-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Piutang / Tagihan Berjalan</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatRupiah(customers.reduce((acc, c) => acc + (c.total_outstanding || 0), 0))}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            {customers.length} customer terdaftar di CRM
          </p>
        </div>
      </div>

      {/* Main Grid: Onboarding Checklist & System Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Onboarding & Readiness Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Onboarding Checklist Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Panduan Kesiapan Operasional CPMS (Tahap 1)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Langkah-langkah esensial sebelum memulai pencatatan armada 20+ unit dan reservasi cor.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-orange-50 text-orange-700 font-semibold rounded border border-orange-200">
                Tahap 1 Fondasi
              </span>
            </div>

            <div className="space-y-3">
              {/* Step 1: Database Supabase */}
              <div className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-start gap-3 transition-colors">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md mt-0.5 shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      1. Database PostgreSQL & Supabase Auth
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {supabaseConfig.isConfigured ? 'Terkoneksi' : 'Siap / Standby'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Struktur tabel <code className="text-orange-600 font-mono text-[11px]">profiles</code>,{' '}
                    <code className="text-orange-600 font-mono text-[11px]">company_settings</code>, dan{' '}
                    <code className="text-orange-600 font-mono text-[11px]">audit_logs</code> dengan Row Level Security telah didefinisikan.
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => setShowSqlModal(true)}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      Lihat Script SQL
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      onClick={handleTestConnection}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Uji Koneksi
                    </button>
                    {connectionTestStatus && (
                      <span className="text-xs text-emerald-600 font-medium ml-2">
                        {connectionTestStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Identitas Perusahaan */}
              <div className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-start gap-3 transition-colors">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md mt-0.5 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      2. Identitas Perusahaan & Rekening Penagihan (IDR)
                    </h3>
                    <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Tersimpan
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Nama PT/CV, NPWP, nomor WhatsApp resmi, dan no rekening bank ({companySettings?.bank_name} - {companySettings?.bank_account_number}) untuk penagihan invoice sewa pompa.
                  </p>
                  <button
                    onClick={() => onNavigateTab('settings')}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 mt-2 cursor-pointer"
                  >
                    Edit Profil Perusahaan <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Step 3: Armada Pompa (Tahap 3 Aktif) */}
              <div className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-start gap-3 transition-colors">
                <div className="p-1.5 bg-orange-100 text-orange-700 rounded-md mt-0.5 shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      3. Manajemen Armada Pompa Beton (Fleet Management)
                    </h3>
                    <span className="text-[10px] text-orange-700 font-semibold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      {units.length} Unit Terdaftar · Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Armada 20+ unit (Standar 24–36m, Long Boom 37–42m, Super Long Boom, Mini/City, dan Pompa Kodok) lengkap dengan spesifikasi teknis boom, log maintenance, KIR Dishub, dan kru operator.
                  </p>
                  <button
                    onClick={() => onNavigateTab('fleet')}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 mt-2 cursor-pointer"
                  >
                    Buka Modul Fleet & Jadwal Servis <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Step 4: Import Excel Customer */}
              <div className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-start gap-3 transition-colors">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md mt-0.5 shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      4. CRM, Database Customer & Import Excel/CSV
                    </h3>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {customers.length} Terdaftar · Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Database kontraktor BUMN, swasta, dan batching plant mitra telah aktif dengan validasi nomor WhatsApp (+62), deteksi duplikat, serta import/export Excel/CSV.
                  </p>
                  <button
                    onClick={() => onNavigateTab('customers')}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 mt-2 cursor-pointer"
                  >
                    Buka Modul Customers & Import Excel <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Operational Audit Log */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900">Audit Log Real-Time</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {auditLogs.length} Entri
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada aktivitas tercatat
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-slate-800 font-mono text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {formatTanggal(log.created_at, true)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{log.user_email}</span>
                      <span className="text-slate-300">·</span>
                      <span className="uppercase font-mono text-[10px] text-orange-600 font-semibold">
                        {log.user_role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onNavigateTab('settings')}
                className="w-full text-center text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors"
              >
                Lihat Log Lengkap di Pengaturan →
              </button>
            </div>
          </div>

          {/* Quick Specifications Info Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Spesifikasi Sistem CPMS
            </h3>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Database:</span>
                <span className="font-mono font-medium">Supabase PostgreSQL</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Keamanan:</span>
                <span className="font-mono font-medium">Row Level Security (RLS)</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Mata Uang:</span>
                <span className="font-mono font-medium">IDR (Rupiah Rp)</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Otorisasi:</span>
                <span className="font-mono font-medium">OWNER & ADMIN</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* SQL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Skema SQL Supabase PostgreSQL (Tahap 1)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Eksekusi skema ini di Supabase Dashboard → SQL Editor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-900 text-slate-200 rounded-b-none">
              <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
{`-- ==============================================================
-- CPMS INITIAL SUPABASE POSTGRESQL SCHEMA (TAHAP 1)
-- ==============================================================

-- 1. Profiles (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin', -- 'owner' | 'admin'
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Company Settings (Single-tenant company identity)
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    legal_name TEXT,
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_account_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    default_payment_terms_days INTEGER NOT NULL DEFAULT 14,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Audit Logs (Immutable operational log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;`}
              </pre>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between rounded-b-xl">
              <span className="text-xs text-slate-500">
                File tersimpan di: <code className="text-slate-700 font-mono">/src/lib/database-schema.sql</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>Salin SQL Lengkap</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
