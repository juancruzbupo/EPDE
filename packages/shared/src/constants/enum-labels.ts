import type {
  ActionTaken,
  BudgetStatus,
  ConditionFound,
  NotificationType,
  PlanStatus,
  ProfessionalAttachmentType,
  ProfessionalAvailability,
  ProfessionalPaymentStatus,
  ProfessionalRequirement,
  ProfessionalSpecialty,
  ProfessionalTier,
  PropertySector,
  PropertyType,
  RecurrenceType,
  ServiceStatus,
  ServiceUrgency,
  TaskExecutor,
  TaskPriority,
  TaskResult,
  TaskStatus,
  TaskType,
  UserStatus,
} from '../types/enums';

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
  EXPIRED: 'Expirado',
} satisfies Record<BudgetStatus, string>;

export const BUDGET_TERMINAL_STATUSES: readonly BudgetStatus[] = [
  'COMPLETED',
  'REJECTED',
  'EXPIRED',
] as const;

export const SERVICE_REQUEST_TERMINAL_STATUSES: readonly ServiceStatus[] = [
  'RESOLVED',
  'CLOSED',
] as const;

/** Type-safe terminal status check — avoids `as never` at call sites. */
export function isBudgetTerminal(status: string): boolean {
  return (BUDGET_TERMINAL_STATUSES as readonly string[]).includes(status);
}

/** Type-safe terminal status check — avoids `as never` at call sites. */
export function isServiceRequestTerminal(status: string): boolean {
  return (SERVICE_REQUEST_TERMINAL_STATUSES as readonly string[]).includes(status);
}

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

export const PROPERTY_SECTOR_LABELS = {
  EXTERIOR: 'Exterior / Fachada',
  ROOF: 'Techo / Cubierta',
  TERRACE: 'Terraza / Balcón',
  INTERIOR: 'Interior general',
  KITCHEN: 'Cocina',
  BATHROOM: 'Baño',
  BASEMENT: 'Subsuelo / Cimientos',
  GARDEN: 'Jardín / Perímetro',
  INSTALLATIONS: 'Instalaciones centrales',
} satisfies Record<PropertySector, string>;

export const PROPERTY_SECTOR_HINTS: Record<PropertySector, string> = {
  EXTERIOR: 'Paredes exteriores, fachada, revoque y pintura exterior',
  ROOF: 'Techo, membrana, canaletas y desagües pluviales',
  TERRACE: 'Terraza, balcón, impermeabilización y barandas',
  INTERIOR: 'Paredes interiores, cielorrasos, pisos y aberturas',
  KITCHEN: 'Instalaciones de cocina: gas, agua, ventilación y revestimientos',
  BATHROOM: 'Grifería, desagües, ventilación y revestimientos de baño',
  BASEMENT: 'Cimientos, subsuelo, humedad ascendente y estructura',
  GARDEN: 'Jardín, veredas, cercos, portones y desagüe perimetral',
  INSTALLATIONS: 'Tablero eléctrico, termotanque, calefacción y gas central',
};

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

