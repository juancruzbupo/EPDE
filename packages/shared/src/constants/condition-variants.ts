import type { ConditionFound } from '../types/enums';

/**
 * Condition severity → Tailwind background class.
 * Used by static visual indicators (dots, pills) that don't read CSS vars dynamically.
 * For dynamic chart colors, use the useChartColors() hook directly.
 */
export const CONDITION_BG_VARIANTS: Record<ConditionFound, string> = {
  EXCELLENT: 'bg-success',
  GOOD: 'bg-success/60',
  FAIR: 'bg-warning',
  POOR: 'bg-caution',
  CRITICAL: 'bg-destructive',
};

/**
 * Condition → chart token index (1-5) for chart color resolution.
 * Index semantics: 1=best, 4=worst, 5 reserved. CRITICAL uses destructive directly.
 * Consumers read the color via `useChartColors()[INDEX]` to stay dark-mode reactive.
 */
export const CONDITION_CHART_INDEX: Record<ConditionFound, number> = {
  EXCELLENT: 1,
  GOOD: 2,
  FAIR: 3,
  POOR: 4,
  CRITICAL: -1, // Sentinel: use `var(--destructive)` directly
};
