import type { AxiosInstance } from 'axios';

import type { ApiResponse, PlanListItem, PlanPublic } from '../types';
import type { PlanStatus } from '../types/enums';

// Note: getPlans returns ApiResponse<T[]> (array wrapped in { data }),
// not PaginatedResponse, because the endpoint returns a full list without cursor pagination.

/**
 * Creates query and mutation functions for the maintenance plans domain.
 * Task-scoped operations live in `createTaskQueries()` — see `./tasks.ts`.
 *
 * @param apiClient Axios instance (web uses proxy `/api/v1`, mobile uses direct URL)
 */
export function createMaintenancePlanQueries(apiClient: AxiosInstance) {
  return {
    // --- Queries ---

    async getPlans(signal?: AbortSignal): Promise<ApiResponse<PlanListItem[]>> {
      const { data } = await apiClient.get('/maintenance-plans', { signal });
      return data;
    },

    async getPlan(id: string, signal?: AbortSignal): Promise<ApiResponse<PlanPublic>> {
      const { data } = await apiClient.get(`/maintenance-plans/${id}`, { signal });
      return data;
    },

    // --- Admin-only mutations ---

    async updatePlan(
      id: string,
      dto: { name?: string; status?: PlanStatus },
    ): Promise<ApiResponse<PlanPublic>> {
      const { data } = await apiClient.patch(`/maintenance-plans/${id}`, dto);
      return data;
    },
  };
}
