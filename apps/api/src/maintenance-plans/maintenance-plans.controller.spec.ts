import type { CurrentUser as CurrentUserPayload } from '@epde/shared';
import { TaskStatus, UserRole } from '@epde/shared';
import { Test, TestingModule } from '@nestjs/testing';

import { TaskLifecycleService } from '../tasks/task-lifecycle.service';
import { TaskNotesService } from '../tasks/task-notes.service';
import { MaintenancePlansController } from './maintenance-plans.controller';
import { MaintenancePlansService } from './maintenance-plans.service';

const mockPlansService = {
  listPlans: jest.fn(),
  getPlan: jest.fn(),
  updatePlan: jest.fn(),
};

const mockTaskLifecycle = {
  listAllTasks: jest.fn(),
  addTask: jest.fn(),
  reorderTasks: jest.fn(),
  updateTask: jest.fn(),
  removeTask: jest.fn(),
  verifyTaskAccess: jest.fn(),
  completeTask: jest.fn(),
};

const mockTaskNotes = {
  getTaskDetail: jest.fn(),
  getTaskLogs: jest.fn(),
  addTaskNote: jest.fn(),
  getTaskNotes: jest.fn(),
};

const adminUser: CurrentUserPayload = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  email: 'admin@epde.ar',
  jti: 'jti-admin-1',
};

const clientUser: CurrentUserPayload = {
  id: 'client-1',
  role: UserRole.CLIENT,
  email: 'client@epde.ar',
  jti: 'jti-client-1',
};

const planId = 'plan-uuid-1';
const taskId = 'task-uuid-1';

