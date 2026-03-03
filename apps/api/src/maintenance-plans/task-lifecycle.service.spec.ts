import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TaskLifecycleService } from './task-lifecycle.service';
import { TasksRepository } from './tasks.repository';
import { MaintenancePlansRepository } from './maintenance-plans.repository';
import { TaskAuditLogRepository } from './task-audit-log.repository';

const mockTasksRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  getMaxOrder: jest.fn(),
  reorderBatch: jest.fn(),
  findByPlanId: jest.fn(),
  completeAndReschedule: jest.fn(),
};

const mockPlansRepository = {
  findById: jest.fn(),
  findWithProperty: jest.fn(),
};

const mockAuditLogRepository = {
  createAuditLog: jest.fn(),
};

describe('TaskLifecycleService', () => {
  let service: TaskLifecycleService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskLifecycleService,
        { provide: TasksRepository, useValue: mockTasksRepository },
        { provide: MaintenancePlansRepository, useValue: mockPlansRepository },
        { provide: TaskAuditLogRepository, useValue: mockAuditLogRepository },
      ],
    }).compile();

    service = module.get<TaskLifecycleService>(TaskLifecycleService);
  });

  describe('addTask', () => {
    it('should add task to plan', async () => {
      const planId = 'plan-1';
      const dto = {
        categoryId: 'cat-1',
        name: 'Inspección',
        recurrenceType: 'ANNUAL' as const,
        priority: 'MEDIUM' as const,
        taskType: 'INSPECTION' as const,
        professionalRequirement: 'OWNER_CAN_DO' as const,
      };
      const createdTask = { id: 'task-1', name: 'Inspección', order: 1 };

      mockPlansRepository.findById.mockResolvedValue({ id: planId });
      mockTasksRepository.getMaxOrder.mockResolvedValue(0);
      mockTasksRepository.create.mockResolvedValue(createdTask);

      const result = await service.addTask(planId, dto, 'user-1');

      expect(mockPlansRepository.findById).toHaveBeenCalledWith(planId);
      expect(mockTasksRepository.getMaxOrder).toHaveBeenCalledWith(planId);
      expect(mockTasksRepository.create).toHaveBeenCalled();
      expect(result).toEqual(createdTask);
    });

    it('should throw NotFoundException when plan does not exist', async () => {
      mockPlansRepository.findById.mockResolvedValue(null);

      await expect(
        service.addTask(
          'non-existent',
          {
            categoryId: 'cat-1',
            name: 'Test',
            taskType: 'INSPECTION' as const,
            professionalRequirement: 'OWNER_CAN_DO' as const,
            recurrenceType: 'ANNUAL' as const,
            priority: 'MEDIUM' as const,
          },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTask', () => {
    it('should update task data', async () => {
      const taskId = 'task-1';
      const dto = { name: 'Updated name' } as never;
      const existingTask = { id: taskId, name: 'Old name' };
      const updatedTask = { id: taskId, name: 'Updated name' };

      mockTasksRepository.findById.mockResolvedValue(existingTask);
      mockTasksRepository.update.mockResolvedValue(updatedTask);

      const result = await service.updateTask(taskId, dto, 'user-1');

      expect(mockTasksRepository.findById).toHaveBeenCalledWith(taskId);
      expect(mockTasksRepository.update).toHaveBeenCalled();
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockTasksRepository.findById.mockResolvedValue(null);

      await expect(service.updateTask('non-existent', {} as never, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeTask', () => {
    it('should soft delete task', async () => {
      const taskId = 'task-1';
      const existingTask = { id: taskId };

      mockTasksRepository.findById.mockResolvedValue(existingTask);
      mockTasksRepository.softDelete.mockResolvedValue(existingTask);

      const result = await service.removeTask(taskId);

      expect(mockTasksRepository.softDelete).toHaveBeenCalledWith(taskId);
      expect(result).toEqual({ message: 'Tarea eliminada' });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockTasksRepository.findById.mockResolvedValue(null);

      await expect(service.removeTask('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('completeTask', () => {
    it('should complete task and create log', async () => {
      const taskId = 'task-1';
      const userId = 'user-1';
      const dto = {
        result: 'OK' as const,
        conditionFound: 'GOOD' as const,
        executor: 'OWNER' as const,
        actionTaken: 'INSPECTION_ONLY' as const,
      };
      const task = {
        id: taskId,
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        nextDueDate: new Date('2025-01-01'),
        maintenancePlanId: 'plan-1',
      };
      const completionResult = { task: { id: taskId }, log: { id: 'log-1' } };

      mockTasksRepository.findById.mockResolvedValue(task);
      mockPlansRepository.findWithProperty.mockResolvedValue({
        property: { userId: 'user-1' },
      });
      mockTasksRepository.completeAndReschedule.mockResolvedValue(completionResult);

      const result = await service.completeTask(taskId, userId, dto as never, {
        id: userId,
        role: 'ADMIN',
      });

      expect(mockTasksRepository.completeAndReschedule).toHaveBeenCalledWith(
        taskId,
        userId,
        dto,
        expect.any(Date),
      );
      expect(result).toEqual(completionResult);
    });

    it('should complete ON_DETECTION task with null due date', async () => {
      const taskId = 'task-1';
      const userId = 'user-1';
      const dto = {
        result: 'OK' as const,
        conditionFound: 'GOOD' as const,
        executor: 'OWNER' as const,
        actionTaken: 'INSPECTION_ONLY' as const,
      };
      const task = {
        id: taskId,
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: null,
        nextDueDate: null,
        maintenancePlanId: 'plan-1',
      };

      mockTasksRepository.findById.mockResolvedValue(task);
      mockTasksRepository.completeAndReschedule.mockResolvedValue({ task, log: {} });

      await service.completeTask(taskId, userId, dto as never, { id: userId, role: 'ADMIN' });

      expect(mockTasksRepository.completeAndReschedule).toHaveBeenCalledWith(
        taskId,
        userId,
        dto,
        null,
      );
    });
  });

  describe('assertTaskAccess (via completeTask)', () => {
    it('should throw ForbiddenException when client accesses task from another user', async () => {
      const taskId = 'task-1';
      const task = {
        id: taskId,
        maintenancePlanId: 'plan-1',
        recurrenceType: 'ANNUAL',
        nextDueDate: new Date(),
        recurrenceMonths: 12,
      };

      mockTasksRepository.findById.mockResolvedValue(task);
      mockPlansRepository.findWithProperty.mockResolvedValue({
        property: { userId: 'other-user' },
      });

      await expect(
        service.completeTask(
          taskId,
          'client-user',
          {} as never,
          { id: 'client-user', role: 'CLIENT' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
