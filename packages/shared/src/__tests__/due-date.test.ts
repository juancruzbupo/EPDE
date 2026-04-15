import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RecurrenceType, TaskPriority } from '../types/enums';
import { suggestDueDate } from '../utils/due-date';

/**
 * `suggestDueDate` is the forward-date heuristic used when a task is promoted
 * from inspection to the maintenance plan. Each branch is locked to an
 * observable interval so we don't accidentally loosen the SLA for urgent /
 * high-priority tasks while tweaking the ON_DETECTION fallback logic.
 */

const NOW = new Date('2026-06-15T12:00:00Z');
const DAY = 86_400_000;

describe('suggestDueDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for ON_DETECTION tasks (no time-based SLA)', () => {
    expect(suggestDueDate(TaskPriority.MEDIUM, RecurrenceType.ON_DETECTION)).toBeNull();
    expect(suggestDueDate(TaskPriority.URGENT, RecurrenceType.ON_DETECTION)).toBeNull();
  });

  it('URGENT → 7 days from now', () => {
    const due = suggestDueDate(TaskPriority.URGENT, RecurrenceType.ANNUAL);
    expect(due).not.toBeNull();
    expect(due!.getTime() - NOW.getTime()).toBe(7 * DAY);
  });

  it('HIGH → 30 days from now', () => {
    const due = suggestDueDate(TaskPriority.HIGH, RecurrenceType.QUARTERLY);
    expect(due).not.toBeNull();
    expect(due!.getTime() - NOW.getTime()).toBe(30 * DAY);
  });

  it('MEDIUM → adds recurrenceMonths to the calendar date', () => {
    const due = suggestDueDate(TaskPriority.MEDIUM, RecurrenceType.ANNUAL, 12);
    expect(due!.getFullYear()).toBe(NOW.getFullYear() + 1);
    expect(due!.getMonth()).toBe(NOW.getMonth());
  });

  it('MEDIUM → falls back to recurrenceType when months is not provided', () => {
    const due = suggestDueDate(TaskPriority.MEDIUM, RecurrenceType.QUARTERLY);
    // Quarterly = 3 months. From June 15 → September 15.
    expect(due!.getMonth()).toBe(NOW.getMonth() + 3);
  });

  it('LOW → at least 90 days even for short recurrences', () => {
    const due = suggestDueDate(TaskPriority.LOW, RecurrenceType.MONTHLY, 1);
    // 1 month / 2 = 15 days → clamped to 90 days.
    expect(due!.getTime() - NOW.getTime()).toBe(90 * DAY);
  });

  it('LOW → half-recurrence when that exceeds 90 days', () => {
    const due = suggestDueDate(TaskPriority.LOW, RecurrenceType.ANNUAL, 12);
    // 12 / 2 * 30 = 180 days.
    expect(due!.getTime() - NOW.getTime()).toBe(180 * DAY);
  });

  it('MEDIUM with unknown recurrence defaults to a 12-month horizon', () => {
    const due = suggestDueDate(TaskPriority.MEDIUM, 'UNKNOWN' as never);
    expect(due!.getFullYear()).toBe(NOW.getFullYear() + 1);
  });
});
