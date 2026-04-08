import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { DashboardRepository } from '../dashboard/dashboard.repository';
import { EmailQueueService } from '../email/email-queue.service';
import { MetricsService } from '../metrics/metrics.service';
import { PushService } from '../notifications/push.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { UsersRepository } from '../users/users.repository';

const BATCH_SIZE = 10;

/**
 * Weekly summary push notification — sent every Monday at 09:00 Argentina (12:00 UTC).
 * "Tu casa esta semana: X tareas pendientes. ISV: Y. Racha: Z meses 🔥"
 *
 * Processes clients in parallel batches of ${BATCH_SIZE} to avoid N+1 timeout
 * (each client requires ~12 DB queries for stats + health + streak).
 */
@Injectable()
export class WeeklySummaryService {
  private readonly logger = new Logger(WeeklySummaryService.name);

  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly usersRepository: UsersRepository,
    private readonly pushService: PushService,
    private readonly emailQueueService: EmailQueueService,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
  ) {}

  @Cron('0 12 * * 1', { name: 'weekly-summary' })
  async sendWeeklySummaries(): Promise<void> {
    const start = Date.now();
    await this.lockService.withLock('cron:weekly-summary', 600, async (signal) => {
      this.logger.log('Starting weekly summaries...');

      const clients = await this.usersRepository.findActiveClients();
      let sent = 0;

      for (let i = 0; i < clients.length; i += BATCH_SIZE) {
        if (signal.lockLost) return;
        const batch = clients.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map(async (client) => {
            const { planIds } = await this.dashboardRepository.getClientPropertyAndPlanIds(
              client.id,
            );
            if (planIds.length === 0) return;

            const [taskStats, healthIndex, streak] = await Promise.all([
              this.dashboardRepository.getClientTaskStats(planIds, client.id),
              this.dashboardRepository.getPropertyHealthIndex(planIds),
              this.dashboardRepository.getMaintenanceStreak(planIds),
            ]);

            const upcomingThisWeek = taskStats.upcomingThisWeek ?? 0;
            const overdue = taskStats.overdueTasks ?? 0;
            const pending = taskStats.pendingTasks ?? 0;
            const total = upcomingThisWeek + overdue;
            const score = healthIndex.score;

            let body: string;
            if (total === 0) {
              body = `Tu casa está al día. ISV: ${score}/100.`;
            } else if (overdue > 0) {
              body = `Tenés ${overdue} tarea${overdue > 1 ? 's' : ''} vencida${overdue > 1 ? 's' : ''} y ${upcomingThisWeek} esta semana. ISV: ${score}/100.`;
            } else {
              body = `${upcomingThisWeek} tarea${upcomingThisWeek > 1 ? 's' : ''} programada${upcomingThisWeek > 1 ? 's' : ''} esta semana. ISV: ${score}/100.`;
            }

            if (streak > 0) {
              body += ` 🔥 ${streak} ${streak === 1 ? 'mes' : 'meses'} al día.`;
            }

            // Upcoming tasks for email — find next non-overdue task
            const upcomingTasks = await this.dashboardRepository.getClientUpcomingTasks(client.id);
            const now = Date.now();
            const nextTask =
              upcomingTasks.find((t) => t.nextDueDate && t.nextDueDate.getTime() >= now) ?? null;

            void this.pushService
              .sendToUsers([client.id], { title: 'Tu casa esta semana', body })
              .catch((err) => this.logger.error(`Weekly push failed for ${client.id}: ${err}`));

            void this.emailQueueService
              .enqueueWeeklySummary({
                to: client.email,
                name: client.name,
                score,
                pendingTasks: pending,
                overdueTasks: overdue,
                upcomingThisWeek,
                streak,
                nextTaskName: nextTask?.name ?? null,
                nextTaskDate: nextTask?.nextDueDate?.toISOString() ?? null,
              })
              .catch((err) => this.logger.error(`Weekly email failed for ${client.id}: ${err}`));

            sent++;
          }),
        );

        for (const r of results) {
          if (r.status === 'rejected') {
            this.logger.error(`Weekly summary batch error: ${r.reason}`);
          }
        }
      }

      this.logger.log(`Weekly summaries complete: ${sent}/${clients.length} sent`);
    });
    this.metricsService.recordCronExecution('weekly-summary', Date.now() - start);
  }
}
