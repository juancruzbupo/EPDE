import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { MaintenancePlansRepository } from '../maintenance-plans/maintenance-plans.repository';
import { TaskAuditLogRepository } from './task-audit-log.repository';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTasksInput,
  CompleteTaskInput,
} from '@epde/shared';
import { recurrenceTypeToMonths, getNextDueDate, UserRole } from '@epde/shared';
import type { Task } from '@prisma/client';

type UpdateTaskData = Omit<UpdateTaskInput, 'categoryId'> & {
  updatedBy?: string;
  category?: { connect: { id: string } };
};

@Injectable()
export class TaskLifecycleService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly plansRepository: MaintenancePlansRepository,
    private readonly auditLogRepository: TaskAuditLogRepository,
  ) {}

  /**
   * Verifies that the given user has access to the task.
   * ADMINs always pass. CLIENTs must own the property the task belongs to.
   * Throws NotFoundException if task doesn't exist, ForbiddenException if access denied.
   */
  async verifyTaskAccess(taskId: string, user?: { id: string; role: string }): Promise<Task> {
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

  async listAllTasks(userId?: string, status?: string, take?: number) {
    return this.tasksRepository.findAllForList(userId, status, take);
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

    const before = { ...task }; // snapshot antes del update

    const data: UpdateTaskData = {
      ...(dto as Omit<UpdateTaskInput, 'categoryId'>),
      ...(updatedBy && { updatedBy }),
    };
    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
    }

    const updated = await this.tasksRepository.update(taskId, data, { category: true });

    if (updatedBy) {
      await this.auditLogRepository.createAuditLog(taskId, updatedBy, 'UPDATE', before, updated);
    }

    return updated;
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

  async completeTask(
    taskId: string,
    userId: string,
    dto: CompleteTaskInput,
    user?: { id: string; role: string },
  ) {
    const task = await this.verifyTaskAccess(taskId, user);

    const COMPLETABLE_STATUSES = ['PENDING', 'UPCOMING', 'OVERDUE'];
    if (!COMPLETABLE_STATUSES.includes(task.status)) {
      throw new BadRequestException(
        `La tarea no está en un estado completable (estado actual: ${task.status})`,
      );
    }

    let newDueDate: Date | null = null;
    if (task.recurrenceType !== 'ON_DETECTION' && task.nextDueDate) {
      const recurrenceMonths =
        task.recurrenceMonths ?? recurrenceTypeToMonths(task.recurrenceType) ?? 12;
      newDueDate = getNextDueDate(task.nextDueDate, recurrenceMonths);
    }

    return this.tasksRepository.completeAndReschedule(taskId, userId, dto, newDueDate);
  }
}
