/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Quotations (Surat Penawaran Harga / SPH) Master Page
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Printer,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { Booking, Customer, Project, Quotation, QuotationStatus } from '../../types/database';
import { formatRupiah, formatTanggal } from '../../lib/formatters';
import { fetchQuotations, createQuotation, updateQuotation, deleteQuotation } from '../../lib/finance-store';
import { fetchCustomers } from '../../lib/customer-store';
import { fetchProjects, fetchBookings } from '../../lib/booking-store';
import { generateWhatsAppUrl } from '../../lib/whatsapp';
import { QuotationFormModal } from './QuotationFormModal';
import { QuotationPrintView } from './QuotationPrintView';

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals & Views
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [printQuotation, setPrintQuotation] = useState<Quotation | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [qData, cData, pData, bData] = await Promise.all([
        fetchQuotations(),
        fetchCustomers(),
        fetchProjects(),
        fetchBookings(),
      ]);
      setQuotations(qData);
      setCustomers(cData);
      setProjects(pData);
      setBookings(bData);
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (selectedStatus !== 'all' && q.status !== selectedStatus) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const mNum = q.quotation_number.toLowerCase().includes(query);
        const mCust = q.customer_name.toLowerCase().includes(query);
        const mPrj = q.project_name.toLowerCase().includes(query);
        if (!mNum && !mCust && !mPrj) return false;
      }
      return true;
    });
  }, [quotations, selectedStatus, searchQuery]);

  // KPIs
  const stats = useMemo(() => {
    const totalCount = quotations.length;
    const approved = quotations.filter((q) => q.status === 'disetujui').length;
    const pending = quotations.filter((q) => q.status === 'terkirim' || q.status === 'draft').length;
    const totalValue = quotations.reduce((acc, q) => acc + q.total_amount, 0);
    const approvedValue = quotations
      .filter((q) => q.status === 'disetujui')
      .reduce((acc, q) => acc + q.total_amount, 0);

    return { totalCount, approved, pending, totalValue, approvedValue };
  }, [quotations]);

  const handleCreateOrUpdate = async (payload: any) => {
    if (editingQuotation) {
      const res = await updateQuotation(editingQuotation.id, payload);
      if (res) {
        await loadData();
        return { success: true };
      }
      return { success: false, error: 'Gagal update SPH' };
    } else {
      const res = await createQuotation(payload);
      if (res) {
        await loadData();
        return { success: true };
      }
      return { success: false, error: 'Gagal membuat SPH' };
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (window.confirm(`Yakin ingin menghapus dokumen penawaran ${num}?`)) {
      await deleteQuotation(id);
      await loadData();
    }
  };

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'disetujui':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Disetujui (Deal)
          </span>
        );
      case 'terkirim':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Terkirim ke Klien
          </span>
        );
      case 'draft':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Draft
          </span>
        );
      case 'ditolak':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            Ditolak
          </span>
        );
      case 'kadaluarsa':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Kadaluarsa
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // If in Print/PDF view mode, display official document template
  if (printQuotation) {
    return (
      <QuotationPrintView
        quotation={printQuotation}
        onBack={() => setPrintQuotation(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Surat Penawaran Harga (SPH)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
              Komersial
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Penerbitan proposal harga sewa pompa beton resmi, integrasi booking, dan cetak PDF kop surat
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingQuotation(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat SPH Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Penawaran Terbit</span>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalCount} SPH</p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">{formatRupiah(stats.totalValue)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">SPH Disetujui (Deal)</span>
          <p className="text-2xl font-black text-emerald-600 mt-2">{stats.approved} SPH</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Konversi: {stats.totalCount > 0 ? Math.round((stats.approved / stats.totalCount) * 100) : 0}%
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Menunggu Respon Klien</span>
          <p className="text-2xl font-black text-amber-600 mt-2">{stats.pending} SPH</p>
          <p className="text-[11px] text-slate-500 mt-1">Follow up via WhatsApp</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Nilai Omzet Disetujui</span>
          <p className="text-xl font-black text-slate-900 mt-2 font-mono">
            {formatRupiah(stats.approvedValue)}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Siap diterbitkan invoice termin</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor SPH, nama kontraktor, atau nama proyek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {[
            { id: 'all', label: 'Semua Status' },
            { id: 'disetujui', label: 'Disetujui (Deal)' },
            { id: 'terkirim', label: 'Terkirim ke Klien' },
            { id: 'draft', label: 'Draft' },
            { id: 'ditolak', label: 'Ditolak' },
            { id: 'kadaluarsa', label: 'Kadaluarsa' },
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

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Nomor SPH & Tanggal</th>
                <th className="px-5 py-3.5">Pelanggan & Proyek</th>
                <th className="px-5 py-3.5">Spesifikasi Pompa & Vol</th>
                <th className="px-5 py-3.5 text-right">Total Nilai Penawaran</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada dokumen penawaran harga</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik tombol "+ Buat SPH Baru" untuk menerbitkan proposal harga ke kontraktor.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nomor & Tanggal */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 font-mono text-xs">{q.quotation_number}</div>
                      <div className="text-xs text-slate-600 mt-0.5">Terbit: {formatTanggal(q.issue_date)}</div>
                      <div className="text-[11px] text-orange-700 font-semibold">
                        Berlaku s/d: {formatTanggal(q.valid_until_date)}
                      </div>
                    </td>

                    {/* Customer & Proyek */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">{q.customer_name}</div>
                      <div className="text-xs text-slate-600 truncate max-w-[220px]">{q.project_name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{q.project_location}</div>
                    </td>

                    {/* Spesifikasi */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800 text-xs">
                        Boom {q.requested_boom_meters} Meter
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">Estimasi {q.estimated_m3} m³ cor</div>
                      {q.pour_date && (
                        <div className="text-[11px] text-blue-600">Rencana: {formatTanggal(q.pour_date)}</div>
                      )}
                    </td>

                    {/* Nilai Penawaran */}
                    <td className="px-5 py-3.5 text-right font-mono">
                      <div className="font-bold text-slate-900 text-xs">{formatRupiah(q.total_amount)}</div>
                      <div className="text-[10px] text-slate-400">
                        {q.apply_tax ? 'Termasuk PPN 11%' : 'Non-PPN'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">{getStatusBadge(q.status)}</td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPrintQuotation(q)}
                          className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-orange-600 flex items-center gap-1 shadow-2xs transition-colors"
                          title="Cetak SPH / PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuotation(q);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit SPH"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(q.id, q.quotation_number)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus SPH"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <QuotationFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingQuotation(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingQuotation}
        customers={customers}
        projects={projects}
        bookings={bookings}
      />
    </div>
  );
};
