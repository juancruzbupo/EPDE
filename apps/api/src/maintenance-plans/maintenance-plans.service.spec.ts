import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MaintenancePlansService } from './maintenance-plans.service';
import { MaintenancePlansRepository } from './maintenance-plans.repository';
import { TasksRepository } from './tasks.repository';
import { TaskLogsRepository } from './task-logs.repository';
import { TaskNotesRepository } from './task-notes.repository';
import { UserRole } from '@epde/shared';

describe('MaintenancePlansService', () => {
  let service: MaintenancePlansService;
  let plansRepository: {
    findById: jest.Mock;
    findWithProperty: jest.Mock;
    findWithFullDetails: jest.Mock;
    update: jest.Mock;
  };
  let tasksRepository: {
    findById: jest.Mock;
    findWithDetails: jest.Mock;
    findByPlanId: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
    getMaxOrder: jest.Mock;
    reorderBatch: jest.Mock;
    completeAndReschedule: jest.Mock;
  };
  let taskLogsRepository: {
    findByTaskId: jest.Mock;
  };
  let taskNotesRepository: {
    findByTaskId: jest.Mock;
    createForTask: jest.Mock;
  };

  const clientUser = { id: 'client-1', role: UserRole.CLIENT };
  const adminUser = { id: 'admin-1', role: UserRole.ADMIN };

  beforeEach(async () => {
    plansRepository = {
      findById: jest.fn(),
      findWithProperty: jest.fn(),
      findWithFullDetails: jest.fn(),
      update: jest.fn(),
    };

    tasksRepository = {
      findById: jest.fn(),
      findWithDetails: jest.fn(),
      findByPlanId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      getMaxOrder: jest.fn(),
      reorderBatch: jest.fn(),
      completeAndReschedule: jest.fn(),
    };

    taskLogsRepository = {
      findByTaskId: jest.fn(),
    };

    taskNotesRepository = {
      findByTaskId: jest.fn(),
      createForTask: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenancePlansService,
        { provide: MaintenancePlansRepository, useValue: plansRepository },
        { provide: TasksRepository, useValue: tasksRepository },
        { provide: TaskLogsRepository, useValue: taskLogsRepository },
        { provide: TaskNotesRepository, useValue: taskNotesRepository },
      ],
    }).compile();

    service = module.get<MaintenancePlansService>(MaintenancePlansService);
  });

  describe('getPlan', () => {
    it('should return plan for admin', async () => {
      const plan = {
        id: 'plan-1',
        propertyId: 'prop-1',
        property: { userId: 'someone-else' },
        tasks: [],
      };
      plansRepository.findWithFullDetails.mockResolvedValue(plan);

      const result = await service.getPlan('plan-1', adminUser);

      expect(result).toEqual(plan);
      expect(plansRepository.findWithFullDetails).toHaveBeenCalledWith('plan-1');
    });

    it('should return plan when client is the property owner', async () => {
      const plan = {
        id: 'plan-1',
        propertyId: 'prop-1',
        property: { userId: clientUser.id },
        tasks: [],
      };
      plansRepository.findWithFullDetails.mockResolvedValue(plan);

      const result = await service.getPlan('plan-1', clientUser);

      expect(result).toEqual(plan);
    });

    it('should throw NotFoundException when plan not found', async () => {
      plansRepository.findWithFullDetails.mockResolvedValue(null);

      await expect(service.getPlan('nonexistent', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when client accesses another users plan', async () => {
      const plan = {
        id: 'plan-1',
        propertyId: 'prop-1',
        property: { userId: 'other-user' },
        tasks: [],
      };
      plansRepository.findWithFullDetails.mockResolvedValue(plan);

      await expect(service.getPlan('plan-1', clientUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getTaskDetail', () => {
    it('should return task with details for admin', async () => {
      const task = {
        id: 'task-1',
        maintenancePlanId: 'plan-1',
        name: 'Revisar techo',
      };
      const taskWithDetails = {
        ...task,
        category: { id: 'cat-1', name: 'Techos' },
        taskLogs: [],
        taskNotes: [],
      };
      tasksRepository.findById.mockResolvedValue(task);
      tasksRepository.findWithDetails.mockResolvedValue(taskWithDetails);

      const result = await service.getTaskDetail('task-1', adminUser);

      expect(result).toEqual(taskWithDetails);
      expect(tasksRepository.findById).toHaveBeenCalledWith('task-1');
      expect(tasksRepository.findWithDetails).toHaveBeenCalledWith('task-1');
    });

    it('should throw NotFoundException when task not found in assertTaskAccess', async () => {
      tasksRepository.findById.mockResolvedValue(null);

      await expect(service.getTaskDetail('nonexistent', adminUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when client accesses another users task', async () => {
      const task = { id: 'task-1', maintenancePlanId: 'plan-1' };
      tasksRepository.findById.mockResolvedValue(task);
      plansRepository.findWithProperty.mockResolvedValue({
        id: 'plan-1',
        property: { userId: 'other-user' },
      });

      await expect(service.getTaskDetail('task-1', clientUser)).rejects.toThrow(ForbiddenException);
    });

    it('should allow client to access own task', async () => {
      const task = { id: 'task-1', maintenancePlanId: 'plan-1' };
      const taskWithDetails = {
        ...task,
        category: { id: 'cat-1', name: 'Techos' },
        taskLogs: [],
        taskNotes: [],
      };
      tasksRepository.findById.mockResolvedValue(task);
      plansRepository.findWithProperty.mockResolvedValue({
        id: 'plan-1',
        property: { userId: clientUser.id },
      });
      tasksRepository.findWithDetails.mockResolvedValue(taskWithDetails);

      const result = await service.getTaskDetail('task-1', clientUser);

      expect(result).toEqual(taskWithDetails);
    });
  });

  describe('completeTask', () => {
    const dto = {
      result: 'OK' as const,
      conditionFound: 'GOOD' as const,
      executor: 'OWNER' as const,
      actionTaken: 'INSPECTION_ONLY' as const,
      note: 'Todo en orden',
    };

    it('should complete task and reschedule with new due date', async () => {
      const task = {
        id: 'task-1',
        maintenancePlanId: 'plan-1',
        recurrenceType: 'ANNUAL',
        recurrenceMonths: 12,
        nextDueDate: new Date('2026-03-01'),
      };
      tasksRepository.findById.mockResolvedValue(task);

      const completedResult = {
        task: { ...task, status: 'PENDING', nextDueDate: new Date('2027-03-01') },
        log: { id: 'log-1', taskId: 'task-1' },
      };
      tasksRepository.completeAndReschedule.mockResolvedValue(completedResult);

      const result = await service.completeTask('task-1', 'user-1', dto, adminUser);

      expect(result).toEqual(completedResult);
      expect(tasksRepository.completeAndReschedule).toHaveBeenCalledWith(
        'task-1',
        'user-1',
        dto,
        expect.any(Date),
      );
    });

    it('should pass null due date for ON_DETECTION tasks', async () => {
      const task = {
        id: 'task-1',
        maintenancePlanId: 'plan-1',
        recurrenceType: 'ON_DETECTION',
        recurrenceMonths: null,
        nextDueDate: null,
      };
      tasksRepository.findById.mockResolvedValue(task);

      const completedResult = {
        task: { ...task, status: 'PENDING' },
        log: { id: 'log-1', taskId: 'task-1' },
      };
      tasksRepository.completeAndReschedule.mockResolvedValue(completedResult);

      await service.completeTask('task-1', 'user-1', dto, adminUser);

      expect(tasksRepository.completeAndReschedule).toHaveBeenCalledWith(
        'task-1',
        'user-1',
        dto,
        null,
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      tasksRepository.findById.mockResolvedValue(null);

      await expect(service.completeTask('nonexistent', 'user-1', dto, adminUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addTaskNote', () => {
    it('should create note for the task', async () => {
      const task = { id: 'task-1', maintenancePlanId: 'plan-1' };
      tasksRepository.findById.mockResolvedValue(task);

      const createdNote = {
        id: 'note-1',
        taskId: 'task-1',
        authorId: 'user-1',
        content: 'Nota de prueba',
        author: { id: 'user-1', name: 'Admin' },
      };
      taskNotesRepository.createForTask.mockResolvedValue(createdNote);

      const result = await service.addTaskNote(
        'task-1',
        'user-1',
        { content: 'Nota de prueba' },
        adminUser,
      );

      expect(result).toEqual(createdNote);
      expect(taskNotesRepository.createForTask).toHaveBeenCalledWith(
        'task-1',
        'user-1',
        'Nota de prueba',
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      tasksRepository.findById.mockResolvedValue(null);

      await expect(
        service.addTaskNote('nonexistent', 'user-1', { content: 'Nota' }, adminUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addTask', () => {
    const dto = {
      categoryId: 'cat-1',
      name: 'Revisar canaletas',
      description: 'Limpieza de canaletas',
      priority: 'HIGH' as const,
      recurrenceType: 'SEMI_ANNUAL' as const,
      nextDueDate: new Date('2026-06-01'),
    };

    it('should create task with correct order', async () => {
      plansRepository.findById.mockResolvedValue({ id: 'plan-1' });
      tasksRepository.getMaxOrder.mockResolvedValue(2);

      const createdTask = {
        id: 'task-new',
        maintenancePlanId: 'plan-1',
        name: dto.name,
        order: 3,
      };
      tasksRepository.create.mockResolvedValue(createdTask);

      const result = await service.addTask('plan-1', dto, 'admin-1');

      expect(result).toEqual(createdTask);
      expect(tasksRepository.getMaxOrder).toHaveBeenCalledWith('plan-1');
      expect(tasksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
          order: 3,
          status: 'PENDING',
          createdBy: 'admin-1',
        }),
        { category: true },
      );
    });

    it('should throw NotFoundException if plan not found', async () => {
      plansRepository.findById.mockResolvedValue(null);

      await expect(service.addTask('nonexistent', dto, 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(tasksRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('removeTask', () => {
    it('should soft delete the task', async () => {
      tasksRepository.findById.mockResolvedValue({ id: 'task-1' });
      tasksRepository.softDelete.mockResolvedValue(undefined);

      const result = await service.removeTask('task-1');

      expect(result).toEqual({ message: 'Tarea eliminada' });
      expect(tasksRepository.softDelete).toHaveBeenCalledWith('task-1');
    });

    it('should throw NotFoundException when task not found', async () => {
      tasksRepository.findById.mockResolvedValue(null);

      await expect(service.removeTask('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
