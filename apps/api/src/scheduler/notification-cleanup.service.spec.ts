import { Test, TestingModule } from '@nestjs/testing';

import { MetricsService } from '../metrics/metrics.service';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { NotificationCleanupService } from './notification-cleanup.service';

const mockNotificationsRepository = {
  deleteOldRead: jest.fn().mockResolvedValue(5),
};

const mockLockService = {
  withLock: jest.fn().mockImplementation(async (_key, _ttl, fn) => fn()),
};

const mockMetricsService = {
  recordCronExecution: jest.fn(),
};

describe('NotificationCleanupService', () => {
  let service: NotificationCleanupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationCleanupService,
        { provide: NotificationsRepository, useValue: mockNotificationsRepository },
        { provide: DistributedLockService, useValue: mockLockService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get(NotificationCleanupService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should use distributed lock', async () => {
    await service.cleanup();

    expect(mockLockService.withLock).toHaveBeenCalledWith(
      'cron:notification-cleanup',
      120,
      expect.any(Function),
    );
  });

  it('should delete old read notifications', async () => {
    mockNotificationsRepository.deleteOldRead.mockResolvedValue(10);

    await service.cleanup();

    expect(mockNotificationsRepository.deleteOldRead).toHaveBeenCalledWith(expect.any(Date));
  });

  it('should record metrics even on error', async () => {
    mockNotificationsRepository.deleteOldRead.mockRejectedValue(new Error('DB error'));

    await service.cleanup();

    expect(mockMetricsService.recordCronExecution).toHaveBeenCalledWith(
      'notification-cleanup',
      expect.any(Number),
    );
  });
});
