/**
 * Referral reward milestones. See ADR-010 for the business rationale.
 *
 * KEY RULE: rewards are **absolute** at the current milestone, not summed
 * across milestones. Hitting 2 conversions ⇒ 2 months of credit (total, not
 * 1+2=3). When the referrer jumps to a higher milestone, the credit is
 * overwritten with the new value and never goes back down.
 *
 * Past the 10-conversion cap the counter keeps incrementing for
 * transparency but the reward is frozen.
 */

export interface MilestoneReward {
  /** Absolute months of subscription credit at this milestone. */
  months: number;
  /** Absolute count (0 or 1) of annual diagnoses earned. */
  annualDiagnosis: number;
  /** Absolute count (0 or 1) of biannual diagnoses earned (program cap). */
  biannualDiagnosis: number;
}

/** Public-facing description of each milestone (rendered in the UI). */
export const MILESTONES: readonly { target: number; reward: string }[] = [
  { target: 1, reward: '1 mes extra de suscripción' },
  { target: 2, reward: '2 meses extra de suscripción' },
  { target: 3, reward: '3 meses extra + re-diagnóstico anual' },
  { target: 5, reward: '6 meses extra + re-diagnóstico anual' },
  { target: 10, reward: '1 año entero + re-diagnóstico bianual (máximo)' },
];

/**
 * Computes the absolute reward snapshot for a given convertedCount.
 *
 * | convertedCount | months | annual | biannual |
 * | -------------- | ------ | ------ | -------- |
 * | 0              | 0      | 0      | 0        |
 * | 1              | 1      | 0      | 0        |
 * | 2              | 2      | 0      | 0        |
 * | 3 or 4         | 3      | 1      | 0        |
 * | 5 through 9    | 6      | 1      | 0        |
 * | 10 or more     | 12     | 0      | 1        |
 *
 * Note: biannual REPLACES annual at milestone 10 — a single re-diagnosis
 * every two years is the top-tier benefit, not additive.
 */
export function computeReward(convertedCount: number): MilestoneReward {
  if (convertedCount <= 0) return { months: 0, annualDiagnosis: 0, biannualDiagnosis: 0 };
  if (convertedCount === 1) return { months: 1, annualDiagnosis: 0, biannualDiagnosis: 0 };
  if (convertedCount === 2) return { months: 2, annualDiagnosis: 0, biannualDiagnosis: 0 };
  if (convertedCount < 5) return { months: 3, annualDiagnosis: 1, biannualDiagnosis: 0 };
  if (convertedCount < 10) return { months: 6, annualDiagnosis: 1, biannualDiagnosis: 0 };
  return { months: 12, annualDiagnosis: 0, biannualDiagnosis: 1 };
}

/**
 * Returns the current milestone (0, 1, 2, 3, 5 or 10) and the next one
 * the user is working toward. `null` for nextMilestone once past 10.
 */
export function getMilestoneProgress(convertedCount: number): {
  currentMilestone: number;
  nextMilestone: number | null;
} {
  const targets = MILESTONES.map((m) => m.target);
  let currentMilestone = 0;
  for (const t of targets) {
    if (convertedCount >= t) currentMilestone = t;
  }
  const nextMilestone = targets.find((t) => t > currentMilestone) ?? null;
  return { currentMilestone, nextMilestone };
}

/**
 * Computes the positive delta between a previous reward snapshot and a new
 * one. Used to decide (a) whether to fire a "milestone reached" email and
 * (b) how many *new* months to add to the referrer's subscription.
 */
export function computeRewardDelta(
  previous: MilestoneReward,
  next: MilestoneReward,
): MilestoneReward {
  return {
    months: Math.max(0, next.months - previous.months),
    annualDiagnosis: Math.max(0, next.annualDiagnosis - previous.annualDiagnosis),
    biannualDiagnosis: Math.max(0, next.biannualDiagnosis - previous.biannualDiagnosis),
  };
}

export function hasReward(delta: MilestoneReward): boolean {
  return delta.months > 0 || delta.annualDiagnosis > 0 || delta.biannualDiagnosis > 0;
}
