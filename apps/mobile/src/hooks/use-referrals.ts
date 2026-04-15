import { QUERY_KEYS } from '@epde/shared';
import { useQuery } from '@tanstack/react-query';

import { getMyReferrals } from '@/lib/api/referrals';

import { STALE_TIME } from './query-stale-times';

/**
 * Self-serve referral state for the mobile profile tab. Web equivalent:
 * apps/web/src/hooks/use-referrals.ts. Mobile is read-only — admin
 * conversions happen on web (see ADR-010).
 */
export function useReferrals() {
  return useQuery({
    queryKey: [QUERY_KEYS.referrals],
    queryFn: ({ signal }) => getMyReferrals(signal).then((r) => r.data),
    staleTime: STALE_TIME.MEDIUM,
  });
}
