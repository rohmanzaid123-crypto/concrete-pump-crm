import React, { ReactNode } from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/database';

interface RoleGuardProps {
  requiredRole: UserRole;
  children: ReactNode;
  fallbackTitle?: string;
  onNavigateHome?: () => void;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  requiredRole,
  children,
  fallbackTitle = 'Akses Terbatas (Privilese Owner)',
  onNavigateHome,
}) => {
  const { role } = useAuth();

  // If role requirement is met (Owner has access to both owner & admin, admin only has admin)
  const hasAccess = requiredRole === 'admin' ? true : role === 'owner';

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[500px] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{fallbackTitle}</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Akun Anda saat ini memiliki peran <strong className="text-slate-800 uppercase font-mono">{role}</strong>.
          Modul ini memuat data finansial sensitif dan otorisasi strategis yang hanya dapat diakses oleh akun berkredensial{' '}
          <strong className="text-orange-600 uppercase font-mono">OWNER</strong>.
        </p>

        {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard
            </button>
          )}
      </div>
    </div>
  );
};
