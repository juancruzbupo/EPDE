import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

import { DashboardStatsRepository } from '../dashboard/dashboard-stats.repository';
import { HealthIndexRepository } from '../dashboard/health-index.repository';
import { EmailQueueService } from '../email/email-queue.service';
import { MetricsService } from '../metrics/metrics.service';
import { PushService } from '../notifications/push.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { UsersRepository } from '../users/users.repository';

/**
 * Weekly summary push notification — sent every Monday at 09:00 Argentina (12:00 UTC).
 * "Tu casa esta semana: X tareas pendientes. ISV: Y. Racha: Z meses"
 *
 * Optimized: uses batch queries to reduce from ~13 queries/client to ~5 queries total
 * (plus 1 sequential streak query per client with plans).
 */
@Injectable()
export class WeeklySummaryService {
  private readonly logger = new Logger(WeeklySummaryService.name);

  constructor(
    private readonly statsRepository: DashboardStatsRepository,
    private readonly healthIndexRepository: HealthIndexRepository,
    private readonly usersRepository: UsersRepository,
    private readonly pushService: PushService,
    private readonly emailQueueService: EmailQueueService,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
  ) {}

  @Cron('0 12 * * 1', { name: 'weekly-summary' })
  async sendWeeklySummaries(): Promise<void> {
    const start = Date.now();
    try {
      await this.lockService.withLock('cron:weekly-summary', 600, async (signal) => {
        this.logger.log('Starting weekly summaries...');

        const clients = await this.usersRepository.findActiveClients();
        if (clients.length === 0) return;

        const clientIds = clients.map((c) => c.id);

        // 1. Batch: all client → planIds (1 query)
        const clientPlanMap = await this.statsRepository.getAllClientPlanIds(clientIds);

        // Collect all planIds for batch queries
        const allPlanIds = [...clientPlanMap.values()].flat();

        if (signal.lockLost) return;

        // 2. Batch: task stats + health index + upcoming tasks (3 queries total)
        const [taskStatsMap, healthBatch, upcomingMap] = await Promise.all([
          this.statsRepository.getBatchTaskStats(allPlanIds),
          this.healthIndexRepository.getPropertyHealthIndexBatch(allPlanIds),
          this.statsRepository.getBatchUpcomingTasks(clientIds),
        ]);

        if (signal.lockLost) return;

        let sent = 0;

        for (const client of clients) {
          if (signal.lockLost) return;

          const planIds = clientPlanMap.get(client.id);
          if (!planIds || planIds.length === 0) continue;

          // Aggregate task stats across all plans for this client
          let pendingTasks = 0;
          let overdueTasks = 0;
          let upcomingThisWeek = 0;
          for (const planId of planIds) {
            const stats = taskStatsMap.get(planId);
            if (stats) {
              pendingTasks += stats.pendingTasks;
              overdueTasks += stats.overdueTasks;
              upcomingThisWeek += stats.upcomingThisWeek;
            }
          }

          // Average health score across plans
          let totalScore = 0;
          let scoreCount = 0;
          for (const planId of planIds) {
            const health = healthBatch.get(planId);
            if (health) {
              totalScore += health.score;
              scoreCount++;
            }
          }
          const score = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

          // Streak still requires sequential month checks — kept per-client
          const streak = await this.healthIndexRepository.getMaintenanceStreak(planIds);

          const total = upcomingThisWeek + overdueTasks;

          let body: string;
          if (total === 0) {
            body = `Tu casa está al día. ISV: ${score}/100.`;
          } else if (overdueTasks > 0) {
            body = `Tenés ${overdueTasks} tarea${overdueTasks > 1 ? 's' : ''} vencida${overdueTasks > 1 ? 's' : ''} y ${upcomingThisWeek} esta semana. ISV: ${score}/100.`;
          } else {
            body = `${upcomingThisWeek} tarea${upcomingThisWeek > 1 ? 's' : ''} programada${upcomingThisWeek > 1 ? 's' : ''} esta semana. ISV: ${score}/100.`;
          }

          if (streak > 0) {
            body += ` 🔥 ${streak} ${streak === 1 ? 'mes' : 'meses'} al día.`;
          }

          const nextTask = upcomingMap.get(client.id) ?? null;

          void this.pushService
            .sendToUsers([client.id], { title: 'Tu casa esta semana', body })
            .catch((err) => this.logger.error(`Weekly push failed for ${client.id}: ${err}`));

          void this.emailQueueService
            .enqueueWeeklySummary({
              to: client.email,
              name: client.name,
              score,
              pendingTasks,
              overdueTasks,
              upcomingThisWeek,
              streak,
              nextTaskName: nextTask?.name ?? null,
              nextTaskDate: nextTask?.nextDueDate?.toISOString() ?? null,
            })
            .catch((err) => this.logger.error(`Weekly email failed for ${client.id}: ${err}`));

          sent++;
        }

        this.logger.log(`Weekly summaries complete: ${sent}/${clients.length} sent`);
      });
    } catch (error) {
      this.logger.error(`Cron failed: ${(error as Error).message}`, (error as Error).stack);
      Sentry.captureException(error);
    }
    this.metricsService.recordCronExecution('weekly-summary', Date.now() - start);
  }
}
