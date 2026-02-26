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

@Injectable()
export class MaintenancePlansService {
  constructor(
    private readonly plansRepository: MaintenancePlansRepository,
    private readonly tasksRepository: TasksRepository,
    private readonly taskLogsRepository: TaskLogsRepository,
    private readonly taskNotesRepository: TaskNotesRepository,
  ) {}

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

  async updatePlan(id: string, dto: UpdatePlanInput) {
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }
    return this.plansRepository.update(id, dto);
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
            : recurrenceTypeToMonths(dto.recurrenceType ?? 'ANNUAL'),
        nextDueDate: dto.nextDueDate,
        order: maxOrder + 1,
        status: 'PENDING',
        createdBy,
      },
      { category: true },
    );
  }

  async updateTask(taskId: string, dto: UpdateTaskInput) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = { ...dto };
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

  async getTaskDetail(taskId: string) {
    const task = await this.tasksRepository.findWithDetails(taskId);

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    return task;
  }

  async completeTask(taskId: string, userId: string, dto: CompleteTaskInput) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    const recurrenceMonths = task.recurrenceMonths ?? recurrenceTypeToMonths(task.recurrenceType);
    const newDueDate = getNextDueDate(task.nextDueDate, recurrenceMonths);

    return this.tasksRepository.completeAndReschedule(
      taskId,
      userId,
      dto.notes,
      dto.photoUrl,
      newDueDate,
    );
  }

  async getTaskLogs(taskId: string) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return this.taskLogsRepository.findByTaskId(taskId);
  }

  async addTaskNote(taskId: string, userId: string, dto: CreateTaskNoteInput) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    return this.taskNotesRepository.createForTask(taskId, userId, dto.content);
  }

  async getTaskNotes(taskId: string) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return this.taskNotesRepository.findByTaskId(taskId);
  }
}
