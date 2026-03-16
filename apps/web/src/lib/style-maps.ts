/**
 * Platform-specific Tailwind class maps for task type and professional requirement styling.
 * Hex token SSoT lives in @epde/shared (TASK_TYPE_TOKENS_LIGHT/DARK, PROFESSIONAL_REQ_TOKENS_LIGHT/DARK).
 * Badge variant mappings also live in @epde/shared — import directly from there.
 */

import type { ProfessionalRequirement, TaskStatus, TaskType } from '@epde/shared';
import { TaskStatus as TS } from '@epde/shared';
import { AlertTriangle, CheckCircle2, Clock, type LucideIcon, Timer } from 'lucide-react';

// ─── Color class maps (platform-specific, not shared) ───

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
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

export const PROFESSIONAL_REQ_COLORS: Record<ProfessionalRequirement, string> = {
  OWNER_CAN_DO: 'bg-success/15 text-success',
  PROFESSIONAL_RECOMMENDED: 'bg-warning/15 text-warning',
  PROFESSIONAL_REQUIRED: 'bg-destructive/15 text-destructive',
};

// ─── Task status display maps (shared across tasks page, plan-viewer, plan-editor) ───

/** Display order: actionable items first. COMPLETED excluded — tasks never stay in that status
 * (they recycle back to PENDING after completion; completion is tracked via TaskLog). */
export const TASK_STATUS_ORDER: TaskStatus[] = [TS.OVERDUE, TS.PENDING, TS.UPCOMING];

export const TASK_STATUS_ICONS: Record<TaskStatus, LucideIcon> = {
  [TS.OVERDUE]: AlertTriangle,
  [TS.PENDING]: Clock,
  [TS.UPCOMING]: Timer,
  [TS.COMPLETED]: CheckCircle2,
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TS.OVERDUE]: 'text-destructive',
  [TS.PENDING]: 'text-amber-600',
  [TS.UPCOMING]: 'text-blue-600',
  [TS.COMPLETED]: 'text-emerald-600',
};
