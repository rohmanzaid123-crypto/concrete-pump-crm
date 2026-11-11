/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Official Payment Receipt (Kwitansi Pembayaran Resmi) Modal & Printable Canvas
 */

import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Payment } from '../../types/database';
import { formatRupiah, formatTanggal } from '../../lib/formatters';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

// Convert number to Indonesian words (Terbilang)
function terbilang(n: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas'
  ];

  if (n < 12) return bilangan[n];
  if (n < 20) return terbilang(n - 10) + ' Belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10);
  if (n < 200) return 'Seratus ' + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100);
  if (n < 2000) return 'Seribu ' + terbilang(n - 1000);
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000);
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000);
  if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + ' Miliar ' + terbilang(n % 1000000000);
  return 'Sangat Besar';
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({ isOpen, onClose, payment }) => {
  if (!isOpen || !payment) return null;

  const terbilangText = terbilang(payment.amount).trim() + ' Rupiah';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header (Hidden in Print) */}
        <div className="print:hidden bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              ✓
            </div>
            <div>
              <h2 className="text-base font-bold">Kwitansi Pembayaran Resmi (Receipt)</h2>
              <p className="text-xs text-slate-400">Bukti penerimaan dana sah terintegrasi buku kas CPMS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kwitansi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Kwitansi Sheet */}
        <div className="p-8 md:p-10 font-sans text-slate-900 overflow-y-auto">
          {/* Bordered Kwitansi Outer Frame */}
          <div className="border-4 border-double border-slate-800 p-6 rounded-xl relative">
            {/* Header PT */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black tracking-tight uppercase text-slate-900">
                  PT BETON PERKASA MANDIRI
                </h3>
                <p className="text-[11px] text-slate-600">
                  Kawasan Industri & Pool Pompa Beton Serpong • Telp: (021) 538-9900
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  KWITANSI RESMI
                </span>
                <p className="text-xs font-mono font-bold text-slate-900 mt-1">{payment.receipt_number}</p>
              </div>
            </div>

            {/* Receipt Fields */}
            <div className="space-y-3.5 text-xs text-slate-800 my-6">
              <div className="flex items-start">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Telah Terima Dari</span>
                <span className="w-4 font-bold">:</span>
                <span className="font-bold text-slate-900 text-sm">{payment.customer_name}</span>
              </div>

              <div className="flex items-start">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Uang Sejumlah</span>
                <span className="w-4 font-bold">:</span>
                <div className="bg-slate-100 px-3 py-1.5 rounded border border-slate-200 font-semibold italic text-slate-900 flex-1">
                  "{terbilangText}"
                </div>
              </div>

              <div className="flex items-start">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Untuk Pembayaran</span>
                <span className="w-4 font-bold">:</span>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">
                    {payment.payment_type === 'dp'
                      ? 'UANG MUKA (DP) PENYEWAAN POMPA BETON'
                      : payment.payment_type === 'pelunasan'
                      ? 'PELUNASAN PENUH BIAYA SEWA POMPA BETON'
                      : 'PEMBAYARAN TERMIN SEWA POMPA BETON'}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Referensi Faktur: <span className="font-mono font-bold">{payment.invoice_number}</span>
                  </p>
                  {payment.notes && <p className="text-slate-500 mt-0.5">{payment.notes}</p>}
                </div>
              </div>

              <div className="flex items-start">
                <span className="w-36 font-semibold text-slate-600 shrink-0">Metode & Rekening</span>
                <span className="w-4 font-bold">:</span>
                <span className="text-slate-700">
                  {payment.payment_method.toUpperCase()} via {payment.cash_account_name}
                  {payment.reference_number && ` (Ref: ${payment.reference_number})`}
                </span>
              </div>
            </div>

            {/* Amount Badge & Signer */}
            <div className="flex items-end justify-between border-t-2 border-slate-800 pt-4 mt-6">
              {/* Rupiah Box */}
              <div className="bg-slate-900 text-white px-5 py-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">JUMLAH (IDR):</span>
                <span className="text-2xl font-black font-mono tracking-tight text-orange-400">
                  {formatRupiah(payment.amount)}
                </span>
              </div>

              {/* Signature Box */}
              <div className="text-center w-52">
                <p className="text-[11px] text-slate-500 mb-0.5">
                  Tangerang Selatan, {formatTanggal(payment.payment_date)}
                </p>
                <p className="text-[11px] font-bold text-slate-800 mb-12">Penerima Kas / Kasir,</p>
                <div className="border-b border-slate-800 w-36 mx-auto"></div>
                <p className="font-bold text-xs text-slate-900 mt-1">{payment.received_by}</p>
                <p className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Validasi Otomatis CPMS</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Close (Hidden in Print) */}
        <div className="print:hidden bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
