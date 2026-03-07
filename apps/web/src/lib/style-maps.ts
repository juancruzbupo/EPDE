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

export const taskTypeColors: Record<string, string> = {
  INSPECTION: 'bg-task-inspection/15 text-task-inspection',
  CLEANING: 'bg-task-cleaning/15 text-task-cleaning',
  TEST: 'bg-task-test/15 text-task-test',
  TREATMENT: 'bg-task-treatment/15 text-task-treatment',
  SEALING: 'bg-task-sealing/15 text-task-sealing',
  LUBRICATION: 'bg-task-lubrication/15 text-task-lubrication',
  ADJUSTMENT: 'bg-task-adjustment/15 text-task-adjustment',
  MEASUREMENT: 'bg-task-measurement/15 text-task-measurement',
  EVALUATION: 'bg-task-evaluation/15 text-task-evaluation',
};

export const professionalReqColors: Record<string, string> = {
  OWNER_CAN_DO: 'bg-success/15 text-success',
  PROFESSIONAL_RECOMMENDED: 'bg-warning/15 text-warning',
  PROFESSIONAL_REQUIRED: 'bg-destructive/15 text-destructive',
};
