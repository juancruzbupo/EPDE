import type { AdminAnalytics, ClientAnalytics } from '@epde/shared';
import { ActivityType } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '../redis/redis.service';
import { DashboardRepository } from './dashboard.repository';

const ANALYTICS_TTL = 300; // 5 minutes

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly redis: RedisService,
  ) {}

  /** Admin overview stats (property/task/budget/service counts). Cached ${ANALYTICS_TTL}s. */
  async getStats() {
    const cacheKey = 'dashboard:admin:stats';
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      /* Redis unavailable */
    }

    const result = await this.dashboardRepository.getAdminStats();

    try {
      await this.redis.setex(cacheKey, ANALYTICS_TTL, JSON.stringify(result));
    } catch {
      /* Redis unavailable */
    }

    return result;
  }

  /** Recent activity feed (last 10 items). NOT cached — real-time data. */
  async getRecentActivity() {
    const { recentClients, recentProperties, recentTasks, recentBudgets, recentServices } =
      await this.dashboardRepository.getRecentActivity();

    const activities = [
      ...recentClients.map((c) => ({
        id: c.id,
        type: ActivityType.CLIENT_CREATED,
        description: `Nuevo cliente: ${c.name}`,
        timestamp: c.createdAt,
        metadata: { clientId: c.id },
      })),
      ...recentProperties.map((p) => ({
        id: p.id,
        type: ActivityType.PROPERTY_CREATED,
        description: `Nueva propiedad: ${p.address}, ${p.city}`,
        timestamp: p.createdAt,
        metadata: { propertyId: p.id },
      })),
      ...recentTasks.map((log) => ({
        id: log.task.id,
        type: ActivityType.TASK_COMPLETED,
        description: `Tarea completada: ${log.task.name}`,
        timestamp: log.completedAt,
        metadata: { taskId: log.task.id, maintenancePlanId: log.task.maintenancePlanId },
      })),
      ...recentBudgets.map((b) => ({
        id: b.id,
        type: ActivityType.BUDGET_REQUESTED,
        description: `Presupuesto solicitado: ${b.title}`,
        timestamp: b.createdAt,
        metadata: { budgetId: b.id },
      })),
      ...recentServices.map((s) => ({
        id: s.id,
        type: ActivityType.SERVICE_REQUESTED,
        description: `Solicitud de servicio: ${s.title}`,
        timestamp: s.createdAt,
        metadata: { serviceRequestId: s.id },
      })),
    ];

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }

  /** Client stats (properties, tasks, budgets, services). Cached ${ANALYTICS_TTL}s per user. */
  async getClientStats(userId: string) {
    const cacheKey = `dashboard:client:${userId}:stats`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Invalidate stale cache missing healthScore (added in v1.1)
        if ('healthScore' in parsed) return parsed;
        await this.redis.del(cacheKey);
      }
    } catch {
      /* Redis unavailable */
    }

    const { propertyIds, planIds } =
      await this.dashboardRepository.getClientPropertyAndPlanIds(userId);

    const [taskStats, budgetServiceStats, healthIndex] = await Promise.all([
      this.dashboardRepository.getClientTaskStats(planIds, userId),
      this.dashboardRepository.getClientBudgetAndServiceCounts(propertyIds),
      this.dashboardRepository.getPropertyHealthIndex(planIds),
    ]);

    const result = {
      totalProperties: propertyIds.length,
      ...taskStats,
      ...budgetServiceStats,
      healthScore: healthIndex.score,
      healthLabel: healthIndex.label,
    };

    try {
      await this.redis.setex(cacheKey, ANALYTICS_TTL, JSON.stringify(result));
    } catch {
      /* Redis unavailable */
    }

    return result;
  }

  /** Client upcoming tasks with ISO date serialization. NOT cached — real-time data. */
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
      professionalRequirement: t.professionalRequirement,
      sector: t.sector,
    }));
  }

  /** Monthly task completion trend ($queryRaw). Cached ${ANALYTICS_TTL}s per month range. */
  async getCompletionTrend(months = 6) {
    const cacheKey = `dashboard:completion-trend:${months}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      /* Redis unavailable */
    }

    const result = await this.dashboardRepository.getCompletionTrend(months);

    try {
      await this.redis.setex(cacheKey, ANALYTICS_TTL, JSON.stringify(result));
    } catch {
      /* Redis unavailable */
    }

    return result;
  }

  /** Condition distribution across all inspections (groupBy). Cached ${ANALYTICS_TTL}s. */
  async getConditionDistribution() {
    const cacheKey = 'dashboard:condition-distribution';
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      /* Redis unavailable */
    }

    const result = await this.dashboardRepository.getConditionDistribution();

    try {
      await this.redis.setex(cacheKey, ANALYTICS_TTL, JSON.stringify(result));
    } catch {
      /* Redis unavailable */
    }

    return result;
  }

  /** Budget pipeline by status with amounts ($queryRaw). Cached ${ANALYTICS_TTL}s. */
  async getBudgetPipeline() {
    const cacheKey = 'dashboard:budget-pipeline';
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      /* Redis unavailable */
    }

    const result = await this.dashboardRepository.getBudgetPipeline();

    try {
      await this.redis.setex(cacheKey, ANALYTICS_TTL, JSON.stringify(result));
    } catch {
      /* Redis unavailable */
    }

    return result;
  }

  /** Full admin analytics (10 repository calls). Cached ${ANALYTICS_TTL}s per month range. */
  async getAdminAnalytics(months = 6): Promise<AdminAnalytics> {
    const cacheKey = `dashboard:admin:analytics:${months}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as AdminAnalytics;
    } catch {
      // Redis unavailable — continue without cache
    }

    const [
      completionTrend,
      conditionDistribution,
      problematicCategories,
      budgetPipeline,
      categoryCosts,
      avgBudgetResponseDays,
      totalMaintenanceCost,
      completionRate,
      slaMetrics,
      problematicSectors,
    ] = await Promise.all([
      this.dashboardRepository.getCompletionTrend(months),
      this.dashboardRepository.getConditionDistribution(),
      this.dashboardRepository.getProblematicCategories(),
      this.dashboardRepository.getBudgetPipeline(),
      this.dashboardRepository.getCategoryCosts(months),
      this.dashboardRepository.getAvgBudgetResponseDays(),
      this.dashboardRepository.getTotalMaintenanceCost(),
      this.dashboardRepository.getCompletionRate(),
      this.dashboardRepository.getSlaMetrics(),
      this.dashboardRepository.getProblematicSectors(),
    ]);

    const result: AdminAnalytics = {
      completionTrend,
      conditionDistribution,
      problematicCategories,
      budgetPipeline,
      categoryCosts,
      avgBudgetResponseDays,
      totalMaintenanceCost,
      completionRate,
      slaMetrics,
      problematicSectors,
    };

    try {
      await this.redis.setex(cacheKey, ANALYTICS_TTL, JSON.stringify(result));
    } catch {
      // Redis unavailable — result still returned uncached
    }

    return result;
  }

  /** Client analytics (health, trends, costs). Cached ${ANALYTICS_TTL}s per user + month range. */
  async getClientAnalytics(userId: string, months = 6): Promise<ClientAnalytics> {
    const cacheKey = `dashboard:client:${userId}:analytics:${months}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as ClientAnalytics;
    } catch {
      // Redis unavailable
    }

    const { planIds } = await this.dashboardRepository.getClientPropertyAndPlanIds(userId);

    const [
      conditionTrend,
      costHistory,
      healthData,
      conditionDistribution,
      categoryBreakdown,
      sectorBreakdown,
      healthIndex,
    ] = await Promise.all([
      this.dashboardRepository.getClientConditionTrend(planIds, months),
      this.dashboardRepository.getClientCostHistory(planIds, months),
      this.dashboardRepository.getClientHealthScore(planIds),
      this.dashboardRepository.getClientConditionDistribution(planIds),
      this.dashboardRepository.getClientCategoryBreakdown(planIds),
      this.dashboardRepository.getClientSectorBreakdown(planIds),
      this.dashboardRepository.getPropertyHealthIndex(planIds),
    ]);

    const result = {
      conditionTrend,
      costHistory,
      healthScore: healthData.healthScore,
      healthLabel: healthData.healthLabel,
      conditionDistribution,
      categoryBreakdown,
      sectorBreakdown,
      healthIndex,
    } satisfies ClientAnalytics;

    try {
      await this.redis.setex(cacheKey, ANALYTICS_TTL, JSON.stringify(result));
    } catch {
      // Redis unavailable
    }

    return result;
  }
}
