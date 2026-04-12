import type { AxiosInstance } from 'axios';

import type { ApiResponse } from '../types';

export interface UserMilestonePublic {
  id: string;
  userId: string;
  type: string;
  unlockedAt: string;
  emoji: string;
  label: string;
  description: string;
}

export interface StreakFreezeResult {
  used: boolean;
}

/**
 * Creates query and mutation functions for auth-related user features.
 * Separated from core auth (login/logout/tokens) because these are
 * feature endpoints (milestones, streak freeze) not auth infrastructure.
 */
export function createAuthFeatureQueries(apiClient: AxiosInstance) {
  return {
    async getMilestones(signal?: AbortSignal): Promise<ApiResponse<UserMilestonePublic[]>> {
      const { data } = await apiClient.get<ApiResponse<UserMilestonePublic[]>>(
        '/auth/me/milestones',
        { signal },
      );
      return data;
    },

    async useStreakFreeze(): Promise<ApiResponse<StreakFreezeResult>> {
      const { data } =
        await apiClient.post<ApiResponse<StreakFreezeResult>>('/auth/me/streak-freeze');
      return data;
    },
  };
}
