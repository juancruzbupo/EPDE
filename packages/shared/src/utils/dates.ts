import { formatDistanceToNow, addMonths, isWithinInterval, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

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

export function recurrenceTypeToMonths(type: string): number | null {
  const map: Record<string, number> = {
    MONTHLY: 1,
    QUARTERLY: 3,
    BIANNUAL: 6,
    ANNUAL: 12,
  };
  return map[type] ?? null;
}
