/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Finance & Cash Accounts Master Page
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Truck,
  RefreshCw,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Wrench,
  Fuel,
} from 'lucide-react';
import {
  Booking,
  CashAccount,
  Expense,
  ExpenseCategory,
  Payment,
  PumpUnit,
} from '../../types/database';
import { formatRupiah, formatTanggal } from '../../lib/formatters';
import {
  fetchCashAccounts,
  fetchExpenses,
  recordExpense,
  fetchPayments,
  exportExpensesToExcel,
} from '../../lib/finance-store';
import { fetchFleetUnits } from '../../lib/fleet-store';
import { fetchBookings } from '../../lib/booking-store';
import { ExpenseFormModal } from './ExpenseFormModal';

export const FinancePage: React.FC = () => {
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [units, setUnits] = useState<PumpUnit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accData, expData, payData, uData, bData] = await Promise.all([
        fetchCashAccounts(),
        fetchExpenses(),
        fetchPayments(),
        fetchFleetUnits(),
        fetchBookings(),
      ]);
      setCashAccounts(accData);
      setExpenses(expData);
      setPayments(payData);
      setUnits(uData);
      setBookings(bData);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
      if (selectedUnitId !== 'all' && e.unit_id !== selectedUnitId) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const mDesc = e.description.toLowerCase().includes(q);
        const mRec = e.recipient_name.toLowerCase().includes(q);
        const mUnit = (e.unit_code || '').toLowerCase().includes(q);
        const mNum = e.expense_number.toLowerCase().includes(q);
        if (!mDesc && !mRec && !mUnit && !mNum) return false;
      }
      return true;
    });
  }, [expenses, selectedCategory, selectedUnitId, searchQuery]);

  // KPIs
  const stats = useMemo(() => {
    const totalLiquid = cashAccounts.reduce((acc, a) => acc + a.current_balance, 0);
    const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalCashInflow = payments.reduce((acc, p) => acc + p.amount, 0);
    const netCashPosition = totalCashInflow - totalExpense;

    return { totalLiquid, totalExpense, totalCashInflow, netCashPosition };
  }, [cashAccounts, expenses, payments]);

  const handleRecordExpense = async (data: any) => {
    const res = await recordExpense(data);
    if (res.success) {
      await loadData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const getCategoryBadge = (cat: ExpenseCategory) => {
    const labels: Record<ExpenseCategory, { label: string; color: string }> = {
      bbm: { label: 'Solar BBM', color: 'bg-amber-100 text-amber-900 border-amber-300' },
      tol: { label: 'Tol & Parkir', color: 'bg-blue-100 text-blue-900 border-blue-300' },
      parkir: { label: 'Parkir', color: 'bg-slate-100 text-slate-800 border-slate-300' },
      mobilisasi: { label: 'Mobilisasi', color: 'bg-purple-100 text-purple-900 border-purple-300' },
      operator: { label: 'Uang Jalan Kru', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
      makan: { label: 'Uang Makan', color: 'bg-orange-100 text-orange-900 border-orange-300' },
      maintenance: { label: 'Servis Bengkel', color: 'bg-red-100 text-red-900 border-red-300' },
      sparepart: { label: 'Suku Cadang', color: 'bg-rose-100 text-rose-900 border-rose-300' },
      pajak_kendaraan: { label: 'KIR & Pajak', color: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
      lainnya: { label: 'Lainnya', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    };
    const c = labels[cat] || { label: cat, color: 'bg-slate-100 text-slate-700' };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${c.color}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Keuangan & Kas Operasional
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
              Kas & Pengeluaran
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Buku kas perusahaan, rekening operasional bank, dan alokasi biaya solar BBM, uang jalan kru, & suku cadang
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportExpensesToExcel(expenses)}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Biaya</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Biaya Operasional</span>
          </button>
        </div>
      </div>

      {/* Saldo Rekening Bank & Kas Likuid */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-orange-600" />
          Rekening Bank Resmi & Kas Kecil Pool
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cashAccounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {acc.bank_name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {acc.type === 'kas_kecil' ? 'Kas Tunai' : 'Giro Bisnis'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500">{acc.account_number}</p>
              <p className="text-[11px] text-slate-400 truncate">{acc.account_holder}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500">Saldo Berjalan:</span>
                <span className="text-xl font-black font-mono text-slate-900">
                  {formatRupiah(acc.current_balance)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Kas Likuid</span>
          <p className="text-xl font-black text-slate-900 mt-2 font-mono">
            {formatRupiah(stats.totalLiquid)}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Siap pakai di bank & pool</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Penerimaan Kas</span>
          <p className="text-xl font-black text-emerald-600 mt-2 font-mono">
            {formatRupiah(stats.totalCashInflow)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Pembayaran DP & Pelunasan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Pengeluaran Kas</span>
          <p className="text-xl font-black text-red-600 mt-2 font-mono">
            {formatRupiah(stats.totalExpense)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{expenses.length} Transaksi Beban</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Net Arus Kas Periode</span>
          <p className="text-xl font-black text-blue-600 mt-2 font-mono">
            {formatRupiah(stats.netCashPosition)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Kas Masuk - Kas Keluar</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari keterangan pengeluaran, penerima dana, atau armada pompa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800"
            >
              <option value="all">Semua Armada Pompa</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_code} ({u.boom_length_meters}m)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {[
            { id: 'all', label: 'Semua Kategori' },
            { id: 'bbm', label: 'Solar BBM' },
            { id: 'tol', label: 'Tol & Parkir' },
            { id: 'operator', label: 'Uang Jalan Kru' },
            { id: 'makan', label: 'Uang Makan' },
            { id: 'maintenance', label: 'Servis Bengkel' },
            { id: 'sparepart', label: 'Suku Cadang' },
            { id: 'pajak_kendaraan', label: 'KIR & Pajak' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">No. Biaya & Tanggal</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Armada Unit</th>
                <th className="px-5 py-3.5">Uraian / Keterangan</th>
                <th className="px-5 py-3.5">Penerima Dana & Sumber Kas</th>
                <th className="px-5 py-3.5 text-right">Jumlah Biaya</th>
                <th className="px-5 py-3.5 text-center">Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Fuel className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada data pengeluaran operasional</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Catat pengeluaran solar BBM, uang jalan kru, tol, atau servis bengkel.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* No & Tanggal */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 font-mono text-xs">{e.expense_number}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{formatTanggal(e.date)}</div>
                    </td>

                    {/* Kategori */}
                    <td className="px-5 py-3.5">{getCategoryBadge(e.category)}</td>

                    {/* Unit */}
                    <td className="px-5 py-3.5">
                      {e.unit_code ? (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-900 font-bold font-mono rounded text-xs">
                          {e.unit_code}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Beban Umum Pool</span>
                      )}
                      {e.booking_code && (
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{e.booking_code}</div>
                      )}
                    </td>

                    {/* Keterangan */}
                    <td className="px-5 py-3.5 max-w-[280px]">
                      <p className="text-xs font-medium text-slate-900">{e.description}</p>
                    </td>

                    {/* Penerima & Kas */}
                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-bold text-slate-800">{e.recipient_name}</div>
                      <div className="text-[11px] text-slate-500">{e.cash_account_name}</div>
                    </td>

                    {/* Jumlah Biaya */}
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-red-600 text-xs">
                      {formatRupiah(e.amount)}
                    </td>

                    {/* Verifikasi Audit */}
                    <td className="px-5 py-3.5 text-center text-xs">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Diaudit
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                        {e.audited_by.split(' (')[0]}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        cashAccounts={cashAccounts}
        units={units}
        bookings={bookings}
        onSubmit={handleRecordExpense}
      />
    </div>
  );
};
