import { getSupabaseClient } from './supabase';

/**
 * CONCRETE PUMP MANAGEMENT SYSTEM (CPMS)
 * Client-Side AI Service Connector
 * Tahap 7: Communicates with backend /api/ai endpoints securely without exposing API keys
 */

export interface AICustomerServiceResponse {
  success: boolean;
  responseText: string;
  toolExecuted?: string | null;
  toolData?: any;
  isHandover?: boolean;
  draftInquiry?: {
    booking_code: string;
    status: string;
    status_note: string;
    contact_name: string;
    contact_wa: string;
    created_at: string;
  } | null;
  error?: string;
}

export interface AIOwnerAssistantResponse {
  success: boolean;
  responseText: string;
  auditTrail?: {
    period: string;
    keyFigures: any;
    dataSources: string[];
  };
  toolExecuted?: string;
  rawData?: any;
  error?: string;
  restricted?: boolean;
}

/**
 * Sends a message to the AI Customer Service endpoint
 */
export async function askAICustomerService(params: {
  message: string;
  customerPhone?: string;
  customerName?: string;
}): Promise<AICustomerServiceResponse> {
  try {
    const res = await fetch('/api/ai/customer-service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return data;
  } catch (err: any) {
    console.warn('Backend AI CS error, returning resilient client response:', err);
    return {
      success: true,
      responseText:
        'Halo! Selamat datang di layanan informasi resmi PT Beton Perkasa Mandiri (CPMS).\n\nKami melayani sewa Concrete Pump 24–36m, 37–42m, Super Long Boom, Mini 21m, dan Pompa Kodok. Seluruh tarif mengacu pada aturan resmi (Paket 8 Jam termasuk 50 m³).\n\nSilakan sampaikan lokasi proyek dan tanggal pengecoran Anda untuk kami periksa ketersediaan armada.',
      toolExecuted: 'client_fallback',
    };
  }
}

/**
 * Sends a query to the AI Owner Assistant endpoint with role enforcement
 */
export async function askAIOwnerAssistant(params: {
  query: string;
  userRole: string;
  userEmail?: string;
}): Promise<AIOwnerAssistantResponse> {
  try {
    const client = getSupabaseClient();
    const { data: { session } } = client ? await client.auth.getSession() : { data: { session: null } };
    if (!session?.access_token) {
      return { success: false, responseText: 'Silakan login kembali untuk menggunakan fitur owner.', error: 'Sesi login tidak ditemukan.', restricted: true };
    }
    const res = await fetch('/api/ai/owner-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ query: params.query }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        responseText: data.error || 'Akses ditolak atau terjadi kesalahan pada asisten owner.',
        error: data.error,
        restricted: res.status === 403 || data.restricted,
      };
    }

    return data;
  } catch (err: any) {
    console.warn('Backend AI Owner error:', err);
    return {
      success: false,
      responseText: 'Gagal terhubung ke modul AI Owner Assistant backend. Pastikan server dev berjalan.',
      error: err.message,
    };
  }
}
