import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, startOfMonth } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalClients, totalProperties, overdueTasks, pendingBudgets, pendingServices] =
      await Promise.all([
        this.prisma.softDelete.user.count({ where: { role: 'CLIENT' } }),
        this.prisma.softDelete.property.count(),
        this.prisma.softDelete.task.count({
          where: { nextDueDate: { lt: new Date() }, status: { not: 'COMPLETED' } },
        }),
        this.prisma.budgetRequest.count({ where: { status: 'PENDING' } }),
        this.prisma.serviceRequest.count({
          where: { status: { in: ['OPEN', 'IN_REVIEW'] } },
        }),
      ]);

    return { totalClients, totalProperties, overdueTasks, pendingBudgets, pendingServices };
  }

  async getRecentActivity() {
    const [recentClients, recentProperties, recentTasks, recentBudgets, recentServices] =
      await Promise.all([
        this.prisma.softDelete.user.findMany({
          where: { role: 'CLIENT' },
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
          where: { status: 'COMPLETED' },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: { id: true, name: true, updatedAt: true },
        }),
        this.prisma.budgetRequest.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, title: true, createdAt: true },
        }),
        this.prisma.serviceRequest.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, title: true, createdAt: true },
        }),
      ]);

    const activities = [
      ...recentClients.map((c) => ({
        id: c.id,
        type: 'client_created' as const,
        description: `Nuevo cliente: ${c.name}`,
        timestamp: c.createdAt,
      })),
      ...recentProperties.map((p) => ({
        id: p.id,
        type: 'property_created' as const,
        description: `Nueva propiedad: ${p.address}, ${p.city}`,
        timestamp: p.createdAt,
      })),
      ...recentTasks.map((t) => ({
        id: t.id,
        type: 'task_completed' as const,
        description: `Tarea completada: ${t.name}`,
        timestamp: t.updatedAt,
      })),
      ...recentBudgets.map((b) => ({
        id: b.id,
        type: 'budget_requested' as const,
        description: `Presupuesto solicitado: ${b.title}`,
        timestamp: b.createdAt,
      })),
      ...recentServices.map((s) => ({
        id: s.id,
        type: 'service_requested' as const,
        description: `Solicitud de servicio: ${s.title}`,
        timestamp: s.createdAt,
      })),
    ];

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }

  async getClientStats(userId: string) {
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);
    const monthStart = startOfMonth(now);

    const userProperties = await this.prisma.softDelete.property.findMany({
      where: { userId },
      select: { id: true },
    });
    const propertyIds = userProperties.map((p) => p.id);

    const planIds = propertyIds.length
      ? (
          await this.prisma.maintenancePlan.findMany({
            where: { propertyId: { in: propertyIds } },
            select: { id: true },
          })
        ).map((p) => p.id)
      : [];

    const taskWhere = {
      maintenancePlanId: { in: planIds },
      deletedAt: null,
    };

    const [
      totalProperties,
      pendingTasks,
      overdueTasks,
      upcomingTasks,
      completedThisMonth,
      pendingBudgets,
      openServices,
    ] = await Promise.all([
      propertyIds.length,
      this.prisma.task.count({
        where: { ...taskWhere, status: 'PENDING' },
      }),
      this.prisma.task.count({
        where: {
          ...taskWhere,
          nextDueDate: { lt: now },
          status: { not: 'COMPLETED' },
        },
      }),
      this.prisma.task.count({
        where: {
          ...taskWhere,
          nextDueDate: { gte: now, lte: thirtyDaysFromNow },
          status: { not: 'COMPLETED' },
        },
      }),
      this.prisma.taskLog.count({
        where: {
          completedBy: userId,
          completedAt: { gte: monthStart },
        },
      }),
      this.prisma.budgetRequest.count({
        where: {
          propertyId: { in: propertyIds },
          status: { in: ['PENDING', 'QUOTED'] },
        },
      }),
      this.prisma.serviceRequest.count({
        where: {
          propertyId: { in: propertyIds },
          status: { in: ['OPEN', 'IN_REVIEW', 'IN_PROGRESS'] },
        },
      }),
    ]);

    return {
      totalProperties,
      pendingTasks,
      overdueTasks,
      upcomingTasks,
      completedThisMonth,
      pendingBudgets,
      openServices,
    };
  }

  async getClientUpcomingTasks(userId: string) {
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    const tasks = await this.prisma.task.findMany({
      where: {
        deletedAt: null,
        maintenancePlan: {
          property: { userId, deletedAt: null },
        },
        OR: [
          { nextDueDate: { lt: now }, status: { not: 'COMPLETED' } },
          { nextDueDate: { gte: now, lte: thirtyDaysFromNow }, status: { not: 'COMPLETED' } },
        ],
      },
      include: {
        category: { select: { name: true } },
        maintenancePlan: {
          select: {
            id: true,
            property: { select: { address: true } },
          },
        },
      },
      orderBy: { nextDueDate: 'asc' },
      take: 10,
    });

    return tasks.map((t) => ({
      id: t.id,
      name: t.name,
      nextDueDate: t.nextDueDate.toISOString(),
      priority: t.priority,
      status: t.status,
      propertyAddress: t.maintenancePlan.property.address,
      categoryName: t.category.name,
      maintenancePlanId: t.maintenancePlan.id,
    }));
  }
}
