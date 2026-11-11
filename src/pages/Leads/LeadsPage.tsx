import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Plus,
  MessageSquare,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Truck,
  Building2,
  X,
  Save,
} from 'lucide-react';
import { Lead, LeadStage, PumpType } from '../../types/database';
import { validateIndonesianWA, formatDisplayWA, getWhatsAppChatUrl } from '../../lib/whatsapp';
import { formatNumber, formatTanggal } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-01',
    lead_code: 'LEAD-2026-001',
    contact_name: 'Pak Rudi Mandor',
    company_name: 'Pembangunan Ruko 4 Lantai Harapan Indah',
    whatsapp_number: '6281234567890',
    source: 'whatsapp',
    stage: 'inquiry',
    estimated_m3: 120,
    target_pump_type: 'standard_24_36m',
    project_location: 'Kawasan Sentra Bisnis Harapan Indah, Bekasi Barat',
    notes: 'Perkiraan cor tanggal 25 Februari. Membutuhkan konfirmasi akses jalan ruko untuk truk pompa 28m.',
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'lead-02',
    lead_code: 'LEAD-2026-002',
    contact_name: 'Ir. Sigit Wicaksono',
    company_name: 'PT Waskita Karya (Proyek Tol Cibitung-Cilincing)',
    whatsapp_number: '6281199887766',
    source: 'telepon',
    stage: 'survei',
    estimated_m3: 350,
    target_pump_type: 'long_boom_37_42m',
    project_location: 'Seksi 4 Tarumajaya, Bekasi',
    notes: 'Survei lokasi telah dijadwalkan untuk cek kekuatan bantalan tanah outrigger pompa Long Boom.',
    created_at: '2026-02-08T14:00:00Z',
    updated_at: '2026-02-08T14:00:00Z',
  },
  {
    id: 'lead-03',
    lead_code: 'LEAD-2026-003',
    contact_name: 'Bu Maya Developer',
    company_name: 'Cluster Puri Asri Karawaci',
    whatsapp_number: '6281788776655',
    source: 'referensi',
    stage: 'penawaran_sph',
    estimated_m3: 85,
    target_pump_type: 'mini_pump',
    project_location: 'Jl. Raya Legok Karawaci, Tangerang',
    notes: 'Surat Penawaran Harga (SPH) telah dikirim via WhatsApp. Menunggu konfirmasi jadwal batching plant.',
    created_at: '2026-02-05T09:30:00Z',
    updated_at: '2026-02-05T09:30:00Z',
  },
];

export const LeadsPage: React.FC = () => {
  const { user, role } = useAuth();
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [location, setLocation] = useState('');
  const [estimatedM3, setEstimatedM3] = useState(100);
  const [pumpType, setPumpType] = useState<PumpType>('standard_24_36m');
  const [source, setSource] = useState<'whatsapp' | 'telepon' | 'referensi' | 'website'>('whatsapp');
  const [notes, setNotes] = useState('');

  const stages: { key: LeadStage; label: string; color: string }[] = [
    { key: 'inquiry', label: '1. Inquiry Masuk', color: 'border-blue-400 bg-blue-50/50' },
    { key: 'survei', label: '2. Survei Lokasi & Pipa', color: 'border-amber-400 bg-amber-50/50' },
    { key: 'penawaran_sph', label: '3. Penawaran SPH', color: 'border-orange-400 bg-orange-50/50' },
    { key: 'deal', label: '4. Deal (Siap Cor)', color: 'border-emerald-400 bg-emerald-50/50' },
    { key: 'lost', label: '5. Batal / Lost', color: 'border-slate-300 bg-slate-50/50' },
  ];

  const handleStageChange = (leadId: string, newStage: LeadStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage, updated_at: new Date().toISOString() } : l))
    );
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const waCheck = validateIndonesianWA(whatsapp);

    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      lead_code: `LEAD-2026-00${leads.length + 1}`,
      contact_name: contactName,
      company_name: companyName,
      whatsapp_number: waCheck.isValid ? waCheck.normalized : whatsapp,
      source,
      stage: 'inquiry',
      estimated_m3: estimatedM3,
      target_pump_type: pumpType,
      project_location: location,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLeads([newLead, ...leads]);
    setIsModalOpen(false);

    // Reset
    setContactName('');
    setCompanyName('');
    setWhatsapp('');
    setLocation('');
    setNotes('');
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.whatsapp_number.includes(searchQuery) ||
      l.project_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 font-bold">
              CRM Pipeline
            </span>
            <span className="text-xs text-slate-400">Prospek Sewa Pompa Masuk via WhatsApp</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-600" />
            Pipeline Prospek Sewa (Leads)
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Prospek Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama prospek, kontraktor, nomor WhatsApp, atau lokasi proyek..."
          className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
        />
      </div>

      {/* Kanban / Pipeline View */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stages.map((stg) => {
          const stageLeads = filteredLeads.filter((l) => l.stage === stg.key);
          const totalVol = stageLeads.reduce((acc, l) => acc + l.estimated_m3, 0);

          return (
            <div key={stg.key} className="flex flex-col bg-slate-50/80 rounded-xl border border-slate-200 p-3 min-h-[500px]">
              <div className="pb-2.5 mb-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{stg.label}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatNumber(totalVol)} m³ total
                  </span>
                </div>
                <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-700 text-[10px] font-bold font-mono flex items-center justify-center">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageLeads.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-8">
                    Tidak ada prospek
                  </p>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs hover:border-orange-300 transition-colors space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono font-bold text-orange-600">{lead.lead_code}</span>
                        <span>{formatTanggal(lead.created_at, false)}</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 leading-snug">{lead.company_name}</h4>
                        <p className="text-slate-600 mt-0.5">{lead.contact_name}</p>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded border border-slate-100">
                        <p className="flex items-center gap-1 text-slate-700">
                          <Layers className="w-3 h-3 text-orange-600" />
                          <span>Rencana Cor: <strong>{lead.estimated_m3} m³</strong></span>
                        </p>
                        <p className="flex items-center gap-1 truncate text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.project_location}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <a
                          href={getWhatsAppChatUrl(lead.whatsapp_number, `Halo Pak/Bu ${lead.contact_name}, mengenai rencana sewa pompa cor di ${lead.project_location}...`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Chat WA</span>
                        </a>

                        <select
                          value={lead.stage}
                          onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700"
                        >
                          <option value="inquiry">Inquiry</option>
                          <option value="survei">Survei</option>
                          <option value="penawaran_sph">SPH</option>
                          <option value="deal">Deal</option>
                          <option value="lost">Batal</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-orange-600" />
                Catat Permintaan Sewa (Lead) Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Proyek / Kontraktor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Proyek Pengecoran Gudang Marunda"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Kontak PIC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Pak Yanto"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Volume Cor (m³)
                  </label>
                  <input
                    type="number"
                    value={estimatedM3}
                    onChange={(e) => setEstimatedM3(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kebutuhan Tipe Pompa
                  </label>
                  <select
                    value={pumpType}
                    onChange={(e) => setPumpType(e.target.value as PumpType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="standard_24_36m">Standar 24–36 Meter</option>
                    <option value="long_boom_37_42m">Long Boom 37–42 Meter</option>
                    <option value="super_long_boom">Super Long Boom &gt;42m</option>
                    <option value="mini_pump">Mini / City Pump</option>
                    <option value="kodok_portable">Pompa Kodok / Portable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lokasi / Alamat Proyek
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kawasan Industri GIIC Cikarang"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Kondisi jalan masuk, kebutuhan pipa tambahan, jam mulai cor..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg"
                >
                  Simpan Prospek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
