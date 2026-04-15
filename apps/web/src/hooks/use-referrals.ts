import { getErrorMessage, QUERY_KEYS } from '@epde/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getMyReferrals,
  getReferralsForUser,
  markReferralConverted,
  recomputeReferrerState,
} from '@/lib/api/referrals';

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

/**
 * Admin-only — fetches a specific user's referral state for the client
 * detail page. Same payload shape as `useReferrals`, just keyed by userId.
 */
export function useClientReferrals(userId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.referrals, userId],
    queryFn: ({ signal }) => getReferralsForUser(userId, signal).then((r) => r.data),
    enabled: !!userId,
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Admin-only — marks a referral as paid/converted. Invalidates both the
 * client-scoped key (refresh the section we're looking at) and the
 * top-level referrals key (in case the referrer is logged in elsewhere
 * and viewing their own profile).
 */
export function useMarkReferralConverted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (referralId: string) => markReferralConverted(referralId),
    onSuccess: () => {
      toast.success('Recomendación marcada como pagada');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.referrals] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al marcar la recomendación'));
    },
  });
}

/** Admin-only — drift recovery; rebuilds a referrer's denormalized counters. */
export function useRecomputeReferrerState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => recomputeReferrerState(userId),
    onSuccess: () => {
      toast.success('Estado de recomendaciones recalculado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.referrals] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al recalcular el estado'));
    },
  });
}
