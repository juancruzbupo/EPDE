import { Injectable } from '@nestjs/common';
import type { Prisma, Referral } from '@prisma/client';

import { BaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Referral records are NOT soft-deletable — history is audit-relevant
 * forever. `hasSoftDelete: false` so BaseRepository uses the raw prisma
 * delegate for reads/writes. `softDelete()` on this repo is intentionally
 * unreachable (would throw per BaseRepository).
 */
@Injectable()
export class ReferralsRepository extends BaseRepository<
  Referral,
  'referral',
  Prisma.ReferralCreateInput,
  Prisma.ReferralUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'referral', false);
  }

  /**
   * Finds the pending referral for a given referred user, or null.
   * Returns only PENDING — a user that already converted once cannot
   * re-trigger counter increments.
   */
  async findPendingByReferredUser(referredUserId: string): Promise<Referral | null> {
    return this.prisma.referral.findFirst({
      where: { referredUserId, status: 'PENDING' },
    });
  }

  /**
   * Counts actually-converted referrals for a referrer — used by the drift
   * recovery endpoint to reconstruct `User.convertedCount` in case the
   * denormalized counter ever desyncs.
   */
  async countConvertedForReferrer(referrerId: string): Promise<number> {
    return this.prisma.referral.count({
      where: { referrerId, status: 'CONVERTED' },
    });
  }

  /**
   * History rendered in the user's profile. Most recent first. Caps at 50
   * to keep the response bounded even for power referrers.
   */
  async findHistoryForReferrer(referrerId: string) {
    return this.prisma.referral.findMany({
      where: { referrerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        // Reading referredUser's soft-delete state explicitly — we still
        // want to show their name in the referrer's history even if they
        // later delete their account (the referral itself is audit-log).
        referredUser: { select: { name: true } },
      },
    });
  }
}
