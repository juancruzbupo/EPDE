export * from './badge-variants';
export * from './design-tokens';

import type {
  ActionTaken,
  BudgetStatus,
  ConditionFound,
  NotificationType,
  PlanStatus,
  ProfessionalRequirement,
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

export const APP_NAME = 'EPDE';
export const API_VERSION = 'v1';

export const PAGINATION_DEFAULT_TAKE = 20;
export const PAGINATION_MAX_TAKE = 100;
export const TASKS_MAX_TAKE = 500;

export const BCRYPT_SALT_ROUNDS = 12;

export const JWT_ACCESS_EXPIRATION = '15m';
export const JWT_REFRESH_EXPIRATION = '7d';

/** Initial subscription duration in days after first activation (set-password).
 * 180 days (6 months) gives clients enough time to complete 2 quarterly cycles,
 * accumulate ISV trend data, and build dependency on the platform before renewal. */
export const SUBSCRIPTION_INITIAL_DAYS = 180;
/** Days before expiration to send reminder notifications. */
export const SUBSCRIPTION_REMINDER_DAYS = [7, 3, 1] as const;
/** WhatsApp contact number for subscription renewal and support. */
export const WHATSAPP_CONTACT_NUMBER = '5493435043696';

// ─── Dopamine / Engagement ──────────────────────────────

/** Motivational messages shown after completing a task (rotated randomly). */
export const COMPLETION_MESSAGES = [
  'Tu casa está un poco más segura.',
  'Bien hecho. Seguí cuidando tu hogar.',
  'Tarea al día. Tu ISV te lo agradece.',
  'Un paso más para mantener tu casa en forma.',
  'Prevención hecha. Tu patrimonio te lo agradece.',
] as const;

/** Estimated savings by category when a problem is detected early.
 * Used for "Evitaste un problema" dopamine feedback. */
export const PREVENTION_SAVINGS: Record<string, string> = {
  Estructura: '$500.000 – $3.000.000',
  'Techos y Cubiertas': '$150.000 – $400.000',
  'Instalación Eléctrica': '$80.000 – $180.000',
  'Instalación Sanitaria': '$100.000 – $300.000',
  'Gas y Calefacción': '$200.000 – $500.000',
  Aberturas: '$50.000 – $150.000',
  'Pintura y Revestimientos': '$80.000 – $250.000',
  'Jardín y Exteriores': '$100.000 – $300.000',
  Climatización: '$60.000 – $200.000',
  'Humedad e Impermeabilización': '$300.000 – $800.000',
  'Seguridad contra Incendio': '$100.000 – $500.000',
  'Control de Plagas': '$80.000 – $200.000',
  'Pisos y Contrapisos': '$100.000 – $400.000',
};

/** Daily home maintenance tips — rotated by day of year. */
export const DAILY_TIPS = [
  '¿Sabías que limpiar los filtros del AC cada 3 meses reduce el consumo eléctrico hasta un 15%?',
  'Revisá las canillas de tu casa cada 6 meses. Un goteo constante puede desperdiciar 30 litros por día.',
  'Las canaletas obstruidas son la causa #1 de humedad en paredes. Limpialas cada 3 meses.',
  'Probá el disyuntor diferencial una vez al mes: presioná el botón de test. Si no corta, llamá a un electricista.',
  'Las juntas de silicona en baños y cocinas duran 2-3 años. Revisalas y renovalas para evitar filtraciones.',
  'Los detectores de humo necesitan baterías nuevas al menos una vez al año. ¿Cuándo cambiaste las tuyas?',
  'La humedad ascendente en muros suele ser invisible al principio. Revisá la base de tus paredes periódicamente.',
  'Un control de gas anual puede prevenir intoxicaciones por monóxido de carbono. Es obligatorio según la NAG-226.',
  'Lubricar bisagras y cerraduras 2 veces al año prolonga su vida útil y evita trabas molestas.',
  'Las termitas pueden dañar una estructura de madera durante años sin que lo notes. Revisá marcos y zócalos.',
  'El ánodo de sacrificio del termotanque se consume con el tiempo. Verificalo una vez al año para evitar corrosión.',
  'Una llave de paso de agua que no gira puede ser un problema grave en una emergencia. Probala cada 6 meses.',
  'Los burletes de puertas y ventanas se desgastan. Renovarlos mejora la aislación y reduce el gasto en climatización.',
  'Después de una tormenta fuerte, recorré la casa buscando filtraciones. Detectar temprano ahorra reparaciones costosas.',
  'Las manchas blancas en paredes (eflorescencias) indican presencia de humedad. No las ignores.',
  'Podar árboles cercanos al techo previene daños por ramas caídas durante tormentas.',
  'La presión de agua baja puede indicar una pérdida oculta. Cerrá todas las canillas y fijate si el medidor se mueve.',
  'Los mosquitos se reproducen en agua estancada. Revisá platos de macetas, canaletas y baldes cada semana.',
  'Un matafuego vencido es tan inútil como no tener uno. Verificá la fecha de recarga anualmente.',
  'La membrana asfáltica del techo dura 10-15 años. Si tiene más, es hora de evaluarla.',
  'Ventilá tu casa 15 minutos al día, incluso en invierno. Reduce la humedad y previene hongos.',
  'Las persianas de enrollar necesitan mantenimiento anual: limpiar guías y lubricar el eje.',
  'La pintura exterior protege el revoque. Si está descascarada, el agua penetra y genera humedad.',
  'Revisá las mangueras de la conexión del lavarropas. Se endurecen con el tiempo y pueden reventarse.',
  'Una instalación eléctrica de más de 20 años necesita una revisión profesional completa.',
  'Los pisos de madera necesitan plastificado cada 3-5 años para mantener su protección.',
  'El conducto de la chimenea del calefón debe estar libre de obstrucciones. Es cuestión de seguridad.',
  'Revisá que las rejas y portones estén bien fijados y sin oxidación en las bases empotradas.',
  'Limpiá la parrilla después de cada uso y revisá los ladrillos refractarios 2 veces al año.',
  'Si tenés pileta, el pH del agua debe estar entre 7.2 y 7.6 para evitar daños en el revestimiento.',
] as const;

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

// ─── ISV Classification ─────────────────────────────────

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
  quoteTemplates: 'quote-templates',
  taskDetail: 'task-detail',
  taskLogs: 'task-logs',
  taskNotes: 'task-notes',
  // Dashboard sub-keys
  dashboardStats: 'stats',
  dashboardActivity: 'activity',
  dashboardClientStats: 'client-stats',
  dashboardClientUpcoming: 'client-upcoming',
  dashboardAnalytics: 'analytics',
  dashboardClientAnalytics: 'client-analytics',
  // Budget sub-keys
  budgetAuditLog: 'budget-audit-log',
  budgetComments: 'budget-comments',
  // Service request sub-keys
  serviceRequestAuditLog: 'service-request-audit-log',
  serviceRequestComments: 'service-request-comments',
  // Notifications sub-keys
  notificationsUnreadCount: 'unread-count',
  // Property sub-keys
  propertyExpenses: 'expenses',
  propertyPhotos: 'photos',
  propertyHealthIndex: 'health-index',
  propertyHealthHistory: 'health-history',
  propertyProblems: 'problems',
  // Plan sub-keys
  plansList: 'list',
  plansTasks: 'tasks',
  // Client sub-keys
  clientsSearch: 'search',
  // Landing settings
  landingSettings: 'landing-settings',
} as const;
