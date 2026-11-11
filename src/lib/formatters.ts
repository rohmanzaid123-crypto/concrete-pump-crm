/**
 * Formatter Helpers for Indonesian Concrete Pump Management System (CPMS)
 */

export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0';
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatTanggal(dateInput: string | Date | null | undefined, includeTime = true): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  };

  return new Intl.DateTimeFormat('id-ID', options).format(date);
}

export function formatVolumeM3(volume: number | null | undefined): string {
  if (volume === null || volume === undefined) return '0 m³';
  return `${formatNumber(volume)} m³`;
}

export function formatBoomLength(meters: number | null | undefined): string {
  if (!meters) return '-';
  return `${meters} Meter`;
}
