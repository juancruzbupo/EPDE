import { createBudgetQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

export type { BudgetFilters } from '@epde/shared/api';

const queries = createBudgetQueries(apiClient);
export const { getBudgets, getBudget, createBudgetRequest, updateBudgetStatus } = queries;
