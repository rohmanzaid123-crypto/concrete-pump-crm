import React, { useState, useEffect } from 'react';
import {
  Truck,
  Search,
  Filter,
  Plus,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Shield,
  Gauge,
  FileText,
} from 'lucide-react';
import { PumpUnit, PumpCategoryCode, PumpUnitStatus } from '../../types/database';
import {
  fetchFleetUnits,
  PUMP_CATEGORIES,
  checkUnitAvailability,
} from '../../lib/fleet-store';
import { formatNumber, formatTanggal, formatRupiah } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { UnitFormModal } from './UnitFormModal';
import { UnitDetailModal } from './UnitDetailModal';

export const FleetPage: React.FC = () => {
  const { user, role } = useAuth();
  const [units, setUnits] = useState<PumpUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<PumpUnit | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<PumpUnit | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchFleetUnits({
      query: searchQuery,
      category: selectedCategory,
      status: selectedStatus,
    });
    setUnits(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, selectedStatus]);

  // Aggregate KPI counts
  const totalUnits = units.length;
  const availableCount = units.filter((u) => u.status === 'available').length;
  const reservedCount = units.filter((u) => u.status === 'reserved').length;
  const rentedCount = units.filter((u) => u.status === 'rented').length;
  const maintenanceCount = units.filter((u) => u.status === 'maintenance').length;
  const outOfServiceCount = units.filter((u) => u.status === 'out_of_service').length;

  const statusStyles: Record<PumpUnitStatus, { label: string; badge: string; dot: string }> = {
    available: { label: 'Available', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
    reserved: { label: 'Reserved', badge: 'bg-blue-50 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
    rented: { label: 'Rented', badge: 'bg-purple-50 text-purple-800 border-purple-300', dot: 'bg-purple-500' },
    maintenance: { label: 'Maintenance', badge: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
    out_of_service: { label: 'Out of Service', badge: 'bg-rose-50 text-rose-800 border-rose-300', dot: 'bg-rose-500' },
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 font-bold">
              Tahap 3 CPMS · Fleet Management
            </span>
            <span className="text-xs text-slate-400">Armada 20+ Unit Pompa Beton Indonesia</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-600" />
            Manajemen Armada & Spesifikasi Pompa
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu Armada"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingUnit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Unit Armada</span>
          </button>
        </div>
      </div>

      {/* Fleet Dashboard KPI Strip (Strictly Required in Prompt) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Unit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Unit
          </span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums block mt-0.5">
            {totalUnits}
          </span>
          <span className="text-[10px] text-slate-400">Armada terdaftar</span>
        </div>

        {/* Unit Tersedia */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Unit Tersedia
          </span>
          <span className="text-2xl font-extrabold text-emerald-800 font-mono tabular-nums block mt-0.5">
            {availableCount}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Siap dispatch</span>
        </div>

        {/* Unit Dipesan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
            Unit Dipesan
          </span>
          <span className="text-2xl font-extrabold text-blue-800 font-mono tabular-nums block mt-0.5">
            {reservedCount}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Booking jadwal</span>
        </div>

        {/* Unit Beroperasi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
            Unit Beroperasi
          </span>
          <span className="text-2xl font-extrabold text-purple-800 font-mono tabular-nums block mt-0.5">
            {rentedCount}
          </span>
          <span className="text-[10px] text-purple-600 font-medium">Di lokasi proyek cor</span>
        </div>

        {/* Unit Maintenance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            Unit Maintenance
          </span>
          <span className="text-2xl font-extrabold text-amber-800 font-mono tabular-nums block mt-0.5">
            {maintenanceCount}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Servis di bengkel</span>
        </div>

        {/* Unit Tidak Beroperasi */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            Tidak Beroperasi
          </span>
          <span className="text-2xl font-extrabold text-rose-800 font-mono tabular-nums block mt-0.5">
            {outOfServiceCount}
          </span>
          <span className="text-[10px] text-rose-600 font-medium">Rusak / Tunggu part</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode unit (CP-36), plat nomor (B 9123...), merk pompa, sasis Hino/Isuzu, operator..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="available">Available (Tersedia)</option>
              <option value="reserved">Reserved (Dipesan)</option>
              <option value="rented">Rented (Beroperasi)</option>
              <option value="maintenance">Maintenance (Servis)</option>
              <option value="out_of_service">Out of Service</option>
            </select>

            <button
              onClick={loadData}
              title="Segarkan Data Armada"
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Kategori:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({units.length})
          </button>
          {PUMP_CATEGORIES.map((cat) => (
            <button
              key={cat.code}
              onClick={() => setSelectedCategory(cat.code)}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                selectedCategory === cat.code
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name.replace('Concrete Pump ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* View 1: Data Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Kode Unit</th>
                  <th className="py-3 px-4">Model & Plat Nomor</th>
                  <th className="py-3 px-4">Jangkauan Boom</th>
                  <th className="py-3 px-4">Kapasitas Pompa</th>
                  <th className="py-3 px-4">Operator Ditugaskan</th>
                  <th className="py-3 px-4">Status & Kesiapan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">Tidak ada unit pompa yang cocok</p>
                    </td>
                  </tr>
                ) : (
                  units.map((u) => {
                    const avail = checkUnitAvailability(u);
                    const stg = statusStyles[u.status];

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Kode Unit */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded border border-orange-200">
                            {u.unit_code}
                          </span>
                        </td>

                        {/* Model & Plat */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-bold text-slate-900 truncate">{u.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {u.plate_number} · {u.brand_chassis}
                          </p>
                        </td>

                        {/* Jangkauan Boom */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold font-mono text-slate-800">
                            {u.boom_length_meters > 0 ? `${u.boom_length_meters} Meter` : 'Pipa Kodok'}
                          </span>
                          <span className="block text-[10px] text-slate-400 truncate max-w-[140px]">
                            {u.boom_sections}
                          </span>
                        </td>

                        {/* Kapasitas */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                          <span className="font-bold text-slate-800">{u.output_capacity_m3_hour} m³/jam</span>
                          <span className="block text-[10px] text-slate-400">{u.max_pressure_bar} Bar</span>
                        </td>

                        {/* Operator */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-800">{u.primary_operator_name}</p>
                          <p className="text-[10px] text-slate-400">Driver: {u.driver_name || 'Driver Standby'}</p>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono font-bold text-[10px] uppercase border ${stg?.badge || ''}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${stg?.dot || 'bg-slate-400'}`}></span>
                            {stg?.label || u.status}
                          </span>
                          {u.current_project_location && (
                            <p className="text-[10px] text-slate-500 truncate max-w-[180px] mt-0.5">
                              {u.current_project_location}
                            </p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedUnit(u)}
                              title="Lihat Spesifikasi & Riwayat Servis"
                              className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUnit(u);
                                setIsFormOpen(true);
                              }}
                              title="Edit Spesifikasi Unit"
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong>{units.length}</strong> unit armada pompa beton
            </span>
            <span className="text-[11px] font-mono">
              Integrasi Penjadwalan & KIR Dishub Aktif
            </span>
          </div>
        </div>
      ) : (
        /* View 2: Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((u) => {
            const stg = statusStyles[u.status];
            const avail = checkUnitAvailability(u);

            return (
              <div
                key={u.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-orange-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded border border-orange-200">
                      {u.unit_code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase border ${stg?.badge || ''}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${stg?.dot || 'bg-slate-400'}`}></span>
                      {stg?.label || u.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{u.name}</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {u.plate_number} · {u.brand_chassis}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Boom:</span>
                      <span className="font-bold font-mono text-slate-800">
                        {u.boom_length_meters > 0 ? `${u.boom_length_meters}m` : 'Pipa Kodok'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Kapasitas:</span>
                      <span className="font-bold font-mono text-slate-800">
                        {u.output_capacity_m3_hour} m³/jam
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Hour Meter:</span>
                      <span className="font-mono text-slate-700">{formatNumber(u.engine_hours)} Jam</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Operator:</span>
                      <span className="text-slate-800 font-medium truncate block">{u.primary_operator_name}</span>
                    </div>
                  </div>

                  {u.current_project_location && (
                    <p className="text-[11px] text-slate-600 mt-2 flex items-center gap-1 bg-purple-50/60 p-2 rounded border border-purple-200 truncate">
                      <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">{u.current_project_location}</span>
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Servis: {formatTanggal(u.next_service_date, false)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedUnit(u)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded text-xs transition-colors cursor-pointer"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => {
                        setEditingUnit(u);
                        setIsFormOpen(true);
                      }}
                      className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold rounded text-xs transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <UnitFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        existingUnit={editingUnit}
        existingUnits={units}
      />

      {/* Detail Modal */}
      <UnitDetailModal
        unit={selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onEdit={(u) => {
          setSelectedUnit(null);
          setEditingUnit(u);
          setIsFormOpen(true);
        }}
        onRefresh={loadData}
      />
    </div>
  );
};
