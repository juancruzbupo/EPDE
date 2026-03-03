/**
 * Centralized badge/color maps for status, priority, and urgency styling.
 * Import from here instead of duplicating in each component.
 *
 * Badge variant mappings are sourced from @epde/shared (single source of truth
 * for web and mobile). Color class maps remain local since they are
 * platform-specific (Tailwind classes for Next.js).
 */

import {
  TASK_STATUS_VARIANT,
  BUDGET_STATUS_VARIANT,
  SERVICE_STATUS_VARIANT,
  URGENCY_VARIANT,
  CLIENT_STATUS_VARIANT,
} from '@epde/shared';

// Re-export shared variant maps under their original camelCase names so that
// existing consumers (`import { taskStatusVariant } from '@/lib/style-maps'`)
// continue to work without changes.
export {
  TASK_STATUS_VARIANT as taskStatusVariant,
  BUDGET_STATUS_VARIANT as budgetStatusVariant,
  SERVICE_STATUS_VARIANT as serviceStatusVariant,
  URGENCY_VARIANT as urgencyVariant,
  CLIENT_STATUS_VARIANT as clientStatusVariant,
};

// ─── Color class maps (platform-specific, not shared) ───

export const priorityColors: Record<string, string> = {
  LOW: 'bg-success/15 text-success',
  MEDIUM: 'bg-warning/15 text-warning',
  HIGH: 'bg-caution/15 text-caution',
  URGENT: 'bg-destructive/15 text-destructive',
};

export const taskTypeColors: Record<string, string> = {
  INSPECTION: 'bg-blue-100 text-blue-700',
  CLEANING: 'bg-cyan-100 text-cyan-700',
  TEST: 'bg-indigo-100 text-indigo-700',
  TREATMENT: 'bg-purple-100 text-purple-700',
  SEALING: 'bg-amber-100 text-amber-700',
  LUBRICATION: 'bg-lime-100 text-lime-700',
  ADJUSTMENT: 'bg-slate-100 text-slate-700',
  MEASUREMENT: 'bg-teal-100 text-teal-700',
  EVALUATION: 'bg-violet-100 text-violet-700',
};

export const professionalReqColors: Record<string, string> = {
  OWNER_CAN_DO: 'bg-success/15 text-success',
  PROFESSIONAL_RECOMMENDED: 'bg-warning/15 text-warning',
  PROFESSIONAL_REQUIRED: 'bg-destructive/15 text-destructive',
};
