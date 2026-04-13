import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

import { MetricsService } from '../metrics/metrics.service';
import { FailedNotificationRepository } from '../notifications/failed-notification.repository';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { DistributedLockService } from '../redis/distributed-lock.service';

/**
 * Hourly cron that retries failed notification side-effects from the dead-letter queue.
 *
 * Uses exponential backoff: 1h → 2h → 4h between retries.
 * Records with retryCount = FAILED_NOTIFICATION_MAX_RETRIES and resolvedAt = null
 * are permanently failed — they remain in the DB for manual inspection.
 *
 * ## How it works
 * 1. Fetch FailedNotification records eligible for retry.
 * 2. Call `NotificationsHandlerService.retryDispatch(handler, payload)` for each.
 *    - retryDispatch runs the handler in retry context (AsyncLocalStorage): on failure
 *      it re-throws instead of writing a new DLQ entry, preventing infinite chains.
 * 3. On success → mark resolved.
 * 4. On failure → increment retryCount and set nextRetryAt with exponential backoff.
 */
@Injectable()
export class NotificationRetryService {
  private readonly logger = new Logger(NotificationRetryService.name);

  constructor(
    private readonly failedNotificationRepository: FailedNotificationRepository,
    private readonly notificationsHandler: NotificationsHandlerService,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
  ) {}

  @Cron('0 * * * *', { name: 'notification-retry' }) // Every hour at :00
  async retryFailed(): Promise<void> {
    const start = Date.now();
    try {
      await Sentry.withMonitor(
        'notification-retry',
        () =>
          this.lockService.withLock('cron:notification-retry', 120, async () => {
            const records = await this.failedNotificationRepository.findRetryable();
            if (records.length === 0) return;

            this.logger.log(`Retrying ${records.length} failed notification(s)...`);

            let resolved = 0;
            let failed = 0;

            await Promise.allSettled(
              records.map(async (record) => {
                try {
                  await this.notificationsHandler.retryDispatch(
                    record.handler,
                    record.payload as Record<string, unknown>,
                  );
                  await this.failedNotificationRepository.markResolved(record.id);
                  resolved++;
                } catch (error) {
                  failed++;
                  // Exponential backoff: 1h → 2h → 4h
                  const backoffMs = Math.pow(2, record.retryCount) * 60 * 60 * 1000;
                  const nextRetryAt = new Date(Date.now() + backoffMs);
                  await this.failedNotificationRepository
                    .incrementRetry(record.id, (error as Error).message, nextRetryAt)
                    .catch((e) => {
                      this.logger.error(`Failed to increment retry for ${record.id}: ${e}`);
                    });
                  this.logger.warn(
                    `Retry failed for ${record.handler} [${record.id}]: ${(error as Error).message}`,
                  );
                }
              }),
            );

            this.logger.log(
              `Notification retry complete: ${resolved} resolved, ${failed} failed (${Date.now() - start}ms)`,
            );
          }),
        { schedule: { type: 'crontab', value: '0 * * * *' } },
      );
    } catch (error) {
      this.logger.error(`Cron failed: ${(error as Error).message}`, (error as Error).stack);
      Sentry.captureException(error);
    }
    this.metricsService.recordCronExecution('notification-retry', Date.now() - start);
  }
}
