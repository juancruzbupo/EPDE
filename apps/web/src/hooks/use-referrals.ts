import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';

import { getMyReferrals } from '@/lib/api/referrals';

import { STALE_TIME } from './query-stale-times';

/**
 * Self-serve referral state for the profile page. Refetches on focus
 * because while the user is on another tab, an admin might be marking
 * one of their referrals as converted — we want the new stats to land
 * as soon as they come back.
 */
export function useReferrals() {
  return useQuery({
    queryKey: [QUERY_KEYS.referrals],
    queryFn: ({ signal }) => getMyReferrals(signal).then((r) => r.data),
    staleTime: STALE_TIME.MEDIUM,
    refetchOnWindowFocus: true,
  });
}
