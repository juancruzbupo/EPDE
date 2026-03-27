import { SUBSCRIPTION_REMINDER_DAYS } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { MetricsService } from '../metrics/metrics.service';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PrismaService } from '../prisma/prisma.service';
import { DistributedLockService } from '../redis/distributed-lock.service';

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
    private readonly prisma: PrismaService,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
    private readonly notificationsHandler: NotificationsHandlerService,
  ) {}

  @Cron('0 9 * * *', { name: 'subscription-reminder' })
  async checkExpiringSubscriptions(): Promise<void> {
    const start = Date.now();
    await this.lockService.withLock('cron:subscription-reminder', 120, async (signal) => {
      const now = new Date();
      let totalReminders = 0;

      for (const daysLeft of SUBSCRIPTION_REMINDER_DAYS) {
        if (signal.lockLost) return;

        // Find users whose subscription expires in exactly `daysLeft` days (± 12h window).
        // Window compensates for timezone variance — subscriptionExpiresAt is stored as UTC in DB.
        const targetDate = new Date(now.getTime() + daysLeft * 24 * 60 * 60_000);
        const windowStart = new Date(targetDate.getTime() - 12 * 60 * 60_000);
        const windowEnd = new Date(targetDate.getTime() + 12 * 60 * 60_000);

        const users = await this.prisma.user.findMany({
          where: {
            role: 'CLIENT',
            status: 'ACTIVE',
            subscriptionExpiresAt: { gte: windowStart, lte: windowEnd },
            deletedAt: null,
          },
          select: { id: true, name: true, email: true, subscriptionExpiresAt: true },
          take: 500,
        });

        for (const user of users) {
          void this.notificationsHandler.handleSubscriptionReminder({
            userId: user.id,
            userName: user.name,
            daysLeft,
            expiresAt: user.subscriptionExpiresAt!,
          });
          totalReminders++;
        }
      }

      if (totalReminders > 0) {
        this.logger.log(`Sent ${totalReminders} subscription reminders`);
      }
    });
    this.metricsService.recordCronExecution('subscription-reminder', Date.now() - start);
  }
}
