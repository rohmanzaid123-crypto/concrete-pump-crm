/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Booking Form Modal: Interactive Booking Creation & Edit with Live Conflict Engine
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Truck,
  Calculator,
  User,
  MapPin,
  ShieldAlert,
  Percent,
  Plus,
} from 'lucide-react';
import {
  Booking,
  Customer,
  PricingModelType,
  Project,
  PumpCategoryCode,
  PumpUnit,
} from '../../types/database';
import { formatRupiah, formatNumber } from '../../lib/formatters';
import { PUMP_CATEGORIES } from '../../lib/fleet-store';
import {
  calculateBookingPrice,
  getRecommendedUnits,
  UnitRecommendation,
  validateBookingConflict,
} from '../../lib/booking-store';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: any) => Promise<{ success: boolean; error?: string }>;
  initialData?: Booking | null;
  customers: Customer[];
  projects: Project[];
  units: PumpUnit[];
  onAddNewProject?: (projectData: any) => Promise<Project>;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  customers,
  projects,
  units,
}) => {
  // 1. Form States
  const [customerId, setCustomerId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [projectLocation, setProjectLocation] = useState<string>('');
  
  const [pumpCategoryCode, setPumpCategoryCode] = useState<PumpCategoryCode>('standard_24_36m');
  const [requestedBoomMeters, setRequestedBoomMeters] = useState<number>(36);
  
  const [pourDate, setPourDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState<string>('08:00');
  const [durationHours, setDurationHours] = useState<number>(8);
  const [mobilizationBuffer, setMobilizationBuffer] = useState<number>(2);
  
  const [volumeM3, setVolumeM3] = useState<number>(50);
  const [concreteGrade, setConcreteGrade] = useState<string>('K-300 Slump 12±2');
  const [extraPipesCount, setExtraPipesCount] = useState<number>(0);
  const [cementBeddingSacks, setCementBeddingSacks] = useState<number>(2);
  
  // Resource Assignment
  const [assignedUnitId, setAssignedUnitId] = useState<string>('');
  const [assignedOperatorName, setAssignedOperatorName] = useState<string>('');
  const [assignedDriverName, setAssignedDriverName] = useState<string>('');
  
  // Pricing states
  const [pricingModel, setPricingModel] = useState<PricingModelType>('paket');
  const [customMobilizationPrice, setCustomMobilizationPrice] = useState<number>(1000000);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(true);
  
  const [status, setStatus] = useState<Booking['status']>('quotation');
  const [notes, setNotes] = useState<string>('');
  
  // Engine results
  const [recommendations, setRecommendations] = useState<UnitRecommendation[]>([]);
  const [liveConflict, setLiveConflict] = useState<{ hasConflict: boolean; reason?: string }>({ hasConflict: false });
  const [isCheckingConflict, setIsCheckingConflict] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute End Time automatically
  const computedEndTime = useMemo(() => {
    try {
      const [hStr, mStr] = startTime.split(':');
      const startH = parseInt(hStr, 10);
      const startM = parseInt(mStr, 10);
      const totalMinutes = startH * 60 + startM + Math.round(durationHours * 60);
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } catch {
      return '16:00';
    }
  }, [startTime, durationHours]);

  // Sync initial data if editing
  useEffect(() => {
    if (initialData) {
      setCustomerId(initialData.customer_id);
      setProjectId(initialData.project_id);
      setProjectLocation(initialData.project_location);
      setPumpCategoryCode(initialData.pump_category_code);
      setRequestedBoomMeters(initialData.requested_boom_meters);
      setPourDate(initialData.pour_date);
      setStartTime(initialData.start_time);
      setDurationHours(initialData.estimated_duration_hours);
      setMobilizationBuffer(initialData.mobilization_buffer_hours);
      setVolumeM3(initialData.volume_m3);
      setConcreteGrade(initialData.concrete_grade);
      setExtraPipesCount(initialData.extra_pipes_count);
      setCementBeddingSacks(initialData.cement_bedding_sacks);
      setAssignedUnitId(initialData.assigned_unit_id || '');
      setAssignedOperatorName(initialData.assigned_operator_name || '');
      setAssignedDriverName(initialData.assigned_driver_name || '');
      setPricingModel(initialData.pricing_model);
      setCustomMobilizationPrice(initialData.mobilization_price);
      setDiscountAmount(initialData.discount_amount);
      setApplyTax(initialData.apply_tax);
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
    } else {
      // Defaults for new booking
      if (customers.length > 0) setCustomerId(customers[0].id);
      if (projects.length > 0) {
        setProjectId(projects[0].id);
        setProjectLocation(projects[0].address + ', ' + projects[0].city);
      }
      setAssignedUnitId('');
      setAssignedOperatorName('');
      setAssignedDriverName('');
    }
  }, [initialData, isOpen, customers, projects]);

  // When customer changes, filter projects
  const filteredProjects = useMemo(() => {
    if (!customerId) return projects;
    const p = projects.filter((item) => item.customer_id === customerId);
    return p.length > 0 ? p : projects;
  }, [customerId, projects]);

  // Auto update project address when project changes
  const handleProjectChange = (pId: string) => {
    setProjectId(pId);
    const proj = projects.find((p) => p.id === pId);
    if (proj) {
      setProjectLocation(`${proj.address}, ${proj.city}`);
    }
  };

  // Run Smart Recommendation & Conflict Checking whenever schedule / unit changes
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    async function evaluateEngine() {
      setIsCheckingConflict(true);

      // 1. Fetch unit recommendations for this category and time
      const recs = await getRecommendedUnits({
        categoryCode: pumpCategoryCode,
        requestedBoomMeters,
        pourDate,
        startTime,
        endTime: computedEndTime,
        mobilizationBufferHours: mobilizationBuffer,
        excludeBookingId: initialData?.id,
      });

      if (isCancelled) return;
      setRecommendations(recs);

      // 2. Validate current assigned unit & operator
      if (assignedUnitId) {
        const selectedUnit = units.find((u) => u.id === assignedUnitId);
        const conflictRes = await validateBookingConflict({
          bookingId: initialData?.id,
          unitId: assignedUnitId,
          unitCode: selectedUnit?.unit_code,
          operatorName: assignedOperatorName,
          pourDate,
          startTime,
          endTime: computedEndTime,
          mobilizationBufferHours: mobilizationBuffer,
        });

        if (!isCancelled) {
          setLiveConflict(conflictRes);
        }
      } else {
        setLiveConflict({ hasConflict: false });
      }

      setIsCheckingConflict(false);
    }

    evaluateEngine();

    return () => {
      isCancelled = true;
    };
  }, [
    isOpen,
    pumpCategoryCode,
    requestedBoomMeters,
    pourDate,
    startTime,
    computedEndTime,
    mobilizationBuffer,
    assignedUnitId,
    assignedOperatorName,
    initialData,
    units,
  ]);

  // Calculate live pricing
  const calculatedPricing = useMemo(() => {
    return calculateBookingPrice({
      category_code: pumpCategoryCode,
      pricing_model: pricingModel,
      volume_m3: volumeM3,
      duration_hours: durationHours,
      extra_pipes_count: extraPipesCount,
      cement_bedding_sacks: cementBeddingSacks,
      custom_mobilization_price: customMobilizationPrice,
      discount_amount: discountAmount,
      apply_tax: applyTax,
    });
  }, [
    pumpCategoryCode,
    pricingModel,
    volumeM3,
    durationHours,
    extraPipesCount,
    cementBeddingSacks,
    customMobilizationPrice,
    discountAmount,
    applyTax,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Hard block if conflict exists
    if (liveConflict.hasConflict) {
      setErrorMessage(`Peringatan Konflik: ${liveConflict.reason}. Pilih unit atau jadwal lain sebelum menyimpan.`);
      return;
    }

    const selectedCust = customers.find((c) => c.id === customerId);
    const selectedProj = projects.find((p) => p.id === projectId);
    const selectedUnit = units.find((u) => u.id === assignedUnitId);

    if (!selectedCust) {
      setErrorMessage('Silakan pilih data Customer.');
      return;
    }

    setIsSubmitting(true);

    const bookingPayload = {
      customer_id: selectedCust.id,
      customer_name: selectedCust.company_name,
      customer_wa: selectedCust.whatsapp_number,
      project_id: selectedProj?.id || 'prj-manual',
      project_name: selectedProj?.project_name || 'Proyek Lapangan',
      project_location: projectLocation,
      pump_category_code: pumpCategoryCode,
      requested_boom_meters: Number(requestedBoomMeters),
      pour_date: pourDate,
      start_time: startTime,
      end_time: computedEndTime,
      estimated_duration_hours: Number(durationHours),
      mobilization_buffer_hours: Number(mobilizationBuffer),
      volume_m3: Number(volumeM3),
      concrete_grade: concreteGrade,
      extra_pipes_count: Number(extraPipesCount),
      cement_bedding_sacks: Number(cementBeddingSacks),
      assigned_unit_id: assignedUnitId || undefined,
      assigned_unit_code: selectedUnit?.unit_code || undefined,
      assigned_operator_name: assignedOperatorName || selectedUnit?.primary_operator_name || undefined,
      assigned_driver_name: assignedDriverName || selectedUnit?.driver_name || undefined,
      pricing_model: pricingModel,
      base_price: calculatedPricing.base_price,
      extra_volume_price: calculatedPricing.extra_volume_price,
      extra_hour_price: calculatedPricing.extra_hour_price,
      mobilization_price: calculatedPricing.mobilization_price,
      additional_costs: calculatedPricing.additional_costs,
      discount_amount: calculatedPricing.discount_amount,
      subtotal: calculatedPricing.subtotal,
      apply_tax: applyTax,
      tax_amount: calculatedPricing.tax_amount,
      total_price: calculatedPricing.total_price,
      status: status,
      notes: notes,
    };

    try {
      const res = await onSubmit(bookingPayload);
      if (!res.success) {
        setErrorMessage(res.error || 'Terjadi kesalahan saat menyimpan booking');
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialData ? `Edit Booking: ${initialData.booking_code}` : 'Buat Booking & Jadwal Pengecoran Baru'}
              </h2>
              <p className="text-xs text-slate-400">
                Kalkulasi tarif otomatis, verifikasi konflik armada, dan alokasi operator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Conflict Alert Banner */}
          {liveConflict.hasConflict && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-300 flex items-start gap-3 text-red-800">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-red-900">Peringatan Bentrok Jadwal / Kendala Armada!</p>
                <p className="text-red-700 mt-0.5">{liveConflict.reason}</p>
                <p className="text-xs text-red-600 mt-1">
                  Sistem mencegah double-booking unit & operator agar operasional lapangan berjalan tanpa kegagalan cor.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-3 text-amber-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION 1: PELANGGAN & PROYEK */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" />
              1. Identitas Pelanggan & Lokasi Proyek
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Customer *</label>
                <select
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                  }}
                  required
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  <option value="">-- Pilih Customer Terdaftar --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.customer_code}) - PIC: {c.pic_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Proyek Properti / Infrastruktur *</label>
                <select
                  value={projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  required
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  <option value="">-- Pilih Proyek Terdaftar --</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Titik Pengecoran (Site Location) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    required
                    placeholder="Contoh: Jl. Boulevard Silk Town Kav. 12, Serpong, Tangerang Selatan"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: JADWAL & VOLUME PENGECORAN */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              2. Jadwal Pengecoran & Spesifikasi Teknis
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Cor *</label>
                <input
                  type="date"
                  value={pourDate}
                  onChange={(e) => setPourDate(e.target.value)}
                  required
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai Cor *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimasi Durasi (Jam) *
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    required
                    className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Selesai: <span className="font-semibold text-slate-800">{computedEndTime} WIB</span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buffer Mobilisasi (Jam)
                </label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  step="0.5"
                  value={mobilizationBuffer}
                  onChange={(e) => setMobilizationBuffer(Number(e.target.value))}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">Waktu jalan bolak-balik pool</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimasi Volume (m³) *</label>
                <input
                  type="number"
                  min="5"
                  max="1000"
                  value={volumeM3}
                  onChange={(e) => setVolumeM3(Number(e.target.value))}
                  required
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mutu Beton Ready Mix</label>
                <select
                  value={concreteGrade}
                  onChange={(e) => setConcreteGrade(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="K-250 Slump 10±2">K-250 Slump 10±2 (Dak/Lantai Biasa)</option>
                  <option value="K-300 Slump 12±2">K-300 Slump 12±2 (Standar Gedung/Ruko)</option>
                  <option value="K-350 Slump 12±2">K-350 Slump 12±2 (Struktur Berat)</option>
                  <option value="K-400 Slump 14±2">K-400 Slump 14±2 (Infrastruktur/LRT)</option>
                  <option value="K-500 Self Compacting">K-500 SCC (Core Wall/High Rise)</option>
                  <option value="FS-45 Rigid Pavement">FS-45 Flexural (Jalan Tol Rigid)</option>
                  <option value="B0 / LC">B0 / Lean Concrete (Lantai Kerja)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pipa Tambahan (Batang @3m)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={extraPipesCount}
                  onChange={(e) => setExtraPipesCount(Number(e.target.value))}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[10px] text-slate-500">Tarif sewa pipa sambungan</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Semen Pelicin Bedding (Sak)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={cementBeddingSacks}
                  onChange={(e) => setCementBeddingSacks(Number(e.target.value))}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[10px] text-slate-500">Pelumas pipa sebelum adukan</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: REKOMENDASI & ALOKASI ARMADA */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-600" />
                3. Rekomendasi Armada & Alokasi Kru Operator
              </h3>
              {isCheckingConflict && (
                <span className="text-xs text-orange-600 animate-pulse font-medium">
                  Memeriksa ketersediaan armada & jadwal...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Armada Dibutuhkan *</label>
                <select
                  value={pumpCategoryCode}
                  onChange={(e) => {
                    const code = e.target.value as PumpCategoryCode;
                    setPumpCategoryCode(code);
                    if (code === 'mini_pump') setRequestedBoomMeters(21);
                    else if (code === 'long_boom_37_42m') setRequestedBoomMeters(42);
                    else if (code === 'super_long_boom') setRequestedBoomMeters(48);
                    else if (code === 'kodok_portable') setRequestedBoomMeters(0);
                    else setRequestedBoomMeters(36);
                  }}
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
                >
                  {PUMP_CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.name} ({cat.boom_range_label})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kebutuhan Panjang Boom</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="65"
                    value={requestedBoomMeters}
                    onChange={(e) => setRequestedBoomMeters(Number(e.target.value))}
                    className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-slate-500 font-semibold">Meter</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Unit Pompa Ditugaskan *</label>
                <select
                  value={assignedUnitId}
                  onChange={(e) => {
                    const uId = e.target.value;
                    setAssignedUnitId(uId);
                    const selected = units.find((u) => u.id === uId);
                    if (selected) {
                      setAssignedOperatorName(selected.primary_operator_name);
                      setAssignedDriverName(selected.driver_name || '');
                    }
                  }}
                  required
                  className={`w-full text-sm bg-white border rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-orange-500 ${
                    liveConflict.hasConflict
                      ? 'border-red-500 text-red-700 bg-red-50'
                      : 'border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">-- Pilih Unit Armada --</option>
                  {units.map((u) => {
                    const rec = recommendations.find((r) => r.unit.id === u.id);
                    const hasConflict = rec?.conflictResult.hasConflict;
                    return (
                      <option
                        key={u.id}
                        value={u.id}
                        disabled={hasConflict}
                        className={hasConflict ? 'text-red-400 bg-slate-100' : 'text-slate-900'}
                      >
                        {u.unit_code} - {u.name} ({u.boom_length_meters}m) - [{u.plate_number}]
                        {hasConflict ? ' ❌ (Bentrok / Maintenance)' : ' ✔ (Tersedia)'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Smart Recommended Quick-Select Chips */}
            <div className="mt-2">
              <span className="text-xs font-semibold text-slate-600 block mb-2">
                Unit Direkomendasikan Sistem (Bebas Bentrok & Kategori Sesuai):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {recommendations
                  .filter((r) => r.isRecommended)
                  .slice(0, 3)
                  .map((rec) => {
                    const isSelected = assignedUnitId === rec.unit.id;
                    return (
                      <button
                        type="button"
                        key={rec.unit.id}
                        onClick={() => {
                          setAssignedUnitId(rec.unit.id);
                          setAssignedOperatorName(rec.unit.primary_operator_name);
                          setAssignedDriverName(rec.unit.driver_name || '');
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2 ${
                          isSelected
                            ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isSelected ? 'text-orange-600' : 'text-emerald-500'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {rec.unit.unit_code} • {rec.unit.boom_length_meters}m
                          </p>
                          <p className="text-[11px] text-slate-600 truncate">{rec.unit.name}</p>
                          <p className="text-[10px] text-emerald-600 font-medium">Bebas jadwal & KIR aktif</p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Operator and Driver Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Operator Pompa (SIO Kemenaker) *
                </label>
                <input
                  type="text"
                  value={assignedOperatorName}
                  onChange={(e) => setAssignedOperatorName(e.target.value)}
                  placeholder="Contoh: Wahyudi Pratama (SIO Kelas II)"
                  required
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Driver Truk Sasis (SIM B2 Umum)
                </label>
                <input
                  type="text"
                  value={assignedDriverName}
                  onChange={(e) => setAssignedDriverName(e.target.value)}
                  placeholder="Contoh: Supardi Hartono"
                  className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: KALKULATOR TARIF FLEKSIBEL */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-inner border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold tracking-wide">
                  4. Kalkulator Tarif Fleksibel (Standar Sewa Pompa Indonesia)
                </h3>
              </div>
              {/* Pricing model tabs */}
              <div className="flex items-center bg-slate-800 p-1 rounded-lg text-xs">
                {(['paket', 'per_jam', 'per_m3', 'kombinasi'] as PricingModelType[]).map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setPricingModel(mode)}
                    className={`px-2.5 py-1 rounded font-semibold transition-all ${
                      pricingModel === mode
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode === 'paket' ? 'Paket 8 Jam / 50m³' : mode === 'per_jam' ? 'Per Jam' : mode === 'per_m3' ? 'Per m³' : 'Kombinasi'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Variable controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Biaya Mobilisasi Armada (IDR)</span>
                  <input
                    type="number"
                    step="100000"
                    value={customMobilizationPrice}
                    onChange={(e) => setCustomMobilizationPrice(Number(e.target.value))}
                    className="w-36 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right text-white font-mono text-xs focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Diskon Khusus Pelanggan (IDR)</span>
                  <input
                    type="number"
                    step="50000"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-36 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right text-emerald-400 font-mono text-xs focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={applyTax}
                      onChange={(e) => setApplyTax(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-400 bg-slate-800 border-slate-700"
                    />
                    <span>Kenakan PPN 11% (Faktur Pajak)</span>
                  </label>
                  <span className="text-slate-400 font-mono text-xs">
                    {applyTax ? formatRupiah(calculatedPricing.tax_amount) : 'Non-PPN'}
                  </span>
                </div>
              </div>

              {/* Live breakdown breakdown summary */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Tarif Minimum / Paket Dasar:</span>
                  <span>{formatRupiah(calculatedPricing.base_price)}</span>
                </div>
                {calculatedPricing.extra_volume_price > 0 && (
                  <div className="flex justify-between text-amber-300">
                    <span>
                      Kelebihan Volume ({Math.max(0, volumeM3 - 50)} m³):
                    </span>
                    <span>+{formatRupiah(calculatedPricing.extra_volume_price)}</span>
                  </div>
                )}
                {calculatedPricing.extra_hour_price > 0 && (
                  <div className="flex justify-between text-amber-300">
                    <span>
                      Overtime / Lembur ({Math.max(0, durationHours - 8)} jam):
                    </span>
                    <span>+{formatRupiah(calculatedPricing.extra_hour_price)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Mobilisasi Truk Pompa:</span>
                  <span>+{formatRupiah(calculatedPricing.mobilization_price)}</span>
                </div>
                {calculatedPricing.additional_costs > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Pipa Tambahan & Semen Bedding:</span>
                    <span>+{formatRupiah(calculatedPricing.additional_costs)}</span>
                  </div>
                )}
                {calculatedPricing.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Diskon Disetujui:</span>
                    <span>-{formatRupiah(calculatedPricing.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 flex justify-between text-slate-400 font-sans">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatRupiah(calculatedPricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-sans">
                  <span>PPN (11%):</span>
                  <span className="font-mono">{formatRupiah(calculatedPricing.tax_amount)}</span>
                </div>
                <div className="border-t-2 border-orange-500/50 pt-2 flex justify-between items-baseline font-sans">
                  <span className="text-sm font-bold text-orange-400">TOTAL ESTIMASI TAGIHAN:</span>
                  <span className="text-xl font-black text-white font-mono tracking-tight">
                    {formatRupiah(calculatedPricing.total_price)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: STATUS & CATATAN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Booking Awal</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Booking['status'])}
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-orange-500"
              >
                <option value="inquiry">Inquiry (Permintaan Awal)</option>
                <option value="quotation">Quotation (Penawaran SPH)</option>
                <option value="pending_confirmation">Pending Confirmation (PO)</option>
                <option value="confirmed">Confirmed (Terkonfirmasi DP)</option>
                <option value="scheduled">Scheduled (Terkunci di Kalender)</option>
                <option value="on_progress">On Progress (Sedang Pengecoran)</option>
                <option value="completed">Completed (Selesai Pengecoran)</option>
                <option value="cancelled">Cancelled (Dibatalkan)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Lapangan & Instruksi Khusus
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Akses jalan sempit, wajib pasang rambu keselamatan & pelat outrigger tebal."
                className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold text-sm transition-colors"
            >
              Batal
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Pengecekan bentrok jadwal otomatis aktif
              </span>
              <button
                type="submit"
                disabled={isSubmitting || liveConflict.hasConflict}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center gap-2 transition-all ${
                  liveConflict.hasConflict
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{initialData ? 'Perbarui Jadwal Booking' : 'Konfirmasi & Jadwalkan Booking'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
