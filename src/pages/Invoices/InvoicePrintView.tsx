/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Printable Invoice & Berita Acara Pengecoran Document
 */

import React from 'react';
import { Printer, ArrowLeft, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { Invoice } from '../../types/database';
import { formatRupiah, formatTanggal } from '../../lib/formatters';
import { generateWhatsAppUrl } from '../../lib/whatsapp';

interface InvoicePrintViewProps {
  invoice: Invoice;
  onBack: () => void;
  onRecordPayment?: (invoice: Invoice) => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({
  invoice,
  onBack,
  onRecordPayment,
}) => {
  const isPaid = invoice.status === 'paid' || invoice.balance_due === 0;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text =
      `*FAKTUR TAGIHAN SEWA CONCRETE PUMP*\n` +
      `No. Invoice: *${invoice.invoice_number}*\n` +
      `Kepada Yth: *${invoice.customer_name}*\n` +
      `Proyek: *${invoice.project_name}*\n` +
      `Tanggal Cor: ${formatTanggal(invoice.pour_date)}\n` +
      `Volume Cor Realisasi: *${invoice.volume_realized_m3} m³*\n\n` +
      `*Rincian Finansial:*\n` +
      `💰 Total Tagihan: *${formatRupiah(invoice.total_amount)}*\n` +
      `💳 Pembayaran Diterima (DP): ${formatRupiah(invoice.amount_paid)}\n` +
      `⚠️ *Sisa Piutang / Pelunasan:* *${formatRupiah(invoice.balance_due)}*\n` +
      `📅 Jatuh Tempo: *${formatTanggal(invoice.due_date)}*\n\n` +
      `*Rekening Resmi Transfer Pembayaran:*\n` +
      `BCA: *883-092-7711* a/n PT BETON PERKASA MANDIRI\n` +
      `Mandiri: *137-00-1928374-1* a/n PT BETON PERKASA MANDIRI\n\n` +
      `Mohon bukti transfer dikirimkan via chat ini. Terima kasih.\n` +
      `_Departemen Keuangan - PT Beton Perkasa Mandiri_`;

    const url = generateWhatsAppUrl(invoice.customer_wa, text);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="print:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Invoice</span>
        </button>

        <div className="flex items-center gap-2">
          {!isPaid && onRecordPayment && (
            <button
              onClick={() => onRecordPayment(invoice)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Catat Pembayaran / DP</span>
            </button>
          )}
          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Kirim Tagihan via WA</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Official Invoice Sheet */}
      <div className="bg-white mx-auto max-w-4xl p-8 md:p-12 border border-slate-200 shadow-lg rounded-2xl print:shadow-none print:border-none print:m-0 print:p-6 print:rounded-none text-slate-900 font-sans relative overflow-hidden">
        {/* Paid Stamp Watermark */}
        {isPaid && (
          <div className="absolute right-12 top-48 border-4 border-emerald-600/40 text-emerald-600/40 font-black text-4xl px-6 py-2 rounded-xl rotate-[-15deg] uppercase tracking-widest select-none pointer-events-none">
            LUNAS
          </div>
        )}

        {/* Kop Surat PT */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-slate-900 text-orange-400 font-black text-2xl flex items-center justify-center border-2 border-orange-500 shadow-sm print:border-black">
              BPM
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                PT BETON PERKASA MANDIRI
              </h2>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                COMMERCIAL INVOICE & BILLING STATEMENT
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                Jl. Raya Serpong KM 8 No. 88, Tangerang Selatan • Telp: (021) 538-9900 • WhatsApp: +62 812-9900-8800
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                NPWP: 01.889.332.4-411.000 • Email: finance@betonperkasamandiri.co.id
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 rounded text-xs font-black uppercase border ${
                isPaid
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-orange-100 text-orange-900 border-orange-300'
              }`}
            >
              {isPaid ? 'FAKTUR LUNAS' : 'FAKTUR TAGIHAN'}
            </span>
            <p className="text-sm font-extrabold font-mono text-slate-900 mt-2">{invoice.invoice_number}</p>
          </div>
        </div>

        {/* Customer & Billing Metadata */}
        <div className="grid grid-cols-2 gap-6 text-xs mb-6 pb-6 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              DITUJUKAN KEPADA:
            </span>
            <p className="font-bold text-sm text-slate-900">{invoice.customer_name}</p>
            <p className="font-semibold text-slate-800 mt-0.5">Proyek: {invoice.project_name}</p>
            <p className="text-slate-600 mt-0.5">{invoice.project_location}</p>
            <p className="text-slate-500 font-mono mt-1">WhatsApp: {invoice.customer_wa}</p>
          </div>

          <div className="text-right space-y-1">
            <div>
              <span className="text-slate-500">Tanggal Terbit: </span>
              <span className="font-bold text-slate-900">{formatTanggal(invoice.issue_date)}</span>
            </div>
            <div>
              <span className="text-slate-500">Jatuh Tempo (TOP): </span>
              <span className="font-bold text-red-600 font-mono">{formatTanggal(invoice.due_date)}</span>
            </div>
            <div>
              <span className="text-slate-500">Tanggal Pengecoran: </span>
              <span className="font-semibold text-slate-800">{formatTanggal(invoice.pour_date)}</span>
            </div>
            <div>
              <span className="text-slate-500">Unit Pompa / Armada: </span>
              <span className="font-bold text-orange-700 font-mono">{invoice.unit_code || 'Armada Pool'}</span>
            </div>
            <div>
              <span className="text-slate-500">Volume Cor Terpompa: </span>
              <span className="font-extrabold text-slate-900">{invoice.volume_realized_m3} m³</span>
            </div>
          </div>
        </div>

        {/* Itemized Services Table */}
        <table className="w-full text-xs text-left mb-6 border border-slate-300">
          <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-300 uppercase">
            <tr>
              <th className="p-2.5 w-10 text-center border-r border-slate-300">No</th>
              <th className="p-2.5 border-r border-slate-300">Deskripsi Pengecoran & Jasa Pompa</th>
              <th className="p-2.5 text-center w-16 border-r border-slate-300">Vol</th>
              <th className="p-2.5 text-center w-16 border-r border-slate-300">Satuan</th>
              <th className="p-2.5 text-right w-28 border-r border-slate-300">Tarif Satuan</th>
              <th className="p-2.5 text-right w-32">Total (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="p-2.5 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                <td className="p-2.5 border-r border-slate-200 font-medium">
                  <div className="font-bold text-slate-900">{item.item_name}</div>
                  {item.description && <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>}
                </td>
                <td className="p-2.5 text-center font-mono border-r border-slate-200">{item.quantity}</td>
                <td className="p-2.5 text-center border-r border-slate-200">{item.unit}</td>
                <td className="p-2.5 text-right font-mono border-r border-slate-200">
                  {formatRupiah(item.unit_price)}
                </td>
                <td className="p-2.5 text-right font-mono font-bold">{formatRupiah(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-xs">
            <tr>
              <td colSpan={5} className="p-2 text-right border-r border-slate-300">
                Subtotal Jasa Pompa:
              </td>
              <td className="p-2 text-right font-mono">{formatRupiah(invoice.subtotal)}</td>
            </tr>
            {invoice.discount_amount > 0 && (
              <tr>
                <td colSpan={5} className="p-2 text-right text-emerald-700 border-r border-slate-300">
                  Diskon Khusus Proyek:
                </td>
                <td className="p-2 text-right font-mono text-emerald-700">
                  -{formatRupiah(invoice.discount_amount)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={5} className="p-2 text-right border-r border-slate-300">
                PPN (11% Faktur Pajak):
              </td>
              <td className="p-2 text-right font-mono">{formatRupiah(invoice.tax_amount)}</td>
            </tr>
            <tr className="bg-slate-100 text-slate-900 text-sm">
              <td colSpan={5} className="p-2.5 text-right font-black uppercase border-r border-slate-300">
                TOTAL NILAI TAGIHAN:
              </td>
              <td className="p-2.5 text-right font-mono font-black">{formatRupiah(invoice.total_amount)}</td>
            </tr>
            <tr className="text-emerald-700">
              <td colSpan={5} className="p-2 text-right border-r border-slate-300 font-semibold">
                Pembayaran Diterima (Uang Muka DP / Cicilan):
              </td>
              <td className="p-2 text-right font-mono font-bold">-{formatRupiah(invoice.amount_paid)}</td>
            </tr>
            <tr className="bg-orange-50/80 text-orange-950 text-sm">
              <td colSpan={5} className="p-2.5 text-right font-black uppercase border-r border-slate-300">
                SISA PIUTANG / TOTAL HARUS DIBAYAR:
              </td>
              <td className="p-2.5 text-right font-mono font-black text-orange-950">
                {formatRupiah(invoice.balance_due)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Bank Account Destination & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-8">
          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-950 uppercase tracking-wider mb-2">
              Instruksi Transfer Rekening Resmi:
            </h4>
            <p className="text-[11px] text-blue-900 mb-2">
              Pembayaran tagihan diakui sah jika ditransfer ke salah satu rekening atas nama perusahaan:
            </p>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="bg-white p-2 rounded border border-blue-200">
                <span className="font-bold text-slate-900 block">BANK CENTRAL ASIA (BCA)</span>
                <span className="text-blue-700 font-bold text-sm">883-092-7711</span>
                <span className="text-[10px] text-slate-500 block">a/n PT BETON PERKASA MANDIRI</span>
              </div>
              <div className="bg-white p-2 rounded border border-blue-200">
                <span className="font-bold text-slate-900 block">BANK MANDIRI</span>
                <span className="text-blue-700 font-bold text-sm">137-00-1928374-1</span>
                <span className="text-[10px] text-slate-500 block">a/n PT BETON PERKASA MANDIRI</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Catatan Penagihan:</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {invoice.notes ||
                  '1. Pembayaran wajib menyertakan nomor invoice pada kolom berita transfer.\n2. Keterlambatan pelunasan melebihi jatuh tempo dapat mempengaruhi alokasi armada booking berikutnya.'}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-400">
              Dokumen ini dihasilkan secara otomatis oleh Concrete Pump Management System (CPMS) dan diakui sebagai Berita Acara Penagihan resmi.
            </div>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 gap-12 text-center text-xs pt-4 border-t border-slate-200">
          <div>
            <p className="text-slate-500 mb-1">Diterima oleh Pihak Pelanggan,</p>
            <p className="font-bold text-slate-900 mb-16">{invoice.customer_name}</p>
            <div className="w-48 mx-auto border-b border-slate-400"></div>
            <p className="text-[11px] text-slate-500 mt-1">(Tanda Tangan & Cap Proyek)</p>
          </div>

          <div>
            <p className="text-slate-500 mb-1">Hormat kami,</p>
            <p className="font-bold text-slate-900 mb-16">PT BETON PERKASA MANDIRI</p>
            <div className="w-48 mx-auto border-b border-slate-400"></div>
            <p className="font-bold text-slate-900 mt-1">Siti Rahmawati, SE</p>
            <p className="text-[11px] text-slate-500">Finance & Billing Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
};
