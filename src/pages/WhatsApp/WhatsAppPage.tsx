/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * WhatsApp Business Cloud API & Unified Inbox Master Page
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Send,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Phone,
  ShieldCheck,
  Settings,
  Plus,
  RefreshCw,
  User,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  BroadcastCampaign,
  CPMSNotification,
  WhatsAppConfig,
  WhatsAppContact,
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppTemplate,
} from '../../types/database';
import { formatTanggal, formatRupiah } from '../../lib/formatters';
import {
  getStoredWhatsAppConfig,
  fetchConversations,
  fetchConversationMessages,
  sendOutboundMessage,
  fetchTemplates,
  fetchBroadcastCampaigns,
  fetchNotifications,
  markNotificationAsRead,
} from '../../lib/whatsapp-store';
import { WhatsAppConfigModal } from './WhatsAppConfigModal';
import { BroadcastModal } from './BroadcastModal';

type WhatsAppTab = 'inbox' | 'templates' | 'broadcasts' | 'notifications';

export const WhatsAppPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WhatsAppTab>('inbox');
  const [config, setConfig] = useState<WhatsAppConfig>(getStoredWhatsAppConfig());

  // Unified Inbox states
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [inboxFilter, setInboxFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchContact, setSearchContact] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // Other tabs
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [notifications, setNotifications] = useState<CPMSNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [convs, tpls, cpgs, notifs] = await Promise.all([
        fetchConversations(),
        fetchTemplates(),
        fetchBroadcastCampaigns(),
        fetchNotifications(),
      ]);
      setConversations(convs);
      setTemplates(tpls);
      setCampaigns(cpgs);
      setNotifications(notifs);

      if (convs.length > 0 && !selectedConvId) {
        setSelectedConvId(convs[0].id);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load active conversation messages when selectedConvId changes
  useEffect(() => {
    if (!selectedConvId) return;

    let isCancelled = false;
    async function loadThread() {
      const msgs = await fetchConversationMessages(selectedConvId);
      if (!isCancelled) {
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
    loadThread();

    return () => {
      isCancelled = true;
    };
  }, [selectedConvId]);

  // Selected conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || conversations[0];
  }, [conversations, selectedConvId]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (inboxFilter !== 'all' && c.status !== inboxFilter) return false;
      if (searchContact.trim() !== '') {
        const q = searchContact.toLowerCase();
        const mName = c.contact_name.toLowerCase().includes(q);
        const mCo = (c.company_name || '').toLowerCase().includes(q);
        const mWa = c.contact_wa.includes(q);
        if (!mName && !mCo && !mWa) return false;
      }
      return true;
    });
  }, [conversations, inboxFilter, searchContact]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeConversation || isSending) return;

    const textToSend = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      const res = await sendOutboundMessage({
        conversationId: activeConversation.id,
        contactWa: activeConversation.contact_wa,
        body: textToSend,
        messageType: 'text',
      });

      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message!]);
        // Update local conversation preview
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? { ...c, last_message_text: textToSend, last_message_time: res.message!.created_at }
              : c
          )
        );
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTemplate = async (template: WhatsAppTemplate) => {
    if (!activeConversation) return;

    let text = template.body_text
      .replace('{{1}}', activeConversation.contact_name)
      .replace('{{2}}', 'BK-2026-0001')
      .replace('{{3}}', activeConversation.company_name || 'Proyek Cor')
      .replace('{{4}}', '01 Maret 2026')
      .replace('{{5}}', '08:00 WIB')
      .replace('{{6}}', 'CP-36-01')
      .replace('{{7}}', 'Wahyudi Pratama');

    const res = await sendOutboundMessage({
      conversationId: activeConversation.id,
      contactWa: activeConversation.contact_wa,
      body: text,
      messageType: 'template',
      templateName: template.template_name,
    });

    if (res.success && res.message) {
      setMessages((prev) => [...prev, res.message!]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const renderStatusTicks = (status: WhatsAppMessage['status']) => {
    switch (status) {
      case 'read':
        return (
          <span title="Dibaca (Blue Ticks)">
            <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
          </span>
        );
      case 'delivered':
        return (
          <span title="Terkirim ke Perangkat">
            <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
          </span>
        );
      case 'sent':
        return (
          <span title="Terkirim dari Server">
            <Check className="w-3.5 h-3.5 text-slate-300" />
          </span>
        );
      case 'pending':
        return (
          <span title="Menunggu Pengiriman">
            <Clock className="w-3 h-3 text-slate-300 animate-spin" />
          </span>
        );
      case 'failed':
        return (
          <span title="Gagal Terkirim">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Integration Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">WhatsApp Business Gateway</h1>
            {/* Real Meta Status Badge */}
            {config.is_connected ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Meta API Terhubung ({config.display_phone_number || '+62 812-9900-8800'})
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Belum Terhubung ke Meta
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Meta WhatsApp Business Cloud API v21.0 • Unified Inbox, Notifikasi Booking, Pengingat DP, & Broadcast
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Broadcast</span>
          </button>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-orange-400" />
            <span>Pengaturan API & Webhook</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-bold max-w-xl">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'inbox' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>Unified Inbox ({conversations.reduce((acc, c) => acc + c.unread_count, 0)})</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
            activeTab === 'templates' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Template Meta ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('broadcasts')}
          className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
            activeTab === 'broadcasts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Broadcast ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
            activeTab === 'notifications' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Notifikasi Sistem ({notifications.filter((n) => !n.is_read).length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: UNIFIED INBOX (3-COLUMN LAYOUT) */}
      {/* ========================================================================= */}
      {activeTab === 'inbox' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[74vh] flex">
          {/* COLUMN 1: CONVERSATIONS LIST (LEFT) */}
          <div className="w-80 border-r border-slate-200 flex flex-col h-full bg-slate-50/50 shrink-0">
            {/* Search and Filters */}
            <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kontak atau nomor WA..."
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setInboxFilter('all')}
                  className={`px-2.5 py-0.5 rounded ${
                    inboxFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setInboxFilter('open')}
                  className={`px-2.5 py-0.5 rounded ${
                    inboxFilter === 'open' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Terbuka
                </button>
                <button
                  onClick={() => setInboxFilter('resolved')}
                  className={`px-2.5 py-0.5 rounded ${
                    inboxFilter === 'resolved' ? 'bg-slate-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Selesai
                </button>
              </div>
            </div>

            {/* Conversation Threads */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Tidak ada percakapan
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = c.id === selectedConvId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedConvId(c.id)}
                      className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600'
                          : 'hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-orange-400 font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                        {c.contact_name.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-bold text-slate-900 truncate">{c.contact_name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(c.last_message_time).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 truncate">{c.company_name}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.last_message_text}</p>
                      </div>

                      {c.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: ACTIVE CHAT THREAD (CENTER) */}
          <div className="flex-1 flex flex-col h-full bg-[#EFEAE2] min-w-0">
            {/* Chat Thread Header */}
            {activeConversation ? (
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shadow-xs z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-600 font-black flex items-center justify-center text-xs text-white">
                    {activeConversation.contact_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold">{activeConversation.contact_name}</h3>
                    <p className="text-[10px] text-slate-400">
                      {activeConversation.company_name} •{' '}
                      <span className="font-mono text-emerald-400">+{activeConversation.contact_wa}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                    Agent: {activeConversation.assigned_agent || 'Admin'}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => {
                const isOutbound = m.direction === 'outbound';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 shadow-2xs text-xs relative ${
                        isOutbound
                          ? 'bg-[#E7FFDB] text-slate-900 rounded-tr-xs'
                          : 'bg-white text-slate-900 rounded-tl-xs'
                      }`}
                    >
                      {m.template_name && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1 bg-emerald-100/60 px-1.5 py-0.5 rounded border border-emerald-200">
                          <Sparkles className="w-3 h-3" />
                          <span>Template: {m.template_name}</span>
                        </div>
                      )}

                      <p className="whitespace-pre-line leading-relaxed text-slate-800">{m.body}</p>

                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 font-mono">
                        <span>
                          {new Date(m.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isOutbound && renderStatusTicks(m.status)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Template Suggestion Chips */}
            <div className="p-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                Pesan Cepat:
              </span>
              {templates.slice(0, 3).map((tpl) => (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => handleSendTemplate(tpl)}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 rounded-full text-[11px] font-semibold text-slate-700 hover:text-emerald-900 whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>{tpl.template_name.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>

            {/* Message Composer Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ketik pesan balasan ke PIC kontraktor..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isSending || !messageInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </form>
          </div>

          {/* COLUMN 3: CUSTOMER DOSSIER & QUICK BOOKING (RIGHT) */}
          {activeConversation ? (
            <div className="w-72 border-l border-slate-200 p-4 bg-white flex flex-col h-full overflow-y-auto space-y-4 shrink-0 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Profil Kontak WhatsApp
                </span>
                <p className="font-bold text-slate-900 text-sm">{activeConversation.contact_name}</p>
                <p className="font-semibold text-slate-700 mt-0.5">{activeConversation.company_name}</p>
                <p className="font-mono text-emerald-700 font-bold mt-1">+{activeConversation.contact_wa}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Status Kepatuhan Meta
                </span>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Opt-In Aktif (Resmi)</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Pelanggan telah memberikan izin komunikasi resmi Meta WhatsApp Business.
                </p>
              </div>

              {activeConversation.booking_id && (
                <div className="bg-orange-50/70 p-3 rounded-xl border border-orange-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-950 block">
                    Booking Cor Terkait
                  </span>
                  <p className="font-bold text-slate-900 font-mono">BK-2026-0001</p>
                  <p className="text-[11px] text-slate-700">Silk Town Alexandria (65 m³)</p>
                  <p className="text-[10px] text-orange-800 font-semibold">Armada: CP-36-01</p>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Aksi Cepat Dokumen
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const tpl = templates.find((t) => t.template_name === 'pengiriman_sph_quotation');
                    if (tpl) handleSendTemplate(tpl);
                  }}
                  className="w-full text-left p-2 rounded-lg border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 flex items-center justify-between transition-colors"
                >
                  <span className="font-bold text-slate-800">Kirim Penawaran SPH</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const tpl = templates.find((t) => t.template_name === 'pengingat_pelunasan_tagihan');
                    if (tpl) handleSendTemplate(tpl);
                  }}
                  className="w-full text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-between transition-colors"
                >
                  <span className="font-bold text-slate-800">Kirim Tagihan Invoice</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: META MESSAGE TEMPLATES */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Kepatuhan Kebijakan 24-Hour Customer Service Window Meta</p>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Pesan keluar yang dikirim di luar jendela interaksi 24 jam hanya dapat menggunakan Template Pesan Resmi
                yang telah berstatus <strong>APPROVED</strong> oleh Meta. Seluruh template berikut telah diverifikasi dan siap digunakan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {tpl.status}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">
                      {tpl.category} • {tpl.language.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-mono font-bold text-xs text-slate-900">{tpl.template_name}</h3>
                  {tpl.header_text && (
                    <p className="text-[11px] font-bold text-orange-600 uppercase mt-1">{tpl.header_text}</p>
                  )}
                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
                    {tpl.body_text}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
                  <span>{tpl.footer_text || 'PT Beton Perkasa Mandiri'}</span>
                  <span className="font-bold text-emerald-600">Resmi Meta</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BROADCAST CAMPAIGNS */}
      {/* ========================================================================= */}
      {activeTab === 'broadcasts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Riwayat Kampanye Broadcast WhatsApp</h3>
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Broadcast Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Nama Kampanye</th>
                  <th className="px-5 py-3.5">Template Pesan</th>
                  <th className="px-5 py-3.5">Kelompok Target</th>
                  <th className="px-5 py-3.5 text-center">Penerima</th>
                  <th className="px-5 py-3.5 text-center">Terkirim</th>
                  <th className="px-5 py-3.5 text-center">Terbaca</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Belum ada riwayat broadcast kampanye.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((bc) => (
                    <tr key={bc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900">{bc.campaign_name}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {formatTanggal(bc.created_at)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-800">
                        {bc.template_name}
                      </td>
                      <td className="px-5 py-3.5 font-bold uppercase text-slate-600">{bc.target_group}</td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-900">{bc.total_recipients}</td>
                      <td className="px-5 py-3.5 text-center font-bold text-emerald-700 font-mono">
                        {bc.delivered_count} ({Math.round((bc.delivered_count / Math.max(1, bc.total_recipients)) * 100)}%)
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-blue-700 font-mono">
                        {bc.read_count} ({Math.round((bc.read_count / Math.max(1, bc.total_recipients)) * 100)}%)
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {bc.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: OPERATIONAL NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Log Notifikasi Sistem & WhatsApp Otomatis</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`py-3 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors ${
                  !n.is_read ? 'bg-orange-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-orange-400 flex items-center justify-center font-bold shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{n.title}</span>
                      {n.whatsapp_sent && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Terkirim WA
                        </span>
                      )}
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatTanggal(n.sent_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <WhatsAppConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigUpdated={(newCfg) => setConfig(newCfg)}
      />

      <BroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSuccess={(c) => setCampaigns((prev) => [c, ...prev])}
      />
    </div>
  );
};
