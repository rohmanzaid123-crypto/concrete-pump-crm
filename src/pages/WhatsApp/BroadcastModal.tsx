/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * WhatsApp Broadcast Campaign Modal (Meta Policy Compliant)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileText,
  Clock,
} from 'lucide-react';
import {
  BroadcastCampaign,
  WhatsAppContact,
  WhatsAppContactGroup,
  WhatsAppTemplate,
} from '../../types/database';
import { fetchContacts, fetchTemplates, createBroadcastCampaign } from '../../lib/whatsapp-store';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (campaign: BroadcastCampaign) => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [campaignName, setCampaignName] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [targetGroup, setTargetGroup] = useState<WhatsAppContactGroup | 'all'>('all');
  const [scheduledAt, setScheduledAt] = useState<string>('');

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [tpls, cts] = await Promise.all([fetchTemplates(), fetchContacts()]);
      setTemplates(tpls);
      setContacts(cts);
      if (tpls.length > 0) setTemplateId(tpls[0].id);
    }
    if (isOpen) {
      load();
      setCampaignName(`Broadcast Operasional - ${new Date().toLocaleDateString('id-ID')}`);
    }
  }, [isOpen]);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === templateId);
  }, [templates, templateId]);

  // Target Contacts and Opt-in Compliance Counter
  const targetContacts = useMemo(() => {
    if (targetGroup === 'all') return contacts;
    return contacts.filter((c) => c.group_tag === targetGroup);
  }, [contacts, targetGroup]);

  const optedInCount = useMemo(() => {
    return targetContacts.filter((c) => c.opt_in_status === 'opted_in').length;
  }, [targetContacts]);

  const optedOutCount = targetContacts.length - optedInCount;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (optedInCount === 0) {
      setErrorMessage(
        'Tidak ada kontak dengan status Opt-In pada target grup yang dipilih. Meta melarang broadcast ke nomor tanpa izin.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createBroadcastCampaign({
        campaign_name: campaignName,
        template_id: templateId,
        target_group: targetGroup,
        scheduled_at: scheduledAt || undefined,
        created_by: 'Ir. H. Sudirman (Owner)',
      });

      if (!res.success || !res.campaign) {
        setErrorMessage(res.error || 'Gagal mengirim broadcast');
      } else {
        onSuccess(res.campaign);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Kirim Broadcast WhatsApp Massal</h2>
              <p className="text-xs text-slate-400">Pengiriman template pesan resmi sesuai kebijakan Meta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kampanye Broadcast *
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              required
              className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Template Pesan Meta (Approved) *
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              required
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.template_name} ({t.category}) - {t.header_text || 'Standard'}
                </option>
              ))}
            </select>
          </div>

          {/* Target Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kelompok Kontak Penerima (Target Audience) *
            </label>
            <select
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value as any)}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
            >
              <option value="all">Semua Kontak Customer & Mitra ({contacts.length} Nomor)</option>
              <option value="kontraktor_bumn">Kontraktor BUMN (WIKA, Adhi Karya, PP, Waskita)</option>
              <option value="kontraktor_swasta">Kontraktor Swasta & Developer Properti</option>
              <option value="mandor">Mandor Cor & Subkon Perorangan</option>
              <option value="batching_plant">Batching Plant Mitra Ready Mix</option>
            </select>
          </div>

          {/* Meta Policy Opt-In Verification Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verifikasi Kepatuhan Meta Opt-In:
              </span>
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                {optedInCount} Kontak Memenuhi Syarat
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sistem memfilter nomor agar tidak terjadi pemblokiran akun WhatsApp Business. Dari {targetContacts.length} kontak di grup ini,{' '}
              <strong>{optedInCount} nomor</strong> memiliki status izin resmi (Opted-In).
              {optedOutCount > 0 && ` (${optedOutCount} nomor dilewati karena belum opt-in)`}.
            </p>
          </div>

          {/* Template Live Preview */}
          {selectedTemplate && (
            <div className="bg-emerald-950/90 text-white p-4 rounded-xl space-y-2 text-xs border border-emerald-900 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Preview Template Pesan:
              </span>
              {selectedTemplate.header_text && (
                <p className="font-bold text-xs text-white uppercase border-b border-emerald-800 pb-1">
                  {selectedTemplate.header_text}
                </p>
              )}
              <p className="text-slate-200 whitespace-pre-line leading-relaxed text-[11px]">
                {selectedTemplate.body_text}
              </p>
              {selectedTemplate.footer_text && (
                <p className="text-[10px] text-emerald-400 italic pt-1 border-t border-emerald-800/80">
                  {selectedTemplate.footer_text}
                </p>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || optedInCount === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Mengirim Broadcast...' : `Kirim ke ${optedInCount} Kontak`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
