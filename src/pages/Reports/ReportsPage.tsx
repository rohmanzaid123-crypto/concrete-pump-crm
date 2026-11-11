/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Tahap 8: Business Intelligence (BI) & Owner Executive Reports
 * Dashboard: Omzet, Pembayaran Masuk, Piutang, Biaya, Laba, Bookings, AOV, Cancellation, Produktivitas Unit, Customer Baru vs Berulang
 * Analisis: Performa Unit, Revenue per Jenis Pompa, Profitabilitas & Biaya Unit, Top Kontraktor, Customer Tidak Aktif, Tren Bulanan, Kinerja CS & Admin
 * Filter: Tanggal, Bulan, Tahun, Unit Pompa, Customer, Admin
 * Export: Excel Multi-Sheet & Printable PDF Dokumen Resmi
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Calendar,
  Layers,
  Truck,
  Users,
  ShieldCheck,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Activity,
  Headphones,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  MessageSquare,
  Search,
  Filter,
  UserCheck,
  Building2,
  PieChart,
} from 'lucide-react';
import {
  AdminPerformanceItem,
  BIFilters,
  CustomerAnalyticsItem,
  CustomerServiceAnalytics,
  ExecutiveBIDashboard,
  MonthlyTrendItem,
  PumpCategoryRevenue,
  UnitProfitability,
  AccountsReceivableAging,
} from '../../types/database';
import { formatRupiah, formatNumber, formatTanggal } from '../../lib/formatters';
import {
  calculateExecutiveBIDashboard,
  calculatePumpCategoryRevenues,
  calculateMonthlyTrends,
  calculateCustomerAnalytics,
  calculateAdminPerformance,
  calculateCustomerServiceAnalytics,
  exportExecutiveBIToExcel,
} from '../../lib/bi-store';
import {
  calculateProfitLossStatement,
  calculateCashFlowStatement,
  calculateUnitProfitability,
  calculateAgingPiutang,
  ProfitLossStatement,
  CashFlowStatement,
} from '../../lib/finance-store';
import { fetchFleetUnits } from '../../lib/fleet-store';
import { fetchCustomers } from '../../lib/customer-store';
import { generateWhatsAppUrl } from '../../lib/whatsapp';

