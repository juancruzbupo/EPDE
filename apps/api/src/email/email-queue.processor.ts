import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service';

export const EMAIL_QUEUE = 'email';

export type EmailJobData =
  | { type: 'invite'; to: string; name: string; token: string }
  | {
      type: 'taskReminder';
      to: string;
      name: string;
      taskName: string;
      propertyAddress: string;
      dueDate: string;
      categoryName: string;
      isOverdue: boolean;
    }
  | {
      type: 'budgetQuoted';
      to: string;
      name: string;
      budgetTitle: string;
      totalAmount: number;
      budgetId: string;
    }
  | {
      type: 'budgetStatus';
      to: string;
      name: string;
      budgetTitle: string;
      newStatus: string;
      budgetId: string;
    };

@Processor(EMAIL_QUEUE)
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    this.logger.log(`Processing email job ${job.id} (type: ${job.data.type})`);

    switch (job.data.type) {
      case 'invite':
        await this.emailService.sendInviteEmail(job.data.to, job.data.name, job.data.token);
        break;
      case 'taskReminder':
        await this.emailService.sendTaskReminderEmail(
          job.data.to,
          job.data.name,
          job.data.taskName,
          job.data.propertyAddress,
          new Date(job.data.dueDate),
          job.data.categoryName,
          job.data.isOverdue,
        );
        break;
      case 'budgetQuoted':
        await this.emailService.sendBudgetQuotedEmail(
          job.data.to,
          job.data.name,
          job.data.budgetTitle,
          job.data.totalAmount,
          job.data.budgetId,
        );
        break;
      case 'budgetStatus':
        await this.emailService.sendBudgetStatusEmail(
          job.data.to,
          job.data.name,
          job.data.budgetTitle,
          job.data.newStatus,
          job.data.budgetId,
        );
        break;
    }
  }
}
