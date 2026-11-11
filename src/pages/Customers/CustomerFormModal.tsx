import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Shield,
  Save,
  MessageSquare,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { Customer, CustomerSegment, CustomerStatus } from '../../types/database';
import { validateIndonesianWA, formatDisplayWA } from '../../lib/whatsapp';
import { checkDuplicateCustomer, createCustomer, updateCustomer } from '../../lib/customer-store';
import { useAuth } from '../../context/AuthContext';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCustomer?: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingCustomer,
}) => {
  const { user, role } = useAuth();
  const isEdit = Boolean(existingCustomer);

  const [companyName, setCompanyName] = useState('');
  const [picName, setPicName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Jakarta Timur');
  const [province, setProvince] = useState('DKI Jakarta');
  const [postalCode, setPostalCode] = useState('');
  const [segment, setSegment] = useState<CustomerSegment>('kontraktor_swasta');
  const [status, setStatus] = useState<CustomerStatus>('aktif');
  const [taxId, setTaxId] = useState('');
  const [creditLimit, setCreditLimit] = useState(50000000);
  const [paymentTermDays, setPaymentTermDays] = useState(14);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset or fill fields on open
  useEffect(() => {
    if (existingCustomer) {
      setCompanyName(existingCustomer.company_name);
      setPicName(existingCustomer.pic_name);
      setWhatsapp(existingCustomer.whatsapp_number);
      setSecondaryPhone(existingCustomer.secondary_phone || '');
      setEmail(existingCustomer.email || '');
      setAddress(existingCustomer.address);
      setCity(existingCustomer.city);
      setProvince(existingCustomer.province);
      setPostalCode(existingCustomer.postal_code || '');
      setSegment(existingCustomer.segment);
      setStatus(existingCustomer.status);
      setTaxId(existingCustomer.tax_id || '');
      setCreditLimit(existingCustomer.credit_limit || 50000000);
      setPaymentTermDays(existingCustomer.payment_term_days || 14);
      setNotes(existingCustomer.notes || '');
    } else {
      setCompanyName('');
      setPicName('');
      setWhatsapp('');
      setSecondaryPhone('');
      setEmail('');
      setAddress('');
      setCity('Jakarta Timur');
      setProvince('DKI Jakarta');
      setPostalCode('');
      setSegment('kontraktor_swasta');
      setStatus('aktif');
      setTaxId('');
      setCreditLimit(50000000);
      setPaymentTermDays(14);
      setNotes('');
    }
    setErrorMessage('');
  }, [existingCustomer, isOpen]);

  if (!isOpen) return null;

  // Live WA validation
  const waValidation = validateIndonesianWA(whatsapp);

  // Live Duplicate detection
  const dupCheck = checkDuplicateCustomer(
    waValidation.isValid ? waValidation.normalized : whatsapp,
    companyName,
    existingCustomer?.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMessage('');

    if (!companyName.trim()) {
      setErrorMessage('Nama perusahaan/usaha wajib diisi.');
      return;
    }

    if (!picName.trim()) {
      setErrorMessage('Nama PIC / Kontak utama wajib diisi.');
      return;
    }

    if (!waValidation.isValid) {
      setErrorMessage(`Nomor WhatsApp tidak valid: ${waValidation.error}`);
      return;
    }

    if (dupCheck.isDuplicate) {
      setErrorMessage(
        dupCheck.matchedField === 'whatsapp'
          ? `Nomor WhatsApp sudah digunakan oleh ${dupCheck.existingCustomer?.company_name} (${dupCheck.existingCustomer?.customer_code})`
          : `Nama perusahaan "${companyName}" sudah terdaftar dengan kode ${dupCheck.existingCustomer?.customer_code}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && existingCustomer) {
        const res = await updateCustomer(
          existingCustomer.id,
          {
            company_name: companyName.trim(),
            pic_name: picName.trim(),
            whatsapp_number: waValidation.normalized,
            secondary_phone: secondaryPhone.trim(),
            email: email.trim(),
            address: address.trim(),
            city: city.trim(),
            province: province.trim(),
            postal_code: postalCode.trim(),
            segment,
            status,
            tax_id: taxId.trim(),
            credit_limit: creditLimit,
            payment_term_days: paymentTermDays,
            notes: notes.trim(),
          },
          user.email,
          role
        );

        if (!res.success) {
          setErrorMessage(res.error || 'Gagal memperbarui data customer.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createCustomer(
          {
            company_name: companyName.trim(),
            pic_name: picName.trim(),
            whatsapp_number: waValidation.normalized,
            secondary_phone: secondaryPhone.trim(),
            email: email.trim(),
            address: address.trim() || 'Alamat proyek / pool',
            city: city.trim(),
            province: province.trim(),
            postal_code: postalCode.trim(),
            segment,
            status,
            tax_id: taxId.trim(),
            credit_limit: creditLimit,
            payment_term_days: paymentTermDays,
            total_transaction_value: 0,
            total_paid: 0,
            total_outstanding: 0,
            notes: notes.trim(),
          },
          user.email,
          role
        );

        if (!res.success) {
          setErrorMessage(res.error || 'Gagal menyimpan customer.');
          setIsSubmitting(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEdit ? `Edit Customer (${existingCustomer?.customer_code})` : 'Tambah Customer Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                Data kontraktor, batching plant, atau mandor penyewa pompa beton
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Duplicate Alert if detected */}
          {dupCheck.isDuplicate && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Peringatan Duplikasi Terdeteksi!</p>
                <p className="mt-0.5">
                  {dupCheck.matchedField === 'whatsapp'
                    ? `Nomor WhatsApp cocok dengan customer terdaftar: "${dupCheck.existingCustomer?.company_name}" (${dupCheck.existingCustomer?.customer_code})`
                    : `Nama perusahaan "${companyName}" cocok dengan customer terdaftar (${dupCheck.existingCustomer?.customer_code})`}
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Profil Perusahaan & PIC */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-orange-600">
              1. Identitas Perusahaan & PIC
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Perusahaan / Kontraktor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. PT Wijaya Karya (Persero) Tbk"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama PIC Utama Lapangan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="e.g. Ir. Hendra Kusuma (Site Manager)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Indonesia <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. 081288991122 atau +62812..."
                    className={`w-full px-3 py-2 rounded-lg border text-xs font-mono pr-8 ${
                      whatsapp && !waValidation.isValid
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : whatsapp && waValidation.isValid
                        ? 'border-emerald-400 focus:ring-emerald-500/20'
                        : 'border-slate-300 focus:ring-orange-500/20'
                    }`}
                  />
                  {whatsapp && (
                    <span className="absolute right-2.5 top-2.5">
                      {waValidation.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </span>
                  )}
                </div>
                {whatsapp && (
                  <p
                    className={`text-[11px] mt-1 font-mono ${
                      waValidation.isValid ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {waValidation.isValid
                      ? `Format Baku: ${waValidation.formatted} (Meta WA: ${waValidation.normalized})`
                      : waValidation.error}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email PIC / Kantor
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. logistik@kontraktor.co.id"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Segmentasi & Status */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-orange-600">
              2. Segmentasi Bisnis & Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Segmentasi Customer
                </label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as CustomerSegment)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="kontraktor_bumn">Kontraktor BUMN (WIKA, Adhi, PP, Waskita)</option>
                  <option value="kontraktor_swasta">Kontraktor Swasta (Total, Jaya Konstruksi, dll)</option>
                  <option value="batching_plant">Batching Plant Mitra (Jayamix, Holcim, Pionir)</option>
                  <option value="developer">Developer & Pengembang Properti</option>
                  <option value="mandor_perorangan">Mandor / Subkon Cor / Rumah Tinggal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Customer
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="aktif">Aktif (Rutin Sewa Pompa)</option>
                  <option value="prospek">Prospek (Penjajakan Awal)</option>
                  <option value="macet">Macet / Blacklist (Piutang Menumpuk)</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NPWP Perusahaan (Opsional)
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="01.889.771.2-031.000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kota / Wilayah Utama Cor
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Jakarta Timur, Bekasi, Tangerang"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Kantor / Proyek Utama
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat kantor kontraktor atau titik proyek cor..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Plafon Kredit & Ketentuan Sewa */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-orange-600">
              3. Ketentuan Penagihan & Kredit (IDR)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plafon Kredit Sewa (Rp)
                </label>
                <input
                  type="number"
                  step="5000000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Batas maksimal piutang sewa sebelum order berikutnya ditahan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jangka Waktu Pembayaran (Term of Payment - Hari)
                </label>
                <input
                  type="number"
                  value={paymentTermDays}
                  onChange={(e) => setPaymentTermDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Standar: 14 hari setelah penagihan invoice cor.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Kebutuhan Pompa & Lapangan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Sering butuh Long Boom 42m, jam cor malam hari, jalan akses mixer agak sempit..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {isEdit ? 'Perubahan akan dicatat pada Audit Log' : 'Nomor customer otomatis dibuat'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Customer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
