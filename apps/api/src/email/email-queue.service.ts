import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE, EmailJobData } from './email-queue.processor';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue<EmailJobData>) {}

  async enqueueInvite(to: string, name: string, token: string): Promise<void> {
    await this.emailQueue.add('invite', { type: 'invite', to, name, token });
    this.logger.log(`Enqueued invite email for ${to}`);
  }

  async enqueueTaskReminder(
    to: string,
    name: string,
    taskName: string,
    propertyAddress: string,
    dueDate: Date,
    categoryName: string,
    isOverdue: boolean,
  ): Promise<void> {
    await this.emailQueue.add('taskReminder', {
      type: 'taskReminder',
      to,
      name,
      taskName,
      propertyAddress,
      dueDate: dueDate.toISOString(),
      categoryName,
      isOverdue,
    });
    this.logger.log(`Enqueued task reminder email for ${to}`);
  }

  async enqueueBudgetQuoted(
    to: string,
    name: string,
    budgetTitle: string,
    totalAmount: number,
    budgetId: string,
  ): Promise<void> {
    await this.emailQueue.add('budgetQuoted', {
      type: 'budgetQuoted',
      to,
      name,
      budgetTitle,
      totalAmount,
      budgetId,
    });
    this.logger.log(`Enqueued budget quoted email for ${to}`);
  }

  async enqueueBudgetStatus(
    to: string,
    name: string,
    budgetTitle: string,
    newStatus: string,
    budgetId: string,
  ): Promise<void> {
    await this.emailQueue.add('budgetStatus', {
      type: 'budgetStatus',
      to,
      name,
      budgetTitle,
      newStatus,
      budgetId,
    });
    this.logger.log(`Enqueued budget status email for ${to}`);
  }
}
