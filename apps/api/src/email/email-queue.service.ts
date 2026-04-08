import type { BudgetStatus } from '@epde/shared';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import { EMAIL_QUEUE, EmailJobData } from './email-queue.processor';

/** Mask email for logging — shows first 3 chars + domain only. */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local?.slice(0, 3)}***@${domain ?? 'unknown'}`;
}

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue<EmailJobData>) {}

  async enqueueInvite(to: string, name: string, token: string): Promise<void> {
    await this.emailQueue.add(
      'invite',
      { type: 'invite', to, name, token },
      { jobId: `invite:${to}:${token.slice(-8)}` },
    );
    this.logger.log(`Enqueued invite email for ${maskEmail(to)}`);
  }

  async enqueuePasswordReset(to: string, name: string, token: string): Promise<void> {
    await this.emailQueue.add(
      'passwordReset',
      { type: 'passwordReset', to, name, token },
      { jobId: `passwordReset:${to}:${token.slice(-8)}` },
    );
    this.logger.log(`Enqueued password reset email for ${maskEmail(to)}`);
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
    this.logger.log(`Enqueued task reminder email for ${maskEmail(opts.to)}`);
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
    this.logger.log(`Enqueued budget quoted email for ${maskEmail(to)}`);
  }

  async enqueueBudgetStatus(
    to: string,
    name: string,
    budgetTitle: string,
    newStatus: BudgetStatus,
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
    this.logger.log(`Enqueued budget status email for ${maskEmail(to)}`);
  }

  async enqueueWeeklySummary(opts: {
    to: string;
    name: string;
    score: number;
    pendingTasks: number;
    overdueTasks: number;
    upcomingThisWeek: number;
    streak: number;
    nextTaskName: string | null;
    nextTaskDate: string | null;
  }): Promise<void> {
    await this.emailQueue.add(
      'weeklySummary',
      { type: 'weeklySummary' as const, ...opts },
      { jobId: `weeklySummary:${opts.to}:${new Date().toISOString().slice(0, 10)}` },
    );
    this.logger.log(`Enqueued weekly summary email for ${maskEmail(opts.to)}`);
  }
}
