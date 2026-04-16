import { Injectable } from '@nestjs/common';
import { WeeklyChallenge } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Weekly challenge tracker — append-only rows keyed by (userId, weekStart).
 * `WeeklyChallenge` is NOT soft-deletable (no `deletedAt` column); rows are
 * either upserted (progress) or hard-deleted in bulk after retention. Neither
 * the cursor pagination nor the `softDelete()` helpers of `BaseRepository`
 * apply here, so the repo works directly with the prisma client.
 * See ADR-011 (append-only / no-base-model).
 */
@Injectable()
export class WeeklyChallengeRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Upsert a challenge for a user+week (no-op if already exists). */
  async upsertChallenge(
    userId: string,
    weekStart: Date,
    type: string,
    target: number,
  ): Promise<WeeklyChallenge> {
    return this.prisma.weeklyChallenge.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      update: {},
      create: { userId, weekStart, type, target },
    });
  }

  /** Find the challenge for a user in the given week. */
  async findByUserAndWeek(userId: string, weekStart: Date): Promise<WeeklyChallenge | null> {
    return this.prisma.weeklyChallenge.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
    });
  }

  /** Update progress (and optionally mark as completed). */
  async updateProgress(id: string, progress: number, completed: boolean): Promise<WeeklyChallenge> {
    return this.prisma.weeklyChallenge.update({
      where: { id },
      data: {
        progress,
        completed,
        ...(completed && { completedAt: new Date() }),
      },
    });
  }
}
