import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { MetricsService } from '../metrics/metrics.service';
import { NotificationsRepository } from '../notifications/notifications.repository';

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
  ) {}

  @Cron('0 3 * * 0') // Every Sunday at 03:00 UTC
  async cleanup() {
    const start = Date.now();
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const deleted = await this.notificationsRepository.deleteOldRead(ninetyDaysAgo);
      const durationMs = Date.now() - start;
      this.logger.log(
        `Notification cleanup: deleted ${deleted} read notifications older than 90 days (${durationMs}ms)`,
      );
      this.metricsService.recordCronExecution('notification-cleanup', durationMs);
    } catch (error) {
      const durationMs = Date.now() - start;
      this.logger.error('Notification cleanup failed', (error as Error).stack);
      this.metricsService.recordCronExecution('notification-cleanup', durationMs);
    }
  }
}
