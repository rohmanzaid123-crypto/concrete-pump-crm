/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Meta WhatsApp Business Cloud API Configuration & Live Connection Tester
 */

import React, { useState } from 'react';
import {
  X,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  RefreshCw,
  Key,
  Smartphone,
  Globe,
  Lock,
} from 'lucide-react';
import { WhatsAppConfig } from '../../types/database';
import {
  getStoredWhatsAppConfig,
  saveWhatsAppConfig,
  testMetaWhatsAppConnection,
} from '../../lib/whatsapp-store';

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: (config: WhatsAppConfig) => void;
}

export const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = getStoredWhatsAppConfig();

  const [accessToken, setAccessToken] = useState<string>(currentConfig.access_token || '');
  const [phoneNumberId, setPhoneNumberId] = useState<string>(currentConfig.phone_number_id || '');
  const [wabaId, setWabaId] = useState<string>(currentConfig.business_account_id || '');
  const [verifyToken, setVerifyToken] = useState<string>(
    currentConfig.verify_token || 'cpms_meta_verify_token_2026'
  );

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    verifiedName?: string;
    displayPhoneNumber?: string;
    qualityRating?: string;
  } | null>(null);

  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(currentConfig.webhook_url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleCopyVerifyToken = () => {
    navigator.clipboard.writeText(verifyToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const res = await testMetaWhatsAppConnection({
      access_token: accessToken,
      phone_number_id: phoneNumberId,
      business_account_id: wabaId,
    });

    setIsTesting(false);

    if (res.isConnected) {
      setTestResult({
        tested: true,
        success: true,
        message: 'Koneksi Berhasil! Akun WhatsApp Business Cloud API Meta terhubung dan terverifikasi.',
        verifiedName: res.verifiedName,
        displayPhoneNumber: res.displayPhoneNumber,
        qualityRating: res.qualityRating,
      });

      const updated: WhatsAppConfig = {
        ...currentConfig,
        access_token: accessToken,
        phone_number_id: phoneNumberId,
        business_account_id: wabaId,
        verify_token: verifyToken,
        is_connected: true,
        display_phone_number: res.displayPhoneNumber,
        verified_name: res.verifiedName,
        quality_rating: res.qualityRating,
        last_tested_at: new Date().toISOString(),
        test_error: undefined,
      };
      saveWhatsAppConfig(updated);
      onConfigUpdated(updated);
    } else {
      setTestResult({
        tested: true,
        success: false,
        message: res.error || 'Gagal terhubung ke Meta Graph API.',
      });

      const updated: WhatsAppConfig = {
        ...currentConfig,
        access_token: accessToken,
        phone_number_id: phoneNumberId,
        business_account_id: wabaId,
        verify_token: verifyToken,
        is_connected: false,
        last_tested_at: new Date().toISOString(),
        test_error: res.error,
      };
      saveWhatsAppConfig(updated);
      onConfigUpdated(updated);
    }
  };

  const handleSaveOnly = (e: React.FormEvent) => {
    e.preventDefault();

    const hasCreds = accessToken.trim().length > 0 && phoneNumberId.trim().length > 0;
    const updated: WhatsAppConfig = {
      ...currentConfig,
      access_token: accessToken,
      phone_number_id: phoneNumberId,
      business_account_id: wabaId,
      verify_token: verifyToken,
      is_connected: hasCreds ? currentConfig.is_connected : false,
      test_error: hasCreds ? currentConfig.test_error : 'Kredensial belum lengkap.',
    };
    saveWhatsAppConfig(updated);
    onConfigUpdated(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Pengaturan Meta WhatsApp Business Cloud API</h2>
              <p className="text-xs text-slate-400">Integrasi resmi Meta Graph API v21.0 & Webhook Web</p>
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
        <form onSubmit={handleSaveOnly} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Connection Status Banner (Truthful & Genuine) */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
              currentConfig.is_connected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            {currentConfig.is_connected ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {currentConfig.is_connected
                    ? 'Status: Terhubung Aktif ke Meta Cloud API'
                    : 'Status: Belum Terhubung (Kredensial Belum Terverifikasi)'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    currentConfig.is_connected
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {currentConfig.is_connected ? 'Active' : 'Unconfigured'}
                </span>
              </div>
              <p className="text-[11px] mt-1 leading-relaxed">
                {currentConfig.is_connected ? (
                  <>
                    Terdaftar sebagai <strong>{currentConfig.verified_name}</strong> (
                    {currentConfig.display_phone_number}). Kualitas akun: {currentConfig.quality_rating}.
                  </>
                ) : (
                  currentConfig.test_error ||
                  'Masukkan Access Token resmi dan Phone Number ID dari Meta Developer Portal untuk mengaktifkan pengiriman WhatsApp otomatis.'
                )}
              </p>
            </div>
          </div>

          {/* Test Result Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Meta API Credentials Fields */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-4 h-4 text-orange-600" />
              Kredensial Backend Secrets (Meta Cloud API)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                System User Access Token (Permanent Token Meta) *
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="EAAG..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Dihasilkan dari Meta Business Manager &rarr; System Users dengan izin <code>whatsapp_business_messaging</code>.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number ID Meta *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 105992837482910"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  ID nomor WhatsApp terdaftar di Meta App Dashboard.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Business Account ID (WABA ID)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 982736451029384"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Webhook Configuration for Inbound Messages */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-orange-600" />
              Webhook Pesan Masuk & Status Delivery
            </h3>
            <p className="text-[11px] text-slate-600">
              Salin URL Callback dan Verify Token ini ke menu <strong>WhatsApp &rarr; Configuration &rarr; Webhook</strong> di Meta Developer Console:
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Callback URL Webhook</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentConfig.webhook_url}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedWebhook ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Verify Token</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleCopyVerifyToken}
                  className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedToken ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Menguji ke Meta...' : 'Uji Koneksi Meta Graph API'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
