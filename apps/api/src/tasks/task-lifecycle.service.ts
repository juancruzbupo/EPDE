import type {
  CompleteTaskInput,
  CreateTaskInput,
  ReorderTasksInput,
  ServiceUser,
  UpdateTaskInput,
} from '@epde/shared';
import {
  getNextDueDate,
  ProfessionalRequirement,
  RecurrenceType,
  recurrenceTypeToMonths,
  TaskPriority,
  TaskStatus,
  TaskType,
  UserRole,
} from '@epde/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Task } from '@prisma/client';

import { TaskNotCompletableError } from '../common/exceptions/domain.exceptions';
import { MaintenancePlansRepository } from '../maintenance-plans/maintenance-plans.repository';
import { TaskAuditLogRepository } from './task-audit-log.repository';
import { TasksRepository } from './tasks.repository';

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
  async verifyTaskAccess(taskId: string, user?: ServiceUser): Promise<Task> {
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
        priority: dto.priority ?? TaskPriority.MEDIUM,
        recurrenceType: dto.recurrenceType ?? RecurrenceType.ANNUAL,
        recurrenceMonths:
          dto.recurrenceType === RecurrenceType.CUSTOM
            ? dto.recurrenceMonths
            : (recurrenceTypeToMonths(dto.recurrenceType ?? RecurrenceType.ANNUAL) ?? 12),
        nextDueDate: dto.nextDueDate,
        order: maxOrder + 1,
        status: TaskStatus.PENDING,
        createdBy,
        taskType: dto.taskType ?? TaskType.INSPECTION,
        professionalRequirement:
          dto.professionalRequirement ?? ProfessionalRequirement.OWNER_CAN_DO,
        technicalDescription: dto.technicalDescription,
        estimatedDurationMinutes: dto.estimatedDurationMinutes,
      },
      { category: true },
    );
  }

  async updateTask(planId: string, taskId: string, dto: UpdateTaskInput, updatedBy?: string) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    if (task.maintenancePlanId !== planId) {
      throw new NotFoundException('Tarea no encontrada en este plan');
    }

    const before = { ...task }; // snapshot antes del update

    const { categoryId, ...taskFields } = dto;
    const data: UpdateTaskData = {
      ...taskFields,
      ...(updatedBy && { updatedBy }),
    };
    if (categoryId) {
      data.category = { connect: { id: categoryId } };
    }

    const updated = await this.tasksRepository.update(taskId, data, { category: true });

    if (updatedBy) {
      await this.auditLogRepository.createAuditLog(taskId, updatedBy, 'UPDATE', before, updated);
    }

    return updated;
  }

  async removeTask(planId: string, taskId: string) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }
    if (task.maintenancePlanId !== planId) {
      throw new NotFoundException('Tarea no encontrada en este plan');
    }

    await this.tasksRepository.softDelete(taskId);
    return { data: null, message: 'Tarea eliminada' };
  }

  async reorderTasks(planId: string, dto: ReorderTasksInput) {
    const plan = await this.plansRepository.findById(planId);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }

    await this.tasksRepository.reorderBatch(dto.tasks);

    return this.tasksRepository.findByPlanId(planId);
  }

  async completeTask(taskId: string, userId: string, dto: CompleteTaskInput, user?: ServiceUser) {
    const task = await this.verifyTaskAccess(taskId, user);

    try {
      const COMPLETABLE_STATUSES: TaskStatus[] = [
        TaskStatus.PENDING,
        TaskStatus.UPCOMING,
        TaskStatus.OVERDUE,
      ];
      if (!COMPLETABLE_STATUSES.includes(task.status)) {
        throw new TaskNotCompletableError(task.status);
      }

      let newDueDate: Date | null = null;
      if (task.recurrenceType !== RecurrenceType.ON_DETECTION && task.nextDueDate) {
        const recurrenceMonths =
          task.recurrenceMonths ?? recurrenceTypeToMonths(task.recurrenceType) ?? 12;
        newDueDate = getNextDueDate(task.nextDueDate, recurrenceMonths);
      }

      return this.tasksRepository.completeAndReschedule(taskId, userId, dto, newDueDate);
    } catch (error) {
      if (error instanceof TaskNotCompletableError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
