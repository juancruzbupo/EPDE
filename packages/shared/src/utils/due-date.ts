import { RecurrenceType, TaskPriority } from '../types/enums';

/**
 * Suggests a due date based on priority and recurrence.
 *
 * - URGENT → 7 days
 * - HIGH → 30 days
 * - MEDIUM → recurrenceMonths (or 90 days if ON_DETECTION)
 * - LOW → max(recurrenceMonths / 2, 90 days)
 */
export function suggestDueDate(
  priority: TaskPriority,
  recurrenceType: RecurrenceType,
  recurrenceMonths?: number,
): Date | null {
  if (recurrenceType === RecurrenceType.ON_DETECTION) return null;

  const now = new Date();
  const addDays = (days: number) => new Date(now.getTime() + days * 86_400_000);
  const addMonths = (months: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const months = recurrenceMonths ?? recurrenceTypeToMonths(recurrenceType) ?? 12;

  switch (priority) {
    case TaskPriority.URGENT:
      return addDays(7);
    case TaskPriority.HIGH:
      return addDays(30);
    case TaskPriority.MEDIUM:
      return addMonths(months);
    case TaskPriority.LOW:
      return addDays(Math.max((months / 2) * 30, 90));
    default:
      return addMonths(months);
  }
}

function recurrenceTypeToMonths(type: RecurrenceType): number | null {
  switch (type) {
    case RecurrenceType.MONTHLY:
      return 1;
    case RecurrenceType.QUARTERLY:
      return 3;
    case RecurrenceType.BIANNUAL:
      return 6;
    case RecurrenceType.ANNUAL:
      return 12;
    default:
      return null;
  }
}
