import { BudgetStatus, ServiceStatus, TaskPriority, TaskStatus, UserRole } from '@epde/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { addDays } from 'date-fns';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Dashboard stats repository — admin stats, client stats, counts.
 *
 * Uses `this.prisma.softDelete.{model}` directly (not BaseRepository) for
 * cross-model aggregations. If the soft-delete mechanism changes, this file
 * must be updated alongside BaseRepository.
 */
@Injectable()
export class DashboardStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminStats() {
    const [totalClients, totalProperties, overdueTasks, pendingBudgets, pendingServices] =
      await Promise.all([
        this.prisma.softDelete.user.count({ where: { role: UserRole.CLIENT } }),
        this.prisma.softDelete.property.count(),
        this.prisma.softDelete.task.count({
          where: { nextDueDate: { lt: new Date() }, status: { not: TaskStatus.COMPLETED } },
        }),
        this.prisma.softDelete.budgetRequest.count({ where: { status: BudgetStatus.PENDING } }),
        this.prisma.softDelete.serviceRequest.count({
          where: { status: { in: [ServiceStatus.OPEN, ServiceStatus.IN_REVIEW] } },
        }),
      ]);

    return { totalClients, totalProperties, overdueTasks, pendingBudgets, pendingServices };
  }

  async getRecentActivity() {
    const [recentClients, recentProperties, recentTasks, recentBudgets, recentServices] =
      await Promise.all([
        this.prisma.softDelete.user.findMany({
          where: { role: UserRole.CLIENT },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, name: true, createdAt: true },
        }),
        this.prisma.softDelete.property.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, address: true, city: true, createdAt: true },
        }),
        // Tasks are cyclic — COMPLETED is transient. Query recent TaskLogs instead.
        this.prisma.taskLog.findMany({
          orderBy: { completedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            completedAt: true,
            task: { select: { id: true, name: true, maintenancePlanId: true } },
          },
        }),
        this.prisma.softDelete.budgetRequest.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, title: true, createdAt: true },
        }),
        this.prisma.softDelete.serviceRequest.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, title: true, createdAt: true },
        }),
      ]);

    return { recentClients, recentProperties, recentTasks, recentBudgets, recentServices };
  }

  async getClientPropertyAndPlanIds(
    userId: string,
  ): Promise<{ propertyIds: string[]; planIds: string[] }> {
    const [properties, plans] = await Promise.all([
      this.prisma.softDelete.property.findMany({
        where: { userId },
        select: { id: true },
      }),
      this.prisma.maintenancePlan.findMany({
        where: { property: { userId, deletedAt: null } },
        select: { id: true },
      }),
    ]);
    return {
      propertyIds: properties.map((p) => p.id),
      planIds: plans.map((p) => p.id),
    };
  }

  async getClientTaskStats(planIds: string[], _userId: string) {
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);
    const thirtyDaysAgo = addDays(now, -30);

    const taskWhere = {
      maintenancePlanId: { in: planIds },
    };

    const sevenDaysFromNow = addDays(now, 7);

    const [
      pendingTasks,
      overdueTasks,
      upcomingTasks,
      upcomingThisWeek,
      urgentTasks,
      completedThisMonth,
    ] = await Promise.all([
      this.prisma.softDelete.task.count({
        where: { ...taskWhere, status: TaskStatus.PENDING },
      }),
      this.prisma.softDelete.task.count({
        where: {
          ...taskWhere,
          nextDueDate: { lt: now },
          status: { not: TaskStatus.COMPLETED },
        },
      }),
      this.prisma.softDelete.task.count({
        where: {
          ...taskWhere,
          nextDueDate: { gte: now, lte: thirtyDaysFromNow },
          status: { not: TaskStatus.COMPLETED },
        },
      }),
      this.prisma.softDelete.task.count({
        where: {
          ...taskWhere,
          nextDueDate: { gte: now, lte: sevenDaysFromNow },
          status: { not: TaskStatus.COMPLETED },
        },
      }),
      this.prisma.softDelete.task.count({
        where: {
          ...taskWhere,
          priority: TaskPriority.URGENT,
          status: { not: TaskStatus.COMPLETED },
        },
      }),
      this.prisma.taskLog.count({
        where: {
          task: { maintenancePlanId: { in: planIds } },
          completedAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    return {
      pendingTasks,
      overdueTasks,
      upcomingTasks,
      upcomingThisWeek,
      urgentTasks,
      completedThisMonth,
    };
  }

  async getClientBudgetAndServiceCounts(propertyIds: string[]) {
    const [pendingBudgets, openServices] = await Promise.all([
      this.prisma.softDelete.budgetRequest.count({
        where: {
          propertyId: { in: propertyIds },
          status: { in: [BudgetStatus.PENDING, BudgetStatus.QUOTED] },
        },
      }),
      this.prisma.softDelete.serviceRequest.count({
        where: {
          propertyId: { in: propertyIds },
          status: { in: [ServiceStatus.OPEN, ServiceStatus.IN_REVIEW, ServiceStatus.IN_PROGRESS] },
        },
      }),
    ]);

    return { pendingBudgets, openServices };
  }

  async getClientUpcomingTasks(userId: string) {
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    return this.prisma.softDelete.task.findMany({
      where: {
        maintenancePlan: {
          property: { userId, deletedAt: null },
        },
        OR: [
          { nextDueDate: { lt: now }, status: { not: TaskStatus.COMPLETED } },
          {
            nextDueDate: { gte: now, lte: thirtyDaysFromNow },
            status: { not: TaskStatus.COMPLETED },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        nextDueDate: true,
        priority: true,
        status: true,
        professionalRequirement: true,
        sector: true,
        category: { select: { name: true } },
        maintenancePlan: {
          select: {
            id: true,
            property: { select: { id: true, address: true } },
          },
        },
      },
      orderBy: { nextDueDate: 'asc' },
      take: 50,
    });
  }

  // ─── Batch methods (for weekly summary optimization) ───

  /**
   * Load all active clients with their planIds in 2 queries (not N+1).
   * Returns a map userId → planIds.
   */
  async getAllClientPlanIds(clientIds: string[]): Promise<Map<string, string[]>> {
    const plans = await this.prisma.maintenancePlan.findMany({
      where: { property: { userId: { in: clientIds }, deletedAt: null } },
      select: { id: true, property: { select: { userId: true } } },
    });

    const map = new Map<string, string[]>();
    for (const plan of plans) {
      const userId = plan.property.userId;
      const arr = map.get(userId) ?? [];
      arr.push(plan.id);
      map.set(userId, arr);
    }
    return map;
  }

  /**
   * Batch task stats for multiple planIds at once using $queryRaw.
   * Returns a map planId → { pendingTasks, overdueTasks, upcomingThisWeek, urgentTasks }.
   */
  async getBatchTaskStats(allPlanIds: string[]): Promise<
    Map<
      string,
      {
        pendingTasks: number;
        overdueTasks: number;
        upcomingThisWeek: number;
        urgentTasks: number;
      }
    >
  > {
    if (allPlanIds.length === 0) return new Map();

    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);

    const rows = await this.prisma.$queryRaw<
      {
        maintenancePlanId: string;
        pending: bigint;
        overdue: bigint;
        upcoming_week: bigint;
        urgent: bigint;
      }[]
    >(Prisma.sql`
      SELECT
        "maintenancePlanId",
        COUNT(*) FILTER (WHERE status = 'PENDING')::bigint AS pending,
        COUNT(*) FILTER (WHERE "nextDueDate" < ${now} AND status != 'COMPLETED')::bigint AS overdue,
        COUNT(*) FILTER (WHERE "nextDueDate" >= ${now} AND "nextDueDate" <= ${sevenDaysFromNow} AND status != 'COMPLETED')::bigint AS upcoming_week,
        COUNT(*) FILTER (WHERE priority = 'URGENT' AND status != 'COMPLETED')::bigint AS urgent
      FROM "Task"
      WHERE "maintenancePlanId" = ANY(${allPlanIds})
        AND "deletedAt" IS NULL
      GROUP BY "maintenancePlanId"
    `);

    const map = new Map<
      string,
      {
        pendingTasks: number;
        overdueTasks: number;
        upcomingThisWeek: number;
        urgentTasks: number;
      }
    >();
    for (const row of rows) {
      map.set(row.maintenancePlanId, {
        pendingTasks: Number(row.pending),
        overdueTasks: Number(row.overdue),
        upcomingThisWeek: Number(row.upcoming_week),
        urgentTasks: Number(row.urgent),
      });
    }
    return map;
  }

  /**
   * Batch upcoming tasks for multiple users at once.
   * Returns a map userId → first upcoming task (next non-overdue).
   */
  async getBatchUpcomingTasks(
    clientIds: string[],
  ): Promise<Map<string, { name: string; nextDueDate: Date | null }>> {
    if (clientIds.length === 0) return new Map();

    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    const tasks = await this.prisma.softDelete.task.findMany({
      where: {
        maintenancePlan: {
          property: { userId: { in: clientIds }, deletedAt: null },
        },
        nextDueDate: { gte: now, lte: thirtyDaysFromNow },
        status: { not: TaskStatus.COMPLETED },
      },
      select: {
        name: true,
        nextDueDate: true,
        maintenancePlan: {
          select: { property: { select: { userId: true } } },
        },
      },
      orderBy: { nextDueDate: 'asc' },
    });

    // Keep first task per user (already sorted by nextDueDate asc)
    const map = new Map<string, { name: string; nextDueDate: Date | null }>();
    for (const t of tasks) {
      const userId = t.maintenancePlan.property.userId;
      if (!map.has(userId)) {
        map.set(userId, { name: t.name, nextDueDate: t.nextDueDate });
      }
    }
    return map;
  }
}
