/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Quotation (SPH) Form Modal
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Booking, Customer, Project, Quotation, QuotationItem, QuotationStatus } from '../../types/database';
import { formatRupiah } from '../../lib/formatters';
import { PUMP_CATEGORIES } from '../../lib/fleet-store';

interface QuotationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quotationData: any) => Promise<{ success: boolean; error?: string }>;
  initialData?: Quotation | null;
  customers: Customer[];
  projects: Project[];
  bookings: Booking[];
}

export const QuotationFormModal: React.FC<QuotationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  customers,
  projects,
  bookings,
}) => {
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [projectLocation, setProjectLocation] = useState<string>('');
  const [customerWa, setCustomerWa] = useState<string>('');
  const [pumpCategoryCode, setPumpCategoryCode] = useState<any>('standard_24_36m');
  const [requestedBoomMeters, setRequestedBoomMeters] = useState<number>(36);
  const [estimatedM3, setEstimatedM3] = useState<number>(50);
  const [pourDate, setPourDate] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [validUntilDate, setValidUntilDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const [items, setItems] = useState<Omit<QuotationItem, 'id' | 'quotation_id'>[]>([
    {
      item_name: 'Sewa Concrete Pump Standar (Paket 8 Jam / 50 m³)',
      quantity: 1,
      unit: 'Paket',
      unit_price: 4500000,
      subtotal: 4500000,
    },
    {
      item_name: 'Mobilisasi Armada Pompa Beton (Pool - Proyek)',
      quantity: 1,
      unit: 'Trip',
      unit_price: 1000000,
      subtotal: 1000000,
    },
  ]);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const [paymentTerms, setPaymentTerms] = useState<string>(
    'DP 30% saat pemesanan unit, pelunasan 70% selambat-lambatnya 14 hari kalender setelah Berita Acara Cor.'
  );
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    '1. Akses jalan dan izin lingkungan disiapkan oleh pihak penyewa.\n2. Slump beton siap cor minimal 12±2 cm.\n3. Waktu tunggu pipa di lokasi melebihi 2 jam dikenakan charge overtime.\n4. Penyewa menyediakan air bersih untuk pencucian pipa.'
  );
  const [status, setStatus] = useState<QuotationStatus>('draft');
  const [signatureName, setSignatureName] = useState<string>('Ir. H. Sudirman');
  const [signatureTitle, setSignatureTitle] = useState<string>('Direktur Utama');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initialData
  useEffect(() => {
    if (initialData) {
      setSelectedBookingId(initialData.booking_id || '');
      setCustomerId(initialData.customer_id);
      setCustomerWa(initialData.customer_wa);
      setProjectId(initialData.project_id || '');
      setProjectLocation(initialData.project_location);
      setPumpCategoryCode(initialData.pump_category_code);
      setRequestedBoomMeters(initialData.requested_boom_meters);
      setEstimatedM3(initialData.estimated_m3);
      setPourDate(initialData.pour_date || '');
      setIssueDate(initialData.issue_date);
      setValidUntilDate(initialData.valid_until_date);
      setItems(initialData.items.map((i) => ({ ...i })));
      setDiscountAmount(initialData.discount_amount);
      setApplyTax(initialData.apply_tax);
      setPaymentTerms(initialData.payment_terms);
      setTermsAndConditions(initialData.terms_and_conditions);
      setStatus(initialData.status);
      setSignatureName(initialData.signature_name);
      setSignatureTitle(initialData.signature_title);
    } else {
      if (customers.length > 0) {
        setCustomerId(customers[0].id);
        setCustomerWa(customers[0].whatsapp_number);
      }
      if (projects.length > 0) {
        setProjectId(projects[0].id);
        setProjectLocation(projects[0].address + ', ' + projects[0].city);
      }
    }
  }, [initialData, isOpen, customers, projects]);

  // Handle Quick Import from Booking
  const handleSelectBooking = (bkId: string) => {
    setSelectedBookingId(bkId);
    const bk = bookings.find((b) => b.id === bkId);
    if (!bk) return;

    setCustomerId(bk.customer_id);
    setCustomerWa(bk.customer_wa);
    setProjectId(bk.project_id);
    setProjectLocation(bk.project_location);
    setPumpCategoryCode(bk.pump_category_code);
    setRequestedBoomMeters(bk.requested_boom_meters);
    setEstimatedM3(bk.volume_m3);
    setPourDate(bk.pour_date);

    // Build items from booking
    const newItems: Omit<QuotationItem, 'id' | 'quotation_id'>[] = [
      {
        item_name: `Sewa Concrete Pump ${bk.requested_boom_meters}m (Paket Dasar 8 Jam / 50 m³)`,
        quantity: 1,
        unit: 'Paket',
        unit_price: bk.base_price,
        subtotal: bk.base_price,
      },
    ];

    if (bk.extra_volume_price > 0) {
      newItems.push({
        item_name: `Estimasi Kelebihan Volume Cor (${Math.max(0, bk.volume_m3 - 50)} m³)`,
        quantity: Math.max(0, bk.volume_m3 - 50),
        unit: 'm³',
        unit_price: Math.round(bk.extra_volume_price / Math.max(1, bk.volume_m3 - 50)),
        subtotal: bk.extra_volume_price,
      });
    }

    if (bk.mobilization_price > 0) {
      newItems.push({
        item_name: 'Mobilisasi Armada Pompa Beton',
        quantity: 1,
        unit: 'Trip',
        unit_price: bk.mobilization_price,
        subtotal: bk.mobilization_price,
      });
    }

    if (bk.additional_costs > 0) {
      newItems.push({
        item_name: 'Sewa Pipa Sambungan & Semen Bedding Pelicin',
        quantity: 1,
        unit: 'Paket',
        unit_price: bk.additional_costs,
        subtotal: bk.additional_costs,
      });
    }

    setItems(newItems);
    setDiscountAmount(bk.discount_amount);
    setApplyTax(bk.apply_tax);
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = applyTax ? Math.round(netSubtotal * 0.11) : 0;
  const totalAmount = netSubtotal + taxAmount;

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      item.subtotal = Number(item.quantity || 0) * Number(item.unit_price || 0);
    }
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { item_name: 'Layanan Tambahan / Pipa', quantity: 1, unit: 'Batang', unit_price: 100000, subtotal: 100000 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cust = customers.find((c) => c.id === customerId);
    const proj = projects.find((p) => p.id === projectId);

    if (!cust) {
      setErrorMessage('Pilih data customer terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      booking_id: selectedBookingId || undefined,
      customer_id: cust.id,
      customer_name: cust.company_name,
      customer_wa: customerWa || cust.whatsapp_number,
      project_id: proj?.id || undefined,
      project_name: proj?.project_name || 'Proyek Lapangan',
      project_location: projectLocation,
      pump_category_code: pumpCategoryCode,
      requested_boom_meters: Number(requestedBoomMeters),
      estimated_m3: Number(estimatedM3),
      pour_date: pourDate || undefined,
      issue_date: issueDate,
      valid_until_date: validUntilDate,
      items: items.map((it, idx) => ({
        ...it,
        id: `item-${Date.now()}-${idx}`,
        quotation_id: initialData?.id || '',
      })),
      subtotal,
      discount_amount: discountAmount,
      apply_tax: applyTax,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      payment_terms: paymentTerms,
      status: status,
      terms_and_conditions: termsAndConditions,
      signature_name: signatureName,
      signature_title: signatureTitle,
    };

    try {
      const res = await onSubmit(payload);
      if (!res.success) {
        setErrorMessage(res.error || 'Gagal menyimpan penawaran harga');
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan penawaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialData ? `Edit Surat Penawaran Harga: ${initialData.quotation_number}` : 'Buat Surat Penawaran Harga (SPH) Baru'}
              </h2>
              <p className="text-xs text-slate-400">Dokumen penawaran resmi untuk kontraktor dan proyek</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Import from Booking */}
          <div className="bg-orange-50/70 p-3.5 rounded-xl border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-orange-950">Tautkan ke Booking / Jadwal Cor:</span>
              <p className="text-[11px] text-orange-800">Otomatis mengisi volume, boom pompa, dan tarif kalkulator</p>
            </div>
            <select
              value={selectedBookingId}
              onChange={(e) => handleSelectBooking(e.target.value)}
              className="text-xs bg-white border border-orange-300 rounded-lg px-3 py-1.5 font-medium text-slate-900 focus:ring-2 focus:ring-orange-500 max-w-xs"
            >
              <option value="">-- Buat Penawaran Bebas (Manual) --</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.booking_code} • {b.customer_name} ({b.volume_m3}m³)
                </option>
              ))}
            </select>
          </div>

          {/* Customer & Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Customer *</label>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  const c = customers.find((item) => item.id === e.target.value);
                  if (c) setCustomerWa(c.whatsapp_number);
                }}
                required
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-orange-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.customer_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Proyek Konstruksi</label>
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  const p = projects.find((item) => item.id === e.target.value);
                  if (p) setProjectLocation(`${p.address}, ${p.city}`);
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name} ({p.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp PIC Kontraktor</label>
              <input
                type="text"
                value={customerWa}
                onChange={(e) => setCustomerWa(e.target.value)}
                placeholder="628xxxxxxxxxx"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Titik Lokasi Proyek</label>
              <input
                type="text"
                value={projectLocation}
                onChange={(e) => setProjectLocation(e.target.value)}
                required
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          {/* SPH Dates and Validity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Terbit SPH *</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Masa Berlaku Penawaran *</label>
              <input
                type="date"
                value={validUntilDate}
                onChange={(e) => setValidUntilDate(e.target.value)}
                required
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rencana Tanggal Cor</label>
              <input
                type="date"
                value={pourDate}
                onChange={(e) => setPourDate(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Rincian Item Penawaran Harga
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Uraian Layanan</th>
                    <th className="p-2.5 w-20 text-center">Vol</th>
                    <th className="p-2.5 w-24">Satuan</th>
                    <th className="p-2.5 w-32 text-right">Harga Satuan (Rp)</th>
                    <th className="p-2.5 w-36 text-right">Subtotal</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="p-2">
                        <input
                          type="text"
                          value={it.item_name}
                          onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded font-medium"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded text-center font-mono"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={it.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="10000"
                          value={it.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded text-right font-mono"
                          required
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(it.subtotal)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary & Tax */}
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Diskon Khusus Pelanggan (Rp)</span>
                <input
                  type="number"
                  step="50000"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-36 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right text-emerald-400 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={applyTax}
                    onChange={(e) => setApplyTax(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-400 bg-slate-800 border-slate-700"
                  />
                  <span>Faktur Pajak PPN 11%</span>
                </label>
                <span className="text-slate-400 font-mono text-xs">
                  {applyTax ? formatRupiah(taxAmount) : 'Non-PPN'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 w-full md:w-72 font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>PPN (11%):</span>
                <span>{formatRupiah(taxAmount)}</span>
              </div>
              <div className="border-t border-slate-700 pt-1.5 flex justify-between font-sans items-baseline">
                <span className="text-xs font-bold text-orange-400">TOTAL SPH:</span>
                <span className="text-base font-black text-white font-mono">{formatRupiah(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Termin Pembayaran</label>
              <textarea
                rows={3}
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Syarat & Ketentuan Teknis</label>
              <textarea
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Status & Signer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Penawaran</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuotationStatus)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold"
              >
                <option value="draft">Draft (Konsep)</option>
                <option value="terkirim">Terkirim ke Kontraktor</option>
                <option value="disetujui">Disetujui (Deal)</option>
                <option value="ditolak">Ditolak / Batal</option>
                <option value="kadaluarsa">Kadaluarsa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penanda Tangan</label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan Resmi</label>
              <input
                type="text"
                value={signatureTitle}
                onChange={(e) => setSignatureTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialData ? 'Perbarui SPH' : 'Simpan & Terbitkan SPH'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
