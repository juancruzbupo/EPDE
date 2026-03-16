import {
  BUDGET_STATUS_LABELS,
  BudgetStatus,
  CONDITION_FOUND_LABELS,
  type ConditionFound,
  ServiceStatus,
  TaskStatus,
  UserRole,
} from '@epde/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { addDays, format, startOfMonth, subMonths } from 'date-fns';

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
  /** ConditionFound → numeric score for averaging. Default 3 (FAIR) for unknown values. */
  private static readonly CONDITION_SCORES: Record<ConditionFound, number> = {
    EXCELLENT: 5,
    GOOD: 4,
    FAIR: 3,
    POOR: 2,
    CRITICAL: 1,
  };

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
          select: { id: true, name: true, updatedAt: true, maintenancePlanId: true },
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

  // ─── Analytics Methods ──────────────────────────────────

  private monthLabels = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  private toMonthLabel(date: Date): string {
    return this.monthLabels[date.getMonth()]!;
  }

  async getCompletionTrend(months: number) {
    const since = subMonths(startOfMonth(new Date()), months - 1);

    const rows = await this.prisma.taskLog.groupBy({
      by: ['completedAt'],
      _count: true,
      where: { completedAt: { gte: since } },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = subMonths(new Date(), months - 1 - i);
      buckets.set(format(d, 'yyyy-MM'), 0);
    }

    for (const row of rows) {
      const key = format(row.completedAt, 'yyyy-MM');
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + row._count);
      }
    }

    return [...buckets.entries()].map(([month, value]) => ({
      month,
      label: this.toMonthLabel(new Date(month + '-01')),
      value,
    }));
  }

  async getConditionDistribution() {
    const groups = await this.prisma.taskLog.groupBy({
      by: ['conditionFound'],
      _count: true,
    });

    return groups.map((g) => ({
      condition: g.conditionFound as ConditionFound,
      count: g._count,
      label: CONDITION_FOUND_LABELS[g.conditionFound as ConditionFound] ?? g.conditionFound,
    }));
  }

  async getProblematicCategories() {
    const rows = await this.prisma.$queryRaw<
      { categoryName: string; totalInspections: bigint; issueCount: bigint }[]
    >(
      Prisma.sql`
        SELECT c.name AS "categoryName",
               COUNT(*)::bigint AS "totalInspections",
               COUNT(*) FILTER (WHERE tl.result IN ('NEEDS_ATTENTION', 'NEEDS_REPAIR', 'NEEDS_URGENT_REPAIR'))::bigint AS "issueCount"
        FROM "TaskLog" tl
        JOIN "Task" t ON tl."taskId" = t.id AND t."deletedAt" IS NULL
        JOIN "Category" c ON t."categoryId" = c.id
        GROUP BY c.name
        HAVING COUNT(*) FILTER (WHERE tl.result IN ('NEEDS_ATTENTION', 'NEEDS_REPAIR', 'NEEDS_URGENT_REPAIR')) > 0
        ORDER BY COUNT(*) FILTER (WHERE tl.result IN ('NEEDS_ATTENTION', 'NEEDS_REPAIR', 'NEEDS_URGENT_REPAIR')) DESC
        LIMIT 5
      `,
    );

    return rows.map((r) => ({
      categoryName: r.categoryName,
      issueCount: Number(r.issueCount),
      totalInspections: Number(r.totalInspections),
    }));
  }

  async getBudgetPipeline() {
    const rows = await this.prisma.$queryRaw<
      { status: string; count: bigint; totalAmount: number | null }[]
    >(
      Prisma.sql`
        SELECT br.status,
               COUNT(*)::bigint AS count,
               COALESCE(SUM(resp."totalAmount"), 0)::float AS "totalAmount"
        FROM "BudgetRequest" br
        LEFT JOIN "BudgetResponse" resp ON resp."budgetRequestId" = br.id
        WHERE br."deletedAt" IS NULL
        GROUP BY br.status
      `,
    );

    return rows.map((r) => ({
      status: r.status as BudgetStatus,
      count: Number(r.count),
      label: BUDGET_STATUS_LABELS[r.status as BudgetStatus] ?? r.status,
      totalAmount: r.totalAmount ?? 0,
    }));
  }

  async getCategoryCosts(months: number) {
    const since = subMonths(startOfMonth(new Date()), months - 1);

    // Pre-build empty month buckets so months with no costs still appear
    const buckets = new Map<string, Record<string, number>>();
    for (let i = 0; i < months; i++) {
      const d = subMonths(new Date(), months - 1 - i);
      buckets.set(format(d, 'yyyy-MM'), {});
    }

    const rows = await this.prisma.$queryRaw<{ month: string; category: string; total: number }[]>(
      Prisma.sql`
        SELECT to_char(tl."completedAt", 'YYYY-MM') AS month,
               c.name AS category,
               SUM(tl.cost)::float AS total
        FROM "TaskLog" tl
        JOIN "Task" t ON tl."taskId" = t.id
        JOIN "Category" c ON t."categoryId" = c.id
        WHERE tl.cost IS NOT NULL AND tl."completedAt" >= ${since}
        GROUP BY 1, 2
        ORDER BY 1
      `,
    );

    for (const row of rows) {
      const bucket = buckets.get(row.month);
      if (bucket) {
        bucket[row.category] = row.total;
      }
    }

    return [...buckets.entries()].map(([month, categories]) => ({
      month,
      label: this.toMonthLabel(new Date(month + '-01')),
      categories,
    }));
  }

  async getAvgBudgetResponseDays() {
    const result = await this.prisma.$queryRaw<[{ avg_days: number | null }]>(
      Prisma.sql`
        SELECT AVG(EXTRACT(EPOCH FROM (br."respondedAt" - bq."createdAt")) / 86400)::float AS avg_days
        FROM "BudgetResponse" br
        JOIN "BudgetRequest" bq ON bq.id = br."budgetRequestId"
        WHERE bq."deletedAt" IS NULL
      `,
    );
    const avg = result[0]?.avg_days;
    return avg !== null && avg !== undefined ? Math.round(avg * 10) / 10 : null;
  }

  async getTotalMaintenanceCost() {
    const result = await this.prisma.taskLog.aggregate({
      _sum: { cost: true },
    });
    return Number(result._sum.cost ?? 0);
  }

  async getCompletionRate() {
    const [total, completed] = await Promise.all([
      this.prisma.softDelete.task.count(),
      this.prisma.softDelete.task.count({ where: { status: TaskStatus.COMPLETED } }),
    ]);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  // ─── Client Analytics Methods ──────────────────────────

  async getClientConditionTrend(planIds: string[], months: number) {
    if (planIds.length === 0) return [];
    const since = subMonths(startOfMonth(new Date()), months - 1);

    const logs = await this.prisma.taskLog.findMany({
      where: {
        task: { maintenancePlanId: { in: planIds } },
        completedAt: { gte: since },
      },
      select: {
        completedAt: true,
        conditionFound: true,
        task: { select: { category: { select: { name: true } } } },
      },
    });

    const buckets = new Map<string, Map<string, number[]>>();
    for (let i = 0; i < months; i++) {
      const d = subMonths(new Date(), months - 1 - i);
      buckets.set(format(d, 'yyyy-MM'), new Map());
    }

    for (const log of logs) {
      const key = format(log.completedAt, 'yyyy-MM');
      const catName = log.task.category.name;
      const bucket = buckets.get(key);
      if (bucket) {
        if (!bucket.has(catName)) bucket.set(catName, []);
        bucket
          .get(catName)!
          .push(DashboardRepository.CONDITION_SCORES[log.conditionFound as ConditionFound] ?? 3);
      }
    }

    return [...buckets.entries()].map(([month, catMap]) => {
      const categories: Record<string, number> = {};
      for (const [cat, scores] of catMap) {
        categories[cat] = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      }
      return {
        month,
        label: this.toMonthLabel(new Date(month + '-01')),
        categories,
      };
    });
  }

  async getClientCostHistory(planIds: string[], months: number) {
    if (planIds.length === 0) return [];
    const since = subMonths(startOfMonth(new Date()), months - 1);

    const logs = await this.prisma.taskLog.findMany({
      where: {
        task: { maintenancePlanId: { in: planIds } },
        completedAt: { gte: since },
        cost: { not: null },
      },
      select: { completedAt: true, cost: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = subMonths(new Date(), months - 1 - i);
      buckets.set(format(d, 'yyyy-MM'), 0);
    }

    for (const log of logs) {
      const key = format(log.completedAt, 'yyyy-MM');
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + Number(log.cost));
      }
    }

    return [...buckets.entries()].map(([month, value]) => ({
      month,
      label: this.toMonthLabel(new Date(month + '-01')),
      value,
    }));
  }

  async getClientConditionDistribution(planIds: string[]) {
    if (planIds.length === 0) return [];

    const groups = await this.prisma.taskLog.groupBy({
      by: ['conditionFound'],
      _count: true,
      where: { task: { maintenancePlanId: { in: planIds } } },
    });

    return groups.map((g) => ({
      condition: g.conditionFound as ConditionFound,
      count: g._count,
      label: CONDITION_FOUND_LABELS[g.conditionFound as ConditionFound] ?? g.conditionFound,
    }));
  }

  async getClientCategoryBreakdown(planIds: string[]) {
    if (planIds.length === 0) return [];
    const now = new Date();

    const tasks = await this.prisma.softDelete.task.findMany({
      where: { maintenancePlanId: { in: planIds } },
      select: {
        status: true,
        nextDueDate: true,
        category: { select: { name: true } },
        taskLogs: {
          select: { conditionFound: true },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    const catMap = new Map<
      string,
      {
        totalTasks: number;
        completedTasks: number;
        overdueTasks: number;
        conditionScores: number[];
      }
    >();

    for (const task of tasks) {
      const name = task.category.name;
      if (!catMap.has(name)) {
        catMap.set(name, {
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          conditionScores: [],
        });
      }
      const entry = catMap.get(name)!;
      entry.totalTasks++;
      if (task.status === TaskStatus.COMPLETED) entry.completedTasks++;
      if (task.nextDueDate && task.nextDueDate < now && task.status !== TaskStatus.COMPLETED) {
        entry.overdueTasks++;
      }
      if (task.taskLogs[0]) {
        entry.conditionScores.push(
          DashboardRepository.CONDITION_SCORES[task.taskLogs[0].conditionFound as ConditionFound] ??
            3,
        );
      }
    }

    return [...catMap.entries()]
      .map(([categoryName, data]) => ({
        categoryName,
        totalTasks: data.totalTasks,
        completedTasks: data.completedTasks,
        overdueTasks: data.overdueTasks,
        avgCondition:
          data.conditionScores.length > 0
            ? Math.round(
                (data.conditionScores.reduce((a, b) => a + b, 0) / data.conditionScores.length) *
                  10,
              ) / 10
            : 0,
      }))
      .sort((a, b) => b.totalTasks - a.totalTasks);
  }

  async getClientHealthScore(planIds: string[]) {
    if (planIds.length === 0) return { healthScore: 0, healthLabel: 'Sin datos' };
    const now = new Date();

    const [total, completed, overdue] = await Promise.all([
      this.prisma.softDelete.task.count({ where: { maintenancePlanId: { in: planIds } } }),
      this.prisma.softDelete.task.count({
        where: { maintenancePlanId: { in: planIds }, status: TaskStatus.COMPLETED },
      }),
      this.prisma.softDelete.task.count({
        where: {
          maintenancePlanId: { in: planIds },
          nextDueDate: { lt: now },
          status: { not: TaskStatus.COMPLETED },
        },
      }),
    ]);

    if (total === 0) return { healthScore: 0, healthLabel: 'Sin datos' };

    const completionRatio = completed / total;
    const overdueRatio = overdue / total;
    const score = Math.max(0, Math.min(100, Math.round(completionRatio * 100 - overdueRatio * 50)));

    const labels: [number, string][] = [
      [80, 'Excelente'],
      [60, 'Bueno'],
      [40, 'Regular'],
      [20, 'Pobre'],
      [0, 'Crítico'],
    ];
    const healthLabel = labels.find(([threshold]) => score >= threshold)?.[1] ?? 'Crítico';

    return { healthScore: score, healthLabel };
  }

  /** SLA metrics for service requests: average response time and resolution time. */
  async getSlaMetrics() {
    const requests = await this.prisma.softDelete.serviceRequest.findMany({
      where: {
        OR: [{ firstResponseAt: { not: null } }, { resolvedAt: { not: null } }],
      },
      select: { createdAt: true, firstResponseAt: true, resolvedAt: true },
    });

    let totalResponseHours = 0;
    let responseCount = 0;
    let totalResolutionHours = 0;
    let resolutionCount = 0;

    for (const r of requests) {
      if (r.firstResponseAt) {
        totalResponseHours +=
          (r.firstResponseAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
        responseCount++;
      }
      if (r.resolvedAt) {
        totalResolutionHours += (r.resolvedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
        resolutionCount++;
      }
    }

    return {
      avgResponseHours: responseCount > 0 ? Math.round(totalResponseHours / responseCount) : null,
      avgResolutionHours:
        resolutionCount > 0 ? Math.round(totalResolutionHours / resolutionCount) : null,
      totalTracked: requests.length,
    };
  }
}
