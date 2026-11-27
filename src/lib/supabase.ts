import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CompanySettings, AuditLog, Profile } from '../types/database';

const STORAGE_KEY_URL = 'cpms_supabase_url';
const STORAGE_KEY_KEY = 'cpms_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  const isProduction = Boolean(import.meta.env.PROD);
  const localUrl = isProduction ? '' : (localStorage.getItem(STORAGE_KEY_URL) || '');
  const localKey = isProduction ? '' : (localStorage.getItem(STORAGE_KEY_KEY) || '');
  const url = isProduction ? envUrl : (localUrl || envUrl);
  const anonKey = isProduction ? envKey : (localKey || envKey);
  const isConfigured = Boolean(url.startsWith('https://') && anonKey.length > 20);
  return { url, anonKey, isConfigured };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string): void {
  if (import.meta.env.PROD) return;
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  cachedClient = null;
}

export function clearStoredSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const config = getStoredSupabaseConfig();
  if (!config.isConfigured) return null;
  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const config = getStoredSupabaseConfig();
  const targetUrl = url || config.url;
  const targetKey = anonKey || config.anonKey;
  if (!targetUrl || !targetKey) {
    return { success: false, message: 'URL atau Anon Key Supabase belum dikonfigurasi.' };
  }
  const startTime = Date.now();
  try {
    const tempClient = createClient(targetUrl, targetKey);
    const { error } = await tempClient.from('company_settings').select('count', { count: 'exact', head: true });
    const latencyMs = Date.now() - startTime;
    if (error && error.code === 'PGRST301') {
      return { success: false, message: `JWT token / Anon key tidak valid: ${error.message}` };
    }
    return {
      success: !error,
      message: error ? `Koneksi Supabase gagal: ${error.message}` : 'Terhubung ke Supabase PostgreSQL secara sukses!',
      latencyMs,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal terhubung ke Supabase: ${msg}` };
  }
}

const STORAGE_KEY_SETTINGS = 'cpms_company_settings';
const STORAGE_KEY_AUDIT_LOGS = 'cpms_audit_logs';
const STORAGE_KEY_PROFILES = 'cpms_profiles';

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: '00000000-0000-0000-0000-000000000001',
  company_name: 'Nama Perusahaan',
  legal_name: '',
  phone_number: '',
  whatsapp_number: '',
  email: '',
  address: '',
  city: '',
  province: '',
  postal_code: '',
  tax_id: '',
  bank_name: '',
  bank_account_name: '',
  bank_account_number: '',
  default_payment_terms_days: 14,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function assertConfiguredClient(): SupabaseClient {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi. Atur environment variables deployment terlebih dahulu.');
  return client;
}

export async function fetchCompanySettings(): Promise<CompanySettings> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.from('company_settings').select('*').limit(1).maybeSingle();
    if (error) throw error;
    if (data) return data as CompanySettings;
  }
  if (import.meta.env.PROD) return DEFAULT_COMPANY_SETTINGS;
  const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (stored) {
    try { return JSON.parse(stored) as CompanySettings; } catch { /* ignore invalid cache */ }
  }
  return DEFAULT_COMPANY_SETTINGS;
}

export async function updateCompanySettings(updates: Partial<CompanySettings>, userEmail: string, userRole: string): Promise<CompanySettings> {
  const client = assertConfiguredClient();
  const current = await fetchCompanySettings();
  const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
  const { error } = await client.from('company_settings').upsert(updated);
  if (error) throw error;
  await recordAuditLog({
    user_id: (await client.auth.getUser()).data.user?.id || userEmail,
    user_email: userEmail,
    user_role: userRole as 'owner' | 'admin',
    action: 'UPDATE_COMPANY_SETTINGS',
    entity_type: 'company_settings',
    entity_id: updated.id,
    details: { fields_updated: Object.keys(updates) },
  });
  return updated;
}

export async function fetchAuditLogs(limit = 50): Promise<AuditLog[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []) as AuditLog[];
  }
  if (import.meta.env.PROD) return [];
  const stored = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
  if (stored) {
    try { return (JSON.parse(stored) as AuditLog[]).slice(0, limit); } catch { /* ignore */ }
  }
  return [];
}

export async function recordAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
  const client = assertConfiguredClient();
  const userId = (await client.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('Sesi pengguna tidak ditemukan untuk pencatatan audit.');
  const newLog: AuditLog = {
    ...log,
    user_id: userId,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const { error } = await client.from('audit_logs').insert(newLog);
  if (error) throw error;
  return newLog;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as Profile[];
  }
  if (import.meta.env.PROD) return [];
  const stored = localStorage.getItem(STORAGE_KEY_PROFILES);
  if (stored) {
    try { return JSON.parse(stored) as Profile[]; } catch { /* ignore */ }
  }
  return [];
}
