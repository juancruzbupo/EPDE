import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import type { Queue } from 'bullmq';

import { EMAIL_QUEUE } from '../email/email-queue.processor';
import { NOTIFICATION_QUEUE } from '../notifications/notification-queue.types';

const BACKLOG_THRESHOLD = 500;

@Injectable()
export class QueueHealthIndicator extends HealthIndicator {
  constructor(
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const [emailWaiting, notifWaiting] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.notificationQueue.getWaitingCount(),
    ]);

    const totalBacklog = emailWaiting + notifWaiting;
    const isHealthy = totalBacklog < BACKLOG_THRESHOLD;
    const details = { emailWaiting, notifWaiting };

    const result = this.getStatus(key, isHealthy, details);
    if (isHealthy) return result;
    throw new HealthCheckError('Queue backlog too high', result);
  }
}
