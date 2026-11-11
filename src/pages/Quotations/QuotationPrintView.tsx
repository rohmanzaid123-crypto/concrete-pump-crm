/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Printable Quotation (Surat Penawaran Harga - SPH) Document
 */

import React from 'react';
import { Printer, Download, MessageSquare, ArrowLeft, CheckCircle2, Building2 } from 'lucide-react';
import { Quotation } from '../../types/database';
import { formatRupiah, formatTanggal } from '../../lib/formatters';
import { generateWhatsAppUrl } from '../../lib/whatsapp';

interface QuotationPrintViewProps {
  quotation: Quotation;
  onBack: () => void;
}

export const QuotationPrintView: React.FC<QuotationPrintViewProps> = ({ quotation, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text =
      `*SURAT PENAWARAN HARGA (SPH) - SEWA CONCRETE PUMP*\n` +
      `No. Dokumen: *${quotation.quotation_number}*\n` +
      `Kepada Yth: *${quotation.customer_name}*\n` +
      `Proyek: *${quotation.project_name}*\n` +
      `Lokasi: ${quotation.project_location}\n\n` +
      `*Rincian Penawaran:*\n` +
      `🚛 Spesifikasi Pompa: Boom ${quotation.requested_boom_meters} Meter\n` +
      `📦 Estimasi Volume: ${quotation.estimated_m3} m³\n` +
      `💰 Total Penawaran: *${formatRupiah(quotation.total_amount)}* ${quotation.apply_tax ? '(Termasuk PPN 11%)' : ''}\n` +
      `⏳ Masa Berlaku SPH: s/d ${formatTanggal(quotation.valid_until_date)}\n\n` +
      `*Syarat Pembayaran:* ${quotation.payment_terms}\n\n` +
      `Dokumen resmi SPH terlampir siap ditandatangani. Terima kasih.\n` +
      `_PT Beton Perkasa Mandiri_`;

    const url = generateWhatsAppUrl(quotation.customer_wa, text);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar (Hidden during print) */}
      <div className="print:hidden bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar SPH</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Kirim via WhatsApp</span>
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

      {/* Official SPH Document Canvas (A4 Sheet Presentation) */}
      <div className="bg-white mx-auto max-w-4xl p-8 md:p-12 border border-slate-200 shadow-lg rounded-2xl print:shadow-none print:border-none print:m-0 print:p-6 print:rounded-none text-slate-900 font-sans">
        {/* Kop Surat Resmi PT */}
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
                CONCRETE PUMP RENTAL & HEAVY EQUIPMENT SPECIALIST
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                Jl. Raya Serpong KM 8 No. 88, Tangerang Selatan • Telp: (021) 538-9900 • WhatsApp: +62 812-9900-8800
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                NPWP: 01.889.332.4-411.000 • Email: commercial@betonperkasamandiri.co.id
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-100 rounded text-xs font-extrabold uppercase border border-slate-300">
              SURAT PENAWARAN HARGA
            </span>
            <p className="text-xs font-bold font-mono text-slate-900 mt-2">{quotation.quotation_number}</p>
          </div>
        </div>

        {/* Header Metadata Meta */}
        <div className="grid grid-cols-2 gap-6 text-xs mb-6 pb-6 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              KEPADA YTH:
            </span>
            <p className="font-bold text-sm text-slate-900">{quotation.customer_name}</p>
            <p className="font-medium text-slate-700 mt-0.5">Proyek: {quotation.project_name}</p>
            <p className="text-slate-600 mt-0.5">{quotation.project_location}</p>
            <p className="text-slate-500 font-mono mt-1">Kontak WhatsApp: {quotation.customer_wa}</p>
          </div>

          <div className="text-right space-y-1">
            <div>
              <span className="text-slate-500">Tanggal Terbit: </span>
              <span className="font-bold text-slate-900">{formatTanggal(quotation.issue_date)}</span>
            </div>
            <div>
              <span className="text-slate-500">Masa Berlaku SPH: </span>
              <span className="font-bold text-orange-700">{formatTanggal(quotation.valid_until_date)}</span>
            </div>
            <div>
              <span className="text-slate-500">Estimasi Rencana Cor: </span>
              <span className="font-bold text-slate-900">
                {quotation.pour_date ? formatTanggal(quotation.pour_date) : 'Sesuai Jadwal Lapangan'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Status Penawaran: </span>
              <span className="font-bold uppercase text-emerald-700 font-mono">{quotation.status}</span>
            </div>
          </div>
        </div>

        {/* Body Text */}
        <p className="text-xs text-slate-700 mb-4 leading-relaxed">
          Dengan hormat,<br />
          Sehubungan dengan kebutuhan pengecoran pada proyek <strong>{quotation.project_name}</strong>, bersama ini kami
          mengajukan rincian penawaran tarif sewa armada pompa beton (Concrete Pump) dengan ketentuan sebagai berikut:
        </p>

        {/* Itemized Table */}
        <table className="w-full text-xs text-left mb-6 border border-slate-300">
          <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-300 uppercase">
            <tr>
              <th className="p-2.5 w-10 text-center border-r border-slate-300">No</th>
              <th className="p-2.5 border-r border-slate-300">Uraian Pekerjaan / Layanan</th>
              <th className="p-2.5 text-center w-16 border-r border-slate-300">Volume</th>
              <th className="p-2.5 text-center w-16 border-r border-slate-300">Satuan</th>
              <th className="p-2.5 text-right w-28 border-r border-slate-300">Harga Satuan</th>
              <th className="p-2.5 text-right w-32">Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {quotation.items.map((item, idx) => (
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
                Subtotal Penawaran:
              </td>
              <td className="p-2 text-right font-mono">{formatRupiah(quotation.subtotal)}</td>
            </tr>
            {quotation.discount_amount > 0 && (
              <tr>
                <td colSpan={5} className="p-2 text-right text-emerald-700 border-r border-slate-300">
                  Diskon Khusus Pelanggan:
                </td>
                <td className="p-2 text-right font-mono text-emerald-700">
                  -{formatRupiah(quotation.discount_amount)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={5} className="p-2 text-right border-r border-slate-300">
                PPN (11%):
              </td>
              <td className="p-2 text-right font-mono">{formatRupiah(quotation.tax_amount)}</td>
            </tr>
            <tr className="bg-orange-50/60 text-slate-900 text-sm">
              <td colSpan={5} className="p-2.5 text-right font-black uppercase text-orange-950 border-r border-slate-300">
                TOTAL KESEPAKATAN HARGA:
              </td>
              <td className="p-2.5 text-right font-mono font-black text-orange-950">
                {formatRupiah(quotation.total_amount)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Syarat & Ketentuan Teknis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-8">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Syarat & Ketentuan Teknis:</h4>
            <div className="space-y-1 text-slate-600 whitespace-pre-line text-[11px] leading-relaxed">
              {quotation.terms_and_conditions}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Termin Pembayaran:</h4>
            <p className="text-[11px] text-slate-700 leading-relaxed">{quotation.payment_terms}</p>
            <div className="mt-3 pt-2 border-t border-slate-200">
              <p className="font-bold text-[11px] text-slate-900">Rekening Resmi Pembayaran PT:</p>
              <p className="text-[11px] font-mono font-bold text-blue-900 mt-0.5">
                BCA: 883-092-7711 a/n PT BETON PERKASA MANDIRI
              </p>
              <p className="text-[11px] font-mono font-bold text-blue-900">
                MANDIRI: 137-00-1928374-1 a/n PT BETON PERKASA MANDIRI
              </p>
            </div>
          </div>
        </div>

        {/* Blok Tanda Tangan */}
        <div className="grid grid-cols-2 gap-12 text-center text-xs pt-4 border-t border-slate-200">
          <div>
            <p className="text-slate-500 mb-1">Disetujui oleh Pihak Penyewa,</p>
            <p className="font-bold text-slate-900 mb-16">{quotation.customer_name}</p>
            <div className="w-48 mx-auto border-b border-slate-400"></div>
            <p className="text-[11px] text-slate-500 mt-1">(Tanda Tangan & Cap Perusahaan)</p>
          </div>

          <div>
            <p className="text-slate-500 mb-1">Hormat kami,</p>
            <p className="font-bold text-slate-900 mb-16">PT BETON PERKASA MANDIRI</p>
            <div className="w-48 mx-auto border-b border-slate-400"></div>
            <p className="font-bold text-slate-900 mt-1">{quotation.signature_name}</p>
            <p className="text-[11px] text-slate-500">{quotation.signature_title}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
