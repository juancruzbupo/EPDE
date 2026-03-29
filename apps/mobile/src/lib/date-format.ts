import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/** Format a date using Argentine Spanish locale. */
export function formatDateES(date: Date, pattern: string = 'd MMM yyyy'): string {
  return format(date, pattern, { locale: es });
}
