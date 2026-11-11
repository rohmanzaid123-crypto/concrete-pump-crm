/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Smart Scheduling Module: Daily, Weekly, Monthly Calendar & 22-Unit Fleet Timeline (Gantt)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Truck,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Layers,
  Wrench,
  ShieldCheck,
  Eye,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import {
  Booking,
  BookingStatus,
  Customer,
  Project,
  PumpCategoryCode,
  PumpUnit,
} from '../../types/database';
import { formatTanggal, formatRupiah } from '../../lib/formatters';
import {
  fetchBookings,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  fetchProjects,
} from '../../lib/booking-store';
import { fetchFleetUnits, PUMP_CATEGORIES } from '../../lib/fleet-store';
import { fetchCustomers } from '../../lib/customer-store';
import { BookingFormModal } from '../Bookings/BookingFormModal';
import { BookingDetailModal } from '../Bookings/BookingDetailModal';

type CalendarViewMode = 'timeline' | 'daily' | 'weekly' | 'monthly';

export const SchedulingPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('timeline');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [units, setUnits] = useState<PumpUnit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected Category filter for timeline
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bData, uData, cData, pData] = await Promise.all([
        fetchBookings(),
        fetchFleetUnits(),
        fetchCustomers(),
        fetchProjects(),
      ]);
      setBookings(bData);
      setUnits(uData);
      setCustomers(cData);
      setProjects(pData);
    } catch (err) {
      console.error('Failed to load scheduling data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format current date string YYYY-MM-DD
  const currentDateStr = useMemo(() => {
    return currentDate.toISOString().split('T')[0];
  }, [currentDate]);

  // Date Navigation handlers
  const handlePrev = () => {
    const nextD = new Date(currentDate);
    if (viewMode === 'daily') nextD.setDate(nextD.getDate() - 1);
    else if (viewMode === 'weekly') nextD.setDate(nextD.getDate() - 7);
    else if (viewMode === 'monthly') nextD.setMonth(nextD.getMonth() - 1);
    else nextD.setDate(nextD.getDate() - 3); // timeline scrolls 3 days
    setCurrentDate(nextD);
  };

  const handleNext = () => {
    const nextD = new Date(currentDate);
    if (viewMode === 'daily') nextD.setDate(nextD.getDate() + 1);
    else if (viewMode === 'weekly') nextD.setDate(nextD.getDate() + 7);
    else if (viewMode === 'monthly') nextD.setMonth(nextD.getMonth() + 1);
    else nextD.setDate(nextD.getDate() + 3);
    setCurrentDate(nextD);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper for timeline days (shows 7-day window centered or starting around currentDate)
  const timelineDays = useMemo(() => {
    const days: { dateStr: string; label: string; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = -1; i <= 5; i++) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      days.push({
        dateStr,
        label: `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [currentDate]);

  // Filter units for timeline
  const displayedUnits = useMemo(() => {
    if (selectedCategory === 'all') return units;
    return units.filter((u) => u.category_code === selectedCategory);
  }, [units, selectedCategory]);

  // Conflict and Reminder Alerts
  const schedulingAlerts = useMemo(() => {
    const alerts: { type: 'conflict' | 'kir' | 'maintenance'; message: string }[] = [];

    // Check units under maintenance
    const maintenanceUnits = units.filter((u) => u.status === 'maintenance' || u.status === 'out_of_service');
    if (maintenanceUnits.length > 0) {
      alerts.push({
        type: 'maintenance',
        message: `${maintenanceUnits.length} unit pompa sedang perbaikan / servis berkala di bengkel pool (${maintenanceUnits.map((u) => u.unit_code).join(', ')}).`,
      });
    }

    // Check KIR expiration
    const now = new Date();
    const expiredKIR = units.filter((u) => new Date(u.kir_expiry_date) < now);
    if (expiredKIR.length > 0) {
      alerts.push({
        type: 'kir',
        message: `Peringatan Legalitas: ${expiredKIR.length} unit memiliki KIR Dishub kedaluwarsa (${expiredKIR.map((u) => u.unit_code).join(', ')}). Tidak disarankan keluar pool.`,
      });
    }

    return alerts;
  }, [units]);

  // Handle Booking Create or Update
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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Smart Scheduling & Armada Timeline</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
              Pencegahan Bentrok
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Visualisasi alokasi 22 unit armada pompa beton, jadwal harian/mingguan/bulanan, dan buffer mobilisasi waktu jalan
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Jadwal"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingBooking(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Jadwal Cor</span>
          </button>
        </div>
      </div>

      {/* Active Alerts Banner */}
      {schedulingAlerts.length > 0 && (
        <div className="space-y-2">
          {schedulingAlerts.map((alert, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border flex items-center gap-3 text-xs font-medium ${
                alert.type === 'kir'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {alert.type === 'kir' ? (
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar: Navigation & View Mode Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
          >
            Hari Ini
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-900 ml-2">
            {formatTanggal(currentDateStr)}
          </span>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'timeline'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Timeline 22 Unit (Gantt)</span>
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'daily'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'weekly'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mingguan
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'monthly'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulanan
          </button>
        </div>
      </div>

      {/* VIEW 1: 22-UNIT FLEET TIMELINE (GANTT CHART) */}
      {viewMode === 'timeline' && (
        <div className="space-y-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semua Armada ({units.length} Unit)
            </button>
            {PUMP_CATEGORIES.map((cat) => (
              <button
                key={cat.code}
                onClick={() => setSelectedCategory(cat.code)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                  selectedCategory === cat.code
                    ? 'bg-orange-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name.split(' (')[0]}
              </button>
            ))}
          </div>

          {/* Timeline Gantt Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                {/* Header Row: Unit info column + 7 Days columns */}
                <thead>
                  <tr className="bg-slate-900 text-white text-xs border-b border-slate-800">
                    <th className="p-3 w-64 font-bold border-r border-slate-800">
                      Armada Pompa ({displayedUnits.length} Unit)
                    </th>
                    {timelineDays.map((td) => (
                      <th
                        key={td.dateStr}
                        className={`p-3 text-center border-r border-slate-800 ${
                          td.isToday ? 'bg-orange-600/30 text-orange-300 font-black' : 'font-semibold text-slate-300'
                        }`}
                      >
                        <div>{td.label}</div>
                        {td.isToday && <span className="text-[10px] text-orange-400 block font-normal">HARI INI</span>}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {displayedUnits.map((unit) => {
                    const isUnderMaintenance = unit.status === 'maintenance' || unit.status === 'out_of_service';
                    return (
                      <tr key={unit.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Unit Identity Column */}
                        <td className="p-3 border-r border-slate-200 bg-slate-50/60">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 font-mono">{unit.unit_code}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                              {unit.boom_length_meters > 0 ? `${unit.boom_length_meters}m` : 'Kodok'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate max-w-[200px]">{unit.name}</p>
                          <p className="text-[10px] text-slate-400">
                            Op: {unit.primary_operator_name.split(' (')[0]}
                          </p>
                        </td>

                        {/* 7 Days Grid Cells */}
                        {timelineDays.map((td) => {
                          // Find bookings for this unit on this date
                          const dayBookings = bookings.filter(
                            (b) =>
                              (b.assigned_unit_id === unit.id || b.assigned_unit_code === unit.unit_code) &&
                              b.pour_date === td.dateStr &&
                              b.status !== 'cancelled'
                          );

                          return (
                            <td
                              key={td.dateStr}
                              className={`p-2 border-r border-slate-100 align-top h-16 ${
                                td.isToday ? 'bg-orange-50/20' : ''
                              }`}
                            >
                              {isUnderMaintenance ? (
                                <div className="h-full rounded bg-slate-100 border border-dashed border-slate-300 p-1 flex items-center justify-center text-[10px] text-slate-500 font-medium">
                                  <span>Bengkel / Servis</span>
                                </div>
                              ) : dayBookings.length > 0 ? (
                                <div className="space-y-1">
                                  {dayBookings.map((b) => (
                                    <button
                                      type="button"
                                      key={b.id}
                                      onClick={() => {
                                        setSelectedBooking(b);
                                        setIsDetailOpen(true);
                                      }}
                                      className={`w-full text-left p-1.5 rounded-lg border text-[11px] font-medium shadow-2xs hover:scale-102 transition-transform ${
                                        b.status === 'on_progress'
                                          ? 'bg-amber-100 border-amber-300 text-amber-900 ring-1 ring-amber-400'
                                          : b.status === 'completed'
                                          ? 'bg-slate-100 border-slate-300 text-slate-700'
                                          : 'bg-blue-50 border-blue-300 text-blue-900'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between font-bold">
                                        <span className="font-mono text-[10px]">{b.start_time}-{b.end_time}</span>
                                        <span className="text-[10px]">{b.volume_m3}m³</span>
                                      </div>
                                      <p className="truncate text-[10px] font-semibold">{b.project_name}</p>
                                      <div className="flex items-center justify-between text-[9px] text-slate-500 mt-0.5">
                                        <span>Buf: {b.mobilization_buffer_hours}j</span>
                                        <span className="font-bold text-orange-700 uppercase">{b.status}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <span className="text-[10px] text-slate-300 font-mono">Tersedia</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DAILY SCHEDULE */}
      {viewMode === 'daily' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Jadwal Pengecoran Harian: {formatTanggal(currentDateStr)}
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {bookings.filter((b) => b.pour_date === currentDateStr && b.status !== 'cancelled').length} Booking Aktif
            </span>
          </div>

          <div className="space-y-3">
            {bookings.filter((b) => b.pour_date === currentDateStr && b.status !== 'cancelled').length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">Tidak ada jadwal pengecoran pada tanggal ini</p>
                <p className="text-xs text-slate-400 mt-1">Seluruh 22 armada pompa tersedia di pool armada.</p>
              </div>
            ) : (
              bookings
                .filter((b) => b.pour_date === currentDateStr && b.status !== 'cancelled')
                .map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBooking(b);
                      setIsDetailOpen(true);
                    }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-sm cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-orange-400 flex flex-col items-center justify-center font-bold text-xs">
                        <span className="font-mono text-xs">{b.start_time}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{b.end_time}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{b.booking_code}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                            {b.assigned_unit_code || 'Unit Belum Ditentukan'}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">({b.requested_boom_meters}m)</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1">{b.customer_name} • {b.project_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {b.project_location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end md:self-center">
                      <div className="text-right text-xs">
                        <span className="font-bold text-slate-900">{b.volume_m3} m³</span>
                        <span className="text-slate-500 block text-[11px]">{b.concrete_grade}</span>
                      </div>
                      <div className="text-right text-xs font-mono">
                        <span className="font-bold text-slate-900">{formatRupiah(b.total_price)}</span>
                        <span className="text-emerald-600 block text-[10px] font-semibold">{b.status}</span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: WEEKLY SCHEDULE */}
      {viewMode === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {timelineDays.map((td) => {
            const dayBookings = bookings.filter(
              (b) => b.pour_date === td.dateStr && b.status !== 'cancelled'
            );
            return (
              <div
                key={td.dateStr}
                className={`bg-white rounded-xl border p-3 min-h-[300px] flex flex-col ${
                  td.isToday ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200'
                }`}
              >
                <div className="border-b border-slate-100 pb-2 mb-2">
                  <p className={`text-xs font-bold ${td.isToday ? 'text-orange-600' : 'text-slate-800'}`}>
                    {td.label}
                  </p>
                  <p className="text-[10px] text-slate-400">{dayBookings.length} Pengecoran</p>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                  {dayBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setSelectedBooking(b);
                        setIsDetailOpen(true);
                      }}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-orange-400 cursor-pointer text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex justify-between font-bold">
                        <span className="font-mono text-orange-700">{b.assigned_unit_code}</span>
                        <span className="text-[10px]">{b.start_time}</span>
                      </div>
                      <p className="font-semibold text-slate-900 truncate text-[11px]">{b.project_name}</p>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{b.volume_m3}m³</span>
                        <span className="font-medium text-emerald-700">{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 4: MONTHLY SCHEDULE */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">
              Kalender Bulanan: {currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total {bookings.length} Aktivitas Booking Terdaftar
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d) => (
              <div key={d} className="p-2 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded-lg">
                {d}
              </div>
            ))}

            {Array.from({ length: 35 }).map((_, i) => {
              const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const startDay = startOfMonth.getDay();
              const dayNum = i - startDay + 1;
              const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
              const isCurrentMonth = dateObj.getMonth() === currentDate.getMonth();
              const dateStr = dateObj.toISOString().split('T')[0];
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              const dayBookings = bookings.filter(
                (b) => b.pour_date === dateStr && b.status !== 'cancelled'
              );

              return (
                <div
                  key={i}
                  onClick={() => {
                    setCurrentDate(dateObj);
                    setViewMode('daily');
                  }}
                  className={`min-h-[75px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isToday
                      ? 'border-orange-500 bg-orange-50/20 ring-1 ring-orange-300'
                      : isCurrentMonth
                      ? 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-slate-100 bg-slate-50/50 opacity-40'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-bold ${
                        isToday ? 'text-orange-600' : 'text-slate-700'
                      }`}
                    >
                      {dateObj.getDate()}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>

                  {dayBookings.length > 0 && (
                    <div className="text-[10px] text-slate-600 font-medium truncate">
                      {dayBookings.map((b) => b.assigned_unit_code || 'CP').join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
