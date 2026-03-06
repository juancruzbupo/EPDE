export * from './badge-variants';
export * from './design-tokens';

import type {
  TaskStatus,
  TaskPriority,
  BudgetStatus,
  ServiceStatus,
  PropertyType,
  RecurrenceType,
  UserStatus,
  PlanStatus,
  ServiceUrgency,
  NotificationType,
  TaskType,
  ProfessionalRequirement,
  TaskResult,
  ConditionFound,
  TaskExecutor,
  ActionTaken,
} from '../types/enums';

export const APP_NAME = 'EPDE';
export const API_VERSION = 'v1';

export const PAGINATION_DEFAULT_TAKE = 20;
export const PAGINATION_MAX_TAKE = 100;
export const TASKS_MAX_TAKE = 500;

export const BCRYPT_SALT_ROUNDS = 12;

export const JWT_ACCESS_EXPIRATION = '15m';
export const JWT_REFRESH_EXPIRATION = '7d';

// ─── Enum Labels (Spanish) ──────────────────────────────

export const TASK_STATUS_LABELS = {
  PENDING: 'Pendiente',
  UPCOMING: 'Próxima',
  OVERDUE: 'Vencida',
  COMPLETED: 'Completada',
} satisfies Record<TaskStatus, string>;

export const TASK_PRIORITY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
} satisfies Record<TaskPriority, string>;

export const BUDGET_STATUS_LABELS = {
  PENDING: 'Pendiente',
  QUOTED: 'Cotizado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
} satisfies Record<BudgetStatus, string>;

export const SERVICE_STATUS_LABELS = {
  OPEN: 'Abierto',
  IN_REVIEW: 'En Revisión',
  IN_PROGRESS: 'En Progreso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
} satisfies Record<ServiceStatus, string>;

export const PROPERTY_TYPE_LABELS = {
  HOUSE: 'Casa',
  APARTMENT: 'Departamento',
  DUPLEX: 'Dúplex',
  COUNTRY_HOUSE: 'Casa de Campo',
  OTHER: 'Otro',
} satisfies Record<PropertyType, string>;

export const RECURRENCE_TYPE_LABELS = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  BIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  CUSTOM: 'Personalizado',
  ON_DETECTION: 'Según detección',
} satisfies Record<RecurrenceType, string>;

export const USER_STATUS_LABELS = {
  INVITED: 'Invitado',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
} satisfies Record<UserStatus, string>;

export const PLAN_STATUS_LABELS = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado',
} satisfies Record<PlanStatus, string>;

export const SERVICE_URGENCY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
} satisfies Record<ServiceUrgency, string>;

export const NOTIFICATION_TYPE_LABELS = {
  TASK_REMINDER: 'Recordatorio',
  BUDGET_UPDATE: 'Presupuesto',
  SERVICE_UPDATE: 'Servicio',
  SYSTEM: 'Sistema',
} satisfies Record<NotificationType, string>;

// ─── Nomenclated Task Labels ─────────────────────────────

export const TASK_TYPE_LABELS = {
  INSPECTION: 'Inspección',
  CLEANING: 'Limpieza',
  TEST: 'Prueba/Ensayo',
  TREATMENT: 'Tratamiento',
  SEALING: 'Sellado',
  LUBRICATION: 'Lubricación',
  ADJUSTMENT: 'Ajuste',
  MEASUREMENT: 'Medición',
  EVALUATION: 'Evaluación',
} satisfies Record<TaskType, string>;

export const PROFESSIONAL_REQUIREMENT_LABELS = {
  OWNER_CAN_DO: 'Propietario puede',
  PROFESSIONAL_RECOMMENDED: 'Profesional recomendado',
  PROFESSIONAL_REQUIRED: 'Profesional obligatorio',
} satisfies Record<ProfessionalRequirement, string>;

export const TASK_RESULT_LABELS = {
  OK: 'Todo en orden',
  OK_WITH_OBSERVATIONS: 'En orden con observaciones',
  NEEDS_ATTENTION: 'Requiere atención',
  NEEDS_REPAIR: 'Requiere reparación',
  NEEDS_URGENT_REPAIR: 'Reparación urgente',
  NOT_APPLICABLE: 'No aplica',
} satisfies Record<TaskResult, string>;

export const CONDITION_FOUND_LABELS = {
  EXCELLENT: 'Excelente',
  GOOD: 'Bueno',
  FAIR: 'Aceptable',
  POOR: 'Deteriorado',
  CRITICAL: 'Crítico',
} satisfies Record<ConditionFound, string>;

export const TASK_EXECUTOR_LABELS = {
  OWNER: 'Yo (propietario)',
  HIRED_PROFESSIONAL: 'Profesional contratado',
  EPDE_PROFESSIONAL: 'Profesional EPDE',
} satisfies Record<TaskExecutor, string>;

export const ACTION_TAKEN_LABELS = {
  INSPECTION_ONLY: 'Solo inspección',
  CLEANING: 'Limpieza',
  MINOR_REPAIR: 'Reparación menor',
  MAJOR_REPAIR: 'Reparación mayor',
  REPLACEMENT: 'Reemplazo',
  TREATMENT: 'Tratamiento',
  SEALING: 'Sellado',
  ADJUSTMENT: 'Ajuste',
  FULL_SERVICE: 'Servicio completo',
  NO_ACTION: 'Sin acción',
} satisfies Record<ActionTaken, string>;

// ─── Default Categories ─────────────────────────────────

export const CATEGORY_DEFAULTS = [
  { name: 'Electricidad', icon: 'zap', order: 1 },
  { name: 'Plomería', icon: 'droplets', order: 2 },
  { name: 'Pintura', icon: 'paintbrush', order: 3 },
  { name: 'Techos y Cubiertas', icon: 'home', order: 4 },
  { name: 'Jardín y Exteriores', icon: 'trees', order: 5 },
  { name: 'Climatización', icon: 'thermometer', order: 6 },
  { name: 'Seguridad', icon: 'shield', order: 7 },
  { name: 'Limpieza General', icon: 'sparkles', order: 8 },
  { name: 'Estructural', icon: 'building', order: 9 },
  { name: 'Aberturas', icon: 'door-open', order: 10 },
] as const;

// ─── Client Type Constants ───────────────────────────────

export const CLIENT_TYPE_HEADER = 'x-client-type' as const;
export const CLIENT_TYPES = { MOBILE: 'mobile', WEB: 'web' } as const;
export type ClientType = (typeof CLIENT_TYPES)[keyof typeof CLIENT_TYPES];

// ─── Query Keys (frontend SSoT) ────────────────────────

export const QUERY_KEYS = {
  budgets: 'budgets',
  dashboard: 'dashboard',
  clients: 'clients',
  properties: 'properties',
  serviceRequests: 'service-requests',
  notifications: 'notifications',
  plans: 'plans',
  categories: 'categories',
  categoryTemplates: 'category-templates',
  taskTemplates: 'task-templates',
  taskDetail: 'task-detail',
  taskLogs: 'task-logs',
  taskNotes: 'task-notes',
  // Dashboard sub-keys
  dashboardStats: 'stats',
  dashboardActivity: 'activity',
  dashboardClientStats: 'client-stats',
  dashboardClientUpcoming: 'client-upcoming',
  // Notifications sub-keys
  notificationsUnreadCount: 'unread-count',
} as const;
