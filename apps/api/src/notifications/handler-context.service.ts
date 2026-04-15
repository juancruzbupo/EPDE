import { Injectable, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { EmailQueueService } from '../email/email-queue.service';
import { FailedNotificationRepository } from './failed-notification.repository';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

/**
 * Shared infrastructure for domain handler classes under `notifications/handlers/`.
 *
 * Lives as its own service so each domain handler (BudgetHandlers, TaskHandlers,
 * etc.) can inject one object for its deps + primitives, instead of 6 individual
 * constructor params and re-implementing the DLQ / retry / sendPush wiring.
 *
 * The AsyncLocalStorage flag shared here is what lets us run the same handler
 * code in two modes: normal fire-and-forget (failures write to FailedNotification)
 * and NotificationRetryService-driven retry (failures bubble up, no new DLQ rows).
 */
@Injectable()
export class HandlerContext {
  private readonly logger = new Logger(HandlerContext.name);
  private readonly retryContext = new AsyncLocalStorage<boolean>();

  constructor(
    public readonly notificationQueueService: NotificationQueueService,
    public readonly notificationsService: NotificationsService,
    public readonly usersRepository: UserLookupRepository,
    public readonly emailQueueService: EmailQueueService,
    public readonly pushService: PushService,
    private readonly failedNotificationRepository: FailedNotificationRepository,
  ) {}

  /**
   * Wraps a handler function with error catching + DLQ write.
   * - Normal call: catches, logs, persists to FailedNotification, does NOT re-throw.
   * - Retry call (via `runInRetry`): catches, logs, re-throws WITHOUT writing to DLQ.
   *   The retry service is responsible for incrementing retryCount on the original record.
   */
  async withDLQ(
    handler: string,
    payload: Record<string, unknown>,
    fn: () => Promise<void>,
  ): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.error(`Error in ${handler}: ${(error as Error).message}`, (error as Error).stack);
      const isRetrying = this.retryContext.getStore() ?? false;
      if (isRetrying) {
        throw error;
      }
      await this.failedNotificationRepository
        .create({ handler, payload, lastError: (error as Error).message })
        .catch((dlqErr) => {
          this.logger.error(`DLQ write failed for ${handler}: ${(dlqErr as Error).message}`);
        });
    }
  }

  /**
   * Runs the given callback under the retry flag. Called by `NotificationsHandlerService.retryDispatch`
   * so that handler methods can distinguish normal fire-and-forget from retry invocations.
   */
  runInRetry<R>(fn: () => Promise<R>): Promise<R> {
    return this.retryContext.run(true, fn);
  }

  /** Send push notification to specific users (fire-and-forget, catches errors). */
  sendPush(userIds: string[], title: string, body: string, data?: Record<string, string>) {
    void this.pushService.sendToUsers(userIds, { title, body, data }).catch((err) => {
      this.logger.error(`Push notification failed: ${err}`);
    });
  }
}
