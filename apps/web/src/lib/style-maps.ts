/**
 * Platform-specific Tailwind class maps for task type and professional requirement styling.
 * Hex token SSoT lives in @epde/shared (TASK_TYPE_TOKENS_LIGHT/DARK, PROFESSIONAL_REQ_TOKENS_LIGHT/DARK).
 * Badge variant mappings also live in @epde/shared — import directly from there.
 */

import type { ProfessionalRequirement, TaskType } from '@epde/shared';
import { TaskStatus } from '@epde/shared';
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

/** Display order by urgency: overdue → upcoming (≤30 días) → pending (>30 días). COMPLETED excluded —
 * tasks never stay in that status (they recycle back to PENDING after completion; completion is
 * tracked via TaskLog). */
export const TASK_STATUS_ORDER: TaskStatus[] = [
  TaskStatus.OVERDUE,
  TaskStatus.UPCOMING,
  TaskStatus.PENDING,
];

export const TASK_STATUS_ICONS: Record<TaskStatus, LucideIcon> = {
  [TaskStatus.OVERDUE]: AlertTriangle,
  [TaskStatus.PENDING]: Clock,
  [TaskStatus.UPCOMING]: Timer,
  [TaskStatus.COMPLETED]: CheckCircle2,
};

// Color mapping follows urgency gradient, not the token name: UPCOMING (≤30 días) is the
// warning/attention tier (amber), PENDING (>30 días) is the informational tier (blue).
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.OVERDUE]: 'text-destructive',
  [TaskStatus.UPCOMING]: 'text-status-pending',
  [TaskStatus.PENDING]: 'text-status-upcoming',
  [TaskStatus.COMPLETED]: 'text-status-completed',
};
