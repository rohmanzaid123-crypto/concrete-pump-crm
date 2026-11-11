/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Record Payment Modal (Pencatatan DP, Termin, & Pelunasan Kas)
 */

import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { CashAccount, Invoice, Payment, PaymentMethod, PaymentType } from '../../types/database';
import { formatRupiah } from '../../lib/formatters';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  cashAccounts: CashAccount[];
  onSubmit: (data: {
    invoice_id: string;
    payment_type: PaymentType;
    payment_method: PaymentMethod;
    cash_account_id: string;
    payment_date: string;
    amount: number;
    reference_number?: string;
    notes?: string;
    received_by: string;
  }) => Promise<{ success: boolean; payment?: Payment; error?: string }>;
  onSuccess: (payment: Payment) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  cashAccounts,
  onSubmit,
  onSuccess,
}) => {
  const [paymentType, setPaymentType] = useState<PaymentType>('dp');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer_bank');
  const [cashAccountId, setCashAccountId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(0);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receivedBy, setReceivedBy] = useState<string>('Siti Rahmawati (Finance Admin)');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (invoice) {
      if (invoice.amount_paid === 0) {
        setPaymentType('dp');
        setAmount(Math.round(invoice.total_amount * 0.3)); // Default DP 30%
      } else {
        setPaymentType('pelunasan');
        setAmount(invoice.balance_due);
      }
      setNotes(`Pembayaran tagihan invoice ${invoice.invoice_number} proyek ${invoice.project_name}`);
    }
    if (cashAccounts.length > 0) {
      setCashAccountId(cashAccounts[0].id);
    }
  }, [invoice, isOpen, cashAccounts]);

  const handleTypeChange = (type: PaymentType) => {
    setPaymentType(type);
    if (!invoice) return;
    if (type === 'pelunasan') {
      setAmount(invoice.balance_due);
    } else if (type === 'dp') {
      setAmount(Math.round(invoice.total_amount * 0.3));
    }
  };

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (amount <= 0) {
      setErrorMessage('Nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }

    if (amount > invoice.balance_due) {
      setErrorMessage(
        `Nominal pembayaran (${formatRupiah(amount)}) melebihi sisa piutang invoice (${formatRupiah(
          invoice.balance_due
        )}).`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await onSubmit({
        invoice_id: invoice.id,
        payment_type: paymentType,
        payment_method: paymentMethod,
        cash_account_id: cashAccountId,
        payment_date: paymentDate,
        amount,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
        received_by: receivedBy,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Gagal mencatat pembayaran');
      } else if (res.payment) {
        onClose();
        onSuccess(res.payment);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Pencatatan Pembayaran & Kwitansi</h2>
              <p className="text-xs text-slate-400">{invoice.invoice_number} • {invoice.customer_name}</p>
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

          {/* Invoice Summary Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Nilai Tagihan:</span>
              <span className="font-bold text-slate-900 font-mono">{formatRupiah(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sudah Diterima Sebelumnya:</span>
              <span className="font-bold text-emerald-700 font-mono">{formatRupiah(invoice.amount_paid)}</span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between">
              <span className="font-bold text-slate-700">Sisa Piutang Saat Ini:</span>
              <span className="font-black text-orange-600 font-mono text-sm">
                {formatRupiah(invoice.balance_due)}
              </span>
            </div>
          </div>

          {/* Payment Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Pembayaran *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dp', label: 'Uang Muka (DP)' },
                { id: 'termin', label: 'Cicilan / Termin' },
                { id: 'pelunasan', label: 'Pelunasan Penuh' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => handleTypeChange(opt.id as PaymentType)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                    paymentType === opt.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Diterima (Rupiah) *
            </label>
            <input
              type="number"
              step="50000"
              min="10000"
              max={invoice.balance_due}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full text-base font-bold font-mono px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Format: {formatRupiah(amount)}
            </span>
          </div>

          {/* Cash / Bank Destination Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rekening Kas Masuk *</label>
              <select
                value={cashAccountId}
                onChange={(e) => setCashAccountId(e.target.value)}
                required
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-semibold text-slate-900"
              >
                {cashAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name} ({acc.bank_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900"
              >
                <option value="transfer_bank">Transfer Bank</option>
                <option value="tunai">Tunai / Kas Langsung</option>
                <option value="giro">Bilyet Giro</option>
                <option value="cek">Cek Bank</option>
              </select>
            </div>
          </div>

          {/* Date & Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Bayar *</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. Bukti Transfer / Ref Bank</label>
              <input
                type="text"
                placeholder="TRF-BCA-XXXXXX"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Diterima & Diverifikasi Oleh</label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              required
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg font-medium"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses...' : 'Catat & Terbitkan Kwitansi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
