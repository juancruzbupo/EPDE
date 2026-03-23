import {
  ProfessionalRequirement,
  RecurrenceType,
  TaskPriority,
  TaskStatus,
  TaskType,
  UserRole,
} from '@epde/shared';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CategoryTemplatesRepository } from '../category-templates/category-templates.repository';
import { MaintenancePlansRepository } from '../maintenance-plans/maintenance-plans.repository';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskAuditLogRepository } from './task-audit-log.repository';
import { TaskLifecycleService } from './task-lifecycle.service';
import { TasksRepository } from './tasks.repository';

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

const mockCategoryTemplatesRepository = {
  findByIdWithTasks: jest.fn(),
};

const mockNotificationsHandler = {
  handleProblemDetected: jest.fn(),
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
        { provide: CategoryTemplatesRepository, useValue: mockCategoryTemplatesRepository },
        { provide: NotificationsHandlerService, useValue: mockNotificationsHandler },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            task: { createMany: jest.fn() },
          },
        },
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
        recurrenceType: RecurrenceType.ANNUAL,
        priority: TaskPriority.MEDIUM,
        taskType: TaskType.INSPECTION,
        professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
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
            taskType: TaskType.INSPECTION,
            professionalRequirement: ProfessionalRequirement.OWNER_CAN_DO,
            recurrenceType: RecurrenceType.ANNUAL,
            priority: TaskPriority.MEDIUM,
          },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTask', () => {
    it('should update task data', async () => {
      const planId = 'plan-1';
      const taskId = 'task-1';
      const dto = { name: 'Updated name' } as never;
      const existingTask = { id: taskId, name: 'Old name', maintenancePlanId: planId };
      const updatedTask = { id: taskId, name: 'Updated name' };

      mockTasksRepository.findById.mockResolvedValue(existingTask);
      mockTasksRepository.update.mockResolvedValue(updatedTask);

      const result = await service.updateTask(planId, taskId, dto, 'user-1');

      expect(mockTasksRepository.findById).toHaveBeenCalledWith(taskId);
      expect(mockTasksRepository.update).toHaveBeenCalled();
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockTasksRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateTask('plan-1', 'non-existent', {} as never, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when task does not belong to plan', async () => {
      const existingTask = { id: 'task-1', maintenancePlanId: 'other-plan' };
      mockTasksRepository.findById.mockResolvedValue(existingTask);

      await expect(service.updateTask('plan-1', 'task-1', {} as never, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeTask', () => {
    it('should soft delete task', async () => {
      const planId = 'plan-1';
      const taskId = 'task-1';
      const existingTask = { id: taskId, maintenancePlanId: planId };

      mockTasksRepository.findById.mockResolvedValue(existingTask);
      mockTasksRepository.softDelete.mockResolvedValue(existingTask);

      await service.removeTask(planId, taskId);

      expect(mockTasksRepository.softDelete).toHaveBeenCalledWith(taskId);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockTasksRepository.findById.mockResolvedValue(null);

      await expect(service.removeTask('plan-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when task does not belong to plan', async () => {
      const existingTask = { id: 'task-1', maintenancePlanId: 'other-plan' };
      mockTasksRepository.findById.mockResolvedValue(existingTask);

      await expect(service.removeTask('plan-1', 'task-1')).rejects.toThrow(NotFoundException);
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
        status: TaskStatus.PENDING,
        recurrenceType: RecurrenceType.ANNUAL,
        recurrenceMonths: 12,
        nextDueDate: new Date(Date.now() - 30 * 86_400_000),
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
        role: UserRole.ADMIN,
      });

      expect(mockTasksRepository.completeAndReschedule).toHaveBeenCalledWith(
        taskId,
        userId,
        dto,
        expect.any(Date),
      );
      expect(result).toEqual({ ...completionResult, problemDetected: false });
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
        status: TaskStatus.OVERDUE,
        recurrenceType: RecurrenceType.ON_DETECTION,
        recurrenceMonths: null,
        nextDueDate: null,
        maintenancePlanId: 'plan-1',
      };

      mockTasksRepository.findById.mockResolvedValue(task);
      mockTasksRepository.completeAndReschedule.mockResolvedValue({ task, log: {} });

      await service.completeTask(taskId, userId, dto as never, {
        id: userId,
        role: UserRole.ADMIN,
      });

      expect(mockTasksRepository.completeAndReschedule).toHaveBeenCalledWith(
        taskId,
        userId,
        dto,
        null,
      );
    });

    it('should throw BadRequestException when task is not in a completable status', async () => {
      const task = {
        id: 'task-1',
        status: TaskStatus.COMPLETED,
        maintenancePlanId: 'plan-1',
        recurrenceType: RecurrenceType.ANNUAL,
        nextDueDate: new Date(),
        recurrenceMonths: 12,
      };
      mockTasksRepository.findById.mockResolvedValue(task);

      await expect(
        service.completeTask('task-1', 'user-1', {} as never, {
          id: 'user-1',
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockTasksRepository.completeAndReschedule).not.toHaveBeenCalled();
    });
  });

  describe('verifyTaskAccess', () => {
    it('should return task when ADMIN accesses any task', async () => {
      const task = { id: 'task-1', maintenancePlanId: 'plan-1', status: TaskStatus.PENDING };
      mockTasksRepository.findById.mockResolvedValue(task);

      const result = await service.verifyTaskAccess('task-1', {
        id: 'admin-1',
        role: UserRole.ADMIN,
      });

      expect(result).toEqual(task);
      expect(mockPlansRepository.findWithProperty).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when client accesses task from another user', async () => {
      const taskId = 'task-1';
      const task = {
        id: taskId,
        status: TaskStatus.PENDING,
        maintenancePlanId: 'plan-1',
      };

      mockTasksRepository.findById.mockResolvedValue(task);
      mockPlansRepository.findWithProperty.mockResolvedValue({
        property: { userId: 'other-user' },
      });

      await expect(
        service.verifyTaskAccess(taskId, { id: 'client-user', role: UserRole.CLIENT }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return task when CLIENT owns the property', async () => {
      const task = { id: 'task-1', maintenancePlanId: 'plan-1', status: TaskStatus.PENDING };
      mockTasksRepository.findById.mockResolvedValue(task);
      mockPlansRepository.findWithProperty.mockResolvedValue({
        property: { userId: 'client-user' },
      });

      const result = await service.verifyTaskAccess('task-1', {
        id: 'client-user',
        role: UserRole.CLIENT,
      });

      expect(result).toEqual(task);
    });
  });
});
