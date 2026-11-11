import React from 'react';
import {
  Truck,
  CalendarDays,
  CalendarCheck,
  Users,
  UserPlus,
  FileText,
  Receipt,
  Wallet,
  MessageSquare,
  Bot,
  BarChart3,
  HardHat,
  Building2,
  LucideIcon,
  ArrowRight,
  ShieldCheck,
  Database,
  Plus,
} from 'lucide-react';
import { NAVIGATION_ITEMS } from '../config/navigation';
import { useAuth } from '../context/AuthContext';
import { RoleGuard } from '../components/common/RoleGuard';

interface ModulePlaceholderProps {
  moduleId: string;
  onNavigateHome: () => void;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ moduleId, onNavigateHome }) => {
  const { role } = useAuth();
  const navItem = NAVIGATION_ITEMS.find((n) => n.id === moduleId);

  if (!navItem) {
    return <div>Modul tidak ditemukan.</div>;
  }

  const Icon = navItem.icon;

  // Specific domain details for CPMS modules
  const getDomainSpecifics = () => {
    switch (moduleId) {
      case 'fleet':
        return {
          badge: 'Tahap 2: Manajemen Armada 20+ Unit',
          specTitle: 'Kategori Unit Pompa Beton CPMS:',
          items: [
            'Pompa Standar 24 – 36 Meter (Paling umum untuk perumahan, ruko, gedung 3-5 lantai)',
            'Pompa Long Boom 37 – 42 Meter (Proyek industri & gedung bertingkat tinggi)',
            'Pompa Super Long Boom >42 Meter (Infrastruktur flyover & superblok)',
            'Pompa Mini / City Pump (Akses gang sempit & jalan perumahan padat)',
            'Pompa Kodok / Stationary / Portable (Pengecoran pipa panjang >100m, basement, subway)',
          ],
          primaryActionText: 'Siapkan Registrasi Unit Baru',
        };
      case 'customers':
        return {
          badge: 'Tahap 3: Database & Import Excel',
          specTitle: 'Kategori Customer & Mitra Kerja:',
          items: [
            'Kontraktor BUMN & Swasta (Adhi Karya, WIKA, PP, Total, Jaya Konstruksi, dll.)',
            'Batching Plant Mitra (Holcim/SMC, Jayamix, Merak Jaya, Pionirbeton, SCG, dll.)',
            'Mandor / Subkontraktor Cor Lapangan',
            'Owner Proyek Swasta & Developer Properti',
            'Dukungan Import File Excel (.xlsx / .csv) daftar customer lama',
          ],
          primaryActionText: 'Siapkan Format Import Excel',
        };
      case 'leads':
        return {
          badge: 'Tahap 3: Pipeline Penjualan Sewa',
          specTitle: 'Alur Konversi Prospek Pompa Beton:',
          items: [
            'Leads Masuk via WhatsApp & Telepon Lapangan',
            'Survei Lokasi & Kesiapan Jalan Armada (Manuver & Beban Truk)',
            'Pengecekan Kebutuhan Panjang Boom & Sambungan Pipa',
            'Penerbitan Surat Penawaran Harga (SPH)',
            'Konversi Menjadi Booking / Jadwal Cor Resmi',
          ],
          primaryActionText: 'Tambah Permintaan Sewa Baru',
        };
      case 'scheduling':
        return {
          badge: 'Tahap 4: Dispatch & Kalender Lapangan',
          specTitle: 'Aturan Penjadwalan Armada Pompa:',
          items: [
            'Alokasi jam mulai cor (Pagi 08:00, Siang 13:00, Malam/Lembur 20:00)',
            'Estimasi durasi mobilisasi armada dari pool ke lokasi proyek',
            'Pencegahan bentrok jadwal (double-booking) antar unit pompa',
            'Sinkronisasi jadwal kedatangan truk mixer batching plant',
            'Manajemen jam tunggu (standby fee) jika truk mixer terlambat datang',
          ],
          primaryActionText: 'Buka Jadwal Pengecoran',
        };
      case 'bookings':
        return {
          badge: 'Tahap 4: Pemesanan & Kontrak',
          specTitle: 'Data Wajib Pemesanan Pompa:',
          items: [
            'Nama Proyek & Lokasi Titik Pengecoran (Google Maps)',
            'Volume Rencana Cor (m³) & Mutu Beton (K-250, K-300, K-350, FS-45)',
            'Pilihan Unit: Standar, Long Boom, Mini, atau Kodok',
            'Kebutuhan Pipa Tambahan (meter pipa lurus, belokan elbow, klem)',
            'Penunjukan Operator & Driver Armada',
          ],
          primaryActionText: 'Buat Pesanan Baru',
        };
      case 'operators':
        return {
          badge: 'Tahap 4: SDM & Kru Lapangan',
          specTitle: 'Struktur Kru per Unit Pompa Beton:',
          items: [
            'Operator Boom (Wajib sertifikat SIO - Surat Izin Operator aktif)',
            'Driver Truk Pompa (SIM B2 Umum)',
            'Helper / Crew Pipa (Pemasangan & pembersihan pipa cor pasca pekerjaan)',
            'Riwayat jam terbang operator & rekap premi per m³ / per ritase',
          ],
          primaryActionText: 'Tambah Data Operator',
        };
      case 'projects':
        return {
          badge: 'Tahap 4: Manajemen Proyek & Batching Plant',
          specTitle: 'Struktur Proyek Cor:',
          items: [
            'Proyek Infrastruktur, Gedung Komersial, Residensial, dan Pabrik',
            'Kontak Site Manager, Pengawas Lapangan, dan Kepala Batching Plant',
            'Log akumulasi m³ cor per proyek dan rekonsiliasi surat jalan',
          ],
          primaryActionText: 'Tambah Proyek Baru',
        };
      case 'quotations':
        return {
          badge: 'Tahap 5: Surat Penawaran Harga (SPH)',
          specTitle: 'Sistem Multi-Tarif CPMS (IDR):',
          items: [
            'Tarif Minimum / Tarif Dasar (Mencakup hingga 50 m³ atau 8 jam kerja)',
            'Tarif Tambahan Volume (Rp per m³ di atas batas minimum)',
            'Tarif Tambahan Jam Kerja (Overtime / Standby per jam)',
            'Tarif Tambahan Pipa (Rp per batang pipa >10 batang)',
            'Generate PDF SPH resmi dengan nomor surat otomatis & logo PT',
          ],
          primaryActionText: 'Buat Penawaran SPH Baru',
        };
      case 'invoices':
        return {
          badge: 'Tahap 5: Faktur & Penagihan IDR',
          specTitle: 'Standar Invoice Sewa Pompa Beton:',
          items: [
            'Kalkulasi otomatis berdasarkan realisasi volume cor m³ & jam kerja',
            'Termin pembayaran (Cash on Delivery / Tempo 14–30 hari)',
            'Pencantuman nomor rekening resmi BCA/Mandiri perusahaan',
            'Status pembayaran: Draft, Terbit, Terbayar Sebagian, Lunas',
          ],
          primaryActionText: 'Buat Invoice Baru',
        };
      case 'finance':
        return {
          badge: 'Tahap 6: Keuangan & Audit Finansial (Owner)',
          specTitle: 'Pengawasan Keuangan Khusus Owner:',
          items: [
            'Biaya Pembelian Solar Industri (B35/Dexlite) per unit pompa',
            'Uang Jalan, Tol, dan Konsumsi Kru Pompa per proyek',
            'Kasbon Kru & Pembayaran Premi Operator per volume m³ cor',
            'Margin laba bersih per unit pompa & analisis biaya pemeliharaan mesin',
          ],
          primaryActionText: 'Catat Arus Kas Operasional',
        };
      case 'whatsapp':
        return {
          badge: 'Tahap 7: Meta WhatsApp Cloud API',
          specTitle: 'Integrasi WhatsApp Lapangan:',
          items: [
            'Notifikasi konfirmasi jadwal cor otomatis H-1 ke nomor kontraktor & mandor',
            'Kirim PDF Surat Penawaran Harga (SPH) langsung ke chat WhatsApp',
            'Kirim reminder invoice jatuh tempo secara santun',
            'Grup koordinasi internal operator & tim dispatch pool',
          ],
          primaryActionText: 'Konfigurasi Meta WhatsApp API',
        };
      case 'ai-assistant':
        return {
          badge: 'Tahap 7: Asisten AI (Gemini API)',
          specTitle: 'Kemampuan AI Asisten Operasional:',
          items: [
            'Rekomendasi jenis pompa otomatis berdasarkan deskripsi proyek & ketinggian gedung',
            'Drafting pesan WhatsApp penawaran harga dalam bahasa sopan bisnis Indonesia',
            'Analisis potensi bentrok jadwal & rute armada terdekat',
            'Peringatan anomali pemakaian solar mesin pompa',
          ],
          primaryActionText: 'Mulai Chat dengan Asisten AI',
        };
      case 'reports':
        return {
          badge: 'Tahap 6: Laporan Utilisasi & Omzet',
          specTitle: 'Analitik Bisnis Pompa Beton:',
          items: [
            'Tingkat utilisasi per unit armada (% jam kerja aktif vs menganggur di pool)',
            'Rekapitulasi total volume cor (m³) per batching plant mitra & kontraktor',
            'Laporan pendapatan sewa kotor dan kontribusi laba per tipe pompa (24–42m vs Kodok)',
            'Ekspor laporan ke format PDF dan Excel',
          ],
          primaryActionText: 'Generate Laporan Periode Ini',
        };
      default:
        return {
          badge: 'Tahap Pengembangan CPMS',
          specTitle: 'Fitur Utama:',
          items: ['Penyimpanan di Supabase PostgreSQL', 'Proteksi Row Level Security', 'Integrasi Multi-Role'],
          primaryActionText: 'Mulai Fitur',
        };
    }
  };

  const domain = getDomainSpecifics();

  const content = (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{navItem.name}</h1>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200 uppercase font-semibold">
                  {domain.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{navItem.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Akses Role:</span>
            <span
              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                navItem.requiredRole === 'owner'
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {navItem.requiredRole ? 'Owner Saja' : 'Owner & Admin'}
            </span>
          </div>
        </div>

        {/* Empty State / Domain Architecture Blueprint */}
        <div className="py-8">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              {domain.specTitle}
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Modul ini terhubung ke arsitektur data Supabase PostgreSQL dan siap menerima pencatatan data nyata sesuai alur bertahap pembangunan CPMS.
            </p>

            <ul className="space-y-2.5 mb-6">
              {domain.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-mono flex items-center justify-center shrink-0 font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Penyimpanan Data Terpusat: Supabase PostgreSQL</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onNavigateHome}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Kembali ke Dashboard
                </button>
                <button
                  onClick={() => alert(`Modul ${navItem.name} disiapkan untuk data operasional pada tahap pembangunan berikutnya sesuai panduan.`)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{domain.primaryActionText}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // If module requires OWNER privilege, guard it!
  if (navItem.requiredRole === 'owner') {
    return (
      <RoleGuard requiredRole="owner" onNavigateHome={onNavigateHome}>
        {content}
      </RoleGuard>
    );
  }

  return content;
};
