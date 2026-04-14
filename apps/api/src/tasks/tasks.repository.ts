import type { ActionTaken, ConditionFound, TaskExecutor, TaskResult } from '@epde/shared';
import { TASKS_MAX_TAKE } from '@epde/shared';
import { Injectable } from '@nestjs/common';
import { Task, TaskStatus } from '@prisma/client';
import { addDays } from 'date-fns';

import { BaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksRepository extends BaseRepository<Task, 'task'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'task', true);
  }

  async findAllForList(userId?: string, status?: string, take = 200, propertyId?: string) {
    // Cap at TASKS_MAX_TAKE to prevent runaway queries. Default 200 covers any realistic single-user portfolio.
    const safeTake = Math.min(take, TASKS_MAX_TAKE);
    return this.model.findMany({
      where: {
        ...(status && status !== 'all' ? { status: status as TaskStatus } : {}),
        ...(userId || propertyId
          ? {
              maintenancePlan: {
                property: {
                  ...(userId ? { userId } : {}),
                  ...(propertyId ? { id: propertyId } : {}),
                },
              },
            }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        maintenancePlan: {
          select: {
            id: true,
            name: true,
            property: { select: { id: true, address: true, city: true } },
          },
        },
      },
      orderBy: [{ nextDueDate: 'asc' }, { priority: 'asc' }],
      take: safeTake,
    });
  }

  async findByPlanId(planId: string) {
    return this.model.findMany({
      where: { maintenancePlanId: planId },
      include: { category: true },
      orderBy: { order: 'asc' },
    });
  }

  async getMaxOrder(planId: string): Promise<number> {
    const result = await this.model.findFirst({
      where: { maintenancePlanId: planId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return result?.order ?? -1;
  }

  async findWithDetails(taskId: string) {
    return this.model.findUnique({
      where: { id: taskId },
      include: {
        category: true,
        taskLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { completedAt: 'desc' },
          take: 20,
        },
        taskNotes: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
  }

  /** Reorders tasks in a single transaction.
   * Uses explicit `deletedAt: null` because $transaction array bypasses the soft-delete extension. */
  async reorderBatch(tasks: { id: string; order: number }[]) {
    return this.prisma.$transaction(
      tasks.map((item) =>
        this.prisma.task.update({
          where: { id: item.id, deletedAt: null },
          data: { order: item.order },
        }),
      ),
    );
  }

  async completeAndReschedule(
    taskId: string,
    userId: string,
    dto: {
      result: TaskResult;
      conditionFound: ConditionFound;
      executor: TaskExecutor;
      actionTaken: ActionTaken;
      completedAt?: Date;
      cost?: number;
      note?: string;
      photoUrl?: string;
    },
    newDueDate: Date | null,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const log = await tx.taskLog.create({
          data: {
            taskId,
            completedBy: userId,
            completedAt: dto.completedAt ?? new Date(),
            result: dto.result,
            conditionFound: dto.conditionFound,
            executor: dto.executor,
            actionTaken: dto.actionTaken,
            cost: dto.cost,
            notes: dto.note,
            photoUrl: dto.photoUrl,
          },
          include: { user: { select: { id: true, name: true } } },
        });

        // eslint-disable-next-line local/no-tx-without-soft-delete-filter -- taskId is pre-validated by TaskLifecycleService.verifyTaskAccess (findById on the soft-delete extension) before this method is called.
        const updatedTask = await tx.task.update({
          where: { id: taskId },
          data: { status: TaskStatus.PENDING, nextDueDate: newDueDate },
          include: { category: true },
        });

        return { task: updatedTask, log };
      },
      { timeout: 10_000 },
    );
  }

  async markOverdue(): Promise<number> {
    const result = await this.model.updateMany({
      where: {
        nextDueDate: { lt: new Date() },
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.OVERDUE] },
        recurrenceType: { not: 'ON_DETECTION' },
      },
      data: { status: TaskStatus.OVERDUE },
    });
    return result.count;
  }

  async markUpcoming(): Promise<number> {
    const now = new Date();
    const result = await this.model.updateMany({
      where: {
        nextDueDate: { gte: now, lte: addDays(now, 30) },
        status: TaskStatus.PENDING,
        recurrenceType: { not: 'ON_DETECTION' },
      },
      data: { status: TaskStatus.UPCOMING },
    });
    return result.count;
  }

  async resetUpcomingToPending(): Promise<number> {
    const result = await this.model.updateMany({
      where: {
        nextDueDate: { gt: addDays(new Date(), 30) },
        status: TaskStatus.UPCOMING,
      },
      data: { status: TaskStatus.PENDING },
    });
    return result.count;
  }

  async findUpcomingWithOwners(daysAhead: number) {
    const now = new Date();
    const taskInclude = {
      category: true,
      maintenancePlan: {
        include: {
          property: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    } as const;

    return this.model.findMany({
      where: {
        nextDueDate: { gte: now, lte: addDays(now, daysAhead) },
        status: { not: TaskStatus.COMPLETED },
        recurrenceType: { not: 'ON_DETECTION' },
      },
      include: taskInclude,
      take: 500,
    });
  }

  async findOverdueWithOwners() {
    return this.model.findMany({
      where: {
        nextDueDate: { lt: new Date() },
        status: TaskStatus.OVERDUE,
        recurrenceType: { not: 'ON_DETECTION' },
      },
      include: {
        category: true,
        maintenancePlan: {
          include: {
            property: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
      take: 500,
    });
  }

  async findStaleCompleted(): Promise<Task[]> {
    return this.model.findMany({
      where: {
        status: TaskStatus.COMPLETED,
        nextDueDate: { not: null, lt: new Date() },
        recurrenceType: { not: 'ON_DETECTION' },
      },
    });
  }

  async updateDueDateAndStatus(taskId: string, nextDueDate: Date, status: TaskStatus) {
    return this.writeModel.update({
      where: { id: taskId },
      data: { nextDueDate, status },
    });
  }
}
