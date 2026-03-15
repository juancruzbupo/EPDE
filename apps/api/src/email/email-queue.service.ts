import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import { EMAIL_QUEUE, EmailJobData } from './email-queue.processor';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue<EmailJobData>) {}

  async enqueueInvite(to: string, name: string, token: string): Promise<void> {
    await this.emailQueue.add(
      'invite',
      { type: 'invite', to, name, token },
      { jobId: `invite:${to}:${token}` },
    );
    this.logger.log(`Enqueued invite email for ${to}`);
  }

  async enqueueTaskReminder(opts: {
    to: string;
    name: string;
    taskId: string;
    taskName: string;
    propertyAddress: string;
    dueDate: Date;
    categoryName: string;
    isOverdue: boolean;
  }): Promise<void> {
    const dueDateStr = opts.dueDate.toISOString().slice(0, 10);
    await this.emailQueue.add(
      'taskReminder',
      {
        type: 'taskReminder',
        to: opts.to,
        name: opts.name,
        taskName: opts.taskName,
        propertyAddress: opts.propertyAddress,
        dueDate: opts.dueDate.toISOString(),
        categoryName: opts.categoryName,
        isOverdue: opts.isOverdue,
      },
      { jobId: `taskReminder:${opts.to}:${opts.taskId}:${dueDateStr}` },
    );
    this.logger.log(`Enqueued task reminder email for ${opts.to}`);
  }

  async enqueueBudgetQuoted(
    to: string,
    name: string,
    budgetTitle: string,
    totalAmount: number,
    budgetId: string,
  ): Promise<void> {
    await this.emailQueue.add(
      'budgetQuoted',
      {
        type: 'budgetQuoted',
        to,
        name,
        budgetTitle,
        totalAmount,
        budgetId,
      },
      { jobId: `budgetQuoted:${to}:${budgetId}` },
    );
    this.logger.log(`Enqueued budget quoted email for ${to}`);
  }

  async enqueueBudgetStatus(
    to: string,
    name: string,
    budgetTitle: string,
    newStatus: string,
    budgetId: string,
  ): Promise<void> {
    await this.emailQueue.add(
      'budgetStatus',
      {
        type: 'budgetStatus',
        to,
        name,
        budgetTitle,
        newStatus,
        budgetId,
      },
      { jobId: `budgetStatus:${to}:${budgetId}:${newStatus}` },
    );
    this.logger.log(`Enqueued budget status email for ${to}`);
  }
}