describe('MaintenancePlansController', () => {
  let controller: MaintenancePlansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenancePlansController],
      providers: [
        { provide: MaintenancePlansService, useValue: mockPlansService },
        { provide: TaskLifecycleService, useValue: mockTaskLifecycle },
        { provide: TaskNotesService, useValue: mockTaskNotes },
      ],
    }).compile();

    controller = module.get<MaintenancePlansController>(MaintenancePlansController);
    jest.clearAllMocks();
  });

  describe('listPlans', () => {
    it('should call plansService.listPlans with the current user and return wrapped data', async () => {
      const plans = [{ id: planId, status: 'ACTIVE' }];
      mockPlansService.listPlans.mockResolvedValue(plans);

      const result = await controller.listPlans(clientUser);

      expect(mockPlansService.listPlans).toHaveBeenCalledWith(clientUser);
      expect(result).toEqual({ data: plans });
    });
  });

  describe('listAllTasks', () => {
    it('should pass userId for CLIENT role', async () => {
      const tasks = [{ id: taskId }];
      mockTaskLifecycle.listAllTasks.mockResolvedValue(tasks);

      const result = await controller.listAllTasks(clientUser, { status: undefined, take: 20 });

      expect(mockTaskLifecycle.listAllTasks).toHaveBeenCalledWith('client-1', undefined, 20);
      expect(result).toEqual({ data: tasks });
    });

    it('should pass undefined userId for ADMIN role', async () => {
      const tasks = [{ id: taskId }];
      mockTaskLifecycle.listAllTasks.mockResolvedValue(tasks);

      await controller.listAllTasks(adminUser, { status: TaskStatus.PENDING, take: 50 });

      expect(mockTaskLifecycle.listAllTasks).toHaveBeenCalledWith(
        undefined,
        TaskStatus.PENDING,
        50,
      );
    });
  });

  describe('getPlan', () => {
    it('should call plansService.getPlan with id and user and return wrapped data', async () => {
      const plan = { id: planId, status: 'ACTIVE' };
      mockPlansService.getPlan.mockResolvedValue(plan);

      const result = await controller.getPlan(planId, clientUser);

      expect(mockPlansService.getPlan).toHaveBeenCalledWith(planId, clientUser);
      expect(result).toEqual({ data: plan });
    });
  });

  describe('updatePlan', () => {
    it('should call plansService.updatePlan with id, dto and userId and return message', async () => {
      const dto = { name: 'Plan actualizado' };
      const updatedPlan = { id: planId, name: 'Plan actualizado' };
      mockPlansService.updatePlan.mockResolvedValue(updatedPlan);

      const result = await controller.updatePlan(planId, dto as any, adminUser);

      expect(mockPlansService.updatePlan).toHaveBeenCalledWith(planId, dto, adminUser.id);
      expect(result).toEqual({ data: updatedPlan, message: 'Plan de mantenimiento actualizado' });
    });
  });

  describe('addTask', () => {
    it('should call taskLifecycle.addTask with planId, dto and userId and return message', async () => {
      const dto = { title: 'Revisar techo', recurrenceType: 'ANNUAL' };
      const createdTask = { id: taskId, title: 'Revisar techo' };
      mockTaskLifecycle.addTask.mockResolvedValue(createdTask);

      const result = await controller.addTask(planId, dto as any, adminUser);

      expect(mockTaskLifecycle.addTask).toHaveBeenCalledWith(planId, dto, adminUser.id);
      expect(result).toEqual({ data: createdTask, message: 'Tarea agregada' });
    });
  });

  describe('reorderTasks', () => {
    it('should call taskLifecycle.reorderTasks with planId and dto and return message', async () => {
      const dto = { taskIds: [taskId, 'task-uuid-2'] };
      const reorderResult = { success: true };
      mockTaskLifecycle.reorderTasks.mockResolvedValue(reorderResult);

      const result = await controller.reorderTasks(planId, dto as any);

      expect(mockTaskLifecycle.reorderTasks).toHaveBeenCalledWith(planId, dto);
      expect(result).toEqual({ data: reorderResult, message: 'Orden de tareas actualizado' });
    });
  });

  describe('updateTask', () => {
    it('should call taskLifecycle.updateTask with planId, taskId, dto and userId and return message', async () => {
      const dto = { title: 'Tarea modificada' };
      const updatedTask = { id: taskId, title: 'Tarea modificada' };
      mockTaskLifecycle.updateTask.mockResolvedValue(updatedTask);

      const result = await controller.updateTask(planId, taskId, dto as any, adminUser);

      expect(mockTaskLifecycle.updateTask).toHaveBeenCalledWith(planId, taskId, dto, adminUser.id);
      expect(result).toEqual({ data: updatedTask, message: 'Tarea actualizada' });
    });
  });

  describe('removeTask', () => {
    it('should call taskLifecycle.removeTask with planId and taskId and return service result', async () => {
      const removeResult = { data: null, message: 'Tarea eliminada' };
      mockTaskLifecycle.removeTask.mockResolvedValue(removeResult);

      const result = await controller.removeTask(planId, taskId);

      expect(mockTaskLifecycle.removeTask).toHaveBeenCalledWith(planId, taskId);
      expect(result).toEqual(removeResult);
    });
  });

  describe('getTaskDetail', () => {
    it('should verify access then fetch task detail and return wrapped data', async () => {
      const task = { id: taskId, title: 'Revisar techo', notes: [] };
      mockTaskLifecycle.verifyTaskAccess.mockResolvedValue({ id: taskId });
      mockTaskNotes.getTaskDetail.mockResolvedValue(task);

      const result = await controller.getTaskDetail(taskId, clientUser);

      expect(mockTaskLifecycle.verifyTaskAccess).toHaveBeenCalledWith(taskId, clientUser);
      expect(mockTaskNotes.getTaskDetail).toHaveBeenCalledWith(taskId);
      expect(result).toEqual({ data: task });
    });
  });

  describe('completeTask', () => {
    it('should call taskLifecycle.completeTask with taskId, userId, dto and user and return message', async () => {
      const dto = { notes: 'Completada sin novedad' };
      const completedTask = { id: taskId, status: 'COMPLETED' };
      mockTaskLifecycle.completeTask.mockResolvedValue(completedTask);

      const result = await controller.completeTask(taskId, dto as any, clientUser);

      expect(mockTaskLifecycle.completeTask).toHaveBeenCalledWith(
        taskId,
        clientUser.id,
        dto,
        clientUser,
      );
      expect(result).toEqual({ data: completedTask, message: 'Tarea completada' });
    });
  });

  describe('getTaskLogs', () => {
    it('should verify access then fetch task logs and return wrapped data', async () => {
      const logs = [{ id: 'log-1', action: 'COMPLETED' }];
      mockTaskLifecycle.verifyTaskAccess.mockResolvedValue({ id: taskId });
      mockTaskNotes.getTaskLogs.mockResolvedValue(logs);

      const result = await controller.getTaskLogs(taskId, adminUser);

      expect(mockTaskLifecycle.verifyTaskAccess).toHaveBeenCalledWith(taskId, adminUser);
      expect(mockTaskNotes.getTaskLogs).toHaveBeenCalledWith(taskId);
      expect(result).toEqual({ data: logs });
    });
  });

  describe('addTaskNote', () => {
    it('should verify access then add note and return wrapped data with message', async () => {
      const dto = { content: 'Se revisó la instalación eléctrica' };
      const note = { id: 'note-1', content: dto.content };
      mockTaskLifecycle.verifyTaskAccess.mockResolvedValue({ id: taskId });
      mockTaskNotes.addTaskNote.mockResolvedValue(note);

      const result = await controller.addTaskNote(taskId, dto as any, clientUser);

      expect(mockTaskLifecycle.verifyTaskAccess).toHaveBeenCalledWith(taskId, clientUser);
      expect(mockTaskNotes.addTaskNote).toHaveBeenCalledWith(taskId, clientUser.id, dto);
      expect(result).toEqual({ data: note, message: 'Nota agregada' });
    });
  });

  describe('getTaskNotes', () => {
    it('should verify access then fetch notes and return wrapped data', async () => {
      const notes = [{ id: 'note-1', content: 'Primera nota' }];
      mockTaskLifecycle.verifyTaskAccess.mockResolvedValue({ id: taskId });
      mockTaskNotes.getTaskNotes.mockResolvedValue(notes);

      const result = await controller.getTaskNotes(taskId, clientUser);

      expect(mockTaskLifecycle.verifyTaskAccess).toHaveBeenCalledWith(taskId, clientUser);
      expect(mockTaskNotes.getTaskNotes).toHaveBeenCalledWith(taskId);
      expect(result).toEqual({ data: notes });
    });
  });
});
