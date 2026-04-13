import { Injectable } from '@nestjs/common';
import { UserMilestone } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * MilestoneRepository
 *
 * Intentionally bypasses BaseRepository because:
 * 1. No pagination — milestone queries are always full-set per user (findMany without cursor).
 * 2. No soft-delete — UserMilestone has no deletedAt; milestones are permanent once earned.
 * 3. No complex transactions — operations are simple createMany (skipDuplicates) + findMany.
 * BaseRepository's generic interface adds no value here; direct PrismaService access is cleaner.
 */
@Injectable()
export class MilestoneRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** All milestone types already earned by a user. */
  async findEarnedTypes(userId: string): Promise<{ type: string }[]> {
    return this.prisma.userMilestone.findMany({
      where: { userId },
      select: { type: true },
    });
  }

  /** Count task-log entries across all plans owned by a user. */
  async countTaskLogsByUser(userId: string): Promise<number> {
    return this.prisma.taskLog.count({
      where: { task: { maintenancePlan: { property: { userId } } } },
    });
  }

  /** Get a user's activation date (soft-delete aware). */
  async findUserActivationDate(userId: string): Promise<Date | null> {
    const user = await this.prisma.softDelete.user.findUnique({
      where: { id: userId },
      select: { activatedAt: true },
    });
    return user?.activatedAt ?? null;
  }

  /** Bulk-create milestones, skipping duplicates. */
  async createMany(userId: string, types: string[]): Promise<void> {
    await this.prisma.userMilestone.createMany({
      data: types.map((type) => ({ userId, type })),
      skipDuplicates: true,
    });
  }

  /** All milestones for a user, ordered by unlock date. */
  async findAllByUser(userId: string): Promise<UserMilestone[]> {
    return this.prisma.userMilestone.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'asc' },
    });
  }
}
