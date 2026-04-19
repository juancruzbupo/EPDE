import { createDashboardQueries } from '@epde/shared';

import { apiClient } from '../api-client';

const queries = createDashboardQueries(apiClient);
export const {
  getClientDashboardStats,
  getClientUpcomingTasks,
  getClientAnalytics,
  getDashboardStats,
  getDashboardFinancial,
  getDashboardOperational,
  getDashboardPortfolio,
  getDashboardActivity,
  getAdminAnalytics,
} = queries;
