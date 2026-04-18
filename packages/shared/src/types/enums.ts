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
  EXPIRED: 'EXPIRED',
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

// ─── Dashboard Activity ─────────────────────────────────

export const ActivityType = {
  CLIENT_CREATED: 'CLIENT_CREATED',
  PROPERTY_CREATED: 'PROPERTY_CREATED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  BUDGET_REQUESTED: 'BUDGET_REQUESTED',
  SERVICE_REQUESTED: 'SERVICE_REQUESTED',
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

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

// ─── Property Sectors (zones of a house) ──────────────────

export const PropertySector = {
  EXTERIOR: 'EXTERIOR',
  ROOF: 'ROOF',
  TERRACE: 'TERRACE',
  INTERIOR: 'INTERIOR',
  KITCHEN: 'KITCHEN',
  BATHROOM: 'BATHROOM',
  BASEMENT: 'BASEMENT',
  GARDEN: 'GARDEN',
  INSTALLATIONS: 'INSTALLATIONS',
} as const;
export type PropertySector = (typeof PropertySector)[keyof typeof PropertySector];

// ─── Inspection ───────────────────────────────────────────

export const InspectionItemStatus = {
  PENDING: 'PENDING',
  OK: 'OK',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
  NEEDS_PROFESSIONAL: 'NEEDS_PROFESSIONAL',
} as const;
export type InspectionItemStatus = (typeof InspectionItemStatus)[keyof typeof InspectionItemStatus];

export const InspectionChecklistStatus = {
  DRAFT: 'DRAFT',
  COMPLETED: 'COMPLETED',
} as const;
export type InspectionChecklistStatus =
  (typeof InspectionChecklistStatus)[keyof typeof InspectionChecklistStatus];

// ─── Enum Value Arrays (for Zod schemas) ─────────────────

export const TASK_TYPE_VALUES = Object.values(TaskType) as [TaskType, ...TaskType[]];
export const RECURRENCE_TYPE_VALUES = Object.values(RecurrenceType) as [
  RecurrenceType,
  ...RecurrenceType[],
];
export const PROFESSIONAL_REQUIREMENT_VALUES = Object.values(ProfessionalRequirement) as [
  ProfessionalRequirement,
  ...ProfessionalRequirement[],
];
export const TASK_PRIORITY_VALUES = Object.values(TaskPriority) as [
  TaskPriority,
  ...TaskPriority[],
];
export const TASK_STATUS_VALUES = Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]];
export const PROPERTY_TYPE_VALUES = Object.values(PropertyType) as [
  PropertyType,
  ...PropertyType[],
];
export const USER_STATUS_VALUES = Object.values(UserStatus) as [UserStatus, ...UserStatus[]];
export const PLAN_STATUS_VALUES = Object.values(PlanStatus) as [PlanStatus, ...PlanStatus[]];
export const SERVICE_URGENCY_VALUES = Object.values(ServiceUrgency) as [
  ServiceUrgency,
  ...ServiceUrgency[],
];
export const BUDGET_STATUS_VALUES = Object.values(BudgetStatus) as [
  BudgetStatus,
  ...BudgetStatus[],
];
export const SERVICE_STATUS_VALUES = Object.values(ServiceStatus) as [
  ServiceStatus,
  ...ServiceStatus[],
];
export const TASK_RESULT_VALUES = Object.values(TaskResult) as [TaskResult, ...TaskResult[]];
export const CONDITION_FOUND_VALUES = Object.values(ConditionFound) as [
  ConditionFound,
  ...ConditionFound[],
];
export const TASK_EXECUTOR_VALUES = Object.values(TaskExecutor) as [
  TaskExecutor,
  ...TaskExecutor[],
];
export const ACTION_TAKEN_VALUES = Object.values(ActionTaken) as [ActionTaken, ...ActionTaken[]];
export const NOTIFICATION_TYPE_VALUES = Object.values(NotificationType) as [
  NotificationType,
  ...NotificationType[],
];
export const PROPERTY_SECTOR_VALUES = Object.values(PropertySector) as [
  PropertySector,
  ...PropertySector[],
];
export const ACTIVITY_TYPE_VALUES = Object.values(ActivityType) as [
  ActivityType,
  ...ActivityType[],
];
export const INSPECTION_ITEM_STATUS_VALUES = Object.values(InspectionItemStatus) as [
  InspectionItemStatus,
  ...InspectionItemStatus[],
];

// ─── Professionals directory ─────────────────────────────

