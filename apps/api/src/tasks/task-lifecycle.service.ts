import type {
  CompleteTaskInput,
  CreateTaskInput,
  ReorderTasksInput,
  ServiceUser,
  UpdateTaskInput,
} from '@epde/shared';
import {
  CONDITION_FOUND_LABELS,
  ConditionFound,
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
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Task } from '@prisma/client';

import { MilestoneService } from '../auth/milestone.service';
import { CategoryTemplatesRepository } from '../category-templates/category-templates.repository';
import {
  TaskAccessDeniedError,
  TaskNotCompletableError,
} from '../common/exceptions/domain.exceptions';
import { MaintenancePlansRepository } from '../maintenance-plans/maintenance-plans.repository';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskAuditLogRepository } from './task-audit-log.repository';
import { TasksRepository } from './tasks.repository';

type UpdateTaskData = Omit<UpdateTaskInput, 'categoryId'> & {
  updatedBy?: string;
  category?: { connect: { id: string } };
};

@Injectable()
export class TaskLifecycleService {
  private readonly logger = new Logger(TaskLifecycleService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly plansRepository: MaintenancePlansRepository,
    private readonly auditLogRepository: TaskAuditLogRepository,
    private readonly categoryTemplatesRepository: CategoryTemplatesRepository,
    private readonly prisma: PrismaService,
    private readonly notificationsHandler: NotificationsHandlerService,
    private readonly milestoneService: MilestoneService,
  ) {}

  /**
   * Verifies that the given user has access to the task.
   * ADMINs always pass. CLIENTs must own the property the task belongs to.
   * When `planId` is provided, also validates the task belongs to that plan
   * (prevents IDOR via mismatched plan/task IDs in nested routes).
   * Throws NotFoundException if task doesn't exist, ForbiddenException if access denied.
   */
  async verifyTaskAccess(taskId: string, user?: ServiceUser, planId?: string): Promise<Task> {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Tarea no encontrada');

    if (planId && task.maintenancePlanId !== planId) {
      throw new NotFoundException('Tarea no encontrada en este plan');
    }

    try {
      if (user?.role === UserRole.CLIENT) {
        const plan = await this.plansRepository.findWithProperty(task.maintenancePlanId);
        if (plan?.property?.userId !== user.id) {
          throw new TaskAccessDeniedError();
        }
      }
    } catch (error) {
      if (error instanceof TaskAccessDeniedError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }

    return task;
  }

  async listAllTasks(userId?: string, status?: string, take?: number, propertyId?: string) {
    return this.tasksRepository.findAllForList(userId, status, take, propertyId);
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
    user?: ServiceUser,
    planId?: string,
  ) {
    const task = await this.verifyTaskAccess(taskId, user, planId);

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

      const result = await this.tasksRepository.completeAndReschedule(
        taskId,
        userId,
        dto,
        newDueDate,
      );

      void this.auditLogRepository.createAuditLog(
        taskId,
        userId,
        'COMPLETED',
        { status: task.status },
        {
          conditionFound: dto.conditionFound,
          result: dto.result,
          nextDueDate: newDueDate?.toISOString() ?? null,
        },
      );

      const problemDetected =
        dto.conditionFound === ConditionFound.POOR ||
        dto.conditionFound === ConditionFound.CRITICAL;

      if (problemDetected) {
        const plan = await this.plansRepository.findWithProperty(task.maintenancePlanId);
        const address = plan?.property?.address ?? 'Propiedad';
        const condLabel =
          CONDITION_FOUND_LABELS[dto.conditionFound as ConditionFound] ?? dto.conditionFound;
        void this.notificationsHandler.handleProblemDetected({
          taskName: task.name,
          propertyAddress: address,
          propertyId: plan?.property?.id ?? '',
          conditionLabel: condLabel,
        });
      }

      // Fire-and-forget: check milestones after task completion (never blocks response).
      // Logs failures so silent milestone service errors don't go unnoticed.
      void this.milestoneService.checkAndAward(userId, { problemDetected }).catch((err) => {
        this.logger.error(`Milestone award failed for user ${userId}: ${(err as Error).message}`);
      });

      return { ...result, problemDetected };
    } catch (error) {
      if (error instanceof TaskNotCompletableError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * Creates tasks in bulk from a CategoryTemplate's TaskTemplates.
   * Finds or creates a Category linked to the template, then creates
   * one Task per TaskTemplate in the plan.
   */
  async bulkAddFromTemplate(
    planId: string,
    categoryTemplateId: string,
    createdBy: string,
  ): Promise<number> {
    const plan = await this.plansRepository.findById(planId);
    if (!plan) {
      throw new NotFoundException('Plan de mantenimiento no encontrado');
    }

    const categoryTemplate =
      await this.categoryTemplatesRepository.findByIdWithTasks(categoryTemplateId);
    if (!categoryTemplate) {
      throw new NotFoundException('Plantilla de categoría no encontrada');
    }

    if (categoryTemplate.tasks.length === 0) {
      throw new BadRequestException('La plantilla no tiene tareas definidas');
    }

    // Wrap category find-or-create + task creation in a transaction
    return this.prisma.$transaction(
      async (tx) => {
        let category = await tx.category.findFirst({
          where: { categoryTemplateId, deletedAt: null },
        });
        if (!category) {
          category = await tx.category.create({
            data: {
              name: categoryTemplate.name,
              icon: categoryTemplate.icon,
              description: categoryTemplate.description,
              categoryTemplateId,
            },
          });
        }

        const maxOrder = await this.tasksRepository.getMaxOrder(planId);

        // Skip tasks with names that already exist in the plan (duplicate detection).
        // Query only for the candidate template names rather than scanning the whole plan —
        // avoids the earlier `take: 1_000` silently missing duplicates on larger plans, and
        // keeps the query bounded by the template size (typically <50 entries).
        const candidateNames = categoryTemplate.tasks.map((tpl) => tpl.name);
        const existingTasks = await tx.task.findMany({
          where: {
            maintenancePlanId: planId,
            deletedAt: null,
            name: { in: candidateNames, mode: 'insensitive' },
          },
          select: { name: true },
        });
        const existingNames = new Set(existingTasks.map((t) => t.name.toLowerCase()));

        const newTemplates = categoryTemplate.tasks.filter(
          (tpl) => !existingNames.has(tpl.name.toLowerCase()),
        );

        if (newTemplates.length === 0) {
          return 0;
        }

        const taskData = newTemplates.map((tpl, index) => ({
          maintenancePlanId: planId,
          categoryId: category.id,
          name: tpl.name,
          taskType: tpl.taskType,
          professionalRequirement: tpl.professionalRequirement,
          technicalDescription: tpl.technicalDescription,
          priority: tpl.priority,
          recurrenceType: tpl.recurrenceType,
          recurrenceMonths: tpl.recurrenceMonths,
          estimatedDurationMinutes: tpl.estimatedDurationMinutes,
          sector: tpl.defaultSector ?? undefined,
          order: maxOrder + 1 + index,
          status: TaskStatus.PENDING,
          createdBy,
        }));

        const result = await tx.task.createMany({ data: taskData });
        return result.count;
      },
      { timeout: 10_000 },
    );
  }
}
