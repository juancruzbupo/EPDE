import type { AxiosInstance } from 'axios';

import type { ApiResponse, ReferralStatePublic } from '../types';

/**
 * Creates query and mutation functions for the referral program.
 *
 * Two surfaces:
 *   - `getMyReferrals()` — self-serve. Any authenticated user gets their
 *     own state (code, stats, milestones, history). Used by the profile
 *     page on web and the profile tab on mobile.
 *   - `markReferralConverted(referralId)` — admin only. Temporary bridge
 *     until a real payment system exists. Marks a PENDING referral as
 *     CONVERTED, triggering the server-side reward recalculation +
 *     notification handlers. See ADR-010 for the manual-conversion
 *     rationale.
 *
 * @param apiClient Axios instance (web uses proxy `/api/v1`, mobile uses direct URL)
 */
export function createReferralQueries(apiClient: AxiosInstance) {
  return {
    async getMyReferrals(signal?: AbortSignal): Promise<ApiResponse<ReferralStatePublic>> {
      const { data } = await apiClient.get('/users/me/referrals', { signal });
      return data;
    },

    /**
     * Admin-only — same payload shape as `getMyReferrals` but keyed by an
     * arbitrary userId. Powers the referrals section on the admin
     * client-detail page (which referrals are pending, stats, milestones).
     */
    async getReferralsForUser(
      userId: string,
      signal?: AbortSignal,
    ): Promise<ApiResponse<ReferralStatePublic>> {
      const { data } = await apiClient.get(`/admin/referrals/users/${userId}`, { signal });
      return data;
    },

    /** Admin-only — marks a referral as converted and fires reward recalculation. */
    async markReferralConverted(referralId: string): Promise<ApiResponse<null>> {
      const { data } = await apiClient.post(`/admin/referrals/${referralId}/convert`);
      return data;
    },

    /**
     * Admin-only drift-recovery — recomputes a referrer's convertedCount
     * from the Referral table in case the denormalized counter ever
     * desyncs. Safe to call repeatedly (idempotent).
     */
    async recomputeReferrerState(userId: string): Promise<ApiResponse<null>> {
      const { data } = await apiClient.post(`/admin/referrals/${userId}/recompute`);
      return data;
    },
  };
}
