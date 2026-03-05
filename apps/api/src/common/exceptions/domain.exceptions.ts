/**
 * Domain exceptions — framework-agnostic errors thrown by repositories.
 * Map these to HTTP exceptions in the service/controller layer.
 */

export class BudgetNotPendingError extends Error {
  readonly name = 'BudgetNotPendingError';
  constructor() {
    super('Solo se puede cotizar un presupuesto pendiente');
  }
}

export class BudgetVersionConflictError extends Error {
  readonly name = 'BudgetVersionConflictError';
  constructor() {
    super('El presupuesto fue modificado por otro usuario');
  }
}

export class CategoryHasReferencingTasksError extends Error {
  readonly name = 'CategoryHasReferencingTasksError';
  constructor() {
    super('No se puede eliminar una categoría que tiene tareas asociadas');
  }
}

export class TaskNotCompletableError extends Error {
  readonly name = 'TaskNotCompletableError';
  constructor(currentStatus: string) {
    super(`La tarea no se puede completar (estado actual: ${currentStatus})`);
  }
}

export class InvalidBudgetTransitionError extends Error {
  readonly name = 'InvalidBudgetTransitionError';
  constructor(currentStatus: string) {
    super(`No se puede cambiar el estado desde ${currentStatus}`);
  }
}

export class UserAlreadyHasPasswordError extends Error {
  readonly name = 'UserAlreadyHasPasswordError';
  constructor() {
    super('El usuario ya tiene contraseña configurada');
  }
}
