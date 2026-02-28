export const APP_NAME = 'EPDE';
export const API_VERSION = 'v1';

export const PAGINATION_DEFAULT_TAKE = 20;
export const PAGINATION_MAX_TAKE = 100;

export const BCRYPT_SALT_ROUNDS = 12;

export const JWT_ACCESS_EXPIRATION = '15m';
export const JWT_REFRESH_EXPIRATION = '7d';

// ─── Enum Labels (Spanish) ──────────────────────────────

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  UPCOMING: 'Próxima',
  OVERDUE: 'Vencida',
  COMPLETED: 'Completada',
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const BUDGET_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  QUOTED: 'Cotizado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
};

export const SERVICE_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierto',
  IN_REVIEW: 'En Revisión',
  IN_PROGRESS: 'En Progreso',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: 'Casa',
  APARTMENT: 'Departamento',
  DUPLEX: 'Dúplex',
  COUNTRY_HOUSE: 'Casa de Campo',
  OTHER: 'Otro',
};

export const RECURRENCE_TYPE_LABELS: Record<string, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  BIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  CUSTOM: 'Personalizado',
  ON_DETECTION: 'Según detección',
};

export const USER_STATUS_LABELS: Record<string, string> = {
  INVITED: 'Invitado',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
};

export const PLAN_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado',
};

export const SERVICE_URGENCY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  TASK_REMINDER: 'Recordatorio',
  BUDGET_UPDATE: 'Presupuesto',
  SERVICE_UPDATE: 'Servicio',
  SYSTEM: 'Sistema',
};

// ─── Nomenclated Task Labels ─────────────────────────────

export const TASK_TYPE_LABELS: Record<string, string> = {
  INSPECTION: 'Inspección',
  CLEANING: 'Limpieza',
  TEST: 'Prueba/Ensayo',
  TREATMENT: 'Tratamiento',
  SEALING: 'Sellado',
  LUBRICATION: 'Lubricación',
  ADJUSTMENT: 'Ajuste',
  MEASUREMENT: 'Medición',
  EVALUATION: 'Evaluación',
};

export const PROFESSIONAL_REQUIREMENT_LABELS: Record<string, string> = {
  OWNER_CAN_DO: 'Propietario puede',
  PROFESSIONAL_RECOMMENDED: 'Profesional recomendado',
  PROFESSIONAL_REQUIRED: 'Profesional obligatorio',
};

export const TASK_RESULT_LABELS: Record<string, string> = {
  OK: 'Todo en orden',
  OK_WITH_OBSERVATIONS: 'En orden con observaciones',
  NEEDS_ATTENTION: 'Requiere atención',
  NEEDS_REPAIR: 'Requiere reparación',
  NEEDS_URGENT_REPAIR: 'Reparación urgente',
  NOT_APPLICABLE: 'No aplica',
};

export const CONDITION_FOUND_LABELS: Record<string, string> = {
  EXCELLENT: 'Excelente',
  GOOD: 'Bueno',
  FAIR: 'Aceptable',
  POOR: 'Deteriorado',
  CRITICAL: 'Crítico',
};

export const TASK_EXECUTOR_LABELS: Record<string, string> = {
  OWNER: 'Yo (propietario)',
  HIRED_PROFESSIONAL: 'Profesional contratado',
  EPDE_PROFESSIONAL: 'Profesional EPDE',
};

export const ACTION_TAKEN_LABELS: Record<string, string> = {
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
};

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
