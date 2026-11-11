import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CompanySettings, AuditLog, Profile } from '../types/database';

// Storage keys for runtime Supabase configuration
const STORAGE_KEY_URL = 'cpms_supabase_url';
const STORAGE_KEY_KEY = 'cpms_supabase_anon_key';
const STORAGE_KEY_SETTINGS = 'cpms_company_settings';
const STORAGE_KEY_AUDIT_LOGS = 'cpms_audit_logs';
const STORAGE_KEY_PROFILES = 'cpms_profiles';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const localUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  const url = localUrl || (envUrl.includes('your-project') ? '' : envUrl);
  const anonKey = localKey || (envKey === 'your-anon-key' ? '' : envKey);

  const isConfigured = Boolean(url && anonKey && url.startsWith('https://') && anonKey.length > 20);

  return { url, anonKey, isConfigured };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  // Invalidate cached client
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
  if (config.isConfigured) {
    try {
      cachedClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return cachedClient;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return null;
}

/**
 * Test connectivity to Supabase
 */
export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const targetUrl = url || getStoredSupabaseConfig().url;
  const targetKey = anonKey || getStoredSupabaseConfig().anonKey;

  if (!targetUrl || !targetKey) {
    return {
      success: false,
      message: 'URL atau Anon Key Supabase belum dikonfigurasi.',
    };
  }

  const startTime = Date.now();
  try {
    const tempClient = createClient(targetUrl, targetKey);
    // Simple ping to auth endpoint or company_settings
    const { error } = await tempClient.from('company_settings').select('count', { count: 'exact', head: true });
    
    // Even if table doesn't exist yet, if we get 401 or network error we know, but 200 or 404/406 confirms connection
    const latency = Date.now() - startTime;
    if (error && error.code === 'PGRST301') {
      return { success: false, message: `JWT token / Anon key tidak valid: ${error.message}` };
    }
    
    return {
      success: true,
      message: error ? `Terhubung ke Supabase (Catatan: Jalankan migrasi SQL di Supabase SQL Editor)` : `Terhubung ke Supabase PostgreSQL secara sukses!`,
      latencyMs: latency,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal terhubung ke Supabase: ${msg}`,
    };
  }
}

// ==============================================================================
// REPOSITORY LAYER (SUPABASE + LOCAL PERSISTENCE BRIDGE)
// ==============================================================================

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: '00000000-0000-0000-0000-000000000001',
  company_name: 'PT Beton Perkasa Mandiri',
  legal_name: 'PT Beton Perkasa Mandiri',
  phone_number: '+62 21 8899 7711',
  whatsapp_number: '+62 812-9876-5432',
  email: 'operasional@cpms-beton.co.id',
  address: 'Kawasan Pergudangan Armada No. 88, Jl. Raya Industri Cakung',
  city: 'Jakarta Timur',
  province: 'DKI Jakarta',
  postal_code: '13910',
  tax_id: '01.889.771.2-031.000',
  bank_name: 'Bank Central Asia (BCA)',
  bank_account_name: 'PT BETON PERKASA MANDIRI',
  bank_account_number: '8820 1928 31',
  default_payment_terms_days: 14,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Fetch Company Settings
 */
export async function fetchCompanySettings(): Promise<CompanySettings> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as CompanySettings;
      }
    } catch (err) {
      console.warn('Supabase fetchCompanySettings error, falling back to local storage:', err);
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (stored) {
    try {
      return JSON.parse(stored) as CompanySettings;
    } catch {
      // ignore
    }
  }

  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_COMPANY_SETTINGS));
  return DEFAULT_COMPANY_SETTINGS;
}

/**
 * Update Company Settings (Restricted to OWNER in backend/RLS)
 */
export async function updateCompanySettings(updates: Partial<CompanySettings>, userEmail: string, userRole: string): Promise<CompanySettings> {
  const current = await fetchCompanySettings();
  const updated: CompanySettings = {
    ...current,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client
        .from('company_settings')
        .upsert(updated);

      if (error) {
        console.warn('Supabase upsert error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase error updating company settings:', err);
    }
  }

  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));

  // Log to Audit Log
  await recordAuditLog({
    user_id: userEmail,
    user_email: userEmail,
    user_role: userRole as 'owner' | 'admin',
    action: 'UPDATE_COMPANY_SETTINGS',
    entity_type: 'company_settings',
    entity_id: updated.id,
    details: { fields_updated: Object.keys(updates) },
  });

  return updated;
}

/**
 * Fetch Audit Logs
 */
export async function fetchAuditLogs(limit = 50): Promise<AuditLog[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as AuditLog[];
      }
    } catch (err) {
      console.warn('Supabase fetchAuditLogs error:', err);
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
  if (stored) {
    try {
      const logs = JSON.parse(stored) as AuditLog[];
      return logs.slice(0, limit);
    } catch {
      // ignore
    }
  }

  return [];
}

/**
 * Record an Audit Log (Immutable record)
 */
export async function recordAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
  const newLog: AuditLog = {
    ...log,
    id: crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('audit_logs').insert(newLog);
    } catch (err) {
      console.warn('Supabase recordAuditLog insert error:', err);
    }
  }

  // Always keep in local persistence cache
  const stored = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
  let logs: AuditLog[] = [];
  if (stored) {
    try {
      logs = JSON.parse(stored);
    } catch {
      logs = [];
    }
  }
  logs.unshift(newLog);
  if (logs.length > 200) logs = logs.slice(0, 200);
  localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(logs));

  return newLog;
}

/**
 * Fetch Profiles
 */
export async function fetchProfiles(): Promise<Profile[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        return data as Profile[];
      }
    } catch (err) {
      console.warn('Supabase fetchProfiles error:', err);
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY_PROFILES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  return [
    {
      id: 'owner-uuid-1',
      email: 'owner@cpms.id',
      full_name: 'H. Sudirman (Owner)',
      role: 'owner',
      phone_number: '+62 811-2233-4455',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'admin-uuid-2',
      email: 'admin@cpms.id',
      full_name: 'Budi Santoso (Admin Operasional)',
      role: 'admin',
      phone_number: '+62 812-7788-9900',
      created_at: '2026-01-05T00:00:00Z',
      updated_at: '2026-01-05T00:00:00Z',
    },
  ];
}
