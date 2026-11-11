/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Expense Form Modal: Record Operational Costs Attributed to Units
 */

import React, { useState, useEffect } from 'react';
import { X, Wrench, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import { Booking, CashAccount, ExpenseCategory, PumpUnit } from '../../types/database';
import { formatRupiah } from '../../lib/formatters';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashAccounts: CashAccount[];
  units: PumpUnit[];
  bookings: Booking[];
  onSubmit: (data: {
    date: string;
    category: ExpenseCategory;
    amount: number;
    unit_id?: string;
    unit_code?: string;
    booking_id?: string;
    booking_code?: string;
    cash_account_id: string;
    description: string;
    recipient_name: string;
    audited_by: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  cashAccounts,
  units,
  bookings,
  onSubmit,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('bbm');
  const [amount, setAmount] = useState<number>(500000);
  const [unitId, setUnitId] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');
  const [cashAccountId, setCashAccountId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [auditedBy, setAuditedBy] = useState<string>('Ir. H. Sudirman (Owner)');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cashAccounts.length > 0) {
      // Default to Kas Kecil Pool if available, or first account
      const petty = cashAccounts.find((a) => a.type === 'kas_kecil');
      setCashAccountId(petty ? petty.id : cashAccounts[0].id);
    }
    if (units.length > 0) {
      setUnitId(units[0].id);
    }
  }, [isOpen, cashAccounts, units]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (amount <= 0) {
      setErrorMessage('Jumlah pengeluaran harus lebih besar dari Rp 0.');
      return;
    }

    if (!cashAccountId) {
      setErrorMessage('Pilih akun kas atau rekening sumber pembayaran.');
      return;
    }

    setIsSubmitting(true);

    const selectedUnit = units.find((u) => u.id === unitId);
    const selectedBk = bookings.find((b) => b.id === bookingId);

    try {
      const res = await onSubmit({
        date,
        category,
        amount,
        unit_id: selectedUnit?.id,
        unit_code: selectedUnit?.unit_code,
        booking_id: selectedBk?.id,
        booking_code: selectedBk?.booking_code,
        cash_account_id: cashAccountId,
        description,
        recipient_name: recipientName,
        audited_by: auditedBy,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Gagal menyimpan pengeluaran');
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Catat Pengeluaran Operasional</h2>
              <p className="text-xs text-slate-400">Alokasikan biaya ke armada unit pompa atau operasional pool</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Kategori Pengeluaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori Pengeluaran Operasional *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              required
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold"
            >
              <option value="bbm">BBM (Bahan Bakar Solar Industri)</option>
              <option value="tol">Tol Trans Jawa & Tol Dalam Kota</option>
              <option value="parkir">Parkir & Retribusi Lingkungan</option>
              <option value="mobilisasi">Mobilisasi & Pengawalan Armada</option>
              <option value="operator">Uang Saku & Uang Jalan Operator</option>
              <option value="makan">Uang Makan Kru & Lembur Malam</option>
              <option value="maintenance">Maintenance / Servis Bengkel</option>
              <option value="sparepart">Suku Cadang (Wear Plate, Pipa, Karet)</option>
              <option value="pajak_kendaraan">Pajak Kendaraan (Uji KIR & STNK)</option>
              <option value="lainnya">Biaya Operasional Lainnya</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Biaya (Rupiah) *
            </label>
            <input
              type="number"
              step="10000"
              min="1000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full text-base font-bold font-mono px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">{formatRupiah(amount)}</span>
          </div>

          {/* Unit & Booking attribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alokasi Unit Armada Pompa
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-medium"
              >
                <option value="">-- Beban Umum Pool (Non-Unit) --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit_code} - Boom {u.boom_length_meters}m ({u.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tautkan Booking Cor (Opsional)
              </label>
              <select
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-medium"
              >
                <option value="">-- Beban Umum / Rutin --</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.booking_code} • {b.project_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cash Account & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sumber Kas / Rekening *
              </label>
              <select
                value={cashAccountId}
                onChange={(e) => setCashAccountId(e.target.value)}
                required
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-semibold"
              >
                {cashAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name} ({formatRupiah(acc.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Transaksi *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>
          </div>

          {/* Description & Recipient */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Pengeluaran *</label>
            <input
              type="text"
              placeholder="Contoh: Pembelian Solar Dexlite 60L di SPBU Serpong untuk cor Silk Town"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Penerima Dana / Pihak Ketiga *</label>
              <input
                type="text"
                placeholder="SPBU Pertamina / Nama Kru / Bengkel"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diverifikasi Oleh (Audit)</label>
              <input
                type="text"
                value={auditedBy}
                onChange={(e) => setAuditedBy(e.target.value)}
                required
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
