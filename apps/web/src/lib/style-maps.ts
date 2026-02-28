/**
 * Centralized badge/color maps for status, priority, and urgency styling.
 * Import from here instead of duplicating in each component.
 */

export const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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
  APPROVED: 'text-green-600 border-green-600 dark:text-green-400 dark:border-green-400',
  COMPLETED: 'text-green-600 border-green-600 dark:text-green-400 dark:border-green-400',
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

export const taskTypeColors: Record<string, string> = {
  INSPECTION: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CLEANING: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  TEST: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  TREATMENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SEALING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  LUBRICATION: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  ADJUSTMENT: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  MEASUREMENT: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  EVALUATION: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

export const professionalReqColors: Record<string, string> = {
  OWNER_CAN_DO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PROFESSIONAL_RECOMMENDED:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PROFESSIONAL_REQUIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
