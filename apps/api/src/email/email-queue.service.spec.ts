import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';

import { EMAIL_QUEUE } from './email-queue.processor';
import { EmailQueueService } from './email-queue.service';

const mockQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-id' }),
};

describe('EmailQueueService', () => {
  let service: EmailQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailQueueService, { provide: getQueueToken(EMAIL_QUEUE), useValue: mockQueue }],
    }).compile();

    service = module.get<EmailQueueService>(EmailQueueService);
    jest.clearAllMocks();
  });

  describe('enqueueInvite', () => {
    it('should call queue.add with jobName "invite" and correct data', async () => {
      await service.enqueueInvite('client@test.com', 'Juan', 'invite-token');

      expect(mockQueue.add).toHaveBeenCalledWith(
        'invite',
        {
          type: 'invite',
          to: 'client@test.com',
          name: 'Juan',
          token: 'invite-token',
        },
        { jobId: 'invite:client@test.com:invite-token' },
      );
    });
  });

  describe('enqueueTaskReminder', () => {
    it('should serialize Date to ISO string before enqueuing', async () => {
      const dueDate = new Date('2026-04-15T12:00:00.000Z');

      await service.enqueueTaskReminder(
        'client@test.com',
        'Juan',
        'task-uuid-1',
        'Revisión HVAC',
        'Av. Corrientes 1234',
        dueDate,
        'Climatización',
        false,
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'taskReminder',
        expect.objectContaining({
          type: 'taskReminder',
          dueDate: dueDate.toISOString(),
        }),
        { jobId: 'taskReminder:client@test.com:task-uuid-1:2026-04-15' },
      );
      // Verify the date is a string, not a Date object
      const call = mockQueue.add.mock.calls[0][1] as { dueDate: unknown };
      expect(typeof call.dueDate).toBe('string');
    });
  });

  describe('enqueueBudgetQuoted', () => {
    it('should call queue.add with jobName "budgetQuoted" and correct data', async () => {
      await service.enqueueBudgetQuoted('client@test.com', 'Juan', 'Pintura', 150000, 'budget-1');

      expect(mockQueue.add).toHaveBeenCalledWith(
        'budgetQuoted',
        {
          type: 'budgetQuoted',
          to: 'client@test.com',
          name: 'Juan',
          budgetTitle: 'Pintura',
          totalAmount: 150000,
          budgetId: 'budget-1',
        },
        { jobId: 'budgetQuoted:client@test.com:budget-1' },
      );
    });
  });

  describe('enqueueBudgetStatus', () => {
    it('should call queue.add with jobName "budgetStatus" and correct data', async () => {
      await service.enqueueBudgetStatus(
        'client@test.com',
        'Juan',
        'Pintura',
        'APPROVED',
        'budget-1',
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'budgetStatus',
        {
          type: 'budgetStatus',
          to: 'client@test.com',
          name: 'Juan',
          budgetTitle: 'Pintura',
          newStatus: 'APPROVED',
          budgetId: 'budget-1',
        },
        { jobId: 'budgetStatus:client@test.com:budget-1:APPROVED' },
      );
    });
  });
});
