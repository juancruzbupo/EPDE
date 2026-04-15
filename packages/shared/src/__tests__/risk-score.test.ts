import { describe, expect, it } from 'vitest';

import { getRiskLevel } from '../utils/risk-score';

describe('getRiskLevel', () => {
  it('returns "none" for zero or negative scores so callers can hide the badge', () => {
    expect(getRiskLevel(0).level).toBe('none');
    expect(getRiskLevel(-1).level).toBe('none');
  });

  it('classifies scores under 6 as "low" with a soft, muted color', () => {
    const info = getRiskLevel(3);
    expect(info.level).toBe('low');
    expect(info.colorClass).toBe('text-muted-foreground');
    expect(info.label).toBe('Cuando puedas');
  });

  it('classifies scores in [6, 12) as "medium" with the warning color', () => {
    const info = getRiskLevel(8);
    expect(info.level).toBe('medium');
    expect(info.colorClass).toBe('text-warning');
    expect(info.label).toBe('Importante');
  });

  it('classifies scores >= 12 as "high" with the destructive color', () => {
    const info = getRiskLevel(15);
    expect(info.level).toBe('high');
    expect(info.colorClass).toBe('text-destructive');
    expect(info.label).toBe('Atender ya');
  });

  it('treats the boundary scores 6 and 12 as the start of medium and high respectively', () => {
    expect(getRiskLevel(6).level).toBe('medium');
    expect(getRiskLevel(12).level).toBe('high');
  });
});
