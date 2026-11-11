import React, { useState, useEffect } from 'react';
import {
  Database,
  ChevronRight,
  Shield,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NAVIGATION_ITEMS } from '../../config/navigation';
import { getStoredSupabaseConfig, testSupabaseConnection } from '../../lib/supabase';

interface HeaderProps {
  currentTab: string;
  onNavigateToSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onNavigateToSettings }) => {
  const { user, role, switchRole } = useAuth();
  const [supabaseStatus, setSupabaseStatus] = useState<{
    tested: boolean;
    online: boolean;
    message: string;
    isTesting: boolean;
  }>({
    tested: false,
    online: false,
    message: '',
    isTesting: false,
  });

  const activeNav = NAVIGATION_ITEMS.find((n) => n.id === currentTab);
  const config = getStoredSupabaseConfig();

  const handleTestConnection = async () => {
    setSupabaseStatus((prev) => ({ ...prev, isTesting: true }));
    const result = await testSupabaseConnection();
    setSupabaseStatus({
      tested: true,
      online: result.success,
      message: result.message,
      isTesting: false,
    });
  };

  useEffect(() => {
    // Initial silent check
    if (config.isConfigured) {
      handleTestConnection();
    } else {
      setSupabaseStatus({
        tested: true,
        online: false,
        message: 'Mode Lokal Terproteksi (Supabase belum dihubungkan)',
        isTesting: false,
      });
    }
  }, [config.isConfigured, config.url]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-xs">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500 uppercase tracking-wider">CPMS</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-900 text-sm">
          {activeNav?.name || 'Dashboard'}
        </span>
        <span className="hidden lg:inline text-slate-300">|</span>
        <span className="hidden lg:inline text-xs text-slate-500 font-medium">
          {activeNav?.label}
        </span>
      </div>

      {/* Right: Actions, Database Status & Role */}
      <div className="flex items-center gap-3">
        {/* Currency Marker */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-600 font-mono border border-slate-200">
          <span>IDR</span>
          <span className="text-slate-400">·</span>
          <span>Rupiah (Rp)</span>
        </div>

        {/* Supabase Status Pill */}
        <div className="flex items-center">
          <button
            onClick={onNavigateToSettings}
            title={supabaseStatus.message || 'Konfigurasi Supabase PostgreSQL'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border transition-colors ${
              config.isConfigured && supabaseStatus.online
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {config.isConfigured && supabaseStatus.online ? 'Supabase PostgreSQL' : 'Database: Mode Siap'}
            </span>
            {config.isConfigured && supabaseStatus.online ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1 rounded font-mono">
                {config.isConfigured ? 'Cek' : 'Lokal/Setup'}
              </span>
            )}
          </button>
        </div>

        {/* Role Indicator & Quick Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
          <div
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono uppercase flex items-center gap-1.5 ${
              role === 'owner'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-800 text-white shadow-xs'
            }`}
          >
            <Shield className="w-3 h-3" />
            {role}
          </div>
          <button
            onClick={() => switchRole(role === 'owner' ? 'admin' : 'owner')}
            title={`Saat ini role ${role}. Klik untuk beralih ke ${role === 'owner' ? 'admin' : 'owner'}`}
            className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
