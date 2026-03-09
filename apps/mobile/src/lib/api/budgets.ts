import { createBudgetQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type { BudgetFilters } from '@epde/shared';

const queries = createBudgetQueries(apiClient);
export const { getBudgets, getBudget, createBudgetRequest, updateBudgetStatus } = queries;
