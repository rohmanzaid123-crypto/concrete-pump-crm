import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Building2,
  Phone,
  MessageSquare,
  FileSpreadsheet,
  AlertTriangle,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { Customer, CustomerSegment, CustomerStatus } from '../../types/database';
import { fetchCustomers, deleteCustomer, exportCustomersToFile } from '../../lib/customer-store';
import { formatRupiah, formatTanggal } from '../../lib/formatters';
import { formatDisplayWA, getWhatsAppChatUrl } from '../../lib/whatsapp';
import { useAuth } from '../../context/AuthContext';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { ExcelImportModal } from './ExcelImportModal';

export const CustomersPage: React.FC = () => {
  const { user, role } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Delete Confirmation state
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchCustomers({
      query: searchQuery,
      segment: selectedSegment,
      status: selectedStatus,
    });
    setCustomers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedSegment, selectedStatus]);

  // Handle Delete Customer
  const handleDeleteConfirm = async () => {
    if (!deletingCustomer || !user) return;
    setIsDeleting(true);
    setDeleteErrorMessage('');

    const res = await deleteCustomer(deletingCustomer.id, user.email, role);
    if (!res.success) {
      setDeleteErrorMessage(res.error || 'Gagal menghapus customer.');
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    setDeletingCustomer(null);
    loadData();
  };

  // Segment labels
  const segmentLabels: Record<string, string> = {
    all: 'Semua Segmentasi',
    kontraktor_bumn: 'Kontraktor BUMN',
    kontraktor_swasta: 'Kontraktor Swasta',
    batching_plant: 'Batching Plant Mitra',
    developer: 'Developer Properti',
    mandor_perorangan: 'Mandor / Perorangan',
  };

  const statusStyles: Record<string, string> = {
    aktif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    prospek: 'bg-blue-50 text-blue-700 border-blue-200',
    macet: 'bg-rose-50 text-rose-700 border-rose-200',
    nonaktif: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  // Aggregated totals
  const totalOutstandingAll = customers.reduce((acc, c) => acc + (Number(c.total_outstanding) || 0), 0);
  const totalBUMNCount = customers.filter((c) => c.segment === 'kontraktor_bumn').length;
  const totalBatchingPlantCount = customers.filter((c) => c.segment === 'batching_plant').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 font-bold">
              Tahap 2 CPMS · CRM
            </span>
            <span className="text-xs text-slate-400">Database Pelanggan Persewaan Pompa</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            Manajemen Customer & Mitra Bisnis
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 text-xs">
                <button
                  onClick={() => {
                    exportCustomersToFile(customers, 'xlsx');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    exportCustomersToFile(customers, 'csv');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>Export CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4 text-orange-400" />
            <span>Import Excel/CSV</span>
          </button>

          {/* Add Customer Button */}
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Customer Terdaftar
          </span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums block mt-1">
            {customers.length}
          </span>
          <span className="text-[10px] text-slate-400">Database aktif di Supabase</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Kontraktor BUMN
          </span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums block mt-1">
            {totalBUMNCount}
          </span>
          <span className="text-[10px] text-slate-400">WIKA, PP, Adhi Karya, Waskita</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Batching Plant Mitra
          </span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums block mt-1">
            {totalBatchingPlantCount}
          </span>
          <span className="text-[10px] text-slate-400">Jayamix, Merak Jaya, Pionir, dsb</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Piutang Berjalan
          </span>
          <span className="text-xl font-extrabold text-rose-600 font-mono tabular-nums block mt-1">
            {formatRupiah(totalOutstandingAll)}
          </span>
          <span className="text-[10px] text-slate-400">Tagihan sewa belum lunas</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama customer, PIC, nomor WhatsApp (08...), perusahaan, atau kode..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="prospek">Prospek</option>
              <option value="macet">Piutang Macet</option>
              <option value="nonaktif">Nonaktif</option>
            </select>

            <button
              onClick={loadData}
              title="Segarkan Data"
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Segment Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Segmentasi:
          </span>
          {Object.entries(segmentLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedSegment(key)}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                selectedSegment === key
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Nama Perusahaan & Alamat</th>
                <th className="py-3 px-4">PIC & Nomor WhatsApp</th>
                <th className="py-3 px-4">Segmentasi</th>
                <th className="py-3 px-4 text-right">Piutang Berjalan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada data customer yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tambahkan customer baru secara manual atau import database dari file Excel/CSV.
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const waUrl = getWhatsAppChatUrl(c.whatsapp_number);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {c.customer_code}
                        </span>
                      </td>

                      {/* Company Name & Address */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">{c.company_name}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {c.city} · {c.address}
                        </p>
                      </td>

                      {/* PIC & WhatsApp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{c.pic_name}</p>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 hover:text-emerald-800 mt-0.5"
                          title="Klik untuk membuka chat WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>{formatDisplayWA(c.whatsapp_number)}</span>
                        </a>
                      </td>

                      {/* Segment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {segmentLabels[c.segment] || c.segment}
                        </span>
                      </td>

                      {/* Financial Outstanding */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            c.total_outstanding > 0 ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {formatRupiah(c.total_outstanding)}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Limit: {formatRupiah(c.credit_limit)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase border ${
                            statusStyles[c.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedCustomerId(c.id)}
                            title="Lihat Profil Detail & Riwayat"
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingCustomer(c);
                              setIsFormOpen(true);
                            }}
                            title="Edit Data Customer"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingCustomer(c)}
                            title={role === 'owner' ? 'Hapus Customer' : 'Hapus Customer (Perlu Hak Owner)'}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan <strong>{customers.length}</strong> customer
          </span>
          <span className="text-[11px] font-mono">
            Format Mata Uang: IDR (Rupiah) · Pemisah Ribuan Titik
          </span>
        </div>
      </div>

      {/* Form Modal (Tambah / Edit) */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        existingCustomer={editingCustomer}
      />

      {/* Detail Modal */}
      <CustomerDetailModal
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        onEdit={(cust) => {
          setSelectedCustomerId(null);
          setEditingCustomer(cust);
          setIsFormOpen(true);
        }}
        onRefresh={loadData}
      />

      {/* Import Modal */}
      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={loadData}
        existingCustomers={customers}
      />

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              Konfirmasi Hapus Customer
            </h3>
            <p className="text-xs text-slate-600 text-center leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus customer{' '}
              <strong className="text-slate-900">&quot;{deletingCustomer.company_name}&quot;</strong> (
              <span className="font-mono">{deletingCustomer.customer_code}</span>)?
            </p>

            {role !== 'owner' && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Aturan Keamanan:</strong> Penghapusan customer hanya dapat dilakukan oleh akun dengan peran <strong>OWNER</strong>.
                </span>
              </div>
            )}

            {deleteErrorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{deleteErrorMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingCustomer(null);
                  setDeleteErrorMessage('');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting || role !== 'owner'}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