/** Descriptive hints for condition options — help non-technical homeowners judge condition. */
export const CONDITION_FOUND_HINTS = {
  EXCELLENT: 'Sin desgaste visible, como nuevo',
  GOOD: 'Buen estado general, sin problemas',
  FAIR: 'Desgaste menor, funciona correctamente',
  POOR: 'Daño visible: grietas, manchas o desgaste importante',
  CRITICAL: 'Daño grave: goteras, roturas, requiere intervención urgente',
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

/** Default ActionTaken based on TaskType — reduces form friction for homeowners */
export const TASK_TYPE_TO_DEFAULT_ACTION: Record<TaskType, ActionTaken> = {
  INSPECTION: 'INSPECTION_ONLY',
  CLEANING: 'CLEANING',
  TEST: 'INSPECTION_ONLY',
  TREATMENT: 'TREATMENT',
  SEALING: 'SEALING',
  LUBRICATION: 'FULL_SERVICE',
  ADJUSTMENT: 'ADJUSTMENT',
  MEASUREMENT: 'INSPECTION_ONLY',
  EVALUATION: 'INSPECTION_ONLY',
};

/** Default TaskResult based on ConditionFound — reduces form friction in quick-complete mode. */
export const CONDITION_TO_DEFAULT_RESULT: Record<ConditionFound, TaskResult> = {
  EXCELLENT: 'OK',
  GOOD: 'OK',
  FAIR: 'OK_WITH_OBSERVATIONS',
  POOR: 'NEEDS_ATTENTION',
  CRITICAL: 'NEEDS_URGENT_REPAIR',
};

// ─── Condition Score Scales ──────────────────────────────

/** ConditionFound → 1-5 scale for chart averaging (trend, category breakdown). */
export const CONDITION_SCORE: Record<ConditionFound, number> = {
  EXCELLENT: 5,
  GOOD: 4,
  FAIR: 3,
  POOR: 2,
  CRITICAL: 1,
};

/** ConditionFound → 0-100 scale for ISV condition dimension. Relationship: percent = (score - 1) * 25. */
export const CONDITION_SCORE_PERCENT: Record<ConditionFound, number> = {
  EXCELLENT: 100,
  GOOD: 80,
  FAIR: 60,
  POOR: 40,
  CRITICAL: 20,
};

/** ActionTaken values classified as preventive (vs corrective) for ISV investment dimension. */
export const PREVENTIVE_ACTIONS: readonly ActionTaken[] = [
  'INSPECTION_ONLY',
  'CLEANING',
  'ADJUSTMENT',
  'SEALING',
] as const;

// ─── Plural Labels (for filter tabs) ────────────────────

export const BUDGET_STATUS_PLURAL_LABELS = {
  PENDING: 'Pendientes',
  QUOTED: 'Cotizados',
  APPROVED: 'Aprobados',
  REJECTED: 'Rechazados',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completados',
  EXPIRED: 'Expirados',
} satisfies Record<BudgetStatus, string>;

export const SERVICE_STATUS_PLURAL_LABELS = {
  OPEN: 'Abiertos',
  IN_REVIEW: 'En Revisión',
  IN_PROGRESS: 'En Progreso',
  RESOLVED: 'Resueltos',
  CLOSED: 'Cerrados',
} satisfies Record<ServiceStatus, string>;

// ─── Audit Action Labels ────────────────────────────────

export const BUDGET_AUDIT_ACTION_LABELS: Record<string, string> = {
  created: 'Creó el presupuesto',
  edited: 'Editó el presupuesto',
  quoted: 'Envió cotización',
  're-quoted': 'Re-cotizó',
  approved: 'Aprobó',
  rejected: 'Rechazó',
  'in-progress': 'Marcó en progreso',
  completed: 'Completó',
  expired: 'Expiró',
  comment_added: 'Agregó comentario',
  attachments_added: 'Agregó adjuntos',
};

export const SERVICE_AUDIT_ACTION_LABELS: Record<string, string> = {
  created: 'Creó la solicitud',
  edited: 'Editó la solicitud',
  'in-review': 'Pasó a revisión',
  'in-progress': 'Marcó en progreso',
  resolved: 'Marcó como resuelta',
  closed: 'Cerró la solicitud',
  comment_added: 'Agregó comentario',
  attachments_added: 'Agregó adjuntos',
};

// ─── Professionals directory ────────────────────────────

export const PROFESSIONAL_SPECIALTY_LABELS = {
  ELECTRICIAN: 'Electricista matriculado',
  PLUMBER_GASFITTER: 'Plomero / Gasista matriculado',
  ARCHITECT_ENGINEER: 'Arquitecto / Ingeniero estructural',
  ROOFER_WATERPROOFER: 'Techista / Impermeabilizador',
  PEST_CONTROL: 'Fumigador / Control de plagas',
  HVAC_TECHNICIAN: 'Técnico HVAC / Aires acondicionados',
  FIRE_SAFETY: 'Seguridad contra incendios',
  DOCUMENTATION_NORMATIVE: 'Documentación y normativa',
  PAINTER: 'Pintor',
  SOLAR_SPECIALIST: 'Especialista en energía solar',
  WATER_TECHNICIAN: 'Técnico en agua potable',
  CARPENTER: 'Carpintero / Ebanista',
  LANDSCAPER: 'Jardinero / Paisajista',
} satisfies Record<ProfessionalSpecialty, string>;

export const PROFESSIONAL_AVAILABILITY_LABELS = {
  AVAILABLE: 'Disponible',
  BUSY: 'Ocupado',
  UNAVAILABLE: 'No disponible',
} satisfies Record<ProfessionalAvailability, string>;

export const PROFESSIONAL_TIER_LABELS = {
  A: 'A — Usar siempre',
  B: 'B — Aceptable',
  C: 'C — Último recurso',
  BLOCKED: 'Bloqueado',
} satisfies Record<ProfessionalTier, string>;

export const PROFESSIONAL_ATTACHMENT_TYPE_LABELS = {
  MATRICULA: 'Matrícula',
  SEGURO_RC: 'Seguro de Responsabilidad Civil',
  DNI: 'DNI',
  CERTIFICADO_CURSO: 'Certificado de curso',
  OTRO: 'Otro',
} satisfies Record<ProfessionalAttachmentType, string>;

export const PROFESSIONAL_PAYMENT_STATUS_LABELS = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  CANCELED: 'Cancelado',
} satisfies Record<ProfessionalPaymentStatus, string>;
