/**
 * Shared badge variant mappings — single source of truth for web and mobile.
 * Each map pairs an enum value to a semantic badge variant.
 */

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

export const TASK_STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'secondary',
  UPCOMING: 'default',
  OVERDUE: 'destructive',
  COMPLETED: 'success',
};

export const BUDGET_STATUS_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'secondary',
  QUOTED: 'default',
  APPROVED: 'success',
  REJECTED: 'destructive',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
};

export const SERVICE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  OPEN: 'secondary',
  IN_REVIEW: 'default',
  IN_PROGRESS: 'default',
  RESOLVED: 'success',
  CLOSED: 'outline',
};

export const URGENCY_VARIANT: Record<string, BadgeVariant> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'default',
  URGENT: 'destructive',
};

export const PRIORITY_VARIANT: Record<string, BadgeVariant> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'default',
  URGENT: 'destructive',
};

export const CLIENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  ACTIVE: 'default',
  INVITED: 'secondary',
  INACTIVE: 'outline',
};

export const PLAN_STATUS_VARIANT: Record<string, BadgeVariant> = {
  DRAFT: 'secondary',
  ACTIVE: 'default',
  ARCHIVED: 'outline',
};