export const ProfessionalSpecialty = {
  PLUMBER: 'PLUMBER',
  GASFITTER: 'GASFITTER',
  ELECTRICIAN: 'ELECTRICIAN',
  ARCHITECT_ENGINEER: 'ARCHITECT_ENGINEER',
  MASON: 'MASON',
  ROOFER_WATERPROOFER: 'ROOFER_WATERPROOFER',
  HVAC_TECHNICIAN: 'HVAC_TECHNICIAN',
  PEST_CONTROL: 'PEST_CONTROL',
  EXTINGUISHER_SERVICE: 'EXTINGUISHER_SERVICE',
  DRAIN_CLEANER: 'DRAIN_CLEANER',
  PAINTER: 'PAINTER',
  CARPENTER: 'CARPENTER',
  LANDSCAPER: 'LANDSCAPER',
  SOLAR_SPECIALIST: 'SOLAR_SPECIALIST',
  WATER_TECHNICIAN: 'WATER_TECHNICIAN',
  LOCKSMITH: 'LOCKSMITH',
  GLAZIER: 'GLAZIER',
  IRONWORKER: 'IRONWORKER',
  DRYWALL_INSTALLER: 'DRYWALL_INSTALLER',
} as const;
export type ProfessionalSpecialty =
  (typeof ProfessionalSpecialty)[keyof typeof ProfessionalSpecialty];

export const ProfessionalAvailability = {
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;
export type ProfessionalAvailability =
  (typeof ProfessionalAvailability)[keyof typeof ProfessionalAvailability];

export const ProfessionalTier = {
  A: 'A',
  B: 'B',
  C: 'C',
  BLOCKED: 'BLOCKED',
} as const;
export type ProfessionalTier = (typeof ProfessionalTier)[keyof typeof ProfessionalTier];

export const ProfessionalAttachmentType = {
  MATRICULA: 'MATRICULA',
  SEGURO_RC: 'SEGURO_RC',
  DNI: 'DNI',
  CERTIFICADO_CURSO: 'CERTIFICADO_CURSO',
  OTRO: 'OTRO',
} as const;
export type ProfessionalAttachmentType =
  (typeof ProfessionalAttachmentType)[keyof typeof ProfessionalAttachmentType];

export const ProfessionalPaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELED: 'CANCELED',
} as const;
export type ProfessionalPaymentStatus =
  (typeof ProfessionalPaymentStatus)[keyof typeof ProfessionalPaymentStatus];

export const PROFESSIONAL_SPECIALTY_VALUES = Object.values(ProfessionalSpecialty) as [
  ProfessionalSpecialty,
  ...ProfessionalSpecialty[],
];
export const PROFESSIONAL_AVAILABILITY_VALUES = Object.values(ProfessionalAvailability) as [
  ProfessionalAvailability,
  ...ProfessionalAvailability[],
];
export const PROFESSIONAL_TIER_VALUES = Object.values(ProfessionalTier) as [
  ProfessionalTier,
  ...ProfessionalTier[],
];
export const PROFESSIONAL_ATTACHMENT_TYPE_VALUES = Object.values(ProfessionalAttachmentType) as [
  ProfessionalAttachmentType,
  ...ProfessionalAttachmentType[],
];
export const PROFESSIONAL_PAYMENT_STATUS_VALUES = Object.values(ProfessionalPaymentStatus) as [
  ProfessionalPaymentStatus,
  ...ProfessionalPaymentStatus[],
];

// ─── Technical Inspections (ADR-019) ─────────────────────

export const TechnicalInspectionType = {
  BASIC: 'BASIC',
  STRUCTURAL: 'STRUCTURAL',
  SALE: 'SALE',
} as const;
export type TechnicalInspectionType =
  (typeof TechnicalInspectionType)[keyof typeof TechnicalInspectionType];

export const TechnicalInspectionStatus = {
  REQUESTED: 'REQUESTED',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  REPORT_READY: 'REPORT_READY',
  PAID: 'PAID',
  CANCELED: 'CANCELED',
} as const;
export type TechnicalInspectionStatus =
  (typeof TechnicalInspectionStatus)[keyof typeof TechnicalInspectionStatus];

export const TechnicalInspectionPaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELED: 'CANCELED',
} as const;
export type TechnicalInspectionPaymentStatus =
  (typeof TechnicalInspectionPaymentStatus)[keyof typeof TechnicalInspectionPaymentStatus];

export const TECHNICAL_INSPECTION_TYPE_VALUES = Object.values(TechnicalInspectionType) as [
  TechnicalInspectionType,
  ...TechnicalInspectionType[],
];
export const TECHNICAL_INSPECTION_STATUS_VALUES = Object.values(TechnicalInspectionStatus) as [
  TechnicalInspectionStatus,
  ...TechnicalInspectionStatus[],
];
export const TECHNICAL_INSPECTION_PAYMENT_STATUS_VALUES = Object.values(
  TechnicalInspectionPaymentStatus,
) as [TechnicalInspectionPaymentStatus, ...TechnicalInspectionPaymentStatus[]];

export const InspectionPriceTier = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
} as const;
export type InspectionPriceTier = (typeof InspectionPriceTier)[keyof typeof InspectionPriceTier];
export const INSPECTION_PRICE_TIER_VALUES = Object.values(InspectionPriceTier) as [
  InspectionPriceTier,
  ...InspectionPriceTier[],
];
