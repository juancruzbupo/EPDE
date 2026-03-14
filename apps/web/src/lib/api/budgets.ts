import { createBudgetQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { BudgetFilters, BudgetRequestPublic } from '@epde/shared';

const queries = createBudgetQueries(apiClient);
export const {
  getBudgets,
  getBudget,
  createBudgetRequest,
  updateBudgetStatus,
  respondToBudget,
  editBudgetRequest,
  getBudgetAuditLog,
  getBudgetComments,
  createBudgetComment,
  addBudgetAttachments,
} = queries;
