import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

import { DashboardStatsRepository } from '../dashboard/dashboard-stats.repository';
import { MetricsService } from '../metrics/metrics.service';
import { PushService } from '../notifications/push.service';
import { PrismaService } from '../prisma/prisma.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { UsersRepository } from '../users/users.repository';

/**
 * Weekly challenge generator — creates a personalized micro-goal for each active
 * client every Monday at 08:00 Argentina (11:00 UTC).
 *
 * Challenge types:
 * - COMPLETE_N: "Completá N tareas esta semana" (when pending/overdue tasks exist)
 * - CATCH_UP: "Ponete al día con 1 tarea vencida" (when overdue tasks exist)
 * - REVIEW: "Revisá las tareas de la próxima semana" (when everything is up to date)
 *
 * Progress is updated via `incrementProgress()` called from TaskLifecycleService
 * after each task completion.
 */
@Injectable()
export class WeeklyChallengeService {
  private readonly logger = new Logger(WeeklyChallengeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersRepository: UsersRepository,
    private readonly statsRepository: DashboardStatsRepository,
    private readonly pushService: PushService,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
  ) {}

  /** Monday of the current week at 00:00 UTC */
  private getWeekStart(): Date {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0
    const monday = new Date(now);
    monday.setUTCDate(monday.getUTCDate() - diff);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
  }

  @Cron('0 11 * * 1', { name: 'weekly-challenge-generate' })
  async generateChallenges(): Promise<void> {
    const start = Date.now();
    try {
      await Sentry.withMonitor(
        'weekly-challenge-generate',
        () =>
          this.lockService.withLock('cron:weekly-challenge', 300, async (signal) => {
            this.logger.log('Generating weekly challenges...');

            const weekStart = this.getWeekStart();
            const clients = await this.usersRepository.findActiveClients();
            if (clients.length === 0) return;

            const clientIds = clients.map((c) => c.id);
            const clientPlanMap = await this.statsRepository.getAllClientPlanIds(clientIds);
            const allPlanIds = [...clientPlanMap.values()].flat();
            const taskStatsMap = await this.statsRepository.getBatchTaskStats(allPlanIds);

            let created = 0;

            for (const client of clients) {
              if (signal.lockLost) return;

              const planIds = clientPlanMap.get(client.id) ?? [];
              if (planIds.length === 0) continue;

              // Aggregate stats
              let overdue = 0;
              let pending = 0;
              for (const planId of planIds) {
                const stats = taskStatsMap.get(planId);
                if (stats) {
                  overdue += stats.overdueTasks;
                  pending += stats.pendingTasks + stats.upcomingThisWeek;
                }
              }

              // Choose challenge type
              let type: string;
              let target: number;
              if (overdue >= 2) {
                type = 'CATCH_UP';
                target = Math.min(overdue, 2);
              } else if (pending + overdue >= 3) {
                type = 'COMPLETE_N';
                target = Math.min(pending + overdue, 3);
              } else if (pending + overdue >= 1) {
                type = 'COMPLETE_N';
                target = 1;
              } else {
                type = 'REVIEW';
                target = 1;
              }

              try {
                await this.prisma.weeklyChallenge.upsert({
                  where: { userId_weekStart: { userId: client.id, weekStart } },
                  update: {},
                  create: { userId: client.id, weekStart, type, target },
                });
                created++;

                // Push notification
                const challengeText =
                  type === 'CATCH_UP'
                    ? `Ponete al día con ${target} tarea${target > 1 ? 's' : ''} vencida${target > 1 ? 's' : ''}`
                    : type === 'COMPLETE_N'
                      ? `Completá ${target} tarea${target > 1 ? 's' : ''} esta semana`
                      : 'Revisá las tareas de la próxima semana';

                void this.pushService
                  .sendToUsers([client.id], {
                    title: '🎯 Desafío semanal',
                    body: `${challengeText}. ¿Aceptás?`,
                  })
                  .catch(() => {});
              } catch {
                // Skip duplicates silently (upsert handles this)
              }
            }

            this.logger.log(`Generated ${created} weekly challenges`);
          }),
        { schedule: { type: 'crontab', value: '0 11 * * 1' } },
      );
    } catch (error) {
      this.logger.error(`Cron failed: ${(error as Error).message}`, (error as Error).stack);
      Sentry.captureException(error);
    }
    this.metricsService.recordCronExecution('weekly-challenge-generate', Date.now() - start);
  }

  /** Called from TaskLifecycleService after each task completion */
  async incrementProgress(userId: string): Promise<{ completed: boolean } | null> {
    const weekStart = this.getWeekStart();

    const challenge = await this.prisma.weeklyChallenge.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
    });

    if (!challenge || challenge.completed) return null;

    const newProgress = challenge.progress + 1;
    const isCompleted = newProgress >= challenge.target;

    await this.prisma.weeklyChallenge.update({
      where: { id: challenge.id },
      data: {
        progress: newProgress,
        completed: isCompleted,
        ...(isCompleted && { completedAt: new Date() }),
      },
    });

    return { completed: isCompleted };
  }

  /** Get the active challenge for a user (current week) */
  async getActiveChallenge(userId: string) {
    const weekStart = this.getWeekStart();
    return this.prisma.weeklyChallenge.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
    });
  }
}
