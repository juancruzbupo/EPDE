import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MaintenancePlansRepository } from './maintenance-plans.repository';
import { TasksRepository } from './tasks.repository';
import { TaskLifecycleService } from './task-lifecycle.service';
import { TaskNotesService } from './task-notes.service';
import type {
  UpdatePlanInput,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTasksInput,
  CompleteTaskInput,
  CreateTaskNoteInput,
} from '@epde/shared';
import { UserRole } from '@epde/shared';

@Injectable()
export class MaintenancePlansService {
  constructor(
    private readonly plansRepository: MaintenancePlansRepository,
    private readonly tasksRepository: TasksRepository,
    private readonly taskLifecycleService: TaskLifecycleService,
    private readonly taskNotesService: TaskNotesService,
  ) {}

  async listPlans(currentUser?: { id: string; role: string }) {
    const userId = currentUser?.role === UserRole.CLIENT ? currentUser.id : undefined;
    return this.plansRepository.findAll(userId);
  }

  async listAllTasks(currentUser?: { id: string; role: string }, status?: string, take?: number) {
    const userId = currentUser?.role === UserRole.CLIENT ? currentUser.id : undefined;
    return this.tasksRepository.findAllForList(userId, status, take);
  }

  async getPlan(id: string, currentUser?: { id: string; role: string }) {
    const plan = await this.plansRepository.findWithFullDetails(id);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }

    if (currentUser?.role === UserRole.CLIENT) {
      const planWithProperty = plan as { property?: { userId?: string } | null };
      if (planWithProperty.property?.userId !== currentUser.id) {
        throw new ForbiddenException('No tenés acceso a este plan');
      }
    }

    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanInput, updatedBy?: string) {
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }
    return this.plansRepository.update(id, { ...dto, ...(updatedBy && { updatedBy }) });
  }

  addTask(planId: string, dto: Omit<CreateTaskInput, 'maintenancePlanId'>, updatedBy?: string) {
    return this.taskLifecycleService.addTask(planId, dto, updatedBy);
  }

  updateTask(taskId: string, dto: UpdateTaskInput, updatedBy?: string) {
    return this.taskLifecycleService.updateTask(taskId, dto, updatedBy);
  }

  removeTask(taskId: string) {
    return this.taskLifecycleService.removeTask(taskId);
  }

  reorderTasks(planId: string, dto: ReorderTasksInput) {
    return this.taskLifecycleService.reorderTasks(planId, dto);
  }

  completeTask(
    taskId: string,
    userId: string,
    dto: CompleteTaskInput,
    user?: { id: string; role: string },
  ) {
    return this.taskLifecycleService.completeTask(taskId, userId, dto, user);
  }

  async getTaskDetail(taskId: string, user?: { id: string; role: string }) {
    await this.assertTaskAccess(taskId, user);
    return this.taskNotesService.getTaskDetail(taskId);
  }

  async getTaskLogs(taskId: string, user?: { id: string; role: string }) {
    await this.assertTaskAccess(taskId, user);
    return this.taskNotesService.getTaskLogs(taskId);
  }

  async getTaskNotes(taskId: string, user?: { id: string; role: string }) {
    await this.assertTaskAccess(taskId, user);
    return this.taskNotesService.getTaskNotes(taskId);
  }

  async addTaskNote(
    taskId: string,
    userId: string,
    dto: CreateTaskNoteInput,
    user?: { id: string; role: string },
  ) {
    await this.assertTaskAccess(taskId, user);
    return this.taskNotesService.addTaskNote(taskId, userId, dto);
  }

  private async assertTaskAccess(
    taskId: string,
    user?: { id: string; role: string },
  ): Promise<void> {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Tarea no encontrada');

    if (user?.role === UserRole.CLIENT) {
      const plan = await this.plansRepository.findWithProperty(task.maintenancePlanId);
      if (plan?.property?.userId !== user.id) {
        throw new ForbiddenException('No tenés acceso a esta tarea');
      }
    }
  }
}
