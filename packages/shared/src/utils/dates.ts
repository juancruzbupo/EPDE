import { addDays, addMonths, formatDistanceToNow, isWithinInterval, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

import type { RecurrenceType } from '../types/enums';

export function formatRelativeDate(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

export function isOverdue(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return startOfDay(d) < startOfDay(new Date());
}

export function isUpcoming(date: Date, daysAhead: number = 30): boolean {
  const now = new Date();
  return isWithinInterval(date, {
    start: now,
    end: addDays(now, daysAhead),
  });
}

export function getNextDueDate(currentDate: Date, recurrenceMonths: number): Date {
  return addMonths(currentDate, recurrenceMonths);
}

/**
 * Maps a recurrence type to its interval in months.
 * ON_DETECTION and CUSTOM have no fixed recurrence — returns null.
 * Callers handle with `?? fallback` (e.g., `?? 12` in the safety sweep).
 */
export function recurrenceTypeToMonths(type: RecurrenceType | string): number | null {
  const map: Record<string, number> = {
    MONTHLY: 1,
    QUARTERLY: 3,
    BIANNUAL: 6,
    ANNUAL: 12,
  };
  return map[type] ?? null;
}
