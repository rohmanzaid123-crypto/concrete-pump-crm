import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  CreditCard,
  Calendar,
  Clock,
  Plus,
  Send,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Truck,
  ArrowUpRight,
  Shield,
  Edit,
} from 'lucide-react';
import { Customer, CustomerContact, CustomerFollowup } from '../../types/database';
import { formatDisplayWA, getWhatsAppChatUrl } from '../../lib/whatsapp';
import { formatRupiah, formatTanggal, formatNumber } from '../../lib/formatters';
import { fetchCustomerById, addCustomerContact, addCustomerFollowup } from '../../lib/customer-store';
import { useAuth } from '../../context/AuthContext';

interface CustomerDetailModalProps {
  customerId: string | null;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onRefresh: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customerId,
  onClose,
  onEdit,
  onRefresh,
}) => {
  const { user, role } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'followup' | 'bookings' | 'finance'>('info');
  const [isLoading, setIsLoading] = useState(true);

  // Form add contact
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPos, setNewContactPos] = useState('');
  const [newContactWA, setNewContactWA] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  // Form add follow-up
  const [showAddFollowup, setShowAddFollowup] = useState(false);
  const [followupMethod, setFollowupMethod] = useState<'whatsapp' | 'telepon' | 'survei_lapangan' | 'meeting' | 'email'>('whatsapp');
  const [followupNotes, setFollowupNotes] = useState('');
  const [followupNextDate, setFollowupNextDate] = useState('');
  const [followupStatus, setFollowupStatus] = useState<'selesai' | 'perlu_tindak_lanjut'>('selesai');

  const loadData = async () => {
    if (!customerId) return;
    setIsLoading(true);
    const data = await fetchCustomerById(customerId);
    setCustomer(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  if (!customerId || !customer) return null;

  const segmentLabels: Record<string, string> = {
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

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactWA.trim()) return;

    await addCustomerContact({
      customer_id: customer.id,
      name: newContactName.trim(),
      position: newContactPos.trim() || 'Staff Lapangan',
      phone_number: newContactWA.trim(),
      whatsapp_number: newContactWA.trim(),
      email: newContactEmail.trim(),
      is_primary: false,
    });

    setNewContactName('');
    setNewContactPos('');
    setNewContactWA('');
    setNewContactEmail('');
    setShowAddContact(false);
    loadData();
  };

  const handleAddFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupNotes.trim() || !user) return;

    await addCustomerFollowup({
      customer_id: customer.id,
      date: new Date().toISOString(),
      author_name: user.full_name,
      author_role: role,
      method: followupMethod,
      notes: followupNotes.trim(),
      next_action_date: followupNextDate || undefined,
      status: followupStatus,
    });

    setFollowupNotes('');
    setFollowupNextDate('');
    setShowAddFollowup(false);
    loadData();
  };

  const waDirectUrl = getWhatsAppChatUrl(
    customer.whatsapp_number,
    `Halo ${customer.pic_name} (${customer.company_name}), saya ${user?.full_name || 'Admin'} dari CPMS Persewaan Pompa Beton.`
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Profile */}
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800">
                  {customer.customer_code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono border ${
                    statusStyles[customer.status] || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white mt-1">
                {customer.company_name}
              </h1>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{customer.pic_name}</span>
                <span>·</span>
                <span className="text-orange-300">{segmentLabels[customer.segment] || customer.segment}</span>
                <span>·</span>
                <span>{customer.city}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={waDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat WhatsApp</span>
            </a>
            <button
              onClick={() => onEdit(customer)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-slate-200 bg-slate-50 divide-x divide-slate-200">
          <div className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Transaksi Sewa
            </span>
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums block mt-0.5">
              {formatRupiah(customer.total_transaction_value)}
            </span>
            <span className="text-[10px] text-slate-400">Total riwayat cor</span>
          </div>

          <div className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Terbayar
            </span>
            <span className="text-base font-bold text-emerald-700 font-mono tabular-nums block mt-0.5">
              {formatRupiah(customer.total_paid)}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">Dana masuk kas</span>
          </div>

          <div className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Piutang Berjalan
            </span>
            <span className="text-base font-bold text-rose-600 font-mono tabular-nums block mt-0.5">
              {formatRupiah(customer.total_outstanding)}
            </span>
            <span className="text-[10px] text-slate-400">Belum terlunasi</span>
          </div>

          <div className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Plafon Kredit (TOP)
            </span>
            <span className="text-base font-bold text-slate-800 font-mono tabular-nums block mt-0.5">
              {formatRupiah(customer.credit_limit)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Tempo: {customer.payment_term_days} Hari</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-200 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Profil & Kontak PIC ({customer.contacts?.length || 1})
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'followup'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Riwayat Follow-up ({customer.followups?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'bookings'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Riwayat Sewa & Booking Pompa
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'finance'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Riwayat Transaksi & Invoice
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PROFIL & KONTAK PIC */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Alamat Kantor / Pool:</span>
                  <p className="font-semibold text-slate-900 leading-relaxed">{customer.address}</p>
                  <p className="text-slate-600 mt-0.5">{customer.city}, {customer.province} {customer.postal_code}</p>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Nomor Pokok Wajib Pajak (NPWP):</span>
                  <p className="font-mono font-semibold text-slate-900">{customer.tax_id || '-'}</p>

                  <span className="text-slate-500 block mt-3 mb-0.5">Catatan Operasional Pompa:</span>
                  <p className="text-slate-700 italic">{customer.notes || 'Tidak ada catatan khusus.'}</p>
                </div>
              </div>

              {/* Contacts List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Daftar Kontak PIC Lapangan & Kantor
                  </h3>
                  <button
                    onClick={() => setShowAddContact(!showAddContact)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah PIC</span>
                  </button>
                </div>

                {/* Add Contact Form Inline */}
                {showAddContact && (
                  <form onSubmit={handleAddContactSubmit} className="mb-4 p-4 bg-orange-50/60 rounded-xl border border-orange-200 space-y-3">
                    <h4 className="text-xs font-bold text-orange-950">Tambah PIC Tambahan</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Nama Lengkap PIC"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Jabatan (e.g. Logistik)"
                        value={newContactPos}
                        onChange={(e) => setNewContactPos(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Nomor WA (0812...)"
                        value={newContactWA}
                        onChange={(e) => setNewContactWA(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                      <input
                        type="email"
                        placeholder="Email (Opsional)"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddContact(false)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-orange-600 text-white text-xs font-semibold rounded hover:bg-orange-700"
                      >
                        Simpan PIC
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Primary PIC */}
                  <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/30 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{customer.pic_name}</span>
                        <span className="text-[9px] bg-orange-600 text-white px-1.5 py-0.2 rounded font-bold font-mono">
                          UTAMA
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Penanggung Jawab Proyek Cor</p>
                      <p className="text-xs text-slate-800 font-mono mt-2 font-medium">
                        {formatDisplayWA(customer.whatsapp_number)}
                      </p>
                      {customer.email && <p className="text-[11px] text-slate-500">{customer.email}</p>}
                    </div>
                    <a
                      href={getWhatsAppChatUrl(customer.whatsapp_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors"
                      title="Kirim Pesan WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Additional Contacts */}
                  {customer.contacts?.map((cnt) => (
                    <div key={cnt.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">{cnt.name}</span>
                          {cnt.is_primary && (
                            <span className="text-[9px] bg-slate-800 text-white px-1.5 py-0.2 rounded font-bold font-mono">
                              PIC
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{cnt.position}</p>
                        <p className="text-xs text-slate-800 font-mono mt-2 font-medium">
                          {formatDisplayWA(cnt.whatsapp_number)}
                        </p>
                        {cnt.email && <p className="text-[11px] text-slate-500">{cnt.email}</p>}
                      </div>
                      <a
                        href={getWhatsAppChatUrl(cnt.whatsapp_number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                        title="Kirim Pesan WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RIWAYAT FOLLOW-UP & KOMUNIKASI */}
          {activeTab === 'followup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Catatan Negosiasi & Log Komunikasi WhatsApp / Lapangan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Riwayat interaksi tim marketing, survei rute, dan penawaran harga sewa pompa.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddFollowup(!showAddFollowup)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Catatan Follow-up</span>
                </button>
              </div>

              {/* Add Followup Form */}
              {showAddFollowup && (
                <form onSubmit={handleAddFollowupSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Catat Interaksi Baru</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Metode Komunikasi
                      </label>
                      <select
                        value={followupMethod}
                        onChange={(e) => setFollowupMethod(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="whatsapp">WhatsApp Chat</option>
                        <option value="telepon">Telepon Langsung</option>
                        <option value="survei_lapangan">Survei Lokasi Proyek</option>
                        <option value="meeting">Pertemuan / Meeting Kantor</option>
                        <option value="email">Email</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Jadwal Tindak Lanjut Berikutnya
                      </label>
                      <input
                        type="date"
                        value={followupNextDate}
                        onChange={(e) => setFollowupNextDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Status Follow-up
                      </label>
                      <select
                        value={followupStatus}
                        onChange={(e) => setFollowupStatus(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="selesai">Selesai (Informatif)</option>
                        <option value="perlu_tindak_lanjut">Perlu Tindak Lanjut</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Catatan Pembicaraan / Hasil Survei
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={followupNotes}
                      onChange={(e) => setFollowupNotes(e.target.value)}
                      placeholder="Tuliskan hasil diskusi, rute jalan pompa, kebutuhan panjang pipa, atau kesepakatan harga..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddFollowup(false)}
                      className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded hover:bg-orange-700"
                    >
                      Simpan Catatan
                    </button>
                  </div>
                </form>
              )}

              {/* Followups Timeline */}
              {customer.followups && customer.followups.length > 0 ? (
                <div className="space-y-3">
                  {customer.followups.map((fol) => (
                    <div key={fol.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 uppercase font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {fol.method.replace('_', ' ')}
                          </span>
                          <span className="text-slate-600 font-medium">Oleh {fol.author_name}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                          {formatTanggal(fol.date, true)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed mt-1">
                        {fol.notes}
                      </p>
                      {fol.next_action_date && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-orange-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Target Tindak Lanjut: {formatTanggal(fol.next_action_date, false)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase ${
                              fol.status === 'selesai'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {fol.status.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs">
                  Belum ada catatan follow-up untuk customer ini. Klik &quot;Tambah Catatan Follow-up&quot; untuk mencatat hasil pembicaraan.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RIWAYAT SEWA & BOOKING POMPA */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Riwayat Pengecoran & Alokasi Pompa Beton
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data riil sewa unit pompa beton per proyek pengecoran (m³ cor).
                  </p>
                </div>
              </div>

              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">Belum Ada Riwayat Booking Cor</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Pencatatan pemesanan dan jadwal pompa beton untuk customer ini akan terhubung otomatis melalui modul{' '}
                  <strong className="text-slate-700">Bookings</strong> dan <strong className="text-slate-700">Scheduling</strong> pada tahap berikutnya.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: RIWAYAT TRANSAKSI & INVOICE */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Buku Piutang & Faktur Tagihan (IDR)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Status tagihan faktur sewa, uang muka (DP), dan pelunasan kontraktor.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>Plafon Kredit Diizinkan</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(customer.credit_limit)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>Total Tagihan Diterbitkan</span>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(customer.total_transaction_value)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>Total Pembayaran Masuk</span>
                  <span className="font-mono font-bold text-emerald-700">{formatRupiah(customer.total_paid)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-800 font-bold">
                  <span>Sisa Piutang Berjalan</span>
                  <span className="font-mono text-rose-600">{formatRupiah(customer.total_outstanding)}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Faktur tagihan resmi (Invoices) terbit secara otomatis saat pekerjaan sewa pompa diselesaikan di modul Invoices.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Terdaftar sejak: {formatTanggal(customer.created_at, false)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
