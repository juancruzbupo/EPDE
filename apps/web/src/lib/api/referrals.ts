import { createReferralQueries } from '@epde/shared';

import { apiClient } from '../api-client';

export type {
  MilestoneState,
  ReferralCredits,
  ReferralHistoryItem,
  ReferralStatePublic,
  ReferralStats,
  ReferralStatus,
} from '@epde/shared';

const queries = createReferralQueries(apiClient);
export const { getMyReferrals, markReferralConverted, recomputeReferrerState } = queries;
