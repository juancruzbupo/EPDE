import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { DashboardRepository } from '../dashboard/dashboard.repository';
import { MetricsService } from '../metrics/metrics.service';
import { PushService } from '../notifications/push.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { UsersRepository } from '../users/users.repository';

/**
 * Weekly summary push notification — sent every Monday at 09:00 Argentina (12:00 UTC).
 * "Tu casa esta semana: X tareas pendientes. ISV: Y. Racha: Z meses 🔥"
 */
@Injectable()
export class WeeklySummaryService {
  private readonly logger = new Logger(WeeklySummaryService.name);

  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly usersRepository: UsersRepository,
    private readonly pushService: PushService,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
  ) {}

  @Cron('0 12 * * 1', { name: 'weekly-summary' })
  async sendWeeklySummaries(): Promise<void> {
    const start = Date.now();
    await this.lockService.withLock('cron:weekly-summary', 300, async (signal) => {
      this.logger.log('Starting weekly summaries...');

      const clients = await this.usersRepository.findActiveClients();
      let sent = 0;

      for (const client of clients) {
        if (signal.lockLost) return;

        try {
          const { planIds } = await this.dashboardRepository.getClientPropertyAndPlanIds(client.id);

          if (planIds.length === 0) continue;

          const [taskStats, healthIndex, streak] = await Promise.all([
            this.dashboardRepository.getClientTaskStats(planIds, client.id),
            this.dashboardRepository.getPropertyHealthIndex(planIds),
            this.dashboardRepository.getMaintenanceStreak(planIds),
          ]);

          const upcomingThisWeek = taskStats.upcomingThisWeek ?? 0;
          const overdue = taskStats.overdueTasks ?? 0;
          const total = upcomingThisWeek + overdue;

          let body: string;
          if (total === 0) {
            body = `Tu casa está al día. ISV: ${healthIndex.score}/100.`;
          } else if (overdue > 0) {
            body = `Tenés ${overdue} tarea${overdue > 1 ? 's' : ''} vencida${overdue > 1 ? 's' : ''} y ${upcomingThisWeek} esta semana. ISV: ${healthIndex.score}/100.`;
          } else {
            body = `${upcomingThisWeek} tarea${upcomingThisWeek > 1 ? 's' : ''} programada${upcomingThisWeek > 1 ? 's' : ''} esta semana. ISV: ${healthIndex.score}/100.`;
          }

          if (streak > 0) {
            body += ` 🔥 ${streak} ${streak === 1 ? 'mes' : 'meses'} al día.`;
          }

          void this.pushService
            .sendToUsers([client.id], {
              title: 'Tu casa esta semana',
              body,
            })
            .catch((err) => {
              this.logger.error(`Weekly push failed for ${client.id}: ${err}`);
            });

          sent++;
        } catch (err) {
          this.logger.error(`Weekly summary failed for ${client.id}: ${err}`);
        }
      }

      this.logger.log(`Weekly summaries complete: ${sent} sent`);
    });
    this.metricsService.recordCronExecution('weekly-summary', Date.now() - start);
  }
}
