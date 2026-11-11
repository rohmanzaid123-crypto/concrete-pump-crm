import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Wrench,
  Shield,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  Gauge,
  FileText,
  User,
} from 'lucide-react';
import {
  PumpUnit,
  PumpCategoryCode,
  PumpUnitStatus,
} from '../../types/database';
import { PUMP_CATEGORIES, generateUnitCode, createPumpUnit, updatePumpUnit } from '../../lib/fleet-store';
import { useAuth } from '../../context/AuthContext';

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingUnit?: PumpUnit | null;
  existingUnits: PumpUnit[];
}

export const UnitFormModal: React.FC<UnitFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingUnit,
  existingUnits,
}) => {
  const { user, role } = useAuth();
  const isEdit = Boolean(existingUnit);

  const [categoryCode, setCategoryCode] = useState<PumpCategoryCode>('standard_24_36m');
  const [unitCode, setUnitCode] = useState('');
  const [name, setName] = useState('');
  const [brandChassis, setBrandChassis] = useState('Hino 500 FM 260 JD');
  const [brandPump, setBrandPump] = useState('Putzmeister');
  const [boomLength, setBoomLength] = useState<number>(36);
  const [boomSections, setBoomSections] = useState('4-Section Z-Fold');
  const [outputCapacity, setOutputCapacity] = useState<number>(120);
  const [maxPressure, setMaxPressure] = useState<number>(85);
  const [plateNumber, setPlateNumber] = useState('');
  const [yearManufactured, setYearManufactured] = useState<number>(2022);
  const [engineHours, setEngineHours] = useState<number>(2500);

  // Kru & Operator
  const [operatorName, setOperatorName] = useState('Agus Triono');
  const [secondaryOperator, setSecondaryOperator] = useState('');
  const [driverName, setDriverName] = useState('Sutrisno');

  // Status & Lokasi
  const [status, setStatus] = useState<PumpUnitStatus>('available');
  const [projectLocation, setProjectLocation] = useState('');

  // Jadwal Servis & Dokumen
  const [nextServiceDate, setNextServiceDate] = useState('2026-12-15');
  const [nextServiceHours, setNextServiceHours] = useState<number>(3000);
  const [stnkExpiry, setStnkExpiry] = useState('2027-06-20');
  const [kirExpiry, setKirExpiry] = useState('2026-12-10');
  const [insuranceExpiry, setInsuranceExpiry] = useState('2027-06-20');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-generate code when category or boom changes on new unit
  useEffect(() => {
    if (!existingUnit && isOpen) {
      const generated = generateUnitCode(categoryCode, boomLength, existingUnits);
      setUnitCode(generated);
    }
  }, [categoryCode, boomLength, existingUnit, isOpen, existingUnits]);

  // Load existing data when editing
  useEffect(() => {
    if (existingUnit) {
      setCategoryCode(existingUnit.category_code);
      setUnitCode(existingUnit.unit_code);
      setName(existingUnit.name);
      setBrandChassis(existingUnit.brand_chassis);
      setBrandPump(existingUnit.brand_pump);
      setBoomLength(existingUnit.boom_length_meters);
      setBoomSections(existingUnit.boom_sections);
      setOutputCapacity(existingUnit.output_capacity_m3_hour);
      setMaxPressure(existingUnit.max_pressure_bar);
      setPlateNumber(existingUnit.plate_number);
      setYearManufactured(existingUnit.year_manufactured);
      setEngineHours(existingUnit.engine_hours);
      setOperatorName(existingUnit.primary_operator_name);
      setSecondaryOperator(existingUnit.secondary_operator_name || '');
      setDriverName(existingUnit.driver_name || '');
      setStatus(existingUnit.status);
      setProjectLocation(existingUnit.current_project_location || '');
      setNextServiceDate(existingUnit.next_service_date);
      setNextServiceHours(existingUnit.next_service_engine_hours);
      setStnkExpiry(existingUnit.stnk_expiry_date);
      setKirExpiry(existingUnit.kir_expiry_date);
      setInsuranceExpiry(existingUnit.insurance_expiry_date || '');
      setNotes(existingUnit.notes || '');
    } else {
      setCategoryCode('standard_24_36m');
      setName('');
      setBrandChassis('Hino 500 FM 260 JD');
      setBrandPump('Putzmeister');
      setBoomLength(36);
      setBoomSections('4-Section Z-Fold');
      setOutputCapacity(120);
      setMaxPressure(85);
      setPlateNumber('');
      setYearManufactured(2022);
      setEngineHours(2000);
      setOperatorName('Agus Triono');
      setSecondaryOperator('');
      setDriverName('');
      setStatus('available');
      setProjectLocation('');
      setNextServiceDate('2026-12-20');
      setNextServiceHours(2500);
      setStnkExpiry('2027-06-20');
      setKirExpiry('2026-12-15');
      setInsuranceExpiry('');
      setNotes('');
    }
    setErrorMessage('');
  }, [existingUnit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Nama model pompa wajib diisi.');
      return;
    }

    if (!plateNumber.trim()) {
      setErrorMessage('Nomor polisi plat kendaraan wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && existingUnit) {
        const res = await updatePumpUnit(
          existingUnit.id,
          {
            name: name.trim(),
            category_code: categoryCode,
            brand_chassis: brandChassis.trim(),
            brand_pump: brandPump.trim(),
            boom_length_meters: Number(boomLength) || 0,
            boom_sections: boomSections.trim(),
            output_capacity_m3_hour: Number(outputCapacity),
            max_pressure_bar: Number(maxPressure),
            plate_number: plateNumber.trim().toUpperCase(),
            year_manufactured: Number(yearManufactured),
            engine_hours: Number(engineHours),
            primary_operator_name: operatorName.trim(),
            secondary_operator_name: secondaryOperator.trim(),
            driver_name: driverName.trim(),
            status,
            current_project_location: projectLocation.trim(),
            next_service_date: nextServiceDate,
            next_service_engine_hours: Number(nextServiceHours),
            stnk_expiry_date: stnkExpiry,
            kir_expiry_date: kirExpiry,
            insurance_expiry_date: insuranceExpiry,
            notes: notes.trim(),
          },
          user.email,
          role
        );

        if (!res.success) {
          setErrorMessage(res.error || 'Gagal memperbarui unit pompa.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createPumpUnit(
          {
            unit_code: unitCode.trim(),
            category_code: categoryCode,
            name: name.trim(),
            brand_chassis: brandChassis.trim(),
            brand_pump: brandPump.trim(),
            boom_length_meters: Number(boomLength) || 0,
            boom_sections: boomSections.trim(),
            output_capacity_m3_hour: Number(outputCapacity),
            max_pressure_bar: Number(maxPressure),
            plate_number: plateNumber.trim().toUpperCase(),
            year_manufactured: Number(yearManufactured),
            engine_hours: Number(engineHours),
            primary_operator_name: operatorName.trim(),
            secondary_operator_name: secondaryOperator.trim(),
            driver_name: driverName.trim(),
            status,
            current_project_location: projectLocation.trim(),
            next_service_date: nextServiceDate,
            next_service_engine_hours: Number(nextServiceHours),
            total_maintenance_cost: 0,
            stnk_expiry_date: stnkExpiry,
            kir_expiry_date: kirExpiry,
            insurance_expiry_date: insuranceExpiry,
            total_rental_hours: 0,
            total_m3_pumped: 0,
            notes: notes.trim(),
          },
          user.email,
          role
        );

        if (!res.success) {
          setErrorMessage(res.error || 'Gagal mendaftarkan unit armada.');
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
      <div className="bg-white rounded-xl max-w-3xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEdit ? `Edit Unit Armada (${unitCode})` : 'Registrasi Unit Pompa Beton Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                Input spesifikasi teknis boom, sasis, kapasitas pompa, plat nomor, dan kru operator
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Identitas & Kategori */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-orange-600">
              1. Identitas Unit & Klasifikasi Pompa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Armada <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value as PumpCategoryCode)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  {PUMP_CATEGORIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Unit Armada <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-orange-600 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plat Nomor Polisi (Indonesia) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. B 9123 UXT"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono uppercase font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Model Pompa Beton <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Putzmeister BSF 36.16H / Sany SYG5280THB"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahun Pembuatan
                </label>
                <input
                  type="number"
                  value={yearManufactured}
                  onChange={(e) => setYearManufactured(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Spesifikasi Teknis Boom & Hidrolik */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-orange-600">
              2. Spesifikasi Teknis Boom, Sasis & Hidrolik
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Merk & Tipe Sasis Truk
                </label>
                <input
                  type="text"
                  value={brandChassis}
                  onChange={(e) => setBrandChassis(e.target.value)}
                  placeholder="Hino 500 / Isuzu Giga / Mercedes Actros"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Merk Manufaktur Pompa
                </label>
                <input
                  type="text"
                  value={brandPump}
                  onChange={(e) => setBrandPump(e.target.value)}
                  placeholder="Putzmeister / Sany / Zoomlion / Schwing"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Panjang Jangkauan Boom (Meter)
                </label>
                <input
                  type="number"
                  value={boomLength}
                  onChange={(e) => setBoomLength(Number(e.target.value))}
                  placeholder="0 untuk kodok/pipa"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sistem Lipatan Boom
                </label>
                <select
                  value={boomSections}
                  onChange={(e) => setBoomSections(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="4-Section Z-Fold">4-Section Z-Fold</option>
                  <option value="5-Section RZ-Fold">5-Section RZ-Fold</option>
                  <option value="6-Section RZ-Fold">6-Section RZ-Fold</option>
                  <option value="3-Section Z-Fold">3-Section Z-Fold (Mini)</option>
                  <option value="Pipa Manual (>120 Meter)">Pipa Manual (Stationary / Kodok)</option>
                  <option value="Roll-and-Fold">Roll-and-Fold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kapasitas Output (m³/jam)
                </label>
                <input
                  type="number"
                  value={outputCapacity}
                  onChange={(e) => setOutputCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tekanan Pompa Maksimal (Bar)
                </label>
                <input
                  type="number"
                  value={maxPressure}
                  onChange={(e) => setMaxPressure(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hour Meter / Jam Kerja Mesin (Hours)
                </label>
                <input
                  type="number"
                  value={engineHours}
                  onChange={(e) => setEngineHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Status Operasional & Kru */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-orange-600">
              3. Status Operasional & Kru yang Ditugaskan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Operasional
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PumpUnitStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="available">Available (Siap di Pool)</option>
                  <option value="reserved">Reserved (Terbooking Jadwal)</option>
                  <option value="rented">Rented (Sedang di Proyek Cor)</option>
                  <option value="maintenance">Maintenance (Servis Bengkel)</option>
                  <option value="out_of_service">Out of Service (Rusak / Standby)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi Proyek / Status Terkini
                </label>
                <input
                  type="text"
                  value={projectLocation}
                  onChange={(e) => setProjectLocation(e.target.value)}
                  placeholder="e.g. Proyek Apartemen Silk Town Serpong / Pool Utama Cakung"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operator Boom Utama (SIO)
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Nama Operator Boom"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operator Cadangan / Helper
                </label>
                <input
                  type="text"
                  value={secondaryOperator}
                  onChange={(e) => setSecondaryOperator(e.target.value)}
                  placeholder="Nama Helper Pipa"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Truk Pompa (SIM B2)
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Nama Driver Sasis"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Dokumen Legal & Jadwal Servis */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-orange-600">
              4. Dokumen Kendaraan & Jadwal Servis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Masa Berlaku STNK
                </label>
                <input
                  type="date"
                  value={stnkExpiry}
                  onChange={(e) => setStnkExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Masa Berlaku Uji KIR Dishub
                </label>
                <input
                  type="date"
                  value={kirExpiry}
                  onChange={(e) => setKirExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Servis Berkala Berikutnya
                </label>
                <input
                  type="date"
                  value={nextServiceDate}
                  onChange={(e) => setNextServiceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Kondisi Mesin & Inspeksi Fisik
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ketebalan wear plate, kondisi seal piston, riwayat kebocoran hidrolik..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Perubahan status armada akan disinkronkan ke kalender penjadwalan.
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
              <span>{isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Daftarkan Unit'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
