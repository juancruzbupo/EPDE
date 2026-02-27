import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MaintenancePlansRepository } from './maintenance-plans.repository';
import { TasksRepository } from './tasks.repository';
import { TaskLogsRepository } from './task-logs.repository';
import { TaskNotesRepository } from './task-notes.repository';
import type {
  UpdatePlanInput,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTasksInput,
  CompleteTaskInput,
  CreateTaskNoteInput,
} from '@epde/shared';
import { recurrenceTypeToMonths, getNextDueDate, UserRole } from '@epde/shared';
import type { Task } from '@prisma/client';

@Injectable()
export class MaintenancePlansService {
  constructor(
    private readonly plansRepository: MaintenancePlansRepository,
    private readonly tasksRepository: TasksRepository,
    private readonly taskLogsRepository: TaskLogsRepository,
    private readonly taskNotesRepository: TaskNotesRepository,
  ) {}

  private async assertTaskAccess(
    taskId: string,
    user?: { id: string; role: string },
  ): Promise<Task> {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Tarea no encontrada');

    if (user?.role === UserRole.CLIENT) {
      const plan = await this.plansRepository.findWithProperty(task.maintenancePlanId);
      if (plan?.property?.userId !== user.id) {
        throw new ForbiddenException('No tenés acceso a esta tarea');
      }
    }

    return task;
  }

  async getPlan(id: string, currentUser?: { id: string; role: string }) {
    const plan = await this.plansRepository.findWithFullDetails(id);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }

    if (currentUser?.role === UserRole.CLIENT) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const property = (plan as any).property;
      if (property?.userId !== currentUser.id) {
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

  async addTask(
    planId: string,
    dto: Omit<CreateTaskInput, 'maintenancePlanId'>,
    createdBy?: string,
  ) {
    const plan = await this.plansRepository.findById(planId);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }

    const maxOrder = await this.tasksRepository.getMaxOrder(planId);

    return this.tasksRepository.create(
      {
        maintenancePlan: { connect: { id: planId } },
        category: { connect: { id: dto.categoryId } },
        name: dto.name,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        recurrenceType: dto.recurrenceType ?? 'ANNUAL',
        recurrenceMonths:
          dto.recurrenceType === 'CUSTOM'
            ? dto.recurrenceMonths
            : (recurrenceTypeToMonths(dto.recurrenceType ?? 'ANNUAL') ?? 12),
        nextDueDate: dto.nextDueDate,
        order: maxOrder + 1,
        status: 'PENDING',
        createdBy,
      },
      { category: true },
    );
  }

  async updateTask(taskId: string, dto: UpdateTaskInput, updatedBy?: string) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { ...dto, ...(updatedBy && { updatedBy }) };
    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
      delete data.categoryId;
    }

    return this.tasksRepository.update(taskId, data, { category: true });
  }

  async removeTask(taskId: string) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    await this.tasksRepository.softDelete(taskId);
    return { message: 'Tarea eliminada' };
  }

  async reorderTasks(planId: string, dto: ReorderTasksInput) {
    const plan = await this.plansRepository.findById(planId);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }

    await this.tasksRepository.reorderBatch(dto.tasks);

    return this.tasksRepository.findByPlanId(planId);
  }

  async getTaskDetail(taskId: string, user?: { id: string; role: string }) {
    await this.assertTaskAccess(taskId, user);
    const task = await this.tasksRepository.findWithDetails(taskId);

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    return task;
  }

  async completeTask(
    taskId: string,
    userId: string,
    dto: CompleteTaskInput,
    user?: { id: string; role: string },
  ) {
    const task = await this.assertTaskAccess(taskId, user);

    const recurrenceMonths =
      task.recurrenceMonths ?? recurrenceTypeToMonths(task.recurrenceType) ?? 12;
    const newDueDate = getNextDueDate(task.nextDueDate, recurrenceMonths);

    return this.tasksRepository.completeAndReschedule(
      taskId,
      userId,
      dto.notes,
      dto.photoUrl,
      newDueDate,
    );
  }

  async getTaskLogs(taskId: string, user?: { id: string; role: string }) {
    await this.assertTaskAccess(taskId, user);
    return this.taskLogsRepository.findByTaskId(taskId);
  }

  async addTaskNote(
    taskId: string,
    userId: string,
    dto: CreateTaskNoteInput,
    user?: { id: string; role: string },
  ) {
    await this.assertTaskAccess(taskId, user);
    return this.taskNotesRepository.createForTask(taskId, userId, dto.content);
  }

  async getTaskNotes(taskId: string, user?: { id: string; role: string }) {
    await this.assertTaskAccess(taskId, user);
    return this.taskNotesRepository.findByTaskId(taskId);
  }
}
