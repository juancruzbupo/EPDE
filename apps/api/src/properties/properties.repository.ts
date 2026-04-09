import {
  BudgetStatus,
  type ConditionFound,
  PlanStatus,
  ServiceStatus,
  TaskStatus,
} from '@epde/shared';
import { Injectable } from '@nestjs/common';
import { Prisma, Property, PropertyType } from '@prisma/client';

import {
  BaseRepository,
  FindManyParams,
  PaginatedResult,
} from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertiesRepository extends BaseRepository<Property, 'property'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'property', true);
  }

  async findProperties(params: {
    cursor?: string;
    take?: number;
    search?: string;
    userId?: string;
    city?: string;
    type?: PropertyType;
  }): Promise<PaginatedResult<Property>> {
    const where: Prisma.PropertyWhereInput = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.city) {
      where.city = { contains: params.city, mode: 'insensitive' };
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.search) {
      where.OR = [
        { address: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const findParams: FindManyParams = {
      cursor: params.cursor,
      take: params.take,
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        maintenancePlan: { select: { id: true, name: true, status: true } },
      },
      count: false,
    };

    return this.findMany(findParams);
  }

  async findWithPlan(id: string) {
    return this.model.findFirst({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        maintenancePlan: {
          include: {
            tasks: { include: { category: true }, orderBy: { order: 'asc' }, take: 500 },
          },
        },
      },
    });
  }

  async findOwnership(id: string): Promise<{ id: string; userId: string } | null> {
    return this.model.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }

  async createWithPlan(data: {
    userId: string;
    address: string;
    city: string;
    type: PropertyType;
    yearBuilt?: number;
    squareMeters?: number;
    createdBy?: string;
  }) {
    // Plan is NOT auto-created. It's generated from the inspection via
    // POST /inspections/:id/generate-plan after the architect completes the inspection.
    return this.prisma.property.create({
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        maintenancePlan: true,
      },
    });
  }

  /**
   * Soft-delete property and cascade to active budgets + service requests.
   * onDelete: Cascade only applies to hard deletes; soft-delete requires explicit cascade.
   */
  async softDeleteWithCascade(id: string) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.property.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.budgetRequest.updateMany({
        where: { propertyId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.serviceRequest.updateMany({
        where: { propertyId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
    ]);
  }

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { userId },
      include: { maintenancePlan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Aggregates expenses for a property from TaskLog costs + approved BudgetResponse amounts. */
  async getPropertyExpenses(propertyId: string) {
    const [taskExpenses, budgetExpenses] = await Promise.all([
      // Task completion costs via MaintenancePlan
      this.prisma.taskLog.findMany({
        where: {
          task: { maintenancePlan: { propertyId } },
          cost: { not: null },
        },
        select: {
          completedAt: true,
          cost: true,
          task: { select: { name: true, sector: true, category: { select: { name: true } } } },
        },
        orderBy: { completedAt: 'desc' },
        take: 200,
      }),
      // Approved budget costs
      this.prisma.budgetResponse.findMany({
        where: {
          budgetRequest: {
            propertyId,
            status: {
              in: [BudgetStatus.APPROVED, BudgetStatus.IN_PROGRESS, BudgetStatus.COMPLETED],
            },
            deletedAt: null,
          },
        },
        select: {
          totalAmount: true,
          respondedAt: true,
          budgetRequest: { select: { title: true } },
        },
        orderBy: { respondedAt: 'desc' },
        take: 500,
      }),
    ]);

    const items = [
      ...taskExpenses.map((t) => ({
        date: t.completedAt.toISOString(),
        description: t.task.name,
        category: t.task.category.name,
        sector: t.task.sector,
        amount: Number(t.cost),
        type: 'task' as const,
      })),
      ...budgetExpenses.map((b) => ({
        date: b.respondedAt.toISOString(),
        description: b.budgetRequest.title,
        category: null,
        sector: null,
        amount: Number(b.totalAmount),
        type: 'budget' as const,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalCost = items.reduce((sum, item) => sum + item.amount, 0);

    return { totalCost, items };
  }

  /** Fetches overdue tasks, upcoming tasks (next 90 days), and status counts for a plan. */
  async getReportTasks(planId: string) {
    const [overdue, upcoming, counts] = await Promise.all([
      this.prisma.softDelete.task.findMany({
        where: { maintenancePlanId: planId, status: TaskStatus.OVERDUE },
        select: {
          id: true,
          name: true,
          sector: true,
          priority: true,
          professionalRequirement: true,
          nextDueDate: true,
          category: { select: { name: true } },
        },
        orderBy: { priority: 'desc' },
        take: 20,
      }),
      this.prisma.softDelete.task.findMany({
        where: {
          maintenancePlanId: planId,
          status: { in: [TaskStatus.PENDING, TaskStatus.UPCOMING] },
          nextDueDate: {
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          name: true,
          sector: true,
          priority: true,
          professionalRequirement: true,
          nextDueDate: true,
          recurrenceType: true,
          category: { select: { name: true } },
        },
        orderBy: { nextDueDate: 'asc' },
        take: 30,
      }),
      this.prisma.softDelete.task.groupBy({
        by: ['status'],
        where: { maintenancePlanId: planId },
        _count: true,
      }),
    ]);

    const stats = { total: 0, overdue: 0, pending: 0, upcoming: 0, completed: 0 };
    for (const g of counts) {
      stats[g.status.toLowerCase() as keyof typeof stats] = g._count;
      stats.total += g._count;
    }

    return { overdue, upcoming, stats };
  }

  /** Fetches the most recent task completion logs for a plan. */
  async getRecentTaskLogs(planId: string) {
    return this.prisma.taskLog.findMany({
      where: { task: { maintenancePlanId: planId, deletedAt: null } },
      select: {
        id: true,
        completedAt: true,
        result: true,
        conditionFound: true,
        actionTaken: true,
        cost: true,
        notes: true,
        photoUrl: true,
        task: {
          select: {
            name: true,
            sector: true,
            category: { select: { name: true } },
          },
        },
        user: { select: { name: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });
  }

  /** Fetches properties with active maintenance plans (bounded query for scheduler use). */
  async findWithActivePlans(take: number) {
    return this.prisma.property.findMany({
      where: { deletedAt: null, maintenancePlan: { status: PlanStatus.ACTIVE } },
      select: {
        id: true,
        address: true,
        userId: true,
        maintenancePlan: { select: { id: true } },
      },
      take,
    });
  }

  /** Aggregates all photos for a property from ServiceRequestPhotos + TaskLog photoUrls. */
  async getPropertyPhotos(propertyId: string) {
    const [servicePhotos, taskPhotos] = await Promise.all([
      this.prisma.serviceRequestPhoto.findMany({
        where: { serviceRequest: { propertyId, deletedAt: null } },
        select: {
          url: true,
          createdAt: true,
          serviceRequest: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.taskLog.findMany({
        where: {
          task: { maintenancePlan: { propertyId } },
          photoUrl: { not: null },
        },
        select: {
          photoUrl: true,
          completedAt: true,
          task: { select: { name: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 100,
      }),
    ]);

    return [
      ...servicePhotos.map((p) => ({
        url: p.url,
        date: p.createdAt.toISOString(),
        description: p.serviceRequest.title,
        source: 'service-request' as const,
      })),
      ...taskPhotos.map((p) => ({
        url: p.photoUrl!,
        date: p.completedAt.toISOString(),
        description: p.task.name,
        source: 'task' as const,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /** Detected problems: POOR/CRITICAL task logs without an active ServiceRequest. */
  async getOpenProblems(propertyId: string) {
    const [problemLogs, activeServiceTaskIds] = await Promise.all([
      this.prisma.taskLog.findMany({
        where: {
          conditionFound: { in: ['POOR', 'CRITICAL'] },
          task: { maintenancePlan: { propertyId }, deletedAt: null },
        },
        select: {
          taskId: true,
          conditionFound: true,
          notes: true,
          completedAt: true,
          task: {
            select: {
              name: true,
              sector: true,
              maintenancePlan: {
                select: { property: { select: { id: true, address: true } } },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 200,
      }),
      this.prisma.serviceRequest.findMany({
        where: {
          propertyId,
          taskId: { not: null },
          status: { notIn: [ServiceStatus.RESOLVED, ServiceStatus.CLOSED] },
          deletedAt: null,
        },
        select: { taskId: true },
      }),
    ]);

    const activeTaskIds = new Set(activeServiceTaskIds.map((s) => s.taskId));
    const seen = new Set<string>();
    const problems: {
      taskId: string;
      taskName: string;
      sector: string | null;
      conditionFound: string;
      severity: 'high' | 'medium';
      notes: string | null;
      completedAt: string;
      propertyId: string;
      propertyAddress: string;
    }[] = [];

    for (const log of problemLogs) {
      if (seen.has(log.taskId) || activeTaskIds.has(log.taskId)) continue;
      seen.add(log.taskId);
      problems.push({
        taskId: log.taskId,
        taskName: log.task.name,
        sector: log.task.sector,
        conditionFound: log.conditionFound as ConditionFound,
        severity: log.conditionFound === 'CRITICAL' ? 'high' : 'medium',
        notes: log.notes,
        completedAt: log.completedAt.toISOString(),
        propertyId,
        propertyAddress: log.task.maintenancePlan.property.address,
      });
    }

    problems.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'high' ? -1 : 1;
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    });

    return problems.slice(0, 20);
  }
}
