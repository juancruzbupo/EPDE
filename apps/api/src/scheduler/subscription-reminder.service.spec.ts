import { Test, TestingModule } from '@nestjs/testing';

import { MetricsService } from '../metrics/metrics.service';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { UsersRepository } from '../users/users.repository';
import { SubscriptionReminderService } from './subscription-reminder.service';

const mockUsersRepository = {
  findExpiringSubscriptions: jest.fn().mockResolvedValue([]),
};

const mockLockService = {
  withLock: jest.fn().mockImplementation(async (_key, _ttl, fn) => {
    await fn({ lockLost: false });
  }),
};

const mockMetricsService = {
  recordCronExecution: jest.fn(),
};

const mockNotificationsHandler = {
  handleSubscriptionReminder: jest.fn().mockResolvedValue(undefined),
};

const mockNotificationsRepository = {
  findTodaySubscriptionReminderUserIds: jest.fn().mockResolvedValue(new Set()),
};

describe('SubscriptionReminderService', () => {
  let service: SubscriptionReminderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionReminderService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: DistributedLockService, useValue: mockLockService },
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: NotificationsHandlerService, useValue: mockNotificationsHandler },
        { provide: NotificationsRepository, useValue: mockNotificationsRepository },
      ],
    }).compile();

    service = module.get(SubscriptionReminderService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should use distributed lock', async () => {
    await service.checkExpiringSubscriptions();

    expect(mockLockService.withLock).toHaveBeenCalledWith(
      'cron:subscription-reminder',
      120,
      expect.any(Function),
    );
  });

  it('should record metrics', async () => {
    await service.checkExpiringSubscriptions();

    expect(mockMetricsService.recordCronExecution).toHaveBeenCalledWith(
      'subscription-reminder',
      expect.any(Number),
    );
  });

  it('should check deduplication before sending reminders', async () => {
    await service.checkExpiringSubscriptions();

    expect(mockNotificationsRepository.findTodaySubscriptionReminderUserIds).toHaveBeenCalled();
  });

  it('should send reminders for expiring users', async () => {
    const expiringUser = {
      id: 'u1',
      name: 'Test',
      subscriptionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
    };
    mockUsersRepository.findExpiringSubscriptions.mockResolvedValue([expiringUser]);
    mockNotificationsRepository.findTodaySubscriptionReminderUserIds.mockResolvedValue(new Set());

    await service.checkExpiringSubscriptions();

    expect(mockNotificationsHandler.handleSubscriptionReminder).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1' }),
    );
  });

  it('should skip users already reminded today', async () => {
    const expiringUser = {
      id: 'u1',
      name: 'Test',
      subscriptionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
    };
    mockUsersRepository.findExpiringSubscriptions.mockResolvedValue([expiringUser]);
    mockNotificationsRepository.findTodaySubscriptionReminderUserIds.mockResolvedValue(
      new Set(['u1']),
    );

    await service.checkExpiringSubscriptions();

    expect(mockNotificationsHandler.handleSubscriptionReminder).not.toHaveBeenCalled();
  });

  it('should not send reminders when no users are expiring', async () => {
    mockUsersRepository.findExpiringSubscriptions.mockResolvedValue([]);

    await service.checkExpiringSubscriptions();

    expect(mockNotificationsHandler.handleSubscriptionReminder).not.toHaveBeenCalled();
  });
});
