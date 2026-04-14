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

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'caution';

/**
 * Per-variant Tailwind class fragments shared across web (CVA) and mobile
 * (NativeWind). `satisfies Record<BadgeVariant, ...>` forces every new variant
 * added to `BadgeVariant` to declare its classes here — otherwise consumers
 * break at compile time rather than drifting visually between platforms.
 *
 * Web layers extra interactive affordances (hover/focus-visible, aria-invalid,
 * [a&] anchor styling) on top of these in its CVA base; mobile uses them
 * as-is. The per-variant tokens live here.
 */
export const BADGE_VARIANT_CLASSES = {
  default: {
    bg: 'bg-primary',
    text: 'text-primary-foreground',
    border: '',
  },
  secondary: {
    bg: 'bg-secondary',
    text: 'text-secondary-foreground',
    border: '',
  },
  destructive: {
    bg: 'bg-destructive',
    text: 'text-white',
    border: '',
  },
  outline: {
    bg: 'bg-transparent',
    text: 'text-foreground',
    border: 'border border-border',
  },
  success: {
    bg: 'bg-success/15',
    text: 'text-success',
    border: 'border border-success/20',
  },
  warning: {
    bg: 'bg-warning/15',
    text: 'text-warning',
    border: 'border border-warning/20',
  },
  caution: {
    bg: 'bg-caution/15',
    text: 'text-caution',
    border: 'border border-caution/20',
  },
} as const satisfies Record<BadgeVariant, { bg: string; text: string; border: string }>;

export const TASK_STATUS_VARIANT = {
  PENDING: 'warning',
  UPCOMING: 'secondary',
  OVERDUE: 'destructive',
  COMPLETED: 'success',
} satisfies Record<TaskStatus, BadgeVariant>;

export const BUDGET_STATUS_VARIANT = {
  PENDING: 'secondary',
  QUOTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  EXPIRED: 'outline',
} satisfies Record<BudgetStatus, BadgeVariant>;

export const SERVICE_STATUS_VARIANT = {
  OPEN: 'secondary',
  IN_REVIEW: 'warning',
  IN_PROGRESS: 'default',
  RESOLVED: 'success',
  CLOSED: 'outline',
} satisfies Record<ServiceStatus, BadgeVariant>;

export const URGENCY_VARIANT = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'warning',
  URGENT: 'destructive',
} satisfies Record<ServiceUrgency, BadgeVariant>;

export const PRIORITY_VARIANT = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'warning',
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
