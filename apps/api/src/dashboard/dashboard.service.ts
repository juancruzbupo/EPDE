import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getStats() {
    return this.dashboardRepository.getAdminStats();
  }

  async getRecentActivity() {
    const { recentClients, recentProperties, recentTasks, recentBudgets, recentServices } =
      await this.dashboardRepository.getRecentActivity();

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
    const { propertyIds, planIds } =
      await this.dashboardRepository.getClientPropertyAndPlanIds(userId);

    const [taskStats, budgetServiceStats] = await Promise.all([
      this.dashboardRepository.getClientTaskStats(planIds, userId),
      this.dashboardRepository.getClientBudgetAndServiceCounts(propertyIds),
    ]);

    return {
      totalProperties: propertyIds.length,
      ...taskStats,
      ...budgetServiceStats,
    };
  }

  async getClientUpcomingTasks(userId: string) {
    const tasks = await this.dashboardRepository.getClientUpcomingTasks(userId);

    return tasks.map((t) => ({
      id: t.id,
      name: t.name,
      nextDueDate: t.nextDueDate?.toISOString() ?? null,
      priority: t.priority,
      status: t.status,
      propertyAddress: t.maintenancePlan.property.address,
      propertyId: t.maintenancePlan.property.id,
      categoryName: t.category.name,
      maintenancePlanId: t.maintenancePlan.id,
    }));
  }
}
