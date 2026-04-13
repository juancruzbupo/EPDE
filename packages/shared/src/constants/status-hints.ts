import type { BudgetStatus, PlanStatus, ServiceUrgency, TaskPriority } from '../types';

/** Plain-language explanations of status/badge values for tooltips. */

export const BUDGET_STATUS_HINTS: Partial<Record<BudgetStatus, string>> = {
  PENDING: 'Esperando que EPDE envíe el presupuesto',
  QUOTED: 'EPDE envió el precio. Podés aprobar o rechazar',
  APPROVED: 'Aprobaste el presupuesto. El trabajo puede comenzar',
  REJECTED: 'Rechazaste este presupuesto',
  IN_PROGRESS: 'El trabajo está en curso',
  COMPLETED: 'Trabajo finalizado',
  EXPIRED: 'El presupuesto venció sin respuesta',
};

export const TASK_PRIORITY_HINTS: Record<TaskPriority, string> = {
  LOW: 'Mantenimiento general, sin fecha apurada',
  MEDIUM: 'Importante completar este mes',
  HIGH: 'Conviene completar en las próximas 2 semanas',
  URGENT: 'Riesgo de daño mayor si se demora. Hacer esta semana',
};

export const SERVICE_URGENCY_HINTS: Record<ServiceUrgency, string> = {
  LOW: 'No hay prisa. Completalo cuando tengas tiempo',
  MEDIUM: 'Conviene hacer algo en las próximas semanas',
  HIGH: 'Debería resolverse pronto para evitar que empeore',
  URGENT: 'Requiere acción inmediata, riesgo de daño mayor',
};

export const PLAN_STATUS_HINTS: Record<PlanStatus, string> = {
  ACTIVE: 'Plan en uso con tareas vigentes',
  DRAFT: 'Plan preparado pero no activado todavía',
  ARCHIVED: 'Plan completado o descartado. Se mantiene como referencia',
};

export const SERVICE_STATUS_HINTS: Record<string, string> = {
  OPEN: 'Tu solicitud fue recibida y está esperando revisión',
  IN_REVIEW: 'EPDE está evaluando el problema',
  IN_PROGRESS: 'Se está trabajando en la solución',
  RESOLVED: 'El problema fue resuelto. Verificá que esté todo bien',
  CLOSED: 'Solicitud cerrada y archivada',
};

export const TASK_EXECUTOR_HINTS: Partial<Record<string, string>> = {
  OWNER: 'Lo hiciste vos personalmente',
  HIRED_PROFESSIONAL: 'Contrataste a un profesional por tu cuenta',
  EPDE_PROFESSIONAL: 'EPDE coordinó al profesional',
};
