import { SUBSCRIPTION_REMINDER_DAYS } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

import { MetricsService } from '../metrics/metrics.service';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { UsersRepository } from '../users/users.repository';

/**
 * Sends reminder notifications to clients whose subscription is about
 * to expire. Runs daily at 09:00 UTC (06:00 Argentina).
 *
 * Reminder schedule: 7, 3, and 1 day(s) before expiration.
 * Uses distributed lock to prevent duplicate runs in multi-instance deploy.
 */
@Injectable()
export class SubscriptionReminderService {
  private readonly logger = new Logger(SubscriptionReminderService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
    private readonly notificationsHandler: NotificationsHandlerService,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  @Cron('0 9 * * *', { name: 'subscription-reminder' })
  async checkExpiringSubscriptions(): Promise<void> {
    const start = Date.now();
    try {
      await this.lockService.withLock('cron:subscription-reminder', 120, async (signal) => {
        const now = new Date();
        let totalReminders = 0;

        // Deduplication: skip users who already received a subscription reminder today
        // (prevents duplicates on redeploy/restart during the same day).
        const alreadyRemindedUserIds =
          await this.notificationsRepository.findTodaySubscriptionReminderUserIds();

        for (const daysLeft of SUBSCRIPTION_REMINDER_DAYS) {
          if (signal.lockLost) return;

          // Find users whose subscription expires in exactly `daysLeft` days (± 12h window).
          // Window compensates for timezone variance — subscriptionExpiresAt is stored as UTC in DB.
          const targetDate = new Date(now.getTime() + daysLeft * 24 * 60 * 60_000);
          const windowStart = new Date(targetDate.getTime() - 12 * 60 * 60_000);
          const windowEnd = new Date(targetDate.getTime() + 12 * 60 * 60_000);

          const users = await this.usersRepository.findExpiringSubscriptions(
            windowStart,
            windowEnd,
            500,
          );

          for (const user of users) {
            if (alreadyRemindedUserIds.has(user.id)) continue;

            void this.notificationsHandler.handleSubscriptionReminder({
              userId: user.id,
              userName: user.name,
              daysLeft,
              expiresAt: user.subscriptionExpiresAt!,
            });
            alreadyRemindedUserIds.add(user.id);
            totalReminders++;
          }
        }

        if (totalReminders > 0) {
          this.logger.log(`Sent ${totalReminders} subscription reminders`);
        }
      });
    } catch (error) {
      this.logger.error(`Cron failed: ${(error as Error).message}`, (error as Error).stack);
      Sentry.captureException(error);
    }
    this.metricsService.recordCronExecution('subscription-reminder', Date.now() - start);
  }
}
