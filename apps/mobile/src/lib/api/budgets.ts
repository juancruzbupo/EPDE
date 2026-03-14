/**
 * Mobile budget API — client-only.
 * Admin mutations (respondToBudget) live exclusively in web's budgets.ts.
 */
import { createBudgetQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { BudgetFilters } from '@epde/shared';

const queries = createBudgetQueries(apiClient);
export const {
  getBudgets,
  getBudget,
  createBudgetRequest,
  updateBudgetStatus,
  editBudgetRequest,
  getBudgetAuditLog,
  getBudgetComments,
  createBudgetComment,
  addBudgetAttachments,
} = queries;
