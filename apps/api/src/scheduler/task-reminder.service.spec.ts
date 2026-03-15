import { Test, TestingModule } from '@nestjs/testing';

import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { TasksRepository } from '../tasks/tasks.repository';
import { TaskReminderService } from './task-reminder.service';

const mockTasksRepository = {
  findUpcomingWithOwners: jest.fn().mockResolvedValue([]),
  findOverdueWithOwners: jest.fn().mockResolvedValue([]),
};
const mockNotificationsRepository = {
  findTodayReminderTaskIds: jest.fn().mockResolvedValue(new Set()),
};
const mockUsersRepository = { findAdminIds: jest.fn().mockResolvedValue([]) };
const mockNotificationsHandler = {
  handleTaskReminders: jest.fn().mockResolvedValue({ notificationCount: 0, failedEmails: 0 }),
};
const mockLockService = {
  withLock: jest
    .fn()
    .mockImplementation(
      async (_key: string, _ttl: number, fn: (signal: { lockLost: boolean }) => Promise<void>) => {
        await fn({ lockLost: false });
      },
    ),
};
const mockMetricsService = {
  recordCronExecution: jest.fn(),
};

describe('TaskReminderService', () => {
  let service: TaskReminderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskReminderService,
        { provide: TasksRepository, useValue: mockTasksRepository },
        { provide: NotificationsRepository, useValue: mockNotificationsRepository },
        { provide: UserLookupRepository, useValue: mockUsersRepository },
        { provide: NotificationsHandlerService, useValue: mockNotificationsHandler },
        { provide: DistributedLockService, useValue: mockLockService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<TaskReminderService>(TaskReminderService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendUpcomingTaskReminders', () => {
    it('should exit early when no tasks to remind', async () => {
      mockTasksRepository.findUpcomingWithOwners.mockResolvedValue([]);
      mockTasksRepository.findOverdueWithOwners.mockResolvedValue([]);
      mockLockService.withLock.mockImplementation(
        async (
          _key: string,
          _ttl: number,
          fn: (signal: { lockLost: boolean }) => Promise<void>,
        ) => {
          await fn({ lockLost: false });
        },
      );

      await service.sendUpcomingTaskReminders();
      expect(mockNotificationsHandler.handleTaskReminders).not.toHaveBeenCalled();
    });

    it('should skip creating notifications if lock is lost after fetch', async () => {
      mockTasksRepository.findUpcomingWithOwners.mockResolvedValue([]);
      mockTasksRepository.findOverdueWithOwners.mockResolvedValue([]);
      mockLockService.withLock.mockImplementationOnce(
        async (
          _key: string,
          _ttl: number,
          fn: (signal: { lockLost: boolean }) => Promise<void>,
        ) => {
          await fn({ lockLost: true });
        },
      );
      await service.sendUpcomingTaskReminders();
      expect(mockNotificationsHandler.handleTaskReminders).not.toHaveBeenCalled();
    });

    it('ON_DETECTION tasks should not appear — findUpcomingWithOwners already filters them', async () => {
      mockTasksRepository.findUpcomingWithOwners.mockResolvedValue([]);
      mockTasksRepository.findOverdueWithOwners.mockResolvedValue([]);
      mockLockService.withLock.mockImplementation(
        async (
          _key: string,
          _ttl: number,
          fn: (signal: { lockLost: boolean }) => Promise<void>,
        ) => {
          await fn({ lockLost: false });
        },
      );

      await service.sendUpcomingTaskReminders();

      expect(mockNotificationsHandler.handleTaskReminders).not.toHaveBeenCalled();
    });

    it('should delegate to NotificationsHandlerService when tasks exist', async () => {
      const upcomingTask = {
        id: 'task-1',
        name: 'Test Task',
        nextDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        recurrenceType: 'ANNUAL',
        category: { name: 'Electricidad' },
        maintenancePlan: {
          property: {
            address: '123 Test St',
            user: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
          },
        },
      };

      mockTasksRepository.findUpcomingWithOwners.mockResolvedValue([upcomingTask]);
      mockTasksRepository.findOverdueWithOwners.mockResolvedValue([]);
      mockNotificationsRepository.findTodayReminderTaskIds.mockResolvedValue(new Set());
      mockNotificationsHandler.handleTaskReminders.mockResolvedValue({
        notificationCount: 1,
        failedEmails: 0,
      });
      mockLockService.withLock.mockImplementation(
        async (
          _key: string,
          _ttl: number,
          fn: (signal: { lockLost: boolean }) => Promise<void>,
        ) => {
          await fn({ lockLost: false });
        },
      );

      await service.sendUpcomingTaskReminders();

      expect(mockNotificationsHandler.handleTaskReminders).toHaveBeenCalledWith({
        notifications: expect.arrayContaining([
          expect.objectContaining({ userId: 'user-1', type: 'TASK_REMINDER' }),
        ]),
        emails: expect.arrayContaining([
          expect.objectContaining({
            to: 'owner@test.com',
            taskId: 'task-1',
            taskName: 'Test Task',
          }),
        ]),
      });
    });
  });
});
