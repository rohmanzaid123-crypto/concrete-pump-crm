import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Wrench,
  Shield,
  Calendar,
  Clock,
  Gauge,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Plus,
  Coins,
  MapPin,
  Edit,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import {
  PumpUnit,
  MaintenanceRecord,
  MaintenanceServiceType,
} from '../../types/database';
import {
  fetchUnitMaintenance,
  recordMaintenance,
  checkUnitAvailability,
  PUMP_CATEGORIES,
} from '../../lib/fleet-store';
import { formatRupiah, formatTanggal, formatNumber } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';

interface UnitDetailModalProps {
  unit: PumpUnit | null;
  onClose: () => void;
  onEdit: (unit: PumpUnit) => void;
  onRefresh: () => void;
}

export const UnitDetailModal: React.FC<UnitDetailModalProps> = ({
  unit,
  onClose,
  onEdit,
  onRefresh,
}) => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'specs' | 'maintenance' | 'service_schedule' | 'rentals'>('specs');
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  // Add maintenance inline state
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [serviceType, setServiceType] = useState<MaintenanceServiceType>('servis_berkala');
  const [description, setDescription] = useState('');
  const [technician, setTechnician] = useState('Mekanik Ruslan (Bengkel Pool)');
  const [costAmount, setCostAmount] = useState<number>(15000000);
  const [engineHourAtService, setEngineHourAtService] = useState<number>(unit?.engine_hours || 2500);
  const [damageNotes, setDamageNotes] = useState('');
  const [replacedParts, setReplacedParts] = useState('');
  const [nextRecDate, setNextRecDate] = useState('');

  const loadMaintenance = async () => {
    if (!unit) return;
    const records = await fetchUnitMaintenance(unit.id);
    setMaintenanceRecords(records);
  };

  useEffect(() => {
    loadMaintenance();
  }, [unit]);

  if (!unit) return null;

  const availability = checkUnitAvailability(unit);
  const categoryInfo = PUMP_CATEGORIES.find((c) => c.code === unit.category_code);

  // Status styles
  const statusStyles: Record<string, { label: string; badge: string }> = {
    available: { label: 'Available (Siap di Pool)', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    reserved: { label: 'Reserved (Terbooking)', badge: 'bg-blue-50 text-blue-800 border-blue-300' },
    rented: { label: 'Rented (Sedang di Proyek)', badge: 'bg-purple-50 text-purple-800 border-purple-300' },
    maintenance: { label: 'Maintenance (Servis Bengkel)', badge: 'bg-amber-50 text-amber-800 border-amber-300' },
    out_of_service: { label: 'Out of Service (Rusak)', badge: 'bg-rose-50 text-rose-800 border-rose-300' },
  };

  const handleRecordMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !user) return;

    await recordMaintenance(
      {
        unit_id: unit.id,
        unit_code: unit.unit_code,
        service_date: new Date().toISOString(),
        service_type: serviceType,
        description: description.trim(),
        workshop_technician: technician.trim(),
        cost_amount: Number(costAmount),
        engine_hour_at_service: Number(engineHourAtService),
        damage_notes: damageNotes.trim(),
        replaced_parts: replacedParts.trim(),
        next_recommended_service_date: nextRecDate || undefined,
      },
      user.email,
      role
    );

    setDescription('');
    setDamageNotes('');
    setReplacedParts('');
    setShowAddMaintenance(false);
    loadMaintenance();
    onRefresh();
  };

  // KIR expiry check
  const isKirExpired = new Date(unit.kir_expiry_date) < new Date();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Profile */}
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/60 px-2.5 py-0.5 rounded border border-orange-800">
                  {unit.unit_code}
                </span>
                <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                  {unit.plate_number}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono border ${
                    statusStyles[unit.status]?.badge || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {statusStyles[unit.status]?.label || unit.status}
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white mt-1">
                {unit.name}
              </h1>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>{unit.brand_chassis}</span>
                <span>·</span>
                <span className="text-orange-300">{unit.brand_pump}</span>
                <span>·</span>
                <span>Jangkauan Boom: {unit.boom_length_meters > 0 ? `${unit.boom_length_meters}m` : 'Pipa Kodok'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onEdit(unit)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Spesifikasi</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Intelligent Availability Engine Banner */}
        <div className={`px-6 py-3 border-b flex items-center justify-between text-xs ${
          availability.isAvailable
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            {availability.isAvailable ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>
              <strong>Kesiapan Dispatch:</strong> {availability.reason}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 hidden md:inline">
            Tersinkronisasi dengan Engine Penjadwalan Kalender
          </span>
        </div>

        {/* Technical KPI Metric Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-slate-200 bg-slate-50 divide-x divide-slate-200 text-xs">
          <div className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Panjang Boom
            </span>
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums block mt-0.5">
              {unit.boom_length_meters > 0 ? `${unit.boom_length_meters} Meter` : 'Pipa Manual'}
            </span>
            <span className="text-[10px] text-slate-400">{unit.boom_sections}</span>
          </div>

          <div className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Kapasitas Pompa
            </span>
            <span className="text-base font-bold text-slate-900 font-mono tabular-nums block mt-0.5">
              {unit.output_capacity_m3_hour} m³/jam
            </span>
            <span className="text-[10px] text-slate-400">Tekanan: {unit.max_pressure_bar} Bar</span>
          </div>

          <div className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Hour Meter (Mesin)
            </span>
            <span className="text-base font-bold text-slate-800 font-mono tabular-nums block mt-0.5">
              {formatNumber(unit.engine_hours)} Jam
            </span>
            <span className="text-[10px] text-slate-400">Tahun: {unit.year_manufactured}</span>
          </div>

          <div className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Biaya Servis
            </span>
            <span className="text-base font-bold text-orange-600 font-mono tabular-nums block mt-0.5">
              {formatRupiah(unit.total_maintenance_cost)}
            </span>
            <span className="text-[10px] text-slate-400">Akumulasi riwayat</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-200 bg-white text-xs font-semibold">
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'specs'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Spesifikasi & Dokumen Kendaraan
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'maintenance'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Riwayat Maintenance ({maintenanceRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('service_schedule')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'service_schedule'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Jadwal Servis Berkala
          </button>
          <button
            onClick={() => setActiveTab('rentals')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'rentals'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Riwayat Pengecoran Proyek
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SPESIFIKASI & DOKUMEN */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              {/* Kru yang Ditugaskan */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-orange-600 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Kru Operator Pompa Beton yang Ditugaskan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Operator Boom Utama</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{unit.primary_operator_name}</p>
                    <span className="inline-block mt-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                      SIO Kemenaker Aktif
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Operator Cadangan / Helper</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{unit.secondary_operator_name || 'Helper Standby'}</p>
                    <span className="text-[11px] text-slate-500">Pemasangan & Pembersihan Pipa</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Driver Truk Pompa</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{unit.driver_name || 'Driver Standby'}</p>
                    <span className="text-[11px] text-slate-500 font-mono">SIM B2 UMUM</span>
                  </div>
                </div>
              </div>

              {/* Dokumen Legal Kendaraan */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 text-orange-600 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Legalitas & Masa Berlaku Dokumen Kendaraan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[11px] block">Masa Berlaku STNK Tahunan:</span>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-1">
                      {formatTanggal(unit.stnk_expiry_date, false)}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-medium">Pajak Kendaraan Aktif</span>
                  </div>

                  <div className={`p-3 rounded-lg border ${
                    isKirExpired
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    <span className="text-[11px] block text-slate-500">Uji Berkala KIR Dishub:</span>
                    <p className="font-mono font-bold text-sm mt-1">
                      {formatTanggal(unit.kir_expiry_date, false)}
                    </p>
                    <span className={`text-[10px] font-bold ${isKirExpired ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {isKirExpired ? '⚠ KEDALUWARSA - Wajib Uji Berkala' : '✓ Uji Kelayakan Sah'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[11px] block">Asuransi Alat Berat & Sasis:</span>
                    <p className="font-mono font-bold text-slate-900 text-sm mt-1">
                      {unit.insurance_expiry_date ? formatTanggal(unit.insurance_expiry_date, false) : 'Polis All Risk Aktif'}
                    </p>
                    <span className="text-[10px] text-slate-500">Comprehensive Heavy Equipment</span>
                  </div>
                </div>
              </div>

              {/* Rincian Teknis Pompa */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Detail Arsitektur Mesin Pompa
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-500 block">Sasis Truk:</span>
                    <p className="font-bold text-slate-900">{unit.brand_chassis}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Manufaktur Pompa:</span>
                    <p className="font-bold text-slate-900">{unit.brand_pump}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sistem Lipatan:</span>
                    <p className="font-bold text-slate-900">{unit.boom_sections}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tekanan Pompa:</span>
                    <p className="font-bold text-slate-900">{unit.max_pressure_bar} Bar</p>
                  </div>
                </div>

                {unit.notes && (
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <span className="text-slate-500 block mb-1">Catatan Khusus Lapangan:</span>
                    <p className="text-slate-700 italic">{unit.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RIWAYAT MAINTENANCE & CATATAN KERUSAKAN */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Log Perawatan Berkala, Suku Cadang & Kerusakan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Riwayat penggantian wear plate, oli hidrolik, piston sekat, seal, dan biaya servis.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddMaintenance(!showAddMaintenance)}
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Servis Baru</span>
                </button>
              </div>

              {/* Inline Form Add Maintenance */}
              {showAddMaintenance && (
                <form onSubmit={handleRecordMaintenanceSubmit} className="p-4 bg-orange-50/50 rounded-xl border border-orange-200 space-y-3 text-xs">
                  <h4 className="font-bold text-orange-950">Catat Perawatan / Servis Unit</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Jenis Perawatan <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="servis_berkala">Servis Berkala (Oli Mesin & Filter)</option>
                        <option value="wear_plate_ring">Ganti Wear Plate & Cutting Ring</option>
                        <option value="ganti_oli_hidrolik">Kuras & Ganti Oli Hidrolik</option>
                        <option value="piston_sekat">Ganti Piston Ram / Karet Sekat</option>
                        <option value="perbaikan_boom">Perbaikan Silinder Boom & Pipa</option>
                        <option value="overhaul_mesin">Overhaul Mesin Sasis</option>
                        <option value="emergency_repair">Perbaikan Darurat Lapangan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Total Biaya Servis (Rp) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={costAmount}
                        onChange={(e) => setCostAmount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Hour Meter Mesin saat Servis
                      </label>
                      <input
                        type="number"
                        value={engineHourAtService}
                        onChange={(e) => setEngineHourAtService(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mekanik / Bengkel Pelaksana
                      </label>
                      <input
                        type="text"
                        value={technician}
                        onChange={(e) => setTechnician(e.target.value)}
                        placeholder="e.g. Bengkel Resmi Sany / Mekanik Ruslan"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Rekomendasi Servis Berikutnya
                      </label>
                      <input
                        type="date"
                        value={nextRecDate}
                        onChange={(e) => setNextRecDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Deskripsi Pekerjaan Servis <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Penggantian suku cadang apa saja yang dikerjakan..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMaintenance(false)}
                      className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded"
                    >
                      Simpan Catatan Servis
                    </button>
                  </div>
                </form>
              )}

              {/* Maintenance List */}
              {maintenanceRecords.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs">
                  Belum ada catatan maintenance untuk unit ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {maintenanceRecords.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase font-mono text-[10px]">
                            {m.service_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-600 font-medium">{m.workshop_technician}</span>
                        </div>
                        <span className="font-mono text-orange-600 font-bold tabular-nums">
                          {formatRupiah(m.cost_amount)}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-medium">
                        {m.description}
                      </p>
                      {m.replaced_parts && (
                        <p className="text-[11px] text-slate-500">
                          <strong>Suku Cadang Diganti:</strong> {m.replaced_parts}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>Waktu Servis: {formatTanggal(m.service_date, true)}</span>
                        <span>Hour Meter: {m.engine_hour_at_service} Jam</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: JADWAL SERVIS BERKALA */}
          {activeTab === 'service_schedule' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider">
                  Pengingat Servis Preventif & Pergantian Suku Cadang
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Jadwal Servis Berikutnya (Kalender):</span>
                    <p className="font-mono font-bold text-base text-slate-900 mt-1">
                      {formatTanggal(unit.next_service_date, false)}
                    </p>
                    <span className="text-[10px] text-orange-600 font-medium block mt-1">
                      Servis ganti oli mesin sasis & sirkuit pompa
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Target Jam Kerja (Hour Meter):</span>
                    <p className="font-mono font-bold text-base text-slate-900 mt-1">
                      {formatNumber(unit.next_service_engine_hours)} Jam
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Sisa jam operasional: {unit.next_service_engine_hours - unit.engine_hours} jam lagi
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RIWAYAT PENGECORAN */}
          {activeTab === 'rentals' && (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700">Akumulasi Realisasi Pemompaan</h4>
              <p className="text-slate-500 mt-1 max-w-md mx-auto">
                Total jam rental: <strong>{unit.total_rental_hours || 0} Jam</strong> · Total beton dipompa:{' '}
                <strong>{formatNumber(unit.total_m3_pumped || 0)} m³</strong>. Riwayat pekerjaan lengkap terhubung langsung dengan modul <strong>Bookings</strong> dan <strong>Scheduling</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Kode Unit: <strong className="font-mono text-slate-800">{unit.unit_code}</strong> · Terdaftar: {formatTanggal(unit.created_at, false)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
