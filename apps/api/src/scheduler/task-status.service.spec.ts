import { Test, TestingModule } from '@nestjs/testing';
import { TaskStatusService } from './task-status.service';
import { TasksRepository } from '../maintenance-plans/tasks.repository';
import { DistributedLockService } from '../redis/distributed-lock.service';

const mockTasksRepository = {
  markOverdue: jest.fn().mockResolvedValue(2),
  markUpcoming: jest.fn().mockResolvedValue(3),
  resetUpcomingToPending: jest.fn().mockResolvedValue(1),
};

const mockLockService = {
  withLock: jest.fn().mockImplementation(async (_key, _ttl, fn) => {
    await fn({ lockLost: false });
  }),
};

describe('TaskStatusService', () => {
  let service: TaskStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskStatusService,
        { provide: TasksRepository, useValue: mockTasksRepository },
        { provide: DistributedLockService, useValue: mockLockService },
      ],
    }).compile();

    service = module.get<TaskStatusService>(TaskStatusService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recalculateTaskStatuses', () => {
    it('should mark overdue, upcoming, and reset tasks', async () => {
      mockTasksRepository.markOverdue.mockResolvedValue(2);
      mockTasksRepository.markUpcoming.mockResolvedValue(3);
      mockTasksRepository.resetUpcomingToPending.mockResolvedValue(1);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.recalculateTaskStatuses();

      expect(mockLockService.withLock).toHaveBeenCalledWith(
        'cron:task-status-recalculation',
        300,
        expect.any(Function),
      );
      expect(mockTasksRepository.markOverdue).toHaveBeenCalled();
      expect(mockTasksRepository.markUpcoming).toHaveBeenCalled();
      expect(mockTasksRepository.resetUpcomingToPending).toHaveBeenCalled();
    });

    it('should skip processing if lock is lost', async () => {
      mockLockService.withLock.mockImplementationOnce(async (_key, _ttl, fn) => {
        await fn({ lockLost: true });
      });

      await service.recalculateTaskStatuses();
      expect(mockTasksRepository.markOverdue).not.toHaveBeenCalled();
    });
  });
});
