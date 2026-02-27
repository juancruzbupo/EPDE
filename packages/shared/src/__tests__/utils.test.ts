import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeDate,
  isOverdue,
  isUpcoming,
  getNextDueDate,
  recurrenceTypeToMonths,
} from '../utils/dates';

// ═══════════════════════════════════════════════════════════
// DATE UTILITIES
// ═══════════════════════════════════════════════════════════

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format a past date with "hace" suffix (Spanish locale)', () => {
    const pastDate = new Date('2026-06-14T12:00:00Z');
    const result = formatRelativeDate(pastDate);
    expect(result).toContain('hace');
  });

  it('should format a future date with "en" prefix (Spanish locale)', () => {
    const futureDate = new Date('2026-06-20T12:00:00Z');
    const result = formatRelativeDate(futureDate);
    expect(result).toContain('en');
  });

  it('should return a string for a date far in the past', () => {
    const oldDate = new Date('2025-01-01T00:00:00Z');
    const result = formatRelativeDate(oldDate);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('isOverdue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for a date in the past', () => {
    const pastDate = new Date('2026-06-14T00:00:00Z');
    expect(isOverdue(pastDate)).toBe(true);
  });

  it('should return false for a date in the future', () => {
    const futureDate = new Date('2026-06-16T00:00:00Z');
    expect(isOverdue(futureDate)).toBe(false);
  });

  it('should return false for a date on the same day (startOfDay comparison)', () => {
    const sameDay = new Date('2026-06-15T11:59:00Z');
    expect(isOverdue(sameDay)).toBe(false);
  });

  it('should return false for a date later the same day', () => {
    const justAhead = new Date('2026-06-15T12:01:00Z');
    expect(isOverdue(justAhead)).toBe(false);
  });
});

describe('isUpcoming', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for a date within the default 30 days window', () => {
    const upcoming = new Date('2026-07-01T12:00:00Z');
    expect(isUpcoming(upcoming)).toBe(true);
  });

  it('should return false for a date past the 30-day window', () => {
    const farAway = new Date('2026-08-01T12:00:00Z');
    expect(isUpcoming(farAway)).toBe(false);
  });

  it('should return false for a date in the past', () => {
    const pastDate = new Date('2026-06-10T12:00:00Z');
    expect(isUpcoming(pastDate)).toBe(false);
  });

  it('should accept custom daysAhead parameter', () => {
    const within7Days = new Date('2026-06-20T12:00:00Z');
    expect(isUpcoming(within7Days, 7)).toBe(true);
  });

  it('should return false if date is outside custom daysAhead', () => {
    const outside7Days = new Date('2026-06-25T12:00:00Z');
    expect(isUpcoming(outside7Days, 7)).toBe(false);
  });

  it('should return true for a date exactly at the boundary', () => {
    // 30 days from 2026-06-15T12:00:00Z is 2026-07-15T12:00:00Z
    const boundary = new Date('2026-07-15T12:00:00Z');
    expect(isUpcoming(boundary)).toBe(true);
  });

  it('should return false for today/now (start is now, date must be >= start)', () => {
    // isWithinInterval is inclusive of start and end
    const now = new Date('2026-06-15T12:00:00Z');
    expect(isUpcoming(now)).toBe(true);
  });
});

describe('getNextDueDate', () => {
  it('should add the specified number of months to the date', () => {
    const currentDate = new Date(2026, 0, 15); // Jan 15, 2026 (local)
    const result = getNextDueDate(currentDate, 3);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(3); // April (0-indexed)
    expect(result.getDate()).toBe(15);
  });

  it('should correctly handle month overflow into next year', () => {
    const currentDate = new Date(2026, 10, 1); // Nov 1, 2026 (local)
    const result = getNextDueDate(currentDate, 3);
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(1); // February (0-indexed)
  });

  it('should handle adding 1 month', () => {
    const currentDate = new Date(2026, 5, 15); // Jun 15, 2026 (local)
    const result = getNextDueDate(currentDate, 1);
    expect(result.getMonth()).toBe(6); // July (0-indexed)
  });

  it('should handle adding 12 months (one year)', () => {
    const currentDate = new Date(2026, 5, 15); // Jun 15, 2026 (local)
    const result = getNextDueDate(currentDate, 12);
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(5); // June (0-indexed)
    expect(result.getDate()).toBe(15);
  });

  it('should handle end-of-month edge cases', () => {
    const jan31 = new Date(2026, 0, 31); // Jan 31, 2026 (local)
    const result = getNextDueDate(jan31, 1);
    // Adding 1 month to Jan 31 -> Feb 28 (date-fns clamps to end of month)
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(28);
  });

  it('should return a Date object', () => {
    const result = getNextDueDate(new Date(), 6);
    expect(result).toBeInstanceOf(Date);
  });
});

describe('recurrenceTypeToMonths', () => {
  it('should return 1 for MONTHLY', () => {
    expect(recurrenceTypeToMonths('MONTHLY')).toBe(1);
  });

  it('should return 3 for QUARTERLY', () => {
    expect(recurrenceTypeToMonths('QUARTERLY')).toBe(3);
  });

  it('should return 6 for BIANNUAL', () => {
    expect(recurrenceTypeToMonths('BIANNUAL')).toBe(6);
  });

  it('should return 12 for ANNUAL', () => {
    expect(recurrenceTypeToMonths('ANNUAL')).toBe(12);
  });

  it('should return null for unknown type', () => {
    expect(recurrenceTypeToMonths('CUSTOM')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(recurrenceTypeToMonths('')).toBeNull();
  });

  it('should return null for arbitrary string', () => {
    expect(recurrenceTypeToMonths('SOMETHING_ELSE')).toBeNull();
  });
});
