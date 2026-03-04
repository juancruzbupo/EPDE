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
