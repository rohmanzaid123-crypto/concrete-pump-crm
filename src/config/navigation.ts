import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  CalendarDays,
  Truck,
  HardHat,
  Building2,
  FileText,
  Receipt,
  Wallet,
  MessageSquare,
  Bot,
  BarChart3,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { UserRole } from '../types/database';

export interface NavItem {
  id: string;
  name: string;
  label: string;
  icon: LucideIcon;
  description: string;
  requiredRole?: UserRole; // if omitted, both owner & admin have access
  category: 'core' | 'operations' | 'commercial' | 'intelligence' | 'system';
}

export const NAVIGATION_ITEMS: NavItem[] = [
  // Core
  {
    id: 'dashboard',
    name: 'Dashboard',
    label: 'Ringkasan Eksekutif & Operasional',
    icon: LayoutDashboard,
    description: 'Statistik armada, jadwal aktif, dan status operasional harian.',
    category: 'core',
  },

  // Operasional Armada & Lapangan
  {
    id: 'fleet',
    name: 'Fleet',
    label: 'Armada Pompa Beton',
    icon: Truck,
    description: 'Manajemen 20+ unit pompa: 24–36m, 37–42m, Long Boom, Mini, Kodok.',
    category: 'operations',
  },
  {
    id: 'scheduling',
    name: 'Scheduling',
    label: 'Penjadwalan Unit & Jam Pengecoran',
    icon: CalendarDays,
    description: 'Kalender jadwal pengecoran, mobilisasi, dan alokasi pompa per hari.',
    category: 'operations',
  },
  {
    id: 'bookings',
    name: 'Bookings',
    label: 'Pemesanan Sewa Pompa',
    icon: CalendarCheck,
    description: 'Pemesanan masuk, verifikasi teknis pipa, dan kesiapan lokasi cor.',
    category: 'operations',
  },
  {
    id: 'operators',
    name: 'Operators',
    label: 'Operator & Crew Pompa',
    icon: HardHat,
    description: 'Daftar operator boom, driver mixer/pompa, dan sertifikasi SIO.',
    category: 'operations',
  },
  {
    id: 'projects',
    name: 'Projects',
    label: 'Proyek Konstruksi',
    icon: Building2,
    description: 'Data batching plant mitra, site manager, dan progress volume m³ cor.',
    category: 'operations',
  },

  // Komersial & CRM
  {
    id: 'customers',
    name: 'Customers',
    label: 'Database Customer',
    icon: Users,
    description: 'Kontraktor, mandor, batching plant, dan histori sewa pompa.',
    category: 'commercial',
  },
  {
    id: 'leads',
    name: 'Leads',
    label: 'Prospek & Permintaan Sewa',
    icon: UserPlus,
    description: 'Leads masuk via WhatsApp, survei lokasi, dan status konversi.',
    category: 'commercial',
  },
  {
    id: 'quotations',
    name: 'Quotations',
    label: 'Surat Penawaran Harga (SPH)',
    icon: FileText,
    description: 'Penawaran tarif sewa per m³, per jam, atau borongan proyek.',
    category: 'commercial',
  },
  {
    id: 'invoices',
    name: 'Invoices',
    label: 'Faktur & Penagihan',
    icon: Receipt,
    description: 'Invoice termin, invoice sewa per jam/m³, dan status pembayaran klien.',
    category: 'commercial',
  },
  {
    id: 'finance',
    name: 'Finance',
    label: 'Keuangan & Kas Operasional',
    icon: Wallet,
    description: 'Biaya solar armada, uang jalan kru, kasbon operator, dan margin sewa.',
    requiredRole: 'owner', // Owner privilege
    category: 'commercial',
  },

  // Komunikasi & Kecerdasan Buatan
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    label: 'WhatsApp Gateway & Chat',
    icon: MessageSquare,
    description: 'Notifikasi konfirmasi jadwal cor, kirim SPH via WA, dan chat klien.',
    category: 'intelligence',
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    label: 'Asisten AI Disposisi & Tarif',
    icon: Bot,
    description: 'Kalkulator kebutuhan boom pompa, draft pesan WA, dan analisis rute.',
    category: 'intelligence',
  },
  {
    id: 'reports',
    name: 'Reports',
    label: 'Laporan Utilisasi & Omzet',
    icon: BarChart3,
    description: 'Laporan utilisasi jam kerja pompa, produktivitas kru, dan rekap m³ cor.',
    category: 'intelligence',
  },

  // Pengaturan Sistem
  {
    id: 'settings',
    name: 'Settings',
    label: 'Pengaturan & Koneksi Supabase',
    icon: Settings,
    description: 'Profil perusahaan, koneksi database Supabase, RLS, dan audit log.',
    category: 'system',
  },
];
