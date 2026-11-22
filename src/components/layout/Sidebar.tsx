import React from 'react';
import {
  Truck,
  LogOut,
  Shield,
  Layers,
  Lock,
} from 'lucide-react';
import { NAVIGATION_ITEMS } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/database';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { user, role, logout } = useAuth();

  const categories = [
    { key: 'core', label: 'Ringkasan Utama' },
    { key: 'operations', label: 'Operasional Lapangan' },
    { key: 'commercial', label: 'Komersial & Billing' },
    { key: 'intelligence', label: 'Konektivitas & AI' },
    { key: 'system', label: 'Sistem' },
  ];

  return (
    <aside className="w-64 bg-[#0A192F] text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#071322] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-900/30">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-white tracking-wider">CPMS</span>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 font-semibold px-1.5 py-0.5 rounded border border-orange-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">
              Concrete Pump Fleet
            </p>
          </div>
        </div>
      </div>

      {/* Identity and verified role */}
      <div className="px-3 py-2.5 bg-[#0e213d] border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400 font-medium">Role Aktif:</span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
              role === 'owner'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}
          >
            {role}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {categories.map((cat) => {
          const items = NAVIGATION_ITEMS.filter((item) => item.category === cat.key);
          if (items.length === 0) return null;

          return (
            <div key={cat.key} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {cat.label}
              </div>
              {items.map((item) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;
                const isOwnerOnly = item.requiredRole === 'owner';
                const isLocked = isOwnerOnly && role !== 'owner';

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-orange-600 text-white font-semibold shadow-sm shadow-orange-950/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : isLocked
                            ? 'text-slate-500 group-hover:text-slate-400'
                            : 'text-slate-400 group-hover:text-orange-400'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {isLocked ? (
                      <span
                        title="Modul ini memerlukan akses OWNER"
                        className="flex items-center gap-0.5 text-[9px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 font-mono"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        OWNER
                      </span>
                    ) : item.id === 'fleet' ? (
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono group-hover:bg-slate-700">
                        20+ Unit
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Footer Panel */}
      <div className="p-3 border-t border-slate-800 bg-[#071322]">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-slate-600 shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.full_name || 'Petugas CPMS'}
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-tight font-mono">
                {user?.email || 'user@cpms.id'}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Keluar / Logout"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
