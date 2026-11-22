import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Code2,
  Copy,
  Check,
  Lock,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CompanySettings, AuditLog, Profile } from '../../types/database';
import {
  fetchCompanySettings,
  updateCompanySettings,
  fetchAuditLogs,
  fetchProfiles,
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabase';
import { formatTanggal } from '../../lib/formatters';

export const SettingsPage: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'supabase' | 'company' | 'users' | 'audit'>('company');

  // Supabase Config State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [connectionTestResult, setConnectionTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    latencyMs?: number;
    isLoading: boolean;
  }>({
    tested: false,
    success: false,
    message: '',
    isLoading: false,
  });

  // Company Settings Form State
  const [companyData, setCompanyData] = useState<CompanySettings | null>(null);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

  // Profiles & Audit Logs
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Copied SQL state
  const [copiedSql, setCopiedSql] = useState(false);

  // Load initial settings
  useEffect(() => {
    const config = getStoredSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseAnonKey(config.anonKey);

    loadCompanyData();
    loadProfiles();
    loadAuditLogs();
  }, []);

  const loadCompanyData = async () => {
    const data = await fetchCompanySettings();
    setCompanyData(data);
  };

  const loadProfiles = async () => {
    const profs = await fetchProfiles();
    setProfiles(profs);
  };

  const loadAuditLogs = async () => {
    setIsLoadingAudit(true);
    const logs = await fetchAuditLogs(50);
    setAuditLogs(logs);
    setIsLoadingAudit(false);
  };

  const handleTestConnection = async () => {
    setConnectionTestResult({
      tested: false,
      success: false,
      message: 'Sedang menghubungi Supabase PostgreSQL...',
      isLoading: true,
    });

    const result = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setConnectionTestResult({
      tested: true,
      success: result.success,
      message: result.message,
      latencyMs: result.latencyMs,
      isLoading: false,
    });
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSupabaseConfig(supabaseUrl, supabaseAnonKey);
    handleTestConnection();
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyData || !user) return;

    if (role !== 'owner') {
      setSaveErrorMessage('Hanya peran OWNER yang diizinkan mengubah identitas & rekening perusahaan.');
      return;
    }

    setIsSavingCompany(true);
    setSaveSuccessMessage('');
    setSaveErrorMessage('');

    try {
      const updated = await updateCompanySettings(companyData, user.email, role);
      setCompanyData(updated);
      setSaveSuccessMessage('Data identitas dan rekening perusahaan berhasil disimpan ke database!');
      setTimeout(() => setSaveSuccessMessage(''), 4000);
      loadAuditLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveErrorMessage(`Gagal menyimpan: ${msg}`);
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleCopySql = () => {
    const sql = `-- Skema SQL Supabase untuk Concrete Pump Management System (CPMS)
-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Company Settings
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'PT Beton Perkasa Mandiri',
    legal_name TEXT,
    phone_number TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Jakarta Timur',
    province TEXT NOT NULL DEFAULT 'DKI Jakarta',
    bank_name TEXT NOT NULL,
    bank_account_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    default_payment_terms_days INTEGER NOT NULL DEFAULT 14,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Audit Logs
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

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-600" />
            Pengaturan Sistem & Database CPMS
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi koneksi Supabase PostgreSQL, identitas perusahaan, rekening bank penagihan, dan audit log.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'company'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profil Perusahaan
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'supabase'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Database Supabase
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hak Akses & Role
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Log ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PROFIL PERUSAHAAN */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-600" />
                  Identitas Legal & Rekening Penagihan (IDR)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informasi ini dicetak pada Surat Penawaran Harga (SPH) dan Faktur/Invoice sewa pompa beton.
                </p>
              </div>

              {role !== 'owner' && (
                <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-md border border-amber-200 font-mono">
                  <Lock className="w-3.5 h-3.5" />
                  Mode Hanya Baca (Hak Akses Owner Diperlukan)
                </span>
              )}
            </div>

            {saveSuccessMessage && (
              <div className="m-6 mb-0 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            {saveErrorMessage && (
              <div className="m-6 mb-0 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveCompany} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Badan Usaha / Perusahaan
                  </label>
                  <input
                    type="text"
                    disabled={role !== 'owner'}
                    value={companyData?.company_name || ''}
                    onChange={(e) =>
                      setCompanyData((prev) => prev && { ...prev, company_name: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="PT Beton Perkasa Mandiri"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Pokok Wajib Pajak (NPWP Perusahaan)
                  </label>
                  <input
                    type="text"
                    disabled={role !== 'owner'}
                    value={companyData?.tax_id || ''}
                    onChange={(e) =>
                      setCompanyData((prev) => prev && { ...prev, tax_id: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="01.889.771.2-031.000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp Resmi (Meta WhatsApp Gateway)
                  </label>
                  <input
                    type="text"
                    disabled={role !== 'owner'}
                    value={companyData?.whatsapp_number || ''}
                    onChange={(e) =>
                      setCompanyData((prev) => prev && { ...prev, whatsapp_number: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="+62 812-9876-5432"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Digunakan untuk kirim jadwal cor otomatis dan SPH ke mandor/kontraktor.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Operasional & Penagihan
                  </label>
                  <input
                    type="email"
                    disabled={role !== 'owner'}
                    value={companyData?.email || ''}
                    onChange={(e) =>
                      setCompanyData((prev) => prev && { ...prev, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="operasional@cpms-beton.co.id"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Pool Armada / Bengkel Concrete Pump
                  </label>
                  <textarea
                    rows={2}
                    disabled={role !== 'owner'}
                    value={companyData?.address || ''}
                    onChange={(e) =>
                      setCompanyData((prev) => prev && { ...prev, address: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Kawasan Pergudangan Armada No. 88, Jl. Raya Industri Cakung, Jakarta Timur"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kota / Wilayah Operasi
                  </label>
                  <input
                    type="text"
                    disabled={role !== 'owner'}
                    value={companyData?.city || ''}
                    onChange={(e) =>
                      setCompanyData((prev) => prev && { ...prev, city: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Jakarta Timur / Jabodetabek"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jangka Waktu Pembayaran Standar (Term of Payment)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      disabled={role !== 'owner'}
                      value={companyData?.default_payment_terms_days ?? 14}
                      onChange={(e) =>
                        setCompanyData(
                          (prev) => prev && { ...prev, default_payment_terms_days: parseInt(e.target.value) || 0 }
                        )
                      }
                      className="w-28 px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <span className="text-xs text-slate-500">Hari setelah pengecoran selesai</span>
                  </div>
                </div>
              </div>

              {/* Bank Account Section */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-orange-600">
                  Rekening Bank Penagihan Sewa (Mata Uang IDR)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      disabled={role !== 'owner'}
                      value={companyData?.bank_name || ''}
                      onChange={(e) =>
                        setCompanyData((prev) => prev && { ...prev, bank_name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-100"
                      placeholder="Bank Central Asia (BCA)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      disabled={role !== 'owner'}
                      value={companyData?.bank_account_number || ''}
                      onChange={(e) =>
                        setCompanyData((prev) => prev && { ...prev, bank_account_number: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-100"
                      placeholder="8820 1928 31"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Atas Nama (A/N)
                    </label>
                    <input
                      type="text"
                      disabled={role !== 'owner'}
                      value={companyData?.bank_account_name || ''}
                      onChange={(e) =>
                        setCompanyData((prev) => prev && { ...prev, bank_account_name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-100"
                      placeholder="PT BETON PERKASA MANDIRI"
                    />
                  </div>
                </div>
              </div>

              {role === 'owner' ? (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingCompany}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingCompany ? 'Menyimpan...' : 'Simpan Profil Perusahaan'}</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-right">
                  Beralih ke peran OWNER untuk mengubah pengaturan ini.
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SUPABASE POSTGRESQL */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  Koneksi Supabase PostgreSQL & Auth
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hubungkan URL project dan public anon key Supabase Anda untuk penyimpanan data multi-perangkat.
                </p>
              </div>
              <button
                onClick={handleCopySql}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Tersalin' : 'Salin DDL SQL'}</span>
              </button>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Dapat ditemukan di Supabase Dashboard → Project Settings → API → Project URL.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supabase Anon / Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Key ini aman digunakan di sisi client dengan perlindungan Row Level Security (RLS).
                </p>
              </div>

              {/* Status message */}
              {connectionTestResult.message && (
                <div
                  className={`p-3 rounded-lg flex items-start gap-2.5 text-xs ${
                    connectionTestResult.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                  }`}
                >
                  {connectionTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{connectionTestResult.message}</p>
                    {connectionTestResult.latencyMs && (
                      <p className="text-[11px] text-emerald-600 mt-0.5 font-mono">
                        Latensi respons: {connectionTestResult.latencyMs} ms
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Simpan Konfigurasi Supabase
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={connectionTestResult.isLoading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${connectionTestResult.isLoading ? 'animate-spin' : ''}`} />
                  <span>Uji Koneksi Supabase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: USER ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  Struktur Peran Pengguna (OWNER & ADMIN)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proteksi bertingkat untuk menjaga integritas data keuangan dan privilese manajemen sewa.
                </p>
              </div>

              <div className="text-xs text-slate-500">Peran akun ditetapkan oleh owner di database.</div>
            </div>

            {/* Matrix of Privileges */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2.5 px-4 font-bold">Modul / Fungsionalitas</th>
                    <th className="py-2.5 px-4 font-bold text-center">Peran OWNER</th>
                    <th className="py-2.5 px-4 font-bold text-center">Peran ADMIN</th>
                    <th className="py-2.5 px-4 font-bold">Kebijakan Keamanan RLS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Dashboard Operasional & Ringkasan
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Lengkap</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Lengkap</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      Akses Baca Umum
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Fleet, Scheduling, Bookings, Operators, Projects
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Hak Penuh</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Hak Penuh</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      Operasional Bebas Dikelola Admin
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      Customers, Leads, Quotations (SPH), Invoices
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Hak Penuh</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Buat & Kelola</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      Otorisasi Penagihan Klien
                    </td>
                  </tr>
                  <tr className="bg-orange-50/30">
                    <td className="py-3 px-4 font-semibold text-orange-950">
                      Keuangan (Finance), Margin Sewa & Kasbon Kru
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Hak Penuh</td>
                    <td className="py-3 px-4 text-center text-rose-500 font-bold">Dibatasi</td>
                    <td className="py-3 px-4 text-orange-700 font-mono text-[11px]">
                      Hanya OWNER yang Diizinkan (RLS)
                    </td>
                  </tr>
                  <tr className="bg-orange-50/30">
                    <td className="py-3 px-4 font-semibold text-orange-950">
                      Ubah Rekening Bank Perusahaan & Pengaturan Legal
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">Hak Penuh</td>
                    <td className="py-3 px-4 text-center text-rose-500 font-bold">Hanya Baca</td>
                    <td className="py-3 px-4 text-orange-700 font-mono text-[11px]">
                      Hanya OWNER yang Diizinkan (RLS)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Active Profiles List */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Daftar Akun Terdaftar (Tabel `profiles`)
              </h3>
              <div className="space-y-2">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border border-slate-200 flex items-center justify-between bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                        {p.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.full_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{p.email}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                        p.role === 'owner'
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {p.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-700" />
                  Jejak Audit Aktivitas Sistem (Immutable Audit Logs)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap login, logout, pergantian role, dan perubahan konfigurasi dicatat secara permanen untuk kepatuhan operasional.
                </p>
              </div>
              <button
                onClick={loadAuditLogs}
                disabled={isLoadingAudit}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                <span>Segarkan Log</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Waktu (WIB)</th>
                    <th className="py-2.5 px-3">Aksi (Action)</th>
                    <th className="py-2.5 px-3">Pengguna & Peran</th>
                    <th className="py-2.5 px-3">Entitas</th>
                    <th className="py-2.5 px-3">Rincian Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                        Belum ada jejak audit
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap tabular-nums">
                          {formatTanggal(log.created_at, true)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-slate-800">{log.user_email}</span>{' '}
                          <span className="text-orange-600 font-bold text-[10px]">({log.user_role})</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{log.entity_type}</td>
                        <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
