import { format as formatDate, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDateString(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDate(date, 'dd.MM.yyyy HH:mm', { locale: ru });
  } catch {
    return dateString;
  }
}

export function formatDateOnly(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDate(date, 'dd.MM.yyyy', { locale: ru });
  } catch {
    return dateString;
  }
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}м ${remainingSeconds}с`;
}

