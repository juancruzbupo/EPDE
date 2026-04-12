import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

import { MetricsService } from '../metrics/metrics.service';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { DistributedLockService } from '../redis/distributed-lock.service';

/**
 * Weekly cleanup of old read notifications to prevent unbounded table growth.
 * Runs every Sunday at 03:00 UTC.
 */
@Injectable()
export class NotificationCleanupService {
  private readonly logger = new Logger(NotificationCleanupService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly metricsService: MetricsService,
    private readonly lockService: DistributedLockService,
  ) {}

  @Cron('0 3 * * 0') // Every Sunday at 03:00 UTC
  async cleanup() {
    const start = Date.now();
    try {
      await this.lockService.withLock('cron:notification-cleanup', 120, async () => {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const deleted = await this.notificationsRepository.deleteOldRead(ninetyDaysAgo);
        this.logger.log(
          `Notification cleanup: deleted ${deleted} read notifications older than 90 days (${Date.now() - start}ms)`,
        );
      });
    } catch (error) {
      this.logger.error(`Cron failed: ${(error as Error).message}`, (error as Error).stack);
      Sentry.captureException(error);
    }
    this.metricsService.recordCronExecution('notification-cleanup', Date.now() - start);
  }
}
