import React, { useState } from 'react';
import { Truck, ArrowRight, Database, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStoredSupabaseConfig } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = getStoredSupabaseConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Autentikasi gagal. Periksa email atau password.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Subtle industrial background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-xl shadow-orange-950/40 mb-3 border border-orange-400/30">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            CPMS <span className="text-orange-500 font-normal">INDONESIA</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
            Concrete Pump Management System & CRM
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-8">
            <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Masuk ke Sistem</h2>
                <p className="text-xs text-slate-500">Masuk menggunakan akun resmi CPMS</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-mono font-medium rounded border border-slate-200">
                v1.0.0
              </span>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.co.id"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm text-slate-900 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kata Sandi (Password)
                  </label>
                  <span className="text-[11px] text-slate-400">Minimal 6 karakter</span>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm text-slate-900 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full mt-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-orange-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Mengautentikasi...</span>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Database Footer Status */}
          <div className="px-8 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Penyimpanan:</span>
              <span className="font-semibold text-slate-800">
                {config.isConfigured ? 'Supabase PostgreSQL' : 'Belum dikonfigurasi'}
              </span>
            </div>
            <span className={`text-[11px] font-semibold ${config.isConfigured ? 'text-emerald-600' : 'text-rose-600'}`}>{config.isConfigured ? 'Konfigurasi ada' : 'Tidak siap'}</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Sistem Terproteksi dengan Row Level Security (RLS) & Multi-Role Permissions
        </p>
      </div>
    </div>
  );
};
