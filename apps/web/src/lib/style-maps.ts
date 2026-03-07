/**
 * Platform-specific color class maps for task type and professional requirement styling.
 * Badge variant mappings live in @epde/shared — import directly from there.
 */

import type { TaskType, ProfessionalRequirement } from '@epde/shared';

// ─── Color class maps (platform-specific, not shared) ───

export const taskTypeColors: Record<TaskType, string> = {
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

export const professionalReqColors: Record<ProfessionalRequirement, string> = {
  OWNER_CAN_DO: 'bg-success/15 text-success',
  PROFESSIONAL_RECOMMENDED: 'bg-warning/15 text-warning',
  PROFESSIONAL_REQUIRED: 'bg-destructive/15 text-destructive',
};
