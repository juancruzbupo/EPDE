import { MILESTONE_MAP, type MilestoneType } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';

import { MilestoneRepository } from './milestone.repository';

/**
 * Checks and awards milestones after task completion or on-demand.
 *
 * Cross-model aggregations (TaskLog count, user activation date, milestone CRUD)
 * delegated to MilestoneRepository.
 * Fire-and-forget — milestone check failures must never block the main flow.
 */
@Injectable()
export class MilestoneService {
  private readonly logger = new Logger(MilestoneService.name);

  constructor(private readonly milestoneRepository: MilestoneRepository) {}

  /**
   * Check if the user qualifies for new milestones and award them.
   * Returns newly unlocked milestone types (empty array if none).
   * Safe to call repeatedly — existing milestones are skipped via upsert.
   */
  async checkAndAward(
    userId: string,
    context?: { problemDetected?: boolean; streak?: number },
  ): Promise<MilestoneType[]> {
    try {
      const [existing, taskLogCount] = await Promise.all([
        this.milestoneRepository.findEarnedTypes(userId),
        this.milestoneRepository.countTaskLogsByUser(userId),
      ]);

      const earned = new Set(existing.map((m) => m.type));
      const toAward: MilestoneType[] = [];

      // Task count milestones
      if (taskLogCount >= 10 && !earned.has('TASKS_10')) toAward.push('TASKS_10');
      if (taskLogCount >= 50 && !earned.has('TASKS_50')) toAward.push('TASKS_50');
      if (taskLogCount >= 100 && !earned.has('TASKS_100')) toAward.push('TASKS_100');

      // First prevention
      if (context?.problemDetected && !earned.has('FIRST_PREVENTION')) {
        toAward.push('FIRST_PREVENTION');
      }

      // Streak milestones
      if (context?.streak !== undefined) {
        if (context.streak >= 6 && !earned.has('STREAK_6')) toAward.push('STREAK_6');
        if (context.streak >= 12 && !earned.has('STREAK_12')) toAward.push('STREAK_12');
      }

      // Anniversary (1 year since activation)
      if (!earned.has('ANNIVERSARY_1')) {
        const activatedAt = await this.milestoneRepository.findUserActivationDate(userId);
        if (activatedAt) {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          if (activatedAt <= oneYearAgo) toAward.push('ANNIVERSARY_1');
        }
      }

      // Award new milestones
      if (toAward.length > 0) {
        await this.milestoneRepository.createMany(userId, toAward);
        this.logger.log(
          `Awarded ${toAward.length} milestone(s) to user ${userId}: ${toAward.join(', ')}`,
        );
      }

      return toAward;
    } catch (error) {
      this.logger.error(
        `Error checking milestones for user ${userId}: ${(error as Error).message}`,
      );
      return [];
    }
  }

  async getUserMilestones(userId: string) {
    const milestones = await this.milestoneRepository.findAllByUser(userId);
    return milestones.map((m) => ({
      ...m,
      ...(MILESTONE_MAP[m.type as MilestoneType] ?? {
        emoji: '🏅',
        label: m.type,
        description: '',
      }),
    }));
  }
}
