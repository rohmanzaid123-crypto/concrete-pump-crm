/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Booking Detail Modal: Full Dossier, WhatsApp Dispatch Generator & Status Workflow
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Truck,
  MapPin,
  User,
  Phone,
  MessageSquare,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Share2,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types/database';
import { formatRupiah, formatTanggal, formatNumber } from '../../lib/formatters';
import { generateWhatsAppUrl } from '../../lib/whatsapp';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: BookingStatus) => Promise<{ success: boolean; error?: string }>;
}

const STATUS_FLOW: { key: BookingStatus; label: string; step: number }[] = [
  { key: 'inquiry', label: 'Inquiry', step: 1 },
  { key: 'quotation', label: 'Penawaran SPH', step: 2 },
  { key: 'pending_confirmation', label: 'Menunggu PO', step: 3 },
  { key: 'confirmed', label: 'Confirmed (DP)', step: 4 },
  { key: 'scheduled', label: 'Terkunci Kalender', step: 5 },
  { key: 'on_progress', label: 'Sedang Cor', step: 6 },
  { key: 'completed', label: 'Selesai', step: 7 },
];

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  onClose,
  booking,
  onEdit,
  onDelete,
  onUpdateStatus,
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [copiedWA, setCopiedWA] = useState<boolean>(false);

  if (!isOpen || !booking) return null;

  const currentStep = STATUS_FLOW.find((s) => s.key === booking.status)?.step || 1;

  // Generate WhatsApp Dispatch Message for Driver / Contractor
  const generateDispatchNotice = (): string => {
    return (
      `*SURAT TUGAS & KONFIRMASI DISPATCH POMPA BETON (CPMS)*\n` +
      `No. Booking: *${booking.booking_code}*\n` +
      `-----------------------------------------\n` +
      `Kepada Yth: *${booking.customer_name}*\n` +
      `Proyek: *${booking.project_name}*\n` +
      `Lokasi: ${booking.project_location}\n\n` +
      `*Jadwal Pengecoran:*\n` +
      `📅 Tanggal: *${formatTanggal(booking.pour_date)}*\n` +
      `⏰ Waktu Cor: *${booking.start_time} - ${booking.end_time} WIB*\n` +
      `⏱ Estimasi Durasi: ${booking.estimated_duration_hours} Jam\n` +
      `📦 Volume Estimasi: ${booking.volume_m3} m³ (${booking.concrete_grade})\n\n` +
      `*Alokasi Armada & Kru Lapangan:*\n` +
      `🚛 Unit Pompa: *${booking.assigned_unit_code || 'Dalam Konfirmasi'}*\n` +
      `👷 Operator: ${booking.assigned_operator_name || '-'}\n` +
      `🚚 Driver Sasis: ${booking.assigned_driver_name || '-'}\n` +
      `🔧 Sambungan Pipa: ${booking.extra_pipes_count} Batang | Semen: ${booking.cement_bedding_sacks} Sak\n\n` +
      `*Rincian Finansial:*\n` +
      `💰 Total Tagihan: *${formatRupiah(booking.total_price)}* ${booking.apply_tax ? '(Termasuk PPN 11%)' : ''}\n\n` +
      `Mohon agar akses jalan, izin lingkungan, dan adukan ready mix disiapkan tepat waktu. Terima kasih.\n` +
      `_CPMS Operations Center_`
    );
  };

  const handleSendWhatsApp = () => {
    const text = generateDispatchNotice();
    const url = generateWhatsAppUrl(booking.customer_wa, text);
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateDispatchNotice());
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  const handleStatusChange = async (newStatus: BookingStatus) => {
    setStatusError(null);
    setIsUpdatingStatus(true);
    try {
      const res = await onUpdateStatus(booking.id, newStatus);
      if (!res.success) {
        setStatusError(res.error || 'Gagal mengubah status');
      }
    } catch (err: any) {
      setStatusError(err.message || 'Gagal mengubah status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold">
              {booking.assigned_unit_code || 'CP'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{booking.booking_code}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400">{booking.project_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Status Progression Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Alur Progres Booking & Pengecoran
            </h4>
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {STATUS_FLOW.map((s, idx) => {
                const isPassed = s.step < currentStep;
                const isCurrent = s.key === booking.status;
                return (
                  <div key={s.key} className="flex items-center">
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange(s.key)}
                      className={`flex flex-col items-center gap-1 min-w-[76px] transition-all ${
                        isCurrent
                          ? 'scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCurrent
                            ? 'bg-orange-600 text-white shadow-md ring-2 ring-orange-300'
                            : isPassed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isPassed ? '✓' : s.step}
                      </div>
                      <span
                        className={`text-[10px] text-center font-semibold leading-tight ${
                          isCurrent ? 'text-orange-700 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                    {idx < STATUS_FLOW.length - 1 && (
                      <div
                        className={`h-0.5 w-6 sm:w-10 ${
                          isPassed ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {statusError && (
              <p className="mt-2 text-xs font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {statusError}
              </p>
            )}
          </div>

          {/* Quick Actions (WhatsApp Dispatch, Copy, Edit) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  Notifikasi Surat Tugas & Dispatch WhatsApp
                </p>
                <p className="text-[11px] text-emerald-700">
                  Kirim rincian lengkap pengecoran langsung ke WhatsApp PIC Kontraktor ({booking.customer_wa})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedWA ? 'Tersalin ke Clipboard!' : 'Salin Pesan'}</span>
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Kirim WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Customer, Project & Technical Specs */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-orange-600" />
                  Pelanggan & Lokasi Pengecoran
                </h4>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Perusahaan / Kontraktor:</span>
                    <span className="font-bold text-slate-900">{booking.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Proyek:</span>
                    <span className="font-semibold text-slate-800">{booking.project_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">WhatsApp PIC:</span>
                    <span className="font-mono text-emerald-700 font-semibold">{booking.customer_wa}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-0.5">Alamat Titik Cor:</span>
                    <span className="text-slate-800 font-medium">{booking.project_location}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-orange-600" />
                  Armada & Kru Ditugaskan
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Unit Pompa Beton:</span>
                    <span className="font-bold text-orange-600 font-mono text-sm">
                      {booking.assigned_unit_code || 'Belum Dialokasikan'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kategori & Boom:</span>
                    <span className="font-medium text-slate-800">
                      {booking.pump_category_code.replace('_', ' ')} ({booking.requested_boom_meters} Meter)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operator Utama:</span>
                    <span className="font-semibold text-slate-800">
                      {booking.assigned_operator_name || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Driver Truk Sasis:</span>
                    <span className="font-medium text-slate-700">
                      {booking.assigned_driver_name || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Schedule & Financials */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  Jadwal & Spesifikasi Teknis
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">TANGGAL COR</span>
                    <span className="font-bold text-slate-800">{formatTanggal(booking.pour_date)}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">WAKTU OPERASIONAL</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {booking.start_time} - {booking.end_time} ({booking.estimated_duration_hours} Jam)
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">VOLUME BETON</span>
                    <span className="font-bold text-slate-800">{booking.volume_m3} m³</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">MUTU BETON</span>
                    <span className="font-bold text-slate-800">{booking.concrete_grade}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">PIPA TAMBAHAN</span>
                    <span className="font-bold text-slate-800">{booking.extra_pipes_count} Batang</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">SEMEN BEDDING</span>
                    <span className="font-bold text-slate-800">{booking.cement_bedding_sacks} Sak</span>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Rincian Tagihan & Biaya</span>
                  <span className="text-[11px] text-slate-400 font-mono">Model: {booking.pricing_model}</span>
                </h4>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Tarif Paket Dasar:</span>
                    <span>{formatRupiah(booking.base_price)}</span>
                  </div>
                  {booking.extra_volume_price > 0 && (
                    <div className="flex justify-between text-amber-300">
                      <span>Ekstra Volume:</span>
                      <span>+{formatRupiah(booking.extra_volume_price)}</span>
                    </div>
                  )}
                  {booking.extra_hour_price > 0 && (
                    <div className="flex justify-between text-amber-300">
                      <span>Overtime Lembur:</span>
                      <span>+{formatRupiah(booking.extra_hour_price)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>Mobilisasi Truk:</span>
                    <span>+{formatRupiah(booking.mobilization_price)}</span>
                  </div>
                  {booking.additional_costs > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Biaya Tambahan (Pipa/Semen):</span>
                      <span>+{formatRupiah(booking.additional_costs)}</span>
                    </div>
                  )}
                  {booking.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Diskon:</span>
                      <span>-{formatRupiah(booking.discount_amount)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-800 pt-1.5 flex justify-between text-slate-400 font-sans">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatRupiah(booking.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-sans">
                    <span>PPN 11%:</span>
                    <span className="font-mono">{formatRupiah(booking.tax_amount)}</span>
                  </div>
                  <div className="border-t-2 border-orange-500/50 pt-2 flex justify-between items-baseline font-sans">
                    <span className="text-xs font-bold text-orange-400">TOTAL AKHIR:</span>
                    <span className="text-lg font-black text-white font-mono">
                      {formatRupiah(booking.total_price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900">
              <span className="font-bold">Catatan Lapangan: </span>
              {booking.notes}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Yakin ingin menghapus booking ${booking.booking_code}?`)) {
                onDelete(booking.id);
                onClose();
              }
            }}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Booking</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(booking);
              }}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Jadwal / Armada</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
