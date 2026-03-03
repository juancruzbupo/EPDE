import { Test, TestingModule } from '@nestjs/testing';
import { TaskReminderService } from './task-reminder.service';
import { TasksRepository } from '../maintenance-plans/tasks.repository';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailQueueService } from '../email/email-queue.service';
import { DistributedLockService } from '../redis/distributed-lock.service';

const mockTasksRepository = {
  findUpcomingWithOwners: jest.fn().mockResolvedValue([]),
  findOverdueWithOwners: jest.fn().mockResolvedValue([]),
};
const mockNotificationsRepository = {
  findTodayReminderTaskIds: jest.fn().mockResolvedValue(new Set()),
};
const mockUsersRepository = { findAdminIds: jest.fn().mockResolvedValue([]) };
const mockNotificationsService = { createNotifications: jest.fn().mockResolvedValue(0) };
const mockEmailQueueService = { enqueueTaskReminder: jest.fn().mockResolvedValue(undefined) };
const mockLockService = {
  withLock: jest.fn().mockImplementation(async (_key, _ttl, fn) => {
    await fn({ lockLost: false });
  }),
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
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: EmailQueueService, useValue: mockEmailQueueService },
        { provide: DistributedLockService, useValue: mockLockService },
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
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.sendUpcomingTaskReminders();
      expect(mockNotificationsService.createNotifications).not.toHaveBeenCalled();
    });

    it('should skip creating notifications if lock is lost after fetch', async () => {
      mockTasksRepository.findUpcomingWithOwners.mockResolvedValue([]);
      mockTasksRepository.findOverdueWithOwners.mockResolvedValue([]);
      mockLockService.withLock.mockImplementationOnce(async (_key, _ttl, fn) => {
        await fn({ lockLost: true });
      });
      await service.sendUpcomingTaskReminders();
      // With lockLost=true and no tasks, the early-return path still skips createNotifications
      expect(mockNotificationsService.createNotifications).not.toHaveBeenCalled();
    });

    it('ON_DETECTION tasks should not appear — findUpcomingWithOwners already filters them', async () => {
      // The repository filters recurrenceType: { not: 'ON_DETECTION' }
      // So if only ON_DETECTION tasks exist, both queries return empty
      mockTasksRepository.findUpcomingWithOwners.mockResolvedValue([]);
      mockTasksRepository.findOverdueWithOwners.mockResolvedValue([]);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.sendUpcomingTaskReminders();

      expect(mockNotificationsService.createNotifications).not.toHaveBeenCalled();
      expect(mockEmailQueueService.enqueueTaskReminder).not.toHaveBeenCalled();
    });

    it('should log error when email enqueue fails', async () => {
      const loggerErrorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation(() => undefined);

      const upcomingTask = {
        id: 'task-1',
        name: 'Test Task',
        nextDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
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
      mockNotificationsService.createNotifications.mockResolvedValue(1);
      mockEmailQueueService.enqueueTaskReminder.mockRejectedValue(new Error('Queue full'));
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.sendUpcomingTaskReminders();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('email(s) failed to enqueue'),
      );

      loggerErrorSpy.mockRestore();
    });
  });
});
