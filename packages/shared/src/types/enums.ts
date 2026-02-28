// Enums as TypeScript union types (mirrors Prisma enums)

export const UserRole = {
  CLIENT: 'CLIENT',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const PropertyType = {
  HOUSE: 'HOUSE',
  APARTMENT: 'APARTMENT',
  DUPLEX: 'DUPLEX',
  COUNTRY_HOUSE: 'COUNTRY_HOUSE',
  OTHER: 'OTHER',
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const PlanStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const RecurrenceType = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  BIANNUAL: 'BIANNUAL',
  ANNUAL: 'ANNUAL',
  CUSTOM: 'CUSTOM',
  ON_DETECTION: 'ON_DETECTION',
} as const;
export type RecurrenceType = (typeof RecurrenceType)[keyof typeof RecurrenceType];

export const TaskStatus = {
  PENDING: 'PENDING',
  UPCOMING: 'UPCOMING',
  OVERDUE: 'OVERDUE',
  COMPLETED: 'COMPLETED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const BudgetStatus = {
  PENDING: 'PENDING',
  QUOTED: 'QUOTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type BudgetStatus = (typeof BudgetStatus)[keyof typeof BudgetStatus];

export const ServiceUrgency = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type ServiceUrgency = (typeof ServiceUrgency)[keyof typeof ServiceUrgency];

export const ServiceStatus = {
  OPEN: 'OPEN',
  IN_REVIEW: 'IN_REVIEW',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];

export const NotificationType = {
  TASK_REMINDER: 'TASK_REMINDER',
  BUDGET_UPDATE: 'BUDGET_UPDATE',
  SERVICE_UPDATE: 'SERVICE_UPDATE',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// ─── Task Metadata (set at creation) ─────────────────────

export const TaskType = {
  INSPECTION: 'INSPECTION',
  CLEANING: 'CLEANING',
  TEST: 'TEST',
  TREATMENT: 'TREATMENT',
  SEALING: 'SEALING',
  LUBRICATION: 'LUBRICATION',
  ADJUSTMENT: 'ADJUSTMENT',
  MEASUREMENT: 'MEASUREMENT',
  EVALUATION: 'EVALUATION',
} as const;
export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const ProfessionalRequirement = {
  OWNER_CAN_DO: 'OWNER_CAN_DO',
  PROFESSIONAL_RECOMMENDED: 'PROFESSIONAL_RECOMMENDED',
  PROFESSIONAL_REQUIRED: 'PROFESSIONAL_REQUIRED',
} as const;
export type ProfessionalRequirement =
  (typeof ProfessionalRequirement)[keyof typeof ProfessionalRequirement];

// ─── Task Completion Selectors (TaskLog) ─────────────────

export const TaskResult = {
  OK: 'OK',
  OK_WITH_OBSERVATIONS: 'OK_WITH_OBSERVATIONS',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
  NEEDS_REPAIR: 'NEEDS_REPAIR',
  NEEDS_URGENT_REPAIR: 'NEEDS_URGENT_REPAIR',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const;
export type TaskResult = (typeof TaskResult)[keyof typeof TaskResult];

export const ConditionFound = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  POOR: 'POOR',
  CRITICAL: 'CRITICAL',
} as const;
export type ConditionFound = (typeof ConditionFound)[keyof typeof ConditionFound];

export const TaskExecutor = {
  OWNER: 'OWNER',
  HIRED_PROFESSIONAL: 'HIRED_PROFESSIONAL',
  EPDE_PROFESSIONAL: 'EPDE_PROFESSIONAL',
} as const;
export type TaskExecutor = (typeof TaskExecutor)[keyof typeof TaskExecutor];

export const ActionTaken = {
  INSPECTION_ONLY: 'INSPECTION_ONLY',
  CLEANING: 'CLEANING',
  MINOR_REPAIR: 'MINOR_REPAIR',
  MAJOR_REPAIR: 'MAJOR_REPAIR',
  REPLACEMENT: 'REPLACEMENT',
  TREATMENT: 'TREATMENT',
  SEALING: 'SEALING',
  ADJUSTMENT: 'ADJUSTMENT',
  FULL_SERVICE: 'FULL_SERVICE',
  NO_ACTION: 'NO_ACTION',
} as const;
export type ActionTaken = (typeof ActionTaken)[keyof typeof ActionTaken];
