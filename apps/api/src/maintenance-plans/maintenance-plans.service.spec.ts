import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { MaintenancePlansService } from './maintenance-plans.service';
import { MaintenancePlansRepository } from './maintenance-plans.repository';
import { TasksRepository } from './tasks.repository';
import { TaskLifecycleService } from './task-lifecycle.service';
import { TaskNotesService } from './task-notes.service';
import { UserRole } from '@epde/shared';

describe('MaintenancePlansService', () => {
  let service: MaintenancePlansService;
  let plansRepository: {
    findById: jest.Mock;
    findWithProperty: jest.Mock;
    findWithFullDetails: jest.Mock;
    findAll: jest.Mock;
    update: jest.Mock;
  };
  let tasksRepository: {
    findAllForList: jest.Mock;
  };
  let taskLifecycleService: {
    addTask: jest.Mock;
    updateTask: jest.Mock;
    removeTask: jest.Mock;
    reorderTasks: jest.Mock;
    completeTask: jest.Mock;
  };
  let taskNotesService: {
    getTaskDetail: jest.Mock;
    getTaskLogs: jest.Mock;
    getTaskNotes: jest.Mock;
    addTaskNote: jest.Mock;
  };

  const clientUser = { id: 'client-1', role: UserRole.CLIENT };
  const adminUser = { id: 'admin-1', role: UserRole.ADMIN };

  beforeEach(async () => {
    plansRepository = {
      findById: jest.fn(),
      findWithProperty: jest.fn(),
      findWithFullDetails: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    tasksRepository = {
      findAllForList: jest.fn(),
    };

    taskLifecycleService = {
      addTask: jest.fn(),
      updateTask: jest.fn(),
      removeTask: jest.fn(),
      reorderTasks: jest.fn(),
      completeTask: jest.fn(),
    };

    taskNotesService = {
      getTaskDetail: jest.fn(),
      getTaskLogs: jest.fn(),
      getTaskNotes: jest.fn(),
      addTaskNote: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenancePlansService,
        { provide: MaintenancePlansRepository, useValue: plansRepository },
        { provide: TasksRepository, useValue: tasksRepository },
        { provide: TaskLifecycleService, useValue: taskLifecycleService },
        { provide: TaskNotesService, useValue: taskNotesService },
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
    it('should delegate to TaskNotesService', async () => {
      const taskWithDetails = {
        id: 'task-1',
        maintenancePlanId: 'plan-1',
        name: 'Revisar techo',
        category: { id: 'cat-1', name: 'Techos' },
        taskLogs: [],
        taskNotes: [],
      };
      taskNotesService.getTaskDetail.mockResolvedValue(taskWithDetails);

      const result = await service.getTaskDetail('task-1', adminUser);

      expect(result).toEqual(taskWithDetails);
      expect(taskNotesService.getTaskDetail).toHaveBeenCalledWith('task-1');
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

    it('should delegate to TaskLifecycleService', async () => {
      const completedResult = {
        task: { id: 'task-1', status: 'PENDING' },
        log: { id: 'log-1', taskId: 'task-1' },
      };
      taskLifecycleService.completeTask.mockResolvedValue(completedResult);

      const result = await service.completeTask('task-1', 'user-1', dto, adminUser);

      expect(result).toEqual(completedResult);
      expect(taskLifecycleService.completeTask).toHaveBeenCalledWith(
        'task-1',
        'user-1',
        dto,
        adminUser,
      );
    });
  });

  describe('addTaskNote', () => {
    it('should delegate to TaskNotesService', async () => {
      const createdNote = {
        id: 'note-1',
        taskId: 'task-1',
        authorId: 'user-1',
        content: 'Nota de prueba',
        author: { id: 'user-1', name: 'Admin' },
      };
      taskNotesService.addTaskNote.mockResolvedValue(createdNote);

      const result = await service.addTaskNote(
        'task-1',
        'user-1',
        { content: 'Nota de prueba' },
        adminUser,
      );

      expect(result).toEqual(createdNote);
      expect(taskNotesService.addTaskNote).toHaveBeenCalledWith('task-1', 'user-1', {
        content: 'Nota de prueba',
      });
    });
  });

  describe('addTask', () => {
    const dto = {
      categoryId: 'cat-1',
      name: 'Revisar canaletas',
      description: 'Limpieza de canaletas',
      priority: 'HIGH' as const,
      taskType: 'INSPECTION' as const,
      professionalRequirement: 'OWNER_CAN_DO' as const,
      recurrenceType: 'BIANNUAL' as const,
      nextDueDate: new Date('2026-06-01'),
    };

    it('should delegate to TaskLifecycleService', async () => {
      const createdTask = {
        id: 'task-new',
        maintenancePlanId: 'plan-1',
        name: dto.name,
        order: 3,
      };
      taskLifecycleService.addTask.mockResolvedValue(createdTask);

      const result = await service.addTask('plan-1', dto, 'admin-1');

      expect(result).toEqual(createdTask);
      expect(taskLifecycleService.addTask).toHaveBeenCalledWith('plan-1', dto, 'admin-1');
    });
  });

  describe('removeTask', () => {
    it('should delegate to TaskLifecycleService', async () => {
      const deleteResult = { message: 'Tarea eliminada' };
      taskLifecycleService.removeTask.mockResolvedValue(deleteResult);

      const result = await service.removeTask('task-1');

      expect(result).toEqual(deleteResult);
      expect(taskLifecycleService.removeTask).toHaveBeenCalledWith('task-1');
    });
  });

  describe('updatePlan', () => {
    it('should update plan when found', async () => {
      const existingPlan = { id: 'plan-1', name: 'Plan original', status: 'ACTIVE' };
      const updatedPlan = { id: 'plan-1', name: 'Plan actualizado', status: 'ACTIVE' };
      plansRepository.findById.mockResolvedValue(existingPlan);
      plansRepository.update.mockResolvedValue(updatedPlan);

      const result = await service.updatePlan('plan-1', { name: 'Plan actualizado' }, 'admin-1');

      expect(result).toEqual(updatedPlan);
      expect(plansRepository.update).toHaveBeenCalledWith(
        'plan-1',
        expect.objectContaining({ name: 'Plan actualizado', updatedBy: 'admin-1' }),
      );
    });

    it('should throw NotFoundException when plan not found', async () => {
      plansRepository.findById.mockResolvedValue(null);

      await expect(service.updatePlan('nonexistent', {}, 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
