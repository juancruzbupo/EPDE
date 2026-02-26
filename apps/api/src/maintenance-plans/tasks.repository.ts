import { Injectable } from '@nestjs/common';
import { Task, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository } from '../common/repositories/base.repository';
import { addDays } from 'date-fns';

@Injectable()
export class TasksRepository extends BaseRepository<Task> {
  constructor(prisma: PrismaService) {
    super(prisma, 'task', true);
  }

  async findByPlanId(planId: string) {
    return this.model.findMany({
      where: { maintenancePlanId: planId },
      include: { category: true },
      orderBy: { order: 'asc' },
    });
  }

  async findOverdue() {
    return this.model.findMany({
      where: {
        nextDueDate: { lt: new Date() },
        status: { not: 'COMPLETED' },
      },
      include: {
        category: true,
        maintenancePlan: { include: { property: true } },
      },
      orderBy: { nextDueDate: 'asc' },
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

  async reorderBatch(tasks: { id: string; order: number }[]) {
    return this.prisma.$transaction(
      tasks.map((item) =>
        this.prisma.task.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );
  }

  async completeAndReschedule(
    taskId: string,
    userId: string,
    notes?: string,
    photoUrl?: string,
    newDueDate?: Date,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const log = await tx.taskLog.create({
        data: {
          taskId,
          completedBy: userId,
          notes,
          photoUrl,
        },
        include: { user: { select: { id: true, name: true } } },
      });

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: { status: 'PENDING', nextDueDate: newDueDate },
        include: { category: true },
      });

      return { task: updatedTask, log };
    });
  }

  async markOverdue(): Promise<number> {
    const result = await this.model.updateMany({
      where: {
        nextDueDate: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'OVERDUE'] },
      },
      data: { status: 'OVERDUE' },
    });
    return result.count;
  }

  async markUpcoming(): Promise<number> {
    const now = new Date();
    const result = await this.model.updateMany({
      where: {
        nextDueDate: { gte: now, lte: addDays(now, 30) },
        status: 'PENDING',
      },
      data: { status: 'UPCOMING' },
    });
    return result.count;
  }

  async resetUpcomingToPending(): Promise<number> {
    const result = await this.model.updateMany({
      where: {
        nextDueDate: { gt: addDays(new Date(), 30) },
        status: 'UPCOMING',
      },
      data: { status: 'PENDING' },
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
        status: { not: 'COMPLETED' },
      },
      include: taskInclude,
    });
  }

  async findOverdueWithOwners() {
    return this.model.findMany({
      where: {
        nextDueDate: { lt: new Date() },
        status: 'OVERDUE',
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
    });
  }

  async findStaleCompleted(): Promise<Task[]> {
    return this.model.findMany({
      where: {
        status: 'COMPLETED',
        nextDueDate: { lt: new Date() },
      },
    });
  }

  async updateDueDateAndStatus(taskId: string, nextDueDate: Date, status: TaskStatus) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { nextDueDate, status },
    });
  }
}
