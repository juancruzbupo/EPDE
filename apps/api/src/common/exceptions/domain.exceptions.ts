/**
 * Domain exceptions — framework-agnostic errors thrown by repositories.
 * Map these to HTTP exceptions in the service/controller layer.
 */

export class BudgetNotQuotableError extends Error {
  override readonly name = 'BudgetNotQuotableError';
  constructor() {
    super('Solo se puede cotizar un presupuesto pendiente o cotizado');
  }
}

export class BudgetNotEditableError extends Error {
  override readonly name = 'BudgetNotEditableError';
  constructor() {
    super('Solo se puede editar un presupuesto pendiente');
  }
}

export class BudgetVersionConflictError extends Error {
  override readonly name = 'BudgetVersionConflictError';
  constructor() {
    super('El presupuesto fue modificado por otro usuario');
  }
}

export class CategoryHasReferencingTasksError extends Error {
  override readonly name = 'CategoryHasReferencingTasksError';
  constructor() {
    super('No se puede eliminar una categoría que tiene tareas asociadas');
  }
}

export class TaskNotCompletableError extends Error {
  override readonly name = 'TaskNotCompletableError';
  constructor(currentStatus: string) {
    super(`La tarea no se puede completar (estado actual: ${currentStatus})`);
  }
}

export class InvalidBudgetTransitionError extends Error {
  override readonly name = 'InvalidBudgetTransitionError';
  constructor(currentStatus: string) {
    super(`No se puede cambiar el estado desde ${currentStatus}`);
  }
}

export class UserAlreadyHasPasswordError extends Error {
  override readonly name = 'UserAlreadyHasPasswordError';
  constructor() {
    super('El usuario ya tiene contraseña configurada');
  }
}

export class BudgetAccessDeniedError extends Error {
  override readonly name = 'BudgetAccessDeniedError';
  constructor(reason: 'role' | 'ownership') {
    super(
      reason === 'role'
        ? 'No tenés permisos para esta transición de estado'
        : 'No tenés acceso a este presupuesto',
    );
  }
}

export class InvalidServiceStatusTransitionError extends Error {
  override readonly name = 'InvalidServiceStatusTransitionError';
  constructor(currentStatus: string, targetStatus: string) {
    super(`No se puede cambiar el estado de ${currentStatus} a ${targetStatus}`);
  }
}

export class ServiceRequestNotEditableError extends Error {
  override readonly name = 'ServiceRequestNotEditableError';
  constructor() {
    super('Solo se puede editar una solicitud abierta');
  }
}

export class PropertyAccessDeniedError extends Error {
  override readonly name = 'PropertyAccessDeniedError';
  constructor() {
    super('No tenés acceso a esta propiedad');
  }
}

export class PlanAccessDeniedError extends Error {
  override readonly name = 'PlanAccessDeniedError';
  constructor() {
    super('No tenés acceso a este plan');
  }
}

export class TaskAccessDeniedError extends Error {
  override readonly name = 'TaskAccessDeniedError';
  constructor() {
    super('No tenés acceso a esta tarea');
  }
}

export class ServiceRequestAccessDeniedError extends Error {
  override readonly name = 'ServiceRequestAccessDeniedError';
  constructor(reason: 'ownership' | 'role' = 'ownership') {
    super(
      reason === 'ownership'
        ? 'No tenés acceso a esta solicitud'
        : 'Solo el cliente puede realizar esta acción',
    );
  }
}

export class ServiceRequestTerminalError extends Error {
  override readonly name = 'ServiceRequestTerminalError';
  constructor(action: string) {
    super(`No se puede ${action} en una solicitud cerrada o resuelta`);
  }
}

export class TaskPropertyMismatchError extends Error {
  override readonly name = 'TaskPropertyMismatchError';
  constructor() {
    super('La tarea no pertenece a esta propiedad');
  }
}

export class DuplicateClientEmailError extends Error {
  override readonly name = 'DuplicateClientEmailError';
  constructor() {
    super('Ya existe un usuario con ese email');
  }
}
