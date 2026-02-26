import { createDashboardQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

const queries = createDashboardQueries(apiClient);
export const { getClientDashboardStats, getClientUpcomingTasks } = queries;
