import { describe, expect, it } from 'vitest';

import {
  BUDGET_TERMINAL_STATUSES,
  isBudgetTerminal,
  isServiceRequestTerminal,
  SERVICE_REQUEST_TERMINAL_STATUSES,
} from '../constants';
import { BudgetStatus, ServiceStatus } from '../types';

// ═══════════════════════════════════════════════════════════
// TERMINAL STATUS SUBSETS
// ═══════════════════════════════════════════════════════════

describe('BUDGET_TERMINAL_STATUSES', () => {
  it('should only contain valid BudgetStatus values', () => {
    const validValues = Object.values(BudgetStatus);
    for (const status of BUDGET_TERMINAL_STATUSES) {
      expect(validValues).toContain(status);
    }
  });

  it('should be a strict subset (not every status is terminal)', () => {
    expect(BUDGET_TERMINAL_STATUSES.length).toBeLessThan(Object.values(BudgetStatus).length);
  });
});

describe('SERVICE_REQUEST_TERMINAL_STATUSES', () => {
  it('should only contain valid ServiceStatus values', () => {
    const validValues = Object.values(ServiceStatus);
    for (const status of SERVICE_REQUEST_TERMINAL_STATUSES) {
      expect(validValues).toContain(status);
    }
  });

  it('should be a strict subset (not every status is terminal)', () => {
    expect(SERVICE_REQUEST_TERMINAL_STATUSES.length).toBeLessThan(
      Object.values(ServiceStatus).length,
    );
  });
});

// ═══════════════════════════════════════════════════════════
// TERMINAL STATUS HELPERS
// ═══════════════════════════════════════════════════════════

describe('isBudgetTerminal', () => {
  it('should return true for every terminal status', () => {
    for (const status of BUDGET_TERMINAL_STATUSES) {
      expect(isBudgetTerminal(status)).toBe(true);
    }
  });

  it('should return false for non-terminal statuses', () => {
    const nonTerminal = Object.values(BudgetStatus).filter(
      (s) => !BUDGET_TERMINAL_STATUSES.includes(s),
    );
    for (const status of nonTerminal) {
      expect(isBudgetTerminal(status)).toBe(false);
    }
  });

  it('should return false for an arbitrary string', () => {
    expect(isBudgetTerminal('NOT_A_STATUS')).toBe(false);
  });
});

describe('isServiceRequestTerminal', () => {
  it('should return true for every terminal status', () => {
    for (const status of SERVICE_REQUEST_TERMINAL_STATUSES) {
      expect(isServiceRequestTerminal(status)).toBe(true);
    }
  });

  it('should return false for non-terminal statuses', () => {
    const nonTerminal = Object.values(ServiceStatus).filter(
      (s) => !SERVICE_REQUEST_TERMINAL_STATUSES.includes(s),
    );
    for (const status of nonTerminal) {
      expect(isServiceRequestTerminal(status)).toBe(false);
    }
  });

  it('should return false for an arbitrary string', () => {
    expect(isServiceRequestTerminal('NOT_A_STATUS')).toBe(false);
  });
});
