/**
 * Indonesian WhatsApp Number Validator & Formatter
 * Compliant with Meta WhatsApp Cloud API & Indonesian Telco Standards (+62)
 */

export interface WAValidationResult {
  isValid: boolean;
  normalized: string; // e.g. "6281234567890" for Meta WA Cloud API & wa.me
  formatted: string;  // e.g. "+62 812-3456-7890" for clean UI display
  error?: string;
}

export function validateIndonesianWA(phone: string | null | undefined): WAValidationResult {
  if (!phone) {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      error: 'Nomor WhatsApp tidak boleh kosong',
    };
  }

  // Strip all non-digit characters except leading plus if any
  const cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');

  // Convert leading zeros or plus to 62
  let standardized = cleaned;
  if (standardized.startsWith('+62')) {
    standardized = standardized.substring(1);
  } else if (standardized.startsWith('08')) {
    standardized = '62' + standardized.substring(1);
  } else if (standardized.startsWith('8')) {
    standardized = '62' + standardized;
  }

  // Check digits only
  if (!/^\d+$/.test(standardized)) {
    return {
      isValid: false,
      normalized: '',
      formatted: phone,
      error: 'Nomor hanya boleh mengandung angka',
    };
  }

  // Check must start with Indonesian country code + mobile prefix (628)
  if (!standardized.startsWith('628')) {
    return {
      isValid: false,
      normalized: standardized,
      formatted: phone,
      error: 'Nomor HP/WhatsApp Indonesia harus diawali 08... atau +628...',
    };
  }

  // Length validation: Indonesian mobile numbers are 10 to 14 digits in total (with 628, that is 11 to 14 characters)
  if (standardized.length < 11 || standardized.length > 15) {
    return {
      isValid: false,
      normalized: standardized,
      formatted: phone,
      error: `Panjang nomor tidak valid (${standardized.length} digit). Standar HP Indonesia 10–13 digit.`,
    };
  }

  // Formatting for clean UI: +62 812-3456-7890
  const localPart = standardized.substring(2); // e.g. "81234567890"
  let formatted = `+62 ${localPart.substring(0, 3)}-${localPart.substring(3, 7)}-${localPart.substring(7)}`;

  return {
    isValid: true,
    normalized: standardized,
    formatted,
  };
}

export function formatDisplayWA(phone: string | null | undefined): string {
  const result = validateIndonesianWA(phone);
  return result.isValid ? result.formatted : phone || '-';
}

export function normalizeWA(phone: string | null | undefined): string {
  const result = validateIndonesianWA(phone);
  return result.isValid ? result.normalized : phone?.replace(/\D/g, '') || '';
}

export function getWhatsAppChatUrl(phone: string, text?: string): string {
  const norm = normalizeWA(phone);
  const base = `https://wa.me/${norm}`;
  if (text) {
    return `${base}?text=${encodeURIComponent(text)}`;
  }
  return base;
}

export const generateWhatsAppUrl = getWhatsAppChatUrl;
