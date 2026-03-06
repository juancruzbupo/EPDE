import { Test, TestingModule } from '@nestjs/testing';
import { TaskSafetyService } from './task-safety.service';
import { TasksRepository } from '../tasks/tasks.repository';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { MetricsService } from '../metrics/metrics.service';

const mockTasksRepository = {
  findStaleCompleted: jest.fn().mockResolvedValue([]),
  updateDueDateAndStatus: jest.fn().mockResolvedValue(undefined),
};

const mockLockService = {
  withLock: jest.fn().mockImplementation(async (_key, _ttl, fn) => {
    await fn({ lockLost: false });
  }),
};

const mockMetricsService = {
  recordCronExecution: jest.fn(),
};

describe('TaskSafetyService', () => {
  let service: TaskSafetyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskSafetyService,
        { provide: TasksRepository, useValue: mockTasksRepository },
        { provide: DistributedLockService, useValue: mockLockService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get<TaskSafetyService>(TaskSafetyService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('safetySweepCompletedTasks', () => {
    it('should exit early when no stale tasks', async () => {
      mockTasksRepository.findStaleCompleted.mockResolvedValue([]);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.safetySweepCompletedTasks();
      expect(mockTasksRepository.updateDueDateAndStatus).not.toHaveBeenCalled();
    });

    it('should fix stale completed tasks in batches', async () => {
      const staleTask = {
        id: 'task-1',
        recurrenceMonths: 12,
        recurrenceType: 'ANNUAL',
        nextDueDate: new Date('2025-01-01'),
      };
      mockTasksRepository.findStaleCompleted.mockResolvedValueOnce([staleTask]);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.safetySweepCompletedTasks();
      expect(mockTasksRepository.updateDueDateAndStatus).toHaveBeenCalledWith(
        'task-1',
        expect.any(Date),
        'PENDING',
      );
    });

    it('should skip task without nextDueDate', async () => {
      const taskWithoutDueDate = {
        id: 'task-no-date',
        recurrenceMonths: 12,
        recurrenceType: 'ANNUAL',
        nextDueDate: null,
      };
      mockTasksRepository.findStaleCompleted.mockResolvedValueOnce([taskWithoutDueDate]);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.safetySweepCompletedTasks();

      // updateDueDateAndStatus should NOT be called since nextDueDate is null
      expect(mockTasksRepository.updateDueDateAndStatus).not.toHaveBeenCalled();
    });

    it('should continue processing other tasks when one fails', async () => {
      const task1 = {
        id: 'task-fail',
        recurrenceMonths: 12,
        recurrenceType: 'ANNUAL',
        nextDueDate: new Date('2025-01-01'),
      };
      const task2 = {
        id: 'task-success',
        recurrenceMonths: 12,
        recurrenceType: 'ANNUAL',
        nextDueDate: new Date('2025-01-01'),
      };

      mockTasksRepository.findStaleCompleted.mockResolvedValueOnce([task1, task2]);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      // First call rejects, second resolves
      mockTasksRepository.updateDueDateAndStatus
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce(undefined);

      await service.safetySweepCompletedTasks();

      // Both tasks should have been attempted
      expect(mockTasksRepository.updateDueDateAndStatus).toHaveBeenCalledTimes(2);
      // Second task should have been processed despite first failure
      expect(mockTasksRepository.updateDueDateAndStatus).toHaveBeenCalledWith(
        'task-success',
        expect.any(Date),
        'PENDING',
      );
    });
  });
});
