import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

import { MilestoneService } from '../auth/milestone.service';
import { DashboardStatsRepository } from '../dashboard/dashboard-stats.repository';
import { EmailQueueService } from '../email/email-queue.service';
import { MetricsService } from '../metrics/metrics.service';
import { PushService } from '../notifications/push.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { UsersRepository } from '../users/users.repository';

/**
 * Anniversary cron — runs daily at 10:00 Argentina (13:00 UTC).
 * Finds users whose activatedAt was exactly 1 year ago (±1 day) and sends
 * a celebratory email + push + ANNIVERSARY_1 milestone.
 *
 * User lookup delegated to UsersRepository; task-log counts delegated to
 * DashboardStatsRepository.
 */
@Injectable()
export class AnniversaryService {
  private readonly logger = new Logger(AnniversaryService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailQueueService: EmailQueueService,
    private readonly pushService: PushService,
    private readonly milestoneService: MilestoneService,
    private readonly statsRepository: DashboardStatsRepository,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
  ) {}

  @Cron('0 13 * * *', { name: 'anniversary-check' })
  async checkAnniversaries(): Promise<void> {
    const start = Date.now();
    try {
      await Sentry.withMonitor(
        'anniversary-check',
        () =>
          this.lockService.withLock('cron:anniversary', 300, async (signal) => {
            this.logger.log('Checking user anniversaries...');

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const dayBefore = new Date(oneYearAgo);
            dayBefore.setDate(dayBefore.getDate() - 1);
            const dayAfter = new Date(oneYearAgo);
            dayAfter.setDate(dayAfter.getDate() + 1);

            const users = await this.usersRepository.findAnniversaryUsers(dayBefore, dayAfter);

            if (users.length === 0) {
              this.logger.log('No anniversaries today');
              return;
            }

            this.logger.log(`Found ${users.length} anniversary user(s)`);

            for (const user of users) {
              if (signal.lockLost) return;

              try {
                // Award milestone
                await this.milestoneService.checkAndAward(user.id);

                // Gather stats for the recap
                const clientPlanIds = await this.statsRepository.getAllClientPlanIds([user.id]);
                const planIds = clientPlanIds.get(user.id) ?? [];
                const taskCount = await this.statsRepository.countTaskLogsByPlanIds(planIds);

                // Push notification
                void this.pushService
                  .sendToUsers([user.id], {
                    title: '🎂 ¡1 año cuidando tu casa!',
                    body: `Completaste ${taskCount} inspecciones en un año. ¡Gracias por confiar en EPDE!`,
                  })
                  .catch((err) =>
                    this.logger.error(`Anniversary push failed for ${user.id}: ${err}`),
                  );

                // Email
                void this.emailQueueService
                  .enqueueAnniversary({
                    to: user.email,
                    name: user.name,
                    taskCount,
                  })
                  .catch((err) =>
                    this.logger.error(`Anniversary email failed for ${user.id}: ${err}`),
                  );

                this.logger.log(`Anniversary processed for user ${user.id}`);
              } catch (err) {
                this.logger.error(
                  `Error processing anniversary for ${user.id}: ${(err as Error).message}`,
                );
              }
            }
          }),
        { schedule: { type: 'crontab', value: '0 13 * * *' } },
      );
    } catch (error) {
      this.logger.error(`Cron failed: ${(error as Error).message}`, (error as Error).stack);
      Sentry.captureException(error);
    }
    this.metricsService.recordCronExecution('anniversary-check', Date.now() - start);
  }
}
