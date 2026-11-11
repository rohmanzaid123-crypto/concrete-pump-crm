/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Bookings Management Master Page
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Eye,
  Edit,
  MessageSquare,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import {
  Booking,
  BookingStatus,
  Customer,
  Project,
  PumpUnit,
} from '../../types/database';
import { formatRupiah, formatTanggal, formatNumber } from '../../lib/formatters';
import {
  fetchBookings,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  fetchProjects,
} from '../../lib/booking-store';
import { fetchCustomers } from '../../lib/customer-store';
import { fetchFleetUnits } from '../../lib/fleet-store';
import { generateWhatsAppUrl } from '../../lib/whatsapp';
import { BookingFormModal } from './BookingFormModal';
import { BookingDetailModal } from './BookingDetailModal';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<PumpUnit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bData, cData, pData, uData] = await Promise.all([
        fetchBookings(),
        fetchCustomers(),
        fetchProjects(),
        fetchFleetUnits(),
      ]);
      setBookings(bData);
      setCustomers(cData);
      setProjects(pData);
      setUnits(uData);
    } catch (err) {
      console.error('Failed to load bookings data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (selectedStatus !== 'all' && b.status !== selectedStatus) {
        return false;
      }
      if (dateFilter && b.pour_date !== dateFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const mCode = b.booking_code.toLowerCase().includes(q);
        const mCust = b.customer_name.toLowerCase().includes(q);
        const mPrj = b.project_name.toLowerCase().includes(q);
        const mUnit = (b.assigned_unit_code || '').toLowerCase().includes(q);
        if (!mCode && !mCust && !mPrj && !mUnit) return false;
      }
      return true;
    });
  }, [bookings, selectedStatus, dateFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = bookings.length;
    const onProgress = bookings.filter((b) => b.status === 'on_progress').length;
    const scheduled = bookings.filter((b) => b.status === 'scheduled' || b.status === 'confirmed').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const totalVolume = bookings.reduce((acc, b) => acc + (b.volume_m3 || 0), 0);
    const totalRevenue = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((acc, b) => acc + (b.total_price || 0), 0);

    return { totalCount, onProgress, scheduled, completed, totalVolume, totalRevenue };
  }, [bookings]);

  const handleCreateOrUpdate = async (payload: any) => {
    if (editingBooking) {
      const res = await updateBooking(editingBooking.id, payload);
      if (res.success) {
        await loadData();
        return { success: true };
      }
      return { success: false, error: res.conflict?.reason || 'Gagal update booking' };
    } else {
      const res = await createBooking(payload);
      if (res.success) {
        await loadData();
        return { success: true };
      }
      return { success: false, error: res.conflict?.reason || 'Gagal membuat booking' };
    }
  };

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    const res = await updateBookingStatus(id, status);
    if (res.success) {
      await loadData();
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, status });
      }
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const handleDelete = async (id: string) => {
    await deleteBooking(id);
    await loadData();
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'on_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Sedang Cor
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3" />
            Terkunci Kalender
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed (DP)
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Selesai
          </span>
        );
      case 'quotation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            Penawaran (SPH)
          </span>
        );
      case 'pending_confirmation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            Menunggu PO
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Booking & Sewa Pompa</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-orange-100 text-orange-800 border border-orange-300">
              Tahap 4
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Jadwal operasional pengecoran, kalkulator tarif fleksibel, alokasi armada 20+ unit, dan deteksi bentrok otomatis
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingBooking(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Booking Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pengecoran Berjalan</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.onProgress} Unit</p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Sedang cor di lokasi proyek</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Jadwal Terkunci (Booking)</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.scheduled} Proyek</p>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">Terkonfirmasi & terjadwal</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Volume Cor</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatNumber(stats.totalVolume)} m³</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">{stats.completed} pengecoran selesai</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Nilai Booking</span>
            <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2 font-mono">{formatRupiah(stats.totalRevenue)}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Akumulasi seluruh booking aktif</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode booking, kontraktor, proyek, atau kode pompa beton..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-slate-500 hover:text-slate-800 underline px-1"
              >
                Reset Tgl
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {[
            { id: 'all', label: 'Semua Booking' },
            { id: 'on_progress', label: 'Sedang Cor' },
            { id: 'scheduled', label: 'Terkunci Kalender' },
            { id: 'confirmed', label: 'Confirmed (DP)' },
            { id: 'pending_confirmation', label: 'Menunggu PO' },
            { id: 'quotation', label: 'Penawaran (SPH)' },
            { id: 'completed', label: 'Selesai' },
            { id: 'cancelled', label: 'Batal' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Kode & Jadwal Cor</th>
                <th className="px-5 py-3.5">Pelanggan & Proyek</th>
                <th className="px-5 py-3.5">Unit Pompa & Operator</th>
                <th className="px-5 py-3.5">Volume & Mutu</th>
                <th className="px-5 py-3.5 text-right">Nilai Tagihan (IDR)</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada jadwal booking yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba ubah filter pencarian atau buat jadwal booking pengecoran baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Kode & Tanggal */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 font-mono text-xs">{b.booking_code}</div>
                      <div className="text-xs font-semibold text-slate-800 mt-0.5">
                        {formatTanggal(b.pour_date)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {b.start_time} - {b.end_time} ({b.estimated_duration_hours}j)
                      </div>
                    </td>

                    {/* Customer & Proyek */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">{b.customer_name}</div>
                      <div className="text-xs text-slate-600 truncate max-w-[220px]">{b.project_name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {b.project_location}
                      </div>
                    </td>

                    {/* Unit & Operator */}
                    <td className="px-5 py-3.5">
                      {b.assigned_unit_code ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-orange-100 border border-orange-200 text-orange-800 rounded font-bold font-mono text-xs">
                            {b.assigned_unit_code}
                          </span>
                          <span className="text-xs font-medium text-slate-700">
                            {b.requested_boom_meters > 0 ? `${b.requested_boom_meters}m` : 'Kodok'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-semibold italic">Belum dialokasikan</span>
                      )}
                      <div className="text-xs text-slate-600 mt-0.5 truncate max-w-[180px]">
                        {b.assigned_operator_name || '-'}
                      </div>
                    </td>

                    {/* Volume & Spesifikasi */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">{b.volume_m3} m³</div>
                      <div className="text-[11px] text-slate-500">{b.concrete_grade}</div>
                      {b.extra_pipes_count > 0 && (
                        <div className="text-[10px] text-blue-600">+{b.extra_pipes_count} btg pipa</div>
                      )}
                    </td>

                    {/* Nilai Tagihan */}
                    <td className="px-5 py-3.5 text-right font-mono">
                      <div className="font-bold text-slate-900 text-xs">{formatRupiah(b.total_price)}</div>
                      <div className="text-[10px] text-slate-400">
                        {b.apply_tax ? 'Termasuk PPN 11%' : 'Non-PPN'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center">{getStatusBadge(b.status)}</td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Lihat Detail Booking"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingBooking(b);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Booking"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <BookingFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBooking(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingBooking}
        customers={customers}
        projects={projects}
        units={units}
      />

      <BookingDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onEdit={(bookingToEdit) => {
          setEditingBooking(bookingToEdit);
          setIsFormOpen(true);
        }}
        onDelete={handleDelete}
        onUpdateStatus={handleStatusUpdate}
      />
    </div>
  );
};
