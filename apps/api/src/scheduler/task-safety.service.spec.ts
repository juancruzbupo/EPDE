import { Test, TestingModule } from '@nestjs/testing';
import { TaskSafetyService } from './task-safety.service';
import { TasksRepository } from '../maintenance-plans/tasks.repository';
import { DistributedLockService } from '../redis/distributed-lock.service';

const mockTasksRepository = {
  findStaleCompleted: jest.fn().mockResolvedValue([]),
  updateDueDateAndStatus: jest.fn().mockResolvedValue(undefined),
};

const mockLockService = {
  withLock: jest.fn().mockImplementation(async (_key, _ttl, fn) => {
    await fn({ lockLost: false });
  }),
};

describe('TaskSafetyService', () => {
  let service: TaskSafetyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskSafetyService,
        { provide: TasksRepository, useValue: mockTasksRepository },
        { provide: DistributedLockService, useValue: mockLockService },
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
  });
});
