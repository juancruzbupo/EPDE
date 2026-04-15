import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { BaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository extends BaseRepository<User, 'user'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user', true);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findFirst({ where: { email } });
  }

  /** Find active clients whose subscription expires within the given time window. */
  async findExpiringSubscriptions(
    windowStart: Date,
    windowEnd: Date,
    take = 500,
  ): Promise<Pick<User, 'id' | 'name' | 'email' | 'subscriptionExpiresAt'>[]> {
    return this.model.findMany({
      where: {
        role: 'CLIENT',
        status: 'ACTIVE',
        subscriptionExpiresAt: { gte: windowStart, lte: windowEnd },
        deletedAt: null,
      },
      select: { id: true, name: true, email: true, subscriptionExpiresAt: true },
      take,
    });
  }

  /** Active clients whose activatedAt falls within the given date range. */
  async findAnniversaryUsers(
    from: Date,
    to: Date,
  ): Promise<Pick<User, 'id' | 'email' | 'name' | 'activatedAt'>[]> {
    return this.prisma.softDelete.user.findMany({
      where: {
        activatedAt: { gte: from, lte: to },
        role: 'CLIENT',
        status: 'ACTIVE',
      },
      select: { id: true, email: true, name: true, activatedAt: true },
    });
  }

  /** All active clients with non-expired subscriptions (for weekly push summaries). Cap at 10K. */
  async findActiveClients() {
    return this.prisma.softDelete.user.findMany({
      where: {
        role: 'CLIENT',
        status: 'ACTIVE',
        OR: [{ subscriptionExpiresAt: { gte: new Date() } }, { subscriptionExpiresAt: null }],
      },
      select: { id: true, name: true, email: true },
      take: 10_000,
    });
  }

  // ─── Referral program helpers ─────────────────────────────────────────────
  // Narrow reads/writes used by ReferralsService. Living here (and not in
  // ReferralsRepository) because the underlying entity is User — keeping
  // the data-access colocated with its model.

  /** Assigns or replaces a user's referral code. Throws on unique collision. */
  async setReferralCode(userId: string, code: string): Promise<void> {
    await this.writeModel.update({ where: { id: userId }, data: { referralCode: code } });
  }

  /**
   * Looks up the referrer that owns a given code. Returns id + deletedAt
   * so the caller can skip soft-deleted referrers silently (registration
   * must never fail on a bad code).
   */
  async findByReferralCode(code: string): Promise<{ id: string; deletedAt: Date | null } | null> {
    return this.writeModel.findUnique({
      where: { referralCode: code },
      select: { id: true, deletedAt: true },
    });
  }

  /**
   * Minimal projection used post-conversion to enqueue the milestone
   * email + in-app notification. Filters soft-deleted — a client who
   * disabled their account after a pending referral shouldn't receive
   * a "¡felicitaciones!" email.
   */
  async findForReferralNotification(userId: string): Promise<Pick<User, 'email' | 'name'> | null> {
    return this.model.findUnique({
      where: { id: userId, deletedAt: null },
      select: { email: true, name: true },
    });
  }

  /** Read-only projection used by drift recovery to compare truth vs counter. */
  async findReferralCounter(userId: string): Promise<Pick<User, 'convertedCount'> | null> {
    return this.model.findUnique({
      where: { id: userId, deletedAt: null },
      select: { convertedCount: true },
    });
  }

  /**
   * Writes the absolute reward snapshot back to the user. Used by drift
   * recovery (no subscription extension). Conversion-flow writes happen
   * inside the `withTransaction` callback in ReferralsService because
   * they need to coexist with the subscription extension.
   */
  async applyReferralCounters(
    userId: string,
    data: {
      convertedCount: number;
      referralCreditMonths: number;
      referralCreditAnnualDiagnosis: number;
      referralCreditBiannualDiagnosis: number;
    },
  ): Promise<void> {
    await this.writeModel.update({ where: { id: userId }, data });
  }

  /**
   * Full state projection used by the public referral read endpoint
   * (GET /users/me/referrals and admin GET /admin/referrals/users/:id).
   * Keep the select list narrow to avoid leaking unrelated User fields
   * through the public contract.
   */
  async findReferralState(
    userId: string,
  ): Promise<Pick<
    User,
    | 'referralCode'
    | 'referralCount'
    | 'convertedCount'
    | 'referralCreditMonths'
    | 'referralCreditAnnualDiagnosis'
    | 'referralCreditBiannualDiagnosis'
  > | null> {
    return this.model.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        referralCode: true,
        referralCount: true,
        convertedCount: true,
        referralCreditMonths: true,
        referralCreditAnnualDiagnosis: true,
        referralCreditBiannualDiagnosis: true,
      },
    });
  }
}
