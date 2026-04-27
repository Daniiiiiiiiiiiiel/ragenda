import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getDateLocale(lang: string) {
  return lang.startsWith('es') ? es : enUS;
}

export function formatDate(date: string | Date, lang = 'en'): string {
  let d = typeof date === 'string' ? parseISO(date) : date;
  if (typeof date === 'string') {
    d = new Date(date.split('T')[0] + 'T12:00:00');
  }
  return format(d, 'PPP', { locale: getDateLocale(lang) });
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
