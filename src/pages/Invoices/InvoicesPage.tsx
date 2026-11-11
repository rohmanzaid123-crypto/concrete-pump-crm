/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Invoices & Receivables (Piutang) Master Page
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  DollarSign,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { CashAccount, Customer, Invoice, InvoiceStatus, Payment } from '../../types/database';
import { formatRupiah, formatTanggal, formatNumber } from '../../lib/formatters';
import {
  fetchInvoices,
  fetchCashAccounts,
  recordPayment,
  fetchPayments,
  exportInvoicesToExcel,
} from '../../lib/finance-store';
import { fetchCustomers } from '../../lib/customer-store';
import { InvoicePrintView } from './InvoicePrintView';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ReceiptPrintModal } from './ReceiptPrintModal';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals & Document Views
  const [selectedPrintInvoice, setSelectedPrintInvoice] = useState<Invoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invData, accData, custData, payData] = await Promise.all([
        fetchInvoices(),
        fetchCashAccounts(),
        fetchCustomers(),
        fetchPayments(),
      ]);
      setInvoices(invData);
      setCashAccounts(accData);
      setCustomers(custData);
      setPayments(payData);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'overdue') {
          const now = new Date().toISOString().split('T')[0];
          if (inv.status === 'paid' || inv.due_date >= now) return false;
        } else if (inv.status !== selectedStatus) {
          return false;
        }
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const mNum = inv.invoice_number.toLowerCase().includes(q);
        const mCust = inv.customer_name.toLowerCase().includes(q);
        const mPrj = inv.project_name.toLowerCase().includes(q);
        const mBk = (inv.booking_code || '').toLowerCase().includes(q);
        if (!mNum && !mCust && !mPrj && !mBk) return false;
      }
      return true;
    });
  }, [invoices, selectedStatus, searchQuery]);

  // KPIs
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const totalBilled = invoices.reduce((acc, inv) => acc + inv.total_amount, 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + inv.amount_paid, 0);
    const totalReceivable = invoices.reduce((acc, inv) => acc + inv.balance_due, 0);

    const now = new Date().toISOString().split('T')[0];
    const overdueCount = invoices.filter((inv) => inv.status !== 'paid' && inv.due_date < now).length;

    return { totalCount, totalBilled, totalPaid, totalReceivable, overdueCount };
  }, [invoices]);

  const handlePaymentSuccess = (payment: Payment) => {
    setSelectedReceipt(payment);
    loadData();
  };

  const getStatusBadge = (invoice: Invoice) => {
    const now = new Date().toISOString().split('T')[0];
    const isOverdue = invoice.status !== 'paid' && invoice.due_date < now;

    if (invoice.status === 'paid' || invoice.balance_due === 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Lunas
        </span>
      );
    }

    if (isOverdue) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Jatuh Tempo
        </span>
      );
    }

    if (invoice.status === 'partially_paid') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
          DP Diterima
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
        Belum Bayar
      </span>
    );
  };

  // If in Print/PDF view mode, display official Invoice document
  if (selectedPrintInvoice) {
    return (
      <InvoicePrintView
        invoice={selectedPrintInvoice}
        onBack={() => setSelectedPrintInvoice(null)}
        onRecordPayment={(inv) => {
          setSelectedPrintInvoice(null);
          setPaymentModalInvoice(inv);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faktur & Penagihan (Invoices)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
              Billing & Kas
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen tagihan termin, pencatatan DP, pelunasan bertahap, dan penerbitan kwitansi resmi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportInvoicesToExcel(invoices)}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Nilai Tagihan</span>
          <p className="text-xl font-black text-slate-900 mt-2 font-mono">{formatRupiah(stats.totalBilled)}</p>
          <p className="text-[11px] text-slate-500 mt-1">{stats.totalCount} Faktur Tagihan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Kas Masuk (DP & Lunas)</span>
          <p className="text-xl font-black text-emerald-600 mt-2 font-mono">{formatRupiah(stats.totalPaid)}</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Tersimpan di Rekening Bank PT
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Sisa Piutang Berjalan</span>
          <p className="text-xl font-black text-orange-600 mt-2 font-mono">
            {formatRupiah(stats.totalReceivable)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Menunggu pelunasan kontraktor</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Invoice Lewat Jatuh Tempo</span>
          <p className="text-2xl font-black text-red-600 mt-2">{stats.overdueCount} Faktur</p>
          <p className="text-[11px] text-red-600 font-semibold mt-1">Perlu follow-up penagihan</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor invoice, kontraktor, proyek, atau kode armada pompa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {[
            { id: 'all', label: 'Semua Invoice' },
            { id: 'partially_paid', label: 'DP Diterima' },
            { id: 'unpaid', label: 'Belum Bayar' },
            { id: 'paid', label: 'Lunas' },
            { id: 'overdue', label: 'Jatuh Tempo' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Nomor Faktur & Tanggal</th>
                <th className="px-5 py-3.5">Pelanggan & Proyek</th>
                <th className="px-5 py-3.5">Armada & Vol Cor</th>
                <th className="px-5 py-3.5 text-right">Total Tagihan</th>
                <th className="px-5 py-3.5 text-right">Sudah Dibayar</th>
                <th className="px-5 py-3.5 text-right">Sisa Piutang</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada faktur penagihan yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Faktur otomatis dibuat dari booking cor atau surat penawaran harga.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nomor & Tanggal */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 font-mono text-xs">{inv.invoice_number}</div>
                      <div className="text-xs text-slate-600 mt-0.5">Terbit: {formatTanggal(inv.issue_date)}</div>
                      <div className="text-[11px] text-red-600 font-semibold font-mono">
                        Jatuh Tempo: {formatTanggal(inv.due_date)}
                      </div>
                    </td>

                    {/* Customer & Proyek */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">{inv.customer_name}</div>
                      <div className="text-xs text-slate-600 truncate max-w-[200px]">{inv.project_name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{inv.project_location}</div>
                    </td>

                    {/* Unit & Volume */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 font-mono font-bold rounded text-xs">
                          {inv.unit_code || 'CP'}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">{inv.volume_realized_m3} m³</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Cor: {formatTanggal(inv.pour_date)}</div>
                    </td>

                    {/* Total Tagihan */}
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 text-xs">
                      {formatRupiah(inv.total_amount)}
                    </td>

                    {/* Sudah Dibayar */}
                    <td className="px-5 py-3.5 text-right font-mono text-emerald-700 font-semibold text-xs">
                      {formatRupiah(inv.amount_paid)}
                    </td>

                    {/* Sisa Piutang */}
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-orange-600 text-xs">
                      {formatRupiah(inv.balance_due)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center">{getStatusBadge(inv)}</td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPrintInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-orange-600 flex items-center gap-1 shadow-2xs transition-colors"
                          title="Cetak Faktur PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Faktur</span>
                        </button>

                        {inv.balance_due > 0 ? (
                          <button
                            type="button"
                            onClick={() => setPaymentModalInvoice(inv)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shadow-2xs transition-colors"
                            title="Catat Pembayaran DP / Pelunasan"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Bayar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const pay = payments.find((p) => p.invoice_id === inv.id);
                              if (pay) setSelectedReceipt(pay);
                            }}
                            className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                            title="Lihat Kwitansi Resmi"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Kwitansi</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!paymentModalInvoice}
        onClose={() => setPaymentModalInvoice(null)}
        invoice={paymentModalInvoice}
        cashAccounts={cashAccounts}
        onSubmit={recordPayment}
        onSuccess={handlePaymentSuccess}
      />

      {/* Kwitansi Modal */}
      <ReceiptPrintModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
      />
    </div>
  );
};
