import { generateReferralCode, type ReferralStatePublic } from '@epde/shared';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { UsersRepository } from '../users/users.repository';
import {
  computeReward,
  computeRewardDelta,
  getMilestoneProgress,
  type MilestoneReward,
  MILESTONES,
} from './milestones';
import { ReferralsRepository } from './referrals.repository';

const GENERATE_CODE_MAX_ATTEMPTS = 5;

/**
 * Public URL base the frontend uses to render the shareable referral link.
 * Read from env at runtime so staging / prod each render their own host.
 */
function getWebBaseUrl(): string {
  return process.env.WEB_BASE_URL ?? 'https://epde-web.vercel.app';
}

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly repo: ReferralsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly notificationsHandler: NotificationsHandlerService,
  ) {}

  // ─── Code generation ─────────────────────────────────────────────────────

  /**
   * Assigns a unique `referralCode` to a user. Retries on collision up to
   * GENERATE_CODE_MAX_ATTEMPTS times. Collision rate is ~1/30^3 ≈ 0.0037%
   * per call; reaching the cap means the user's name prefix is saturated
   * — extremely unlikely in practice.
   *
   * Throws if all attempts fail (should be operationally impossible).
   */
  async assignReferralCodeTo(userId: string, name: string): Promise<string> {
    for (let attempt = 0; attempt < GENERATE_CODE_MAX_ATTEMPTS; attempt++) {
      const code = generateReferralCode(name);
      try {
        await this.usersRepo.setReferralCode(userId, code);
        return code;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('Unique constraint')) continue;
        throw err;
      }
    }
    throw new Error(
      `Failed to generate a unique referralCode for user ${userId} after ${GENERATE_CODE_MAX_ATTEMPTS} attempts`,
    );
  }

  // ─── Registration (called from UserService.create) ───────────────────────

  /**
   * Records a referral when a new user registers with a code. Idempotent
   * at the caller level (UserService will only call this once per signup).
   *
   * If the code doesn't exist or points to the user themselves, logs a
   * warning and returns — we never fail the signup for a bad code.
   */
  async registerReferral(newUserId: string, newUserEmail: string, rawCode: string): Promise<void> {
    const code = rawCode.trim().toUpperCase();
    const referrer = await this.usersRepo.findByReferralCode(code);
    if (!referrer || referrer.deletedAt) {
      this.logger.warn(
        `Referral code "${code}" used by user ${newUserId} is unknown or deleted — ignoring.`,
      );
      return;
    }
    if (referrer.id === newUserId) {
      this.logger.warn(`User ${newUserId} tried to use their own referral code — ignoring.`);
      return;
    }

    await this.repo.withTransaction(async (tx) => {
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId: newUserId,
          referredEmail: newUserEmail,
          status: 'PENDING',
        },
      });

      // eslint-disable-next-line local/no-tx-without-soft-delete-filter -- update-by-id on the new user record, created in the same signup flow.
      await tx.user.update({
        where: { id: newUserId },
        data: { referredByCode: code },
      });

      // eslint-disable-next-line local/no-tx-without-soft-delete-filter -- update-by-id on the referrer record validated above; soft-delete state already confirmed.
      await tx.user.update({
        where: { id: referrer.id },
        data: { referralCount: { increment: 1 } },
      });
    });
  }

  // ─── Admin-facing lookup ─────────────────────────────────────────────────

  /**
   * Convenience wrapper: admin endpoint identifies referrals by their own
   * id (intuitive in the "pending referrals" list view) but the service
   * keys conversion off `referredUserId`. Dereference here so the
   * admin-facing URL stays referral-id-based.
   */
  async markConvertedById(referralId: string) {
    const referral = await this.repo.findById(referralId);
    if (!referral) {
      throw new NotFoundException('Recomendación no encontrada');
    }
    if (!referral.referredUserId) {
      throw new NotFoundException(
        'La recomendación no está vinculada a un usuario registrado todavía',
      );
    }
    return this.convertReferral(referral.referredUserId);
  }

  // ─── Conversion (manual admin trigger for MVP) ───────────────────────────

  /**
   * Marks the PENDING referral for a user as CONVERTED and fires reward
   * recalculation. Idempotent: re-calling with an already-converted user
   * is a no-op.
   *
   * For the MVP this is called from the admin endpoint. When a real
   * payment system ships, the payment confirmation hook will call it
   * automatically — the signature and semantics won't change.
   *
   * Returns an object describing whether a new milestone was reached,
   * which the caller can use to decide about fire-and-forget side effects
   * (notifications, analytics).
   */
  async convertReferral(
    referredUserId: string,
  ): Promise<
    | { converted: false }
    | { converted: true; referrerId: string; milestone: number; delta: MilestoneReward }
  > {
    const pending = await this.repo.findPendingByReferredUser(referredUserId);
    if (!pending) {
      // Idempotency + "not referred at all" collapse to the same no-op —
      // caller doesn't need to know which one was true.
      return { converted: false };
    }

    const result = await this.repo.withTransaction(async (tx) => {
      // Mark the referral CONVERTED first; we use this as the atomic
      // idempotency guard — if two admins click at the same time, the
      // second one's findPending below returns null.

      const alreadyConverted = await tx.referral.findUnique({
        where: { id: pending.id },
        select: { status: true },
      });
      if (alreadyConverted?.status === 'CONVERTED') return null;

      await tx.referral.update({
        where: { id: pending.id },
        data: { status: 'CONVERTED', convertedAt: new Date() },
      });

      // Read current state → compute new reward → write back.
      const referrer = await tx.user.findUnique({
        where: { id: pending.referrerId, deletedAt: null },
        select: {
          convertedCount: true,
          referralCreditMonths: true,
          referralCreditAnnualDiagnosis: true,
          referralCreditBiannualDiagnosis: true,
          subscriptionExpiresAt: true,
        },
      });
      if (!referrer) {
        // Referrer was soft-deleted after the referral was recorded. Leave
        // the Referral CONVERTED (history) but skip reward propagation.
        return null;
      }

      const previousReward: MilestoneReward = {
        months: referrer.referralCreditMonths,
        annualDiagnosis: referrer.referralCreditAnnualDiagnosis,
        biannualDiagnosis: referrer.referralCreditBiannualDiagnosis,
      };
      const newConvertedCount = referrer.convertedCount + 1;
      const newReward = computeReward(newConvertedCount);
      const delta = computeRewardDelta(previousReward, newReward);

      // Extend subscription by only the NEW months (delta), not the total.
      // If the user has no subscriptionExpiresAt (trial-ish state not
      // modeled here), treat "now" as the baseline so the delta still
      // translates into real time added. TODO: revisit if trial tracking
      // lands in User.
      const baseline = referrer.subscriptionExpiresAt ?? new Date();
      const newExpiry =
        delta.months > 0 ? addMonths(baseline, delta.months) : referrer.subscriptionExpiresAt;

      // eslint-disable-next-line local/no-tx-without-soft-delete-filter -- update-by-id on referrer we just validated above with deletedAt: null.
      await tx.user.update({
        where: { id: pending.referrerId },
        data: {
          convertedCount: newConvertedCount,
          referralCreditMonths: newReward.months,
          referralCreditAnnualDiagnosis: newReward.annualDiagnosis,
          referralCreditBiannualDiagnosis: newReward.biannualDiagnosis,
          subscriptionExpiresAt: newExpiry,
        },
      });

      const { currentMilestone } = getMilestoneProgress(newConvertedCount);
      return {
        referrerId: pending.referrerId,
        milestone: currentMilestone,
        delta,
        newReward,
      };
    });

    if (!result) return { converted: false };

    // Post-transaction side effects: fire notification handlers if this
    // conversion actually moved the needle (delta > 0). Fire-and-forget
    // with DLQ inside the handler; never block or fail the mutation on a
    // notification problem.
    const hasDelta =
      result.delta.months > 0 ||
      result.delta.annualDiagnosis > 0 ||
      result.delta.biannualDiagnosis > 0;
    if (hasDelta) {
      const referrer = await this.usersRepo.findForReferralNotification(result.referrerId);
      if (referrer) {
        const { nextMilestone } = getMilestoneProgress(result.milestone);
        void this.notificationsHandler.handleReferralMilestoneReached({
          userId: result.referrerId,
          userEmail: referrer.email,
          userName: referrer.name,
          milestone: result.milestone,
          creditMonths: result.newReward.months,
          nextMilestone,
          hasAnnualDiagnosis: result.newReward.annualDiagnosis > 0,
          hasBiannualDiagnosis: result.newReward.biannualDiagnosis > 0,
        });

        // Admin alert — only when this conversion crosses INTO milestone 10
        // (previous was < 10, now === 10). biannualDiagnosis delta is the
        // single-bit marker for that transition.
        if (result.delta.biannualDiagnosis > 0) {
          const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
          if (adminEmail) {
            void this.notificationsHandler.handleReferralMaxReached({
              adminEmail,
              clientId: result.referrerId,
              clientName: referrer.name,
              clientEmail: referrer.email,
            });
          } else {
            this.logger.warn(
              `Client ${result.referrerId} hit 10 conversions but ADMIN_NOTIFICATION_EMAIL is not set — admin alert skipped.`,
            );
          }
        }
      }
    }

    return {
      converted: true,
      referrerId: result.referrerId,
      milestone: result.milestone,
      delta: result.delta,
    };
  }

  // ─── Drift recovery (admin) ──────────────────────────────────────────────

  /**
   * Reconstructs a referrer's `convertedCount` from the Referral table
   * and re-applies the reward snapshot. Idempotent. Use if counters
   * ever drift (e.g. a bug landed, a migration glitched).
   *
   * Does NOT fire notifications — this is a reconciliation op, not a
   * milestone celebration.
   */
  async recomputeReferrerState(
    referrerId: string,
  ): Promise<{ previousConvertedCount: number; newConvertedCount: number }> {
    const user = await this.usersRepo.findReferralCounter(referrerId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const trueCount = await this.repo.countConvertedForReferrer(referrerId);
    if (trueCount === user.convertedCount) {
      return { previousConvertedCount: user.convertedCount, newConvertedCount: trueCount };
    }

    const reward = computeReward(trueCount);

    await this.usersRepo.applyReferralCounters(referrerId, {
      convertedCount: trueCount,
      referralCreditMonths: reward.months,
      referralCreditAnnualDiagnosis: reward.annualDiagnosis,
      referralCreditBiannualDiagnosis: reward.biannualDiagnosis,
    });

    return { previousConvertedCount: user.convertedCount, newConvertedCount: trueCount };
  }

  // ─── Read API (GET /users/me/referrals) ──────────────────────────────────

  async getReferralStateForUser(userId: string): Promise<ReferralStatePublic> {
    const user = await this.usersRepo.findReferralState(userId);
    if (!user || !user.referralCode) {
      throw new NotFoundException('Código de recomendación no disponible');
    }

    const history = await this.repo.findHistoryForReferrer(userId);
    const convertedTimes = new Map<string, Date>();
    for (const r of history) {
      if (r.status === 'CONVERTED' && r.convertedAt) convertedTimes.set(r.id, r.convertedAt);
    }

    const { currentMilestone, nextMilestone } = getMilestoneProgress(user.convertedCount);
    const webBase = getWebBaseUrl();

    return {
      referralCode: user.referralCode,
      // Public landing page with a `ref` query param. There is no public
      // self-signup today — referred users arrive at the landing, contact
      // via WhatsApp citing the code, and the admin enters the code when
      // inviting them. The query param is there for future analytics /
      // autofill once self-signup exists.
      referralUrl: `${webBase}/?ref=${encodeURIComponent(user.referralCode)}`,
      stats: {
        totalReferrals: user.referralCount,
        convertedCount: user.convertedCount,
        currentMilestone,
        nextMilestone,
        creditsEarned: {
          months: user.referralCreditMonths,
          annualDiagnosis: user.referralCreditAnnualDiagnosis,
          biannualDiagnosis: user.referralCreditBiannualDiagnosis,
        },
      },
      milestones: MILESTONES.map((m) => ({
        target: m.target,
        reward: m.reward,
        reached: user.convertedCount >= m.target,
        reachedAt: null, // Per-milestone timestamps aren't tracked yet; future PR if product asks.
      })),
      referralHistory: history.map((r) => ({
        id: r.id,
        referredName: r.status === 'CONVERTED' ? (r.referredUser?.name ?? null) : null,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        convertedAt: r.convertedAt?.toISOString() ?? null,
      })),
    };
  }
}

/**
 * Calendar-month addition that preserves the day-of-month where possible.
 * JavaScript's Date handles overflow automatically — adding 1 month to
 * Jan 31 lands on Feb 28/29 via rollover.
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