type BITab = 'dashboard' | 'units' | 'customers' | 'cs_admin' | 'accounting';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BITab>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [filters, setFilters] = useState<BIFilters>({
    periodType: 'month',
    month: '2026-03',
    year: 2026,
    unitId: 'all',
    customerId: 'all',
    adminEmail: 'all',
  });

  // Master Data for Selectors
  const [fleetList, setFleetList] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [customerList, setCustomerList] = useState<Array<{ id: string; name: string }>>([]);

  // BI Data State
  const [dashboardData, setDashboardData] = useState<ExecutiveBIDashboard | null>(null);
  const [categoryRevenues, setCategoryRevenues] = useState<PumpCategoryRevenue[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendItem[]>([]);
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalyticsItem[]>([]);
  const [adminPerf, setAdminPerf] = useState<AdminPerformanceItem[]>([]);
  const [csAnalytics, setCsAnalytics] = useState<CustomerServiceAnalytics | null>(null);
  const [unitReports, setUnitReports] = useState<UnitProfitability[]>([]);

  // Accounting Statements
  const [pnlReport, setPnlReport] = useState<ProfitLossStatement | null>(null);
  const [cashFlowReport, setCashFlowReport] = useState<CashFlowStatement | null>(null);
  const [arReports, setArReports] = useState<AccountsReceivableAging[]>([]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [
        dash,
        catRev,
        trends,
        custs,
        admins,
        cs,
        unitsProf,
        pnl,
        cf,
        ar,
        fleets,
        allCusts,
      ] = await Promise.all([
        calculateExecutiveBIDashboard(filters),
        calculatePumpCategoryRevenues(),
        calculateMonthlyTrends(),
        calculateCustomerAnalytics(),
        calculateAdminPerformance(),
        calculateCustomerServiceAnalytics(),
        calculateUnitProfitability(),
        calculateProfitLossStatement(),
        calculateCashFlowStatement(),
        calculateAgingPiutang(),
        fetchFleetUnits(),
        fetchCustomers(),
      ]);

      setDashboardData(dash);
      setCategoryRevenues(catRev);
      setMonthlyTrends(trends);
      setCustomerAnalytics(custs);
      setAdminPerf(admins);
      setCsAnalytics(cs);
      setUnitReports(unitsProf);
      setPnlReport(pnl);
      setCashFlowReport(cf);
      setArReports(ar);

      setFleetList(fleets.map((u) => ({ id: u.id, code: u.unit_code, name: u.name })));
      setCustomerList(allCusts.map((c) => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.error('Failed to load BI reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [filters.month, filters.periodType, filters.unitId, filters.customerId, filters.adminEmail]);

  // Filtered Unit Profitability
  const filteredUnitReports = useMemo(() => {
    if (filters.unitId === 'all') return unitReports;
    return unitReports.filter((u) => u.unit_id === filters.unitId || u.unit_code === filters.unitId);
  }, [unitReports, filters.unitId]);

  // Filtered Customer Analytics
  const filteredCustomers = useMemo(() => {
    if (filters.customerId === 'all') return customerAnalytics;
    return customerAnalytics.filter((c) => c.customer_id === filters.customerId);
  }, [customerAnalytics, filters.customerId]);

  const handleExportExcel = () => {
    if (!dashboardData || !csAnalytics) return;
    exportExecutiveBIToExcel({
      dashboard: dashboardData,
      categoryRevenues,
      unitReports,
      topCustomers: customerAnalytics,
      adminPerf,
      csAnalytics,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & EXPORT ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Business Intelligence & Laporan Owner
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Audit Riil 22 Unit
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Konsolidasi performa komersial, biaya per unit, retensi pelanggan, konversi funnel CS, dan pembukuan resmi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel Lengkap</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            <span>Cetak Dokumen Resmi</span>
          </button>

          <button
            onClick={loadAllData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Seluruh Data BI"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPREHENSIVE MULTI-FILTER BAR */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-orange-600" />
            <span>Filter Parameter Analisis Eksekutif</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Periode Aktif: {dashboardData?.period_label || 'Maret 2026'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
          {/* Period Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Rentang Waktu</label>
            <select
              value={filters.periodType}
              onChange={(e) => setFilters({ ...filters, periodType: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-orange-500"
            >
              <option value="month">Bulanan (Bulan Ini)</option>
              <option value="quarter">Kuartal (Q1 2026)</option>
              <option value="year">Tahunan (Tahun 2026)</option>
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan</label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Unit Pump Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Unit Pompa Beton</label>
            <select
              value={filters.unitId}
              onChange={(e) => setFilters({ ...filters, unitId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">Semua Armada (22 Unit)</option>
              {fleetList.map((u) => (
                <option key={u.id} value={u.code}>
                  {u.code} - {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mitra Kontraktor</label>
            <select
              value={filters.customerId}
              onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">Semua Kontraktor</option>
              {customerList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Admin Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Petugas Admin</label>
            <select
              value={filters.adminEmail}
              onChange={(e) => setFilters({ ...filters, adminEmail: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-orange-500"
            >
              <option value="all">Semua Petugas (Dispatcher)</option>
              <option value="siti.rahmawati@cpms.id">Siti Rahmawati (Admin)</option>
              <option value="owner@cpms-indonesia.com">Ir. H. Sudirman (Owner)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. NAVIGATION SUB-TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center bg-slate-200/60 p-1 rounded-2xl text-xs font-bold max-w-3xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-orange-400" />
          <span>Dashboard KPI Owner</span>
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'units' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-blue-400" />
          <span>Performa & Biaya Unit</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'customers' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>Analisis Pelanggan</span>
        </button>

        <button
          onClick={() => setActiveTab('cs_admin')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'cs_admin' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Headphones className="w-3.5 h-3.5 text-purple-400" />
          <span>Kinerja CS & Admin</span>
        </button>

        <button
          onClick={() => setActiveTab('accounting')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'accounting' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span>Laporan Akuntansi (P&L)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE BI DASHBOARD (11 KEY OWNER KPIS & TRENDS) */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && dashboardData && (
        <div className="space-y-6">
          {/* 11 KPI Scorecard Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* 1. Total Omzet */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Omzet</span>
              <p className="text-lg font-black text-slate-900 font-mono mt-1">
                {formatRupiah(dashboardData.total_omzet)}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Faktur Terbit</span>
            </div>

            {/* 2. Pendapatan Diterima */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Kas Diterima</span>
              <p className="text-lg font-black text-emerald-600 font-mono mt-1">
                {formatRupiah(dashboardData.pendapatan_diterima)}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">DP & Pelunasan Bank</span>
            </div>

            {/* 3. Piutang */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Piutang Berjalan</span>
              <p className="text-lg font-black text-amber-700 font-mono mt-1">
                {formatRupiah(dashboardData.piutang_berjalan)}
              </p>
              <span className="text-[10px] text-amber-800 font-bold block mt-0.5">Outstanding AR</span>
            </div>

            {/* 4. Total Biaya */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Biaya</span>
              <p className="text-lg font-black text-red-600 font-mono mt-1">
                {formatRupiah(dashboardData.total_biaya_operasional)}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Solar, Kru, Servis</span>
            </div>

            {/* 5. Laba Bersih */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Laba Bersih</span>
              <p className="text-lg font-black text-blue-600 font-mono mt-1">
                {formatRupiah(dashboardData.laba_bersih)}
              </p>
              <span className="text-[10px] text-blue-700 font-bold block mt-0.5">
                Margin {dashboardData.net_margin_percentage}%
              </span>
            </div>

            {/* 6. Jumlah Booking */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Jumlah Booking</span>
              <p className="text-lg font-black text-slate-900 font-mono mt-1">
                {dashboardData.total_bookings} Job
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {dashboardData.completed_bookings} Selesai Cor
              </span>
            </div>

            {/* 7. Rata-Rata Nilai Booking */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Rata-Rata Order</span>
              <p className="text-lg font-black text-slate-900 font-mono mt-1">
                {formatRupiah(dashboardData.average_booking_value)}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">AOV per Pekerjaan</span>
            </div>

            {/* 8. Tingkat Pembatalan */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Pembatalan</span>
              <p className="text-lg font-black text-slate-800 font-mono mt-1">
                {dashboardData.cancellation_rate_percentage}%
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {dashboardData.cancelled_bookings} job batal
              </span>
            </div>

            {/* 9. Produktivitas Unit */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Produktivitas Unit</span>
              <p className="text-lg font-black text-slate-900 font-mono mt-1">
                {dashboardData.productivity_m3_per_unit} m³
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Rata-rata / Unit Armada</span>
            </div>

            {/* 10. Customer Baru */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Customer Baru</span>
              <p className="text-lg font-black text-slate-900 font-mono mt-1">
                {dashboardData.customer_baru_count} Akun
              </p>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Prospek Terkonversi</span>
            </div>

            {/* 11. Customer Berulang (Repeat Order) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Loyalitas Customer (Repeat)</span>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-lg font-black text-slate-900 font-mono">
                  {dashboardData.customer_berulang_count} Kontraktor
                </p>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                  {dashboardData.repeat_customer_rate_percentage}% Repeat Order
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Kontraktor memesan lebih dari 1 kali (Waskita, Total, Adhi Karya)
              </span>
            </div>
          </div>

          {/* Visual Charts & Trend Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Bulanan (Jan, Feb, Mar 2026) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Tren Pendapatan & Laba Bulanan (Q1 2026)</h3>
                  <p className="text-xs text-slate-500">Perkembangan omzet, biaya operasional, dan laba bersih</p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="space-y-4">
                {monthlyTrends.map((t) => {
                  const maxRevenue = 65000000;
                  const revPct = Math.round((t.revenue / maxRevenue) * 100);
                  const expPct = Math.round((t.expenses / maxRevenue) * 100);
                  const netPct = Math.round((t.net_profit / maxRevenue) * 100);

                  return (
                    <div key={t.month_key} className="space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between font-bold text-slate-800 font-sans">
                        <span>{t.month_label} ({t.bookings_count} Bookings / {t.volume_m3} m³)</span>
                        <span>{formatRupiah(t.revenue)}</span>
                      </div>

                      {/* Stacked Visual Bar */}
                      <div className="h-5 bg-slate-100 rounded-lg overflow-hidden flex items-center p-0.5 gap-1">
                        <div
                          style={{ width: `${revPct}%` }}
                          className="h-full bg-slate-900 rounded text-[9px] text-white flex items-center justify-center font-bold"
                          title={`Omzet: ${formatRupiah(t.revenue)}`}
                        >
                          Omzet
                        </div>
                        <div
                          style={{ width: `${netPct}%` }}
                          className="h-full bg-emerald-500 rounded text-[9px] text-white flex items-center justify-center font-bold"
                          title={`Laba: ${formatRupiah(t.net_profit)}`}
                        >
                          Laba
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Biaya Operasional: {formatRupiah(t.expenses)}</span>
                        <span className="text-emerald-700 font-bold">Laba: {formatRupiah(t.net_profit)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pendapatan per Jenis Pompa */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Komposisi Pendapatan per Kategori Pompa</h3>
                  <p className="text-xs text-slate-500">Distribusi omzet berdasarkan jenis boom dan sistem pipa</p>
                </div>
                <PieChart className="w-4 h-4 text-orange-600" />
              </div>

              <div className="space-y-3">
                {categoryRevenues.map((cat) => (
                  <div key={cat.category_code} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{cat.category_name} ({cat.total_jobs} kali cor • {cat.volume_m3} m³)</span>
                      <span className="font-bold font-mono">{formatRupiah(cat.revenue)} ({cat.percentage_of_total}%)</span>
                    </div>

                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${cat.percentage_of_total}%` }}
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ANALISIS ARMADA & PROFITABILITAS PER UNIT */}
      {/* ========================================================================= */}
      {activeTab === 'units' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Analisis Kinerja, Biaya & Profitabilitas 22 Unit Pompa
              </h3>
              <p className="text-xs text-slate-500">
                Omzet unit dikurangi beban langsung solar, uang jalan operator, tol, dan servis pemeliharaan
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-slate-700 bg-white px-3 py-1 rounded border border-slate-200">
              Menampilkan {filteredUnitReports.length} Unit
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Kode Unit & Tipe</th>
                  <th className="px-5 py-3.5 text-center">Frekuensi</th>
                  <th className="px-5 py-3.5 text-center">Volume (m³)</th>
                  <th className="px-5 py-3.5 text-right">Pendapatan Kotor</th>
                  <th className="px-5 py-3.5 text-right">Biaya Solar & Operasional</th>
                  <th className="px-5 py-3.5 text-right">Laba Bersih Unit</th>
                  <th className="px-5 py-3.5 text-center">Margin Laba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredUnitReports.map((u) => {
                  const isProfitable = u.net_profit >= 0;
                  return (
                    <tr key={u.unit_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-sans">
                        <span className="font-bold text-slate-900 font-mono">{u.unit_code}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          {u.boom_length > 0 ? `${u.boom_length}m` : 'Stationary'} ({u.category_name})
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center font-bold">{u.total_pours}x</td>

                      <td className="px-5 py-3.5 text-center text-slate-700 font-bold">
                        {formatNumber(u.total_volume_m3)} m³
                      </td>

                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                        {formatRupiah(u.total_revenue)}
                      </td>

                      <td className="px-5 py-3.5 text-right text-red-600 font-semibold">
                        {formatRupiah(u.total_expenses)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-black">
                        <span className={isProfitable ? 'text-emerald-700' : 'text-red-700'}>
                          {formatRupiah(u.net_profit)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.margin_percentage >= 50
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.margin_percentage > 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {u.margin_percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ANALISIS PELANGGAN (TOP TRANSAKSI & INACTIVE CUSTOMERS) */}
      {/* ========================================================================= */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {/* Top Customers & Dormant Warning */}
          <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl text-xs text-amber-950 flex items-start justify-between gap-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Pemantauan Pelanggan Tidak Aktif (&gt;60 Hari)</p>
                <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                  Pelanggan yang tidak melakukan repeat order sewa pompa selama lebih dari 60 hari ditandai sebagai dorman.
                  Gunakan tombol WhatsApp di kolom aksi untuk segera mengirim penawaran diskon sewa atau jadwal survei proyek baru.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-200 text-amber-900 font-bold rounded font-mono shrink-0">
              {filteredCustomers.filter((c) => c.is_inactive).length} Akun Dorman
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Peringkat Transaksi & Status Keaktifan Kontraktor
              </h3>
              <span className="text-xs font-bold font-mono text-slate-600">
                Total {filteredCustomers.length} Pelanggan Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Kontraktor / Perusahaan</th>
                    <th className="px-5 py-3.5">Segmentasi</th>
                    <th className="px-5 py-3.5 text-center">Booking</th>
                    <th className="px-5 py-3.5 text-right">Total Transaksi</th>
                    <th className="px-5 py-3.5 text-right">Sisa Piutang</th>
                    <th className="px-5 py-3.5 text-center">Status Keaktifan</th>
                    <th className="px-5 py-3.5 text-center">Aksi Follow-Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredCustomers.map((c, idx) => (
                    <tr key={c.customer_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center font-mono shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900">{c.customer_name}</span>
                            <span className="text-[11px] text-slate-500 block">{c.company_name}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-sans font-bold uppercase text-[10px] text-slate-600">
                        {c.segment}
                      </td>

                      <td className="px-5 py-3.5 text-center font-bold">{c.booking_count}x</td>

                      <td className="px-5 py-3.5 text-right font-black text-slate-900">
                        {formatRupiah(c.total_transactions)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-semibold text-amber-700">
                        {c.outstanding_receivables > 0 ? formatRupiah(c.outstanding_receivables) : '-'}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        {c.is_inactive ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Tidak Aktif ({c.days_inactive} Hari)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Aktif ({c.days_inactive} Hari Lalu)
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center font-sans">
                        <a
                          href={generateWhatsAppUrl(
                            c.whatsapp_number,
                            `Halo Bapak/Ibu ${c.customer_name}, kami dari PT Beton Perkasa Mandiri (CPMS). Ingin menanyakan apakah ada rencana pengecoran baru untuk proyek Anda minggu ini? Kami siap alokasikan armada concrete pump terbaik.`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>Chat WA</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: KINERJA CUSTOMER SERVICE & ADMIN CONVERSION FUNNEL */}
      {/* ========================================================================= */}
      {activeTab === 'cs_admin' && csAnalytics && (
        <div className="space-y-6">
          {/* Customer Service Funnel Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Jumlah Chat</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">{csAnalytics.total_chats}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Pesan Masuk WA</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Waktu Respons</span>
              <p className="text-xl font-black text-emerald-600 font-mono mt-1">
                {csAnalytics.avg_response_time_minutes} mnt
              </p>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Sangat Cepat</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Follow-Up</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">{csAnalytics.total_followups}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Kontak Dihubungi</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Quotation (SPH)</span>
              <p className="text-xl font-black text-orange-600 font-mono mt-1">{csAnalytics.total_quotations}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Penawaran Resmi</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Booking Gol</span>
              <p className="text-xl font-black text-blue-600 font-mono mt-1">
                {csAnalytics.total_successful_bookings}
              </p>
              <span className="text-[10px] text-blue-700 font-bold block mt-0.5">Jadwal Terkunci</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Conversion Rate</span>
              <p className="text-xl font-black text-purple-600 font-mono mt-1">
                {csAnalytics.overall_conversion_rate}%
              </p>
              <span className="text-[10px] text-purple-700 font-bold block mt-0.5">SPH ke Booking</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Chat Pending</span>
              <p className="text-xl font-black text-amber-600 font-mono mt-1">
                {csAnalytics.unreplied_chats_count}
              </p>
              <span className="text-[10px] text-amber-800 font-bold block mt-0.5">Belum Dibalas</span>
            </div>
          </div>

          {/* Admin Performance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Evaluasi Kinerja Petugas Admin & Penutupan Penjualan
              </h3>
              <span className="text-xs font-bold font-mono text-slate-500">Maret 2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Nama Petugas</th>
                    <th className="px-5 py-3.5">Peran / Jabatan</th>
                    <th className="px-5 py-3.5 text-center">Chat Masuk</th>
                    <th className="px-5 py-3.5 text-center">Follow-Up</th>
                    <th className="px-5 py-3.5 text-center">SPH Terbit</th>
                    <th className="px-5 py-3.5 text-center">Booking Gol</th>
                    <th className="px-5 py-3.5 text-right">Nilai Transaksi Ditutup</th>
                    <th className="px-5 py-3.5 text-center">Rasio Konversi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {adminPerf.map((adm) => (
                    <tr key={adm.admin_email} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-sans">
                        <div className="font-bold text-slate-900">{adm.admin_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{adm.admin_email}</div>
                      </td>

                      <td className="px-5 py-3.5 font-sans font-semibold text-slate-700">{adm.role}</td>

                      <td className="px-5 py-3.5 text-center font-bold text-slate-800">{adm.chats_handled}</td>

                      <td className="px-5 py-3.5 text-center font-bold text-slate-800">{adm.followups_count}</td>

                      <td className="px-5 py-3.5 text-center font-bold text-orange-600">
                        {adm.quotations_generated}
                      </td>

                      <td className="px-5 py-3.5 text-center font-black text-emerald-700">
                        {adm.bookings_closed}
                      </td>

                      <td className="px-5 py-3.5 text-right font-black text-slate-900">
                        {formatRupiah(adm.total_revenue_closed)}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          {adm.conversion_rate_percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LAPORAN AKUNTANSI RESMI (P&L, CASH FLOW & AR AGING) */}
      {/* ========================================================================= */}
      {activeTab === 'accounting' && pnlReport && cashFlowReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Omzet Bruto (P&L)</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">
                {formatRupiah(pnlReport.gross_revenue)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Total tagihan paket sewa & extra m³</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Laba Bersih Operasional</span>
              <p className="text-xl font-black text-blue-600 font-mono mt-1">
                {formatRupiah(pnlReport.net_operating_profit)}
              </p>
              <p className="text-[11px] text-blue-700 font-bold mt-1">
                Net Margin: {pnlReport.net_margin_pct}%
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase">Surplus Arus Kas Likuid</span>
              <p className="text-xl font-black text-emerald-600 font-mono mt-1">
                {formatRupiah(cashFlowReport.net_cash_flow)}
              </p>
              <p className="text-[11px] text-emerald-700 font-bold mt-1">Kas Masuk &gt; Beban Keluar</p>
            </div>
          </div>

          {/* Printable Official P&L Statement */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 max-w-4xl mx-auto">
            <div className="border-b border-slate-200 pb-4 mb-4 text-center">
              <h2 className="text-base font-black uppercase text-slate-900 tracking-wider">
                PT BETON PERKASA MANDIRI
              </h2>
              <h3 className="text-sm font-bold text-orange-600">
                LAPORAN LABA RUGI OPERASIONAL (STATEMENT OF PROFIT OR LOSS)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Periode: {pnlReport.period_label}</p>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <div className="font-bold font-sans text-slate-900 text-sm border-b border-slate-300 pb-1 mb-2 uppercase">
                  I. PENDAPATAN OPERASIONAL SEWA POMPA
                </div>
                <div className="space-y-1.5 pl-4">
                  <div className="flex justify-between text-slate-700">
                    <span>Pendapatan Paket Standar 8 Jam / 50 m³:</span>
                    <span>{formatRupiah(pnlReport.revenue_rental_packages)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Pendapatan Kelebihan Volume Cor (Extra m³):</span>
                    <span>{formatRupiah(pnlReport.revenue_extra_volume)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Pendapatan Biaya Mobilisasi Armada:</span>
                    <span>{formatRupiah(pnlReport.revenue_mobilization)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                    <span className="font-sans">TOTAL PENDAPATAN BERSIH:</span>
                    <span className="text-sm font-black">{formatRupiah(pnlReport.gross_revenue)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="font-bold font-sans text-slate-900 text-sm border-b border-slate-300 pb-1 mb-2 uppercase text-red-900">
                  II. BIAYA OPERASIONAL LANGSUNG & PEMELIHARAAN
                </div>
                <div className="space-y-1.5 pl-4 text-slate-700">
                  <div className="flex justify-between">
                    <span>BBM Solar Industri Pompa & Truk:</span>
                    <span className="text-red-700">{formatRupiah(pnlReport.cogs_fuel_bbm)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uang Jalan & Makan Operator Boom & Driver:</span>
                    <span className="text-red-700">{formatRupiah(pnlReport.cogs_operator_road_allowance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Servis Berkala & Sparepart Hidrolik Bengkel:</span>
                    <span className="text-orange-800">{formatRupiah(pnlReport.opex_maintenance)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                    <span className="font-sans">TOTAL BEBAN OPERASIONAL:</span>
                    <span className="text-red-700 font-bold">
                      {formatRupiah(pnlReport.total_cogs + pnlReport.total_opex)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-baseline justify-between font-sans mt-4">
                <div>
                  <span className="text-sm font-bold uppercase tracking-wider text-orange-400">
                    LABA BERSIH OPERASIONAL (NET OPERATING PROFIT):
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Net Margin: <span className="font-bold text-emerald-400">{pnlReport.net_margin_pct}%</span>
                  </p>
                </div>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatRupiah(pnlReport.net_operating_profit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
