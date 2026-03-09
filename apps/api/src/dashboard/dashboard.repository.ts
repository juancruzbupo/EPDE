import { BudgetStatus, ServiceStatus, TaskStatus, UserRole } from '@epde/shared';
import { Injectable } from '@nestjs/common';
import { addDays, startOfMonth } from 'date-fns';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Standalone repository — does not extend BaseRepository because dashboard
 * queries span multiple models with custom aggregations and joins that don't
 * fit the single-model CRUD pattern of BaseRepository.
 *
 * Uses `this.prisma.softDelete.{model}` directly (not BaseRepository) for
 * cross-model aggregations. If the soft-delete mechanism changes, this file
 * must be updated alongside BaseRepository.
 */
@Injectable()
export class DashboardRepository {
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
        this.prisma.softDelete.task.findMany({
          where: { status: TaskStatus.COMPLETED },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: { id: true, name: true, updatedAt: true },
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
    const properties = await this.prisma.softDelete.property.findMany({
      where: { userId },
      select: { id: true, maintenancePlan: { select: { id: true } } },
    });
    return {
      propertyIds: properties.map((p: { id: string }) => p.id),
      planIds: properties
        .filter((p: { maintenancePlan: { id: string } | null }) => p.maintenancePlan)
        .map((p: { maintenancePlan: { id: string } | null }) => p.maintenancePlan!.id),
    };
  }

  async getClientTaskStats(planIds: string[], userId: string) {
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);
    const monthStart = startOfMonth(now);

    const taskWhere = {
      maintenancePlanId: { in: planIds },
    };

    const [pendingTasks, overdueTasks, upcomingTasks, completedThisMonth] = await Promise.all([
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
      this.prisma.taskLog.count({
        where: {
          completedBy: userId,
          completedAt: { gte: monthStart },
        },
      }),
    ]);

    return { pendingTasks, overdueTasks, upcomingTasks, completedThisMonth };
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
      include: {
        category: { select: { name: true } },
        maintenancePlan: {
          select: {
            id: true,
            property: { select: { id: true, address: true } },
          },
        },
      },
      orderBy: { nextDueDate: 'asc' },
      take: 10,
    });
  }
}
