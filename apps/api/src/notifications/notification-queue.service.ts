import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import {
  NOTIFICATION_QUEUE,
  NotificationBatchJobData,
  NotificationJobData,
} from './notification-queue.types';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(@InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue) {}

  async enqueue(data: NotificationJobData): Promise<void> {
    await this.notificationQueue.add('single', data);
    this.logger.log(`Enqueued notification for user ${data.userId} (${data.type})`);
  }

  async enqueueBatch(notifications: NotificationJobData[]): Promise<void> {
    if (notifications.length === 0) return;
    const data: NotificationBatchJobData = { notifications };
    await this.notificationQueue.add('batch', data);
    this.logger.log(`Enqueued batch of ${notifications.length} notifications`);
  }
}
