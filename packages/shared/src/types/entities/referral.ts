import type { BaseEntity } from '../index';

/**
 * Referral program types. See ADR-010 for the business rules and the
 * rationale for absolute (non-cumulative) milestone rewards.
 *
 * Referral is NOT soft-deletable — history is audit-relevant forever.
 */
export type ReferralStatus = 'PENDING' | 'CONVERTED';

export interface Referral extends BaseEntity {
  referrerId: string;
  referredUserId: string | null;
  referredEmail: string | null;
  status: ReferralStatus;
  convertedAt: Date | null;
}

/** Public item rendered in the user's referral history list. */
export interface ReferralHistoryItem {
  id: string;
  /** Null until the referral converts — privacy for pending invites. */
  referredName: string | null;
  status: ReferralStatus;
  createdAt: string;
  convertedAt: string | null;
}

/** Single milestone step rendered in the profile's "stepper". */
export interface MilestoneState {
  /** The conversion count that unlocks this milestone (1, 2, 3, 5, 10). */
  target: number;
  reached: boolean;
  reachedAt: string | null;
  reward: string;
}

/** Credit counters earned by the current milestone (absolute, not cumulative). */
export interface ReferralCredits {
  months: number;
  annualDiagnosis: number;
  biannualDiagnosis: number;
}

/** Referral stats rendered in the stats card. */
export interface ReferralStats {
  totalReferrals: number;
  convertedCount: number;
  /** 0 | 1 | 2 | 3 | 5 | 10. 0 means no milestone reached yet. */
  currentMilestone: number;
  /** Next target the user is working toward. Null once past the 10-conversion cap. */
  nextMilestone: number | null;
  creditsEarned: ReferralCredits;
}

/** Full response shape from GET /users/me/referrals. */
export interface ReferralStatePublic {
  referralCode: string;
  referralUrl: string;
  stats: ReferralStats;
  milestones: MilestoneState[];
  referralHistory: ReferralHistoryItem[];
}
