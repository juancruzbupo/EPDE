/**
 * Shared badge variant mappings — single source of truth for web and mobile.
 * Each map pairs an enum value to a semantic badge variant.
 */

import type {
  BudgetStatus,
  PlanStatus,
  ServiceStatus,
  ServiceUrgency,
  TaskPriority,
  TaskStatus,
  UserStatus,
} from '../types/enums';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

export const TASK_STATUS_VARIANT = {
  PENDING: 'secondary',
  UPCOMING: 'default',
  OVERDUE: 'destructive',
  COMPLETED: 'success',
} satisfies Record<TaskStatus, BadgeVariant>;

export const BUDGET_STATUS_VARIANT = {
  PENDING: 'secondary',
  QUOTED: 'default',
  APPROVED: 'success',
  REJECTED: 'destructive',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
} satisfies Record<BudgetStatus, BadgeVariant>;

export const SERVICE_STATUS_VARIANT = {
  OPEN: 'secondary',
  IN_REVIEW: 'default',
  IN_PROGRESS: 'default',
  RESOLVED: 'success',
  CLOSED: 'outline',
} satisfies Record<ServiceStatus, BadgeVariant>;

export const URGENCY_VARIANT = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'default',
  URGENT: 'destructive',
} satisfies Record<ServiceUrgency, BadgeVariant>;

export const PRIORITY_VARIANT = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'default',
  URGENT: 'destructive',
} satisfies Record<TaskPriority, BadgeVariant>;

export const CLIENT_STATUS_VARIANT = {
  ACTIVE: 'default',
  INVITED: 'secondary',
  INACTIVE: 'outline',
} satisfies Record<UserStatus, BadgeVariant>;

export const PLAN_STATUS_VARIANT = {
  DRAFT: 'secondary',
  ACTIVE: 'default',
  ARCHIVED: 'outline',
} satisfies Record<PlanStatus, BadgeVariant>;
