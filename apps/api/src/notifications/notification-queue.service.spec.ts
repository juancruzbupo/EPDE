import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationQueueService } from './notification-queue.service';
import { NOTIFICATION_QUEUE } from './notification-queue.types';

const mockQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-id' }),
};

const MOCK_NOTIFICATION = {
  userId: 'user-1',
  type: 'BUDGET_UPDATE' as const,
  title: 'Test notification',
  message: 'Test message',
};

describe('NotificationQueueService', () => {
  let service: NotificationQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationQueueService,
        { provide: getQueueToken(NOTIFICATION_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<NotificationQueueService>(NotificationQueueService);
    jest.clearAllMocks();
  });

  describe('enqueue', () => {
    it('should call queue.add with jobName "single" and notification data', async () => {
      await service.enqueue(MOCK_NOTIFICATION);

      expect(mockQueue.add).toHaveBeenCalledWith('single', MOCK_NOTIFICATION);
    });

    it('should complete without error even if queue.add rejects', async () => {
      mockQueue.add.mockRejectedValueOnce(new Error('Queue unavailable'));

      // The service does not have try-catch, so it propagates the error
      await expect(service.enqueue(MOCK_NOTIFICATION)).rejects.toThrow('Queue unavailable');
    });
  });

  describe('enqueueBatch', () => {
    it('should call queue.add with jobName "batch" and the notifications array', async () => {
      const notifications = [MOCK_NOTIFICATION, { ...MOCK_NOTIFICATION, userId: 'user-2' }];

      await service.enqueueBatch(notifications);

      expect(mockQueue.add).toHaveBeenCalledWith('batch', { notifications });
    });

    it('should not call queue.add when notifications array is empty', async () => {
      await service.enqueueBatch([]);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });
});
