import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import {
  NOTIFICATION_QUEUE,
  NotificationBatchJobData,
  NotificationJobData,
} from './notification-queue.types';

/**
 * Low-level BullMQ adapter — enqueues notification jobs for async processing.
 *
 * ## Notification service naming
 * - `NotificationQueueService` (this) — BullMQ queue adapter (enqueue/enqueueBatch)
 * - `NotificationsHandlerService` — Domain orchestrator: maps domain events to queue + email calls
 * - `NotificationsService` — CRUD for notification entities (read, mark as read, count)
 *
 * Domain services inject `NotificationsHandlerService`, NEVER this service directly.
 */
@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(@InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue) {}

  async enqueue(data: NotificationJobData): Promise<void> {
    await this.notificationQueue.add('single', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    this.logger.log(`Enqueued notification for user ${data.userId} (${data.type})`);
  }

  async enqueueBatch(notifications: NotificationJobData[]): Promise<void> {
    if (notifications.length === 0) return;
    const data: NotificationBatchJobData = { notifications };
    await this.notificationQueue.add('batch', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    this.logger.log(`Enqueued batch of ${notifications.length} notifications`);
  }
}
