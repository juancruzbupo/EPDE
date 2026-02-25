/**
 * Centralized badge/color maps for status, priority, and urgency styling.
 * Import from here instead of duplicating in each component.
 */

export const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export const taskStatusVariant: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  PENDING: 'secondary',
  UPCOMING: 'default',
  OVERDUE: 'destructive',
  COMPLETED: 'outline',
};

export const budgetStatusVariant: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  PENDING: 'secondary',
  QUOTED: 'default',
  APPROVED: 'outline',
  REJECTED: 'destructive',
  IN_PROGRESS: 'default',
  COMPLETED: 'outline',
};

export const budgetStatusClassName: Record<string, string> = {
  APPROVED: 'text-green-600 border-green-600',
  COMPLETED: 'text-green-600 border-green-600',
};

export const urgencyVariant: Record<string, 'outline' | 'secondary' | 'default' | 'destructive'> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'default',
  URGENT: 'destructive',
};

export const clientStatusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  ACTIVE: 'default',
  INVITED: 'secondary',
  INACTIVE: 'outline',
};
