import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalClients, totalProperties, overdueTasks, pendingBudgets] = await Promise.all([
      this.prisma.softDelete.user.count({ where: { role: 'CLIENT' } }),
      this.prisma.softDelete.property.count(),
      this.prisma.softDelete.task.count({
        where: { nextDueDate: { lt: new Date() }, status: { not: 'COMPLETED' } },
      }),
      this.prisma.budgetRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return { totalClients, totalProperties, overdueTasks, pendingBudgets };
  }

  async getRecentActivity() {
    const [recentClients, recentProperties, recentTasks] = await Promise.all([
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
    ];

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }
}
