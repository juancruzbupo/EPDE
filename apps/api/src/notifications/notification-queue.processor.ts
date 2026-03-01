import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from './notifications.service';
import {
  NOTIFICATION_QUEUE,
  NotificationJobData,
  NotificationBatchJobData,
} from './notification-queue.types';

@Processor(NOTIFICATION_QUEUE)
export class NotificationQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<NotificationJobData | NotificationBatchJobData>): Promise<void> {
    this.logger.log(`Processing notification job ${job.id} (name: ${job.name})`);

    try {
      if (job.name === 'batch') {
        const { notifications } = job.data as NotificationBatchJobData;
        await this.notificationsService.createNotifications(notifications);
      } else {
        const data = job.data as NotificationJobData;
        await this.notificationsService.createNotification(data);
      }
    } catch (error) {
      this.logger.error(
        `Notification job ${job.id} failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
