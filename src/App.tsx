/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Enterprise CRM & Fleet Management for Concrete Pump Rental in Indonesia
 * Tahap 1: Inisialisasi & Fondasi Sistem (Supabase, Auth, Multi-Role, Layout)
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/Auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { Truck } from 'lucide-react';

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center animate-bounce mb-3 shadow-lg shadow-orange-950/50">
          <Truck className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold tracking-wider uppercase text-slate-300">
          CPMS INDONESIA
        </p>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          Memuat sesi operasional...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppLayout />;
};

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
