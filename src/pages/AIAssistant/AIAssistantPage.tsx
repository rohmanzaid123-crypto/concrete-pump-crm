/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Tahap 7: Gemini AI Controller & Assistant Page
 * Features:
 *   A. AI Customer Service (Specs, Official Pricing, Availability, Draft Inquiry, Handover)
 *   B. AI Owner Assistant (Executive Audit, Revenue, Cash In, AR, Profit, Productivity, Top Clients, Security Role Guard)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Truck,
  Users,
  Clock,
  AlertCircle,
  FileText,
  Layers,
  ChevronRight,
  Headphones,
  Crown,
  Lock,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  askAICustomerService,
  askAIOwnerAssistant,
  AICustomerServiceResponse,
  AIOwnerAssistantResponse,
} from '../../lib/ai-service';

type AssistantTab = 'customer_service' | 'owner_assistant';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  toolExecuted?: string | null;
  toolData?: any;
  draftInquiry?: any;
  isHandover?: boolean;
  auditTrail?: {
    period: string;
    keyFigures: any;
    dataSources: string[];
  };
}

export const AIAssistantPage: React.FC = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<AssistantTab>('owner_assistant');

  // Customer Service State
  const [csInput, setCsInput] = useState<string>('');
  const [csLoading, setCsLoading] = useState<boolean>(false);
  const [csMessages, setCsMessages] = useState<ChatMessage[]>([
    {
      id: 'cs-init-1',
      sender: 'ai',
      text: 'Layanan AI pelanggan sedang dinonaktifkan sementara sampai tarif, jadwal armada, dan permintaan sewa terhubung ke database produksi.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    },
  ]);

  // Owner Assistant State
  const [ownerInput, setOwnerInput] = useState<string>('');
  const [ownerLoading, setOwnerLoading] = useState<boolean>(false);
  const [ownerMessages, setOwnerMessages] = useState<ChatMessage[]>([
    {
      id: 'owner-init-1',
      sender: 'ai',
      text: 'Asisten finansial owner sedang dinonaktifkan sementara. Fitur akan dibuka kembali setelah laporan terhubung ke data produksi yang terverifikasi.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    },
  ]);

  const csEndRef = useRef<HTMLDivElement>(null);
  const ownerEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    csEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [csMessages]);

  useEffect(() => {
    ownerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ownerMessages]);

  // Handle Customer Service Submit
  const handleSendCS = async (textToSend?: string) => {
    const text = (textToSend || csInput).trim();
    if (!text || csLoading) return;

    setCsInput('');
    const userMsg: ChatMessage = {
      id: `cs-u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };
    setCsMessages((prev) => [...prev, userMsg]);
    setCsLoading(true);

    try {
      const res: AICustomerServiceResponse = await askAICustomerService({
        message: text,
        customerName: 'Kontraktor Mitra',
        customerPhone: '6281234567802',
      });

      const aiMsg: ChatMessage = {
        id: `cs-ai-${Date.now()}`,
        sender: 'ai',
        text: res.responseText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        toolExecuted: res.toolExecuted,
        toolData: res.toolData,
        draftInquiry: res.draftInquiry,
        isHandover: res.isHandover,
      };
      setCsMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Error fallback
    } finally {
      setCsLoading(false);
    }
  };

  // Handle Owner Assistant Submit
  const handleSendOwner = async (queryToSend?: string) => {
    const query = (queryToSend || ownerInput).trim();
    if (!query || ownerLoading) return;

    setOwnerInput('');
    const userMsg: ChatMessage = {
      id: `owner-u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };
    setOwnerMessages((prev) => [...prev, userMsg]);
    setOwnerLoading(true);

    try {
      const res: AIOwnerAssistantResponse = await askAIOwnerAssistant({
        query,
        userRole: role,
        userEmail: undefined,
      });

      const aiMsg: ChatMessage = {
        id: `owner-ai-${Date.now()}`,
        sender: 'ai',
        text: res.responseText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        toolExecuted: res.toolExecuted,
        auditTrail: res.auditTrail,
      };
      setOwnerMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Error fallback
    } finally {
      setOwnerLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Industrial Header Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Kecerdasan Buatan CPMS (Gemini AI)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Gemini 3.8 Flash • Controlled Tools
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dua mesin AI terpadu: Layanan Pelanggan Otomatis (Anti-Halusinasi Harga) & Asisten Eksekutif Finansial Owner
          </p>
        </div>

        {/* Current Role Guard Indicator */}
        <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span className="text-slate-500 font-semibold">Akses Saat Ini:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
              role === 'owner'
                ? 'bg-orange-100 text-orange-800 border border-orange-300'
                : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}
          >
            {role === 'owner' ? '👑 Owner (Akses Penuh)' : '🛡️ Admin (Terbatas)'}
          </span>

        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-bold max-w-md">
        <button
          onClick={() => setActiveTab('owner_assistant')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'owner_assistant'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-orange-400" />
          <span>AI Owner Assistant</span>
        </button>
        <button
          onClick={() => setActiveTab('customer_service')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'customer_service'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Headphones className="w-3.5 h-3.5 text-emerald-400" />
          <span>AI Customer Service</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: AI OWNER ASSISTANT (EXECUTIVE ADVISOR) */}
      {/* ========================================================================= */}
      {activeTab === 'owner_assistant' && (
        <div className="space-y-4">
          {/* Security Alert if Admin is logged in */}
          {role !== 'owner' ? (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-red-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center text-red-600 shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-900 flex items-center gap-2">
                    <span>Akses Keuangan Eksekutif Dibatasi (Admin Mode)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-red-200 text-red-900 font-mono">
                      HTTP 403 FORBIDDEN
                    </span>
                  </h3>
                  <p className="text-xs text-red-800 mt-1 leading-relaxed">
                    Sesuai aturan keamanan perusahaan, <strong>informasi keuangan sensitif, omzet, laba bersih, kas bank, dan piutang dilindungi dari akses akun Admin</strong>. Hanya akun dengan wewenang <strong>Owner</strong> yang dapat berinteraksi dengan AI Owner Assistant.
                  </p>
                </div>
              </div>
              <button
                onClick={() => switchRole('owner')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Crown className="w-4 h-4 text-orange-400" />
                <span>Beralih ke Akun Owner</span>
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-emerald-950 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Akses Owner Terverifikasi:</strong> Pertanyaan finansial diproses dengan query terkontrol langsung ke database akuntansi riil. <em>(Zero Hallucination Policy & No Free SQL).</em>
                </span>
              </div>
              <span className="font-mono text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded font-bold">
                AUDITED DATA
              </span>
            </div>
          )}

          {/* Chat Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[65vh] overflow-hidden">
            {/* Header info */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white text-xs">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold flex items-center gap-2">
                    <span>Executive AI Advisor (Owner Intelligence)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Sumber data: Invoices, Kwitansi Kas, Pengeluaran Pool & Utilisasi 22 Unit
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-orange-400 font-mono font-bold bg-slate-800 px-2 py-1 rounded">
                Periode: Maret 2026
              </span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {ownerMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 shadow-2xs text-xs relative ${
                        isUser
                          ? 'bg-slate-900 text-white rounded-tr-xs'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {isUser ? (
                          <User className="w-3.5 h-3.5 text-orange-400" />
                        ) : (
                          <Crown className="w-3.5 h-3.5 text-orange-600" />
                        )}
                        <span className="font-bold text-[11px]">
                          {isUser ? 'Ir. H. Sudirman (Owner)' : 'AI Executive Advisor'}
                        </span>
                        <span className="text-[10px] opacity-60 ml-auto font-mono">{msg.timestamp}</span>
                      </div>

                      <div className="whitespace-pre-line leading-relaxed text-slate-800">
                        {msg.text}
                      </div>

                      {/* Explicit Audit Trail Card (Required) */}
                      {msg.auditTrail && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 bg-slate-50 p-2.5 rounded-xl border text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Audit Trail & Sumber Data Terverifikasi:
                            </span>
                            <span className="font-mono text-slate-700">{msg.auditTrail.period}</span>
                          </div>

                          <div className="text-[10px] text-slate-600 space-y-0.5">
                            <p>
                              <strong>Tabel Database:</strong>{' '}
                              <code className="text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                                {msg.auditTrail.dataSources.join(', ')}
                              </code>
                            </p>
                            <p className="text-emerald-700 font-semibold">
                              ✓ Data dihitung menggunakan formula akuntansi resmi CPMS, bukan perkiraan acak.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {ownerLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 italic p-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
                  <span>AI Advisor sedang mengeksekusi query data keuangan & menghitung audit...</span>
                </div>
              )}
              <div ref={ownerEndRef} />
            </div>

            {/* Quick 9 Supported Question Pills for Owner */}
            <div className="p-2.5 bg-slate-100 border-t border-slate-200 overflow-x-auto flex items-center gap-1.5 text-xs shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 pl-1">
                Pertanyaan Cepat:
              </span>
              {[
                'Berapa omzet bulan ini?',
                'Berapa pembayaran yang masuk?',
                'Berapa piutang customer?',
                'Berapa biaya operasional?',
                'Berapa laba bulan ini?',
                'Unit mana yang paling produktif?',
                'Siapa customer terbesar?',
                'Bagaimana jadwal minggu ini?',
                'Customer mana yang belum follow-up?',
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={role !== 'owner' || ownerLoading}
                  onClick={() => handleSendOwner(q)}
                  className="px-2.5 py-1 bg-white hover:bg-orange-50 border border-slate-300 hover:border-orange-500 rounded-full text-[11px] font-semibold text-slate-700 hover:text-orange-950 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  <span>{q}</span>
                </button>
              ))}
            </div>

            {/* Input Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOwner();
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                disabled={role !== 'owner' || ownerLoading}
                placeholder={
                  role !== 'owner'
                    ? 'Akses diblokir: Beralih ke role Owner untuk bertanya data eksekutif...'
                    : 'Tanyakan metrik keuangan, produktivitas armada, atau jadwal operasional...'
                }
                value={ownerInput}
                onChange={(e) => setOwnerInput(e.target.value)}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={role !== 'owner' || ownerLoading || !ownerInput.trim()}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-orange-400" />
                <span>Kirim</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION A: AI CUSTOMER SERVICE (PROSPECT & WHATSAPP SIMULATOR) */}
      {/* ========================================================================= */}
      {activeTab === 'customer_service' && (
        <div className="space-y-4">
          {/* Rules Banner (Anti-Hallucination & Booking Validation) */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-blue-950 flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Standar Integritas Layanan Pelanggan CPMS</p>
              <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                1. <strong>Anti-Halusinasi:</strong> AI terikat pada tarif resmi (Paket 8 jam, semen bedding, extra m³) dan pengecekan ketersediaan 22 armada riil.<br />
                2. <strong>Batas Otoritas:</strong> Pemesanan oleh AI berstatus <strong>Inquiry (Draft)</strong> dan TIDAK PERNAH otomatis menjadi <em>Confirmed</em> tanpa survei teknis dan persetujuan DP oleh Admin/Owner.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[65vh] overflow-hidden">
            {/* Header info */}
            <div className="p-3.5 bg-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold flex items-center gap-2">
                    <span>AI Customer Service Assistant (WhatsApp Public Responder)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </h3>
                  <p className="text-[10px] text-emerald-200">
                    Spesifikasi Pompa • Simulasi Tarif • Cek Armada • Buat Draft Inquiry
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-200 font-mono font-bold bg-emerald-950/60 px-2 py-1 rounded border border-emerald-700/50">
                PT BETON PERKASA MANDIRI
              </span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#EFEAE2]/60">
              {csMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 shadow-2xs text-xs relative ${
                        isUser
                          ? 'bg-[#E7FFDB] text-slate-900 rounded-tr-xs'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {isUser ? (
                          <User className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span className="font-bold text-[11px]">
                          {isUser ? 'Calon Pelanggan (Kontraktor)' : 'AI Customer Service CPMS'}
                        </span>
                        <span className="text-[10px] opacity-60 ml-auto font-mono">{msg.timestamp}</span>
                      </div>

                      <div className="whitespace-pre-line leading-relaxed text-slate-800">
                        {msg.text}
                      </div>

                      {/* Tool Executed Badge */}
                      {msg.toolExecuted && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Backend Tool Terverifikasi: {msg.toolExecuted}</span>
                        </div>
                      )}

                      {/* Draft Inquiry Card if generated */}
                      {msg.draftInquiry && (
                        <div className="mt-3 bg-amber-50 border border-amber-300 p-3 rounded-xl text-amber-950 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-amber-900">
                              📋 {msg.draftInquiry.booking_code}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-900">
                              {msg.draftInquiry.status} (DRAFT)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 font-medium">
                            Kontak: {msg.draftInquiry.contact_name} (+{msg.draftInquiry.contact_wa})
                          </p>
                          <p className="text-[10px] text-amber-800 font-semibold mt-1">
                            ⚠️ {msg.draftInquiry.status_note}
                          </p>
                        </div>
                      )}

                      {/* Handover to Admin Banner */}
                      {msg.isHandover && (
                        <div className="mt-3 bg-blue-50 border border-blue-300 p-3 rounded-xl text-blue-950 flex items-center gap-2">
                          <Headphones className="w-5 h-5 text-blue-600 shrink-0" />
                          <div className="text-[11px]">
                            <p className="font-bold">Handover ke Admin Terkirim!</p>
                            <p className="text-blue-800 text-[10px]">
                              Tiket eskalasi telah diteruskan ke Unified Inbox tim Dispatcher CPMS untuk tindak lanjut via telepon/WhatsApp.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {csLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 italic p-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>AI Customer Service sedang memvalidasi spesifikasi & menghitung tarif...</span>
                </div>
              )}
              <div ref={csEndRef} />
            </div>

            {/* Quick Prompt Pills for Customer Service */}
            <div className="p-2.5 bg-slate-100 border-t border-slate-200 overflow-x-auto flex items-center gap-1.5 text-xs shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 pl-1">
                Simulasi Tanya:
              </span>
              {[
                'Apa saja jenis dan spesifikasi concrete pump yang tersedia?',
                'Berapa tarif sewa pompa standar 36m untuk volume 65 m3?',
                'Apakah ada unit pompa yang tersedia untuk tanggal hari ini?',
                'Saya ingin booking sewa pompa untuk Proyek Silk Town Alexandria',
                'Saya ingin bicara langsung dengan Admin / Tim Dispatcher',
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={csLoading}
                  onClick={() => handleSendCS(q)}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 rounded-full text-[11px] font-semibold text-slate-700 hover:text-emerald-950 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>{q}</span>
                </button>
              ))}
            </div>

            {/* Input Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCS();
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                disabled={csLoading}
                placeholder="Ketik pertanyaan calon pelanggan (spesifikasi, tarif, ketersediaan unit)..."
                value={csInput}
                onChange={(e) => setCsInput(e.target.value)}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={csLoading || !csInput.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
