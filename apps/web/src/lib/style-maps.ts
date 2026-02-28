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
  OWNER_CAN_DO: 'bg-green-100 text-green-700',
  PROFESSIONAL_RECOMMENDED: 'bg-yellow-100 text-yellow-700',
  PROFESSIONAL_REQUIRED: 'bg-red-100 text-red-700',
};
