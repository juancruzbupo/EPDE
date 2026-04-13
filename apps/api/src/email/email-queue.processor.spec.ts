import { Job } from 'bullmq';

import { type EmailJobData, EmailQueueProcessor } from './email-queue.processor';

function makeJob(data: EmailJobData, id = 'job-1'): Job<EmailJobData> {
  return { id, data, name: data.type } as unknown as Job<EmailJobData>;
}

describe('EmailQueueProcessor', () => {
  let processor: EmailQueueProcessor;
  let emailService: {
    sendInviteEmail: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
    sendTaskReminderEmail: jest.Mock;
    sendBudgetQuotedEmail: jest.Mock;
    sendBudgetStatusEmail: jest.Mock;
    sendWeeklySummaryEmail: jest.Mock;
    sendAnniversaryEmail: jest.Mock;
  };

  beforeEach(() => {
    emailService = {
      sendInviteEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendTaskReminderEmail: jest.fn().mockResolvedValue(undefined),
      sendBudgetQuotedEmail: jest.fn().mockResolvedValue(undefined),
      sendBudgetStatusEmail: jest.fn().mockResolvedValue(undefined),
      sendWeeklySummaryEmail: jest.fn().mockResolvedValue(undefined),
      sendAnniversaryEmail: jest.fn().mockResolvedValue(undefined),
    };
    processor = new EmailQueueProcessor(emailService as never);
  });

  describe('process — job routing', () => {
    it('invite → sendInviteEmail', async () => {
      const job = makeJob({ type: 'invite', to: 'a@b.com', name: 'Ana', token: 'tok' });
      await processor.process(job);
      expect(emailService.sendInviteEmail).toHaveBeenCalledWith('a@b.com', 'Ana', 'tok');
    });

    it('passwordReset → sendPasswordResetEmail', async () => {
      const job = makeJob({ type: 'passwordReset', to: 'a@b.com', name: 'Ana', token: 'tok' });
      await processor.process(job);
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith('a@b.com', 'Ana', 'tok');
    });

    it('taskReminder → sendTaskReminderEmail with Date coercion', async () => {
      const dueDate = '2026-05-01T00:00:00.000Z';
      const job = makeJob({
        type: 'taskReminder',
        to: 'a@b.com',
        name: 'Ana',
        taskName: 'Revisar techo',
        propertyAddress: 'Calle 1',
        dueDate,
        categoryName: 'Techado',
        isOverdue: false,
      });
      await processor.process(job);
      expect(emailService.sendTaskReminderEmail).toHaveBeenCalledWith(
        'a@b.com',
        'Ana',
        'Revisar techo',
        'Calle 1',
        new Date(dueDate),
        'Techado',
        false,
      );
    });

    it('budgetQuoted → sendBudgetQuotedEmail', async () => {
      const job = makeJob({
        type: 'budgetQuoted',
        to: 'a@b.com',
        name: 'Ana',
        budgetTitle: 'Impermeabilización',
        totalAmount: 15000,
        budgetId: 'bid-1',
      });
      await processor.process(job);
      expect(emailService.sendBudgetQuotedEmail).toHaveBeenCalledWith(
        'a@b.com',
        'Ana',
        'Impermeabilización',
        15000,
        'bid-1',
      );
    });

    it('budgetStatus → sendBudgetStatusEmail', async () => {
      const job = makeJob({
        type: 'budgetStatus',
        to: 'a@b.com',
        name: 'Ana',
        budgetTitle: 'Pintura',
        newStatus: 'APPROVED',
        budgetId: 'bid-2',
      });
      await processor.process(job);
      expect(emailService.sendBudgetStatusEmail).toHaveBeenCalledWith(
        'a@b.com',
        'Ana',
        'Pintura',
        'APPROVED',
        'bid-2',
      );
    });

    it('weeklySummary → sendWeeklySummaryEmail with full data object', async () => {
      const data: EmailJobData = {
        type: 'weeklySummary',
        to: 'a@b.com',
        name: 'Ana',
        score: 82,
        pendingTasks: 3,
        overdueTasks: 1,
        upcomingThisWeek: 2,
        streak: 5,
        nextTaskName: 'Limpieza de canaletas',
        nextTaskDate: '2026-05-05',
      };
      const job = makeJob(data);
      await processor.process(job);
      expect(emailService.sendWeeklySummaryEmail).toHaveBeenCalledWith(data);
    });

    it('anniversary → sendAnniversaryEmail with full data object', async () => {
      const data: EmailJobData = { type: 'anniversary', to: 'a@b.com', name: 'Ana', taskCount: 42 };
      const job = makeJob(data);
      await processor.process(job);
      expect(emailService.sendAnniversaryEmail).toHaveBeenCalledWith(data);
    });
  });

  describe('error handling', () => {
    it('rethrows error so BullMQ marks job as failed and retries', async () => {
      const err = new Error('Resend API down');
      emailService.sendInviteEmail.mockRejectedValue(err);
      const job = makeJob({ type: 'invite', to: 'a@b.com', name: 'Ana', token: 'tok' });
      await expect(processor.process(job)).rejects.toThrow('Resend API down');
    });

    it('does not swallow errors from any job type', async () => {
      emailService.sendAnniversaryEmail.mockRejectedValue(new Error('timeout'));
      const job = makeJob({ type: 'anniversary', to: 'a@b.com', name: 'Ana', taskCount: 1 });
      await expect(processor.process(job)).rejects.toThrow('timeout');
    });
  });
});
