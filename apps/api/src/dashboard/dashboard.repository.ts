import {
  BUDGET_STATUS_LABELS,
  BudgetStatus,
  CONDITION_FOUND_LABELS,
  type ConditionFound,
  type PropertySector,
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
          priority: 'URGENT',
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

    const rows = await this.prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char("completedAt", 'YYYY-MM') as month, COUNT(*) as count
      FROM "TaskLog"
      WHERE "completedAt" >= ${since}
      GROUP BY month ORDER BY month
    `;

    // Build full month range with zeros for months without data
    const buckets = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = subMonths(new Date(), months - 1 - i);
      buckets.set(format(d, 'yyyy-MM'), 0);
    }
    for (const row of rows) {
      if (buckets.has(row.month)) buckets.set(row.month, Number(row.count));
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

  /** Top sectors with most overdue tasks across all properties. */
  async getProblematicSectors() {
    const groups = await this.prisma.task.groupBy({
      by: ['sector'],
      where: { deletedAt: null, status: TaskStatus.OVERDUE, sector: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { sector: 'desc' } },
      take: 5,
    });

    return groups.map((g) => ({ sector: g.sector!, overdueCount: g._count._all }));
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

  /**
   * Completion rate = tasks with at least 1 TaskLog / total tasks.
   * Task.status is NOT reliable because EPDE tasks are cyclic — upon completion,
   * status resets to PENDING with a new nextDueDate. COMPLETED is transient.
   */
  async getCompletionRate() {
    const [total, withLogs] = await Promise.all([
      this.prisma.softDelete.task.count(),
      this.prisma.softDelete.task.count({
        where: { taskLogs: { some: {} } },
      }),
    ]);
    return total > 0 ? Math.round((withLogs / total) * 100) : 0;
  }

  // ─── Client Analytics Methods ──────────────────────────

  /**
   * Groups by month AND category with average condition scores.
   * Kept as in-memory aggregation (not $queryRaw) because the category name
   * requires a JOIN through Task → Category, and the dataset is bounded to
   * a single client's planIds — typically dozens of rows, not thousands.
   */
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
      orderBy: { completedAt: 'desc' },
      take: 5_000,
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

    const rows = await this.prisma.$queryRaw<{ month: string; total: number }[]>`
      SELECT to_char(tl."completedAt", 'YYYY-MM') as month, SUM(tl.cost)::float as total
      FROM "TaskLog" tl
      JOIN "Task" t ON t.id = tl."taskId"
      WHERE t."maintenancePlanId" IN (${Prisma.join(planIds)})
        AND tl."completedAt" >= ${since}
        AND tl.cost IS NOT NULL
      GROUP BY month ORDER BY month
    `;

    // Build full month range with zeros for months without data
    const buckets = new Map<string, number>();
    for (let i = 0; i < months; i++) {
      const d = subMonths(new Date(), months - 1 - i);
      buckets.set(format(d, 'yyyy-MM'), 0);
    }
    for (const row of rows) {
      if (buckets.has(row.month)) buckets.set(row.month, row.total);
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
      // Tasks are cyclic — COMPLETED is transient (resets to PENDING with new nextDueDate).
      // Count by TaskLog presence: a task with logs has been completed at least once.
      if (task.taskLogs.length > 0) entry.completedTasks++;
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
      // Tasks are cyclic — COMPLETED is transient. Count by TaskLog presence.
      this.prisma.softDelete.task.count({
        where: { maintenancePlanId: { in: planIds }, taskLogs: { some: {} } },
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

  /**
   * Property Health Index (ISV) — 5-dimensional score.
   * Uses only existing data (Task, TaskLog, sector).
   *
   * Safety bounds prevent unbounded result sets for properties with many tasks/logs.
   */
  /**
   * Safety bounds for health index queries. Prevents unbounded result sets
   * for properties with extensive inspection history.
   * - TASKS: 500 — single property rarely exceeds 200 active tasks
   * - RECENT_LOGS: 2000 — 12 months × 500 tasks × ~4 completions/year
   * - OLDER_LOGS: 1000 — 3-month window, fewer expected entries
   */
  private static readonly HEALTH_INDEX_LIMITS = {
    TASKS: 500,
    RECENT_LOGS: 2_000,
    OLDER_LOGS: 1_000,
  } as const;

  async getPropertyHealthIndex(planIds: string[]) {
    if (planIds.length === 0) {
      return {
        score: 0,
        label: 'Sin datos',
        dimensions: { compliance: 0, condition: 0, coverage: 0, investment: 0, trend: 0 },
        sectorScores: [],
      };
    }

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [tasks, recentLogs, olderLogs] = await Promise.all([
      this.prisma.task.findMany({
        where: { maintenancePlanId: { in: planIds }, deletedAt: null },
        select: { id: true, status: true, priority: true, sector: true, nextDueDate: true },
        take: DashboardRepository.HEALTH_INDEX_LIMITS.TASKS,
      }),
      this.prisma.taskLog.findMany({
        where: {
          task: { maintenancePlanId: { in: planIds } },
          completedAt: { gte: twelveMonthsAgo },
        },
        select: {
          conditionFound: true,
          actionTaken: true,
          completedAt: true,
          task: { select: { sector: true } },
        },
        take: DashboardRepository.HEALTH_INDEX_LIMITS.RECENT_LOGS,
        orderBy: { completedAt: 'desc' },
      }),
      // Older logs for trend comparison (3-6 months ago)
      this.prisma.taskLog.findMany({
        where: {
          task: { maintenancePlanId: { in: planIds } },
          completedAt: {
            gte: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
            lt: threeMonthsAgo,
          },
        },
        select: { conditionFound: true, actionTaken: true },
        take: DashboardRepository.HEALTH_INDEX_LIMITS.OLDER_LOGS,
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    if (tasks.length === 0) {
      return {
        score: 0,
        label: 'Sin datos',
        dimensions: { compliance: 0, condition: 0, coverage: 0, investment: 0, trend: 0 },
        sectorScores: [],
      };
    }

    // ─── 1. COMPLIANCE (35%) — weighted by priority ───
    const priorityWeight = { HIGH: 3, URGENT: 4, MEDIUM: 2, LOW: 1 } as Record<string, number>;
    let totalWeight = 0;
    let onTimeWeight = 0;
    for (const t of tasks) {
      const w = priorityWeight[t.priority] ?? 2;
      totalWeight += w;
      if (t.status !== TaskStatus.OVERDUE) onTimeWeight += w;
    }
    const compliance = totalWeight > 0 ? Math.round((onTimeWeight / totalWeight) * 100) : 100;

    // ─── 2. CONDITION (30%) — avg conditionFound of recent inspections ───
    const conditionMap: Record<string, number> = {
      EXCELLENT: 100,
      GOOD: 80,
      FAIR: 60,
      POOR: 40,
      CRITICAL: 20,
    };
    const conditionScores = recentLogs
      .map((l) => conditionMap[l.conditionFound] ?? 60)
      .filter((v) => v != null);
    const condition =
      conditionScores.length > 0
        ? Math.round(conditionScores.reduce((a, b) => a + b, 0) / conditionScores.length)
        : 50; // default if no inspections

    // ─── 3. COVERAGE (20%) — % sectors with inspection in last 12 months ───
    const allSectors = new Set(tasks.map((t) => t.sector).filter(Boolean));
    const inspectedSectors = new Set(recentLogs.map((l) => l.task.sector).filter(Boolean));
    const coverage =
      allSectors.size > 0 ? Math.round((inspectedSectors.size / allSectors.size) * 100) : 0;

    // ─── 4. INVESTMENT (15%) — preventive vs corrective ratio ───
    const preventiveActions = ['INSPECTION_ONLY', 'CLEANING', 'ADJUSTMENT', 'SEALING'];
    const preventiveCount = recentLogs.filter((l) =>
      preventiveActions.includes(l.actionTaken),
    ).length;
    const _correctiveCount = recentLogs.length - preventiveCount;
    const investment =
      recentLogs.length > 0 ? Math.round((preventiveCount / recentLogs.length) * 100) : 50;

    // ─── 5. TREND — compare current quarter condition vs previous ───
    const recentConditionAvg = recentLogs
      .filter((l) => l.completedAt >= threeMonthsAgo)
      .map((l) => conditionMap[l.conditionFound] ?? 60);
    const olderConditionAvg = olderLogs.map((l) => conditionMap[l.conditionFound] ?? 60);

    const avgRecent =
      recentConditionAvg.length > 0
        ? recentConditionAvg.reduce((a, b) => a + b, 0) / recentConditionAvg.length
        : 50;
    const avgOlder =
      olderConditionAvg.length > 0
        ? olderConditionAvg.reduce((a, b) => a + b, 0) / olderConditionAvg.length
        : 50;
    // Trend: 50 = stable, >50 = improving, <50 = declining
    const trend = Math.max(0, Math.min(100, Math.round(50 + (avgRecent - avgOlder))));

    // ─── GLOBAL SCORE ───
    const globalScore = Math.round(
      compliance * 0.35 + condition * 0.3 + coverage * 0.2 + investment * 0.15,
    );

    const labels: [number, string][] = [
      [80, 'Excelente'],
      [60, 'Bueno'],
      [40, 'Regular'],
      [20, 'Necesita atención'],
      [0, 'Crítico'],
    ];
    const label = labels.find(([threshold]) => globalScore >= threshold)?.[1] ?? 'Crítico';

    // ─── SECTOR SCORES ───
    const sectorMap = new Map<string, { total: number; overdue: number }>();
    for (const t of tasks) {
      if (!t.sector) continue;
      const entry = sectorMap.get(t.sector) ?? { total: 0, overdue: 0 };
      entry.total += 1;
      if (t.status === TaskStatus.OVERDUE) entry.overdue += 1;
      sectorMap.set(t.sector, entry);
    }
    const sectorScores = [...sectorMap.entries()]
      .map(([sector, data]) => ({
        sector,
        score: data.total > 0 ? Math.round(((data.total - data.overdue) / data.total) * 100) : 100,
        overdue: data.overdue,
        total: data.total,
      }))
      .sort((a, b) => a.score - b.score);

    return {
      score: globalScore,
      label,
      dimensions: { compliance, condition, coverage, investment, trend },
      sectorScores,
    };
  }

  /** SLA metrics for service requests: average response time and resolution time. */
  async getSlaMetrics() {
    const [result] = await this.prisma.$queryRaw<
      {
        avg_response_hours: number | null;
        avg_resolution_hours: number | null;
        total_tracked: bigint;
      }[]
    >`
      SELECT
        AVG(EXTRACT(EPOCH FROM ("firstResponseAt" - "createdAt")) / 3600)::float as avg_response_hours,
        AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600)::float as avg_resolution_hours,
        COUNT(*) as total_tracked
      FROM "ServiceRequest"
      WHERE "deletedAt" IS NULL
        AND ("firstResponseAt" IS NOT NULL OR "resolvedAt" IS NOT NULL)
    `;

    return {
      avgResponseHours: result?.avg_response_hours ? Math.round(result.avg_response_hours) : null,
      avgResolutionHours: result?.avg_resolution_hours
        ? Math.round(result.avg_resolution_hours)
        : null,
      totalTracked: Number(result?.total_tracked ?? 0),
    };
  }

  /** Sector breakdown: task count, overdue, completed per sector for a set of plans. */
  async getClientSectorBreakdown(planIds: string[]) {
    if (planIds.length === 0) return [];

    const [tasks, logs] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          maintenancePlanId: { in: planIds },
          deletedAt: null,
          sector: { not: null },
        },
        select: { id: true, sector: true, status: true },
      }),
      this.prisma.taskLog.findMany({
        where: {
          task: { maintenancePlanId: { in: planIds }, sector: { not: null } },
          cost: { not: null },
        },
        select: { cost: true, task: { select: { sector: true } } },
      }),
    ]);

    const map = new Map<
      PropertySector,
      { total: number; overdue: number; pending: number; cost: number }
    >();
    for (const t of tasks) {
      if (!t.sector) continue;
      const sector = t.sector as PropertySector;
      const entry = map.get(sector) ?? { total: 0, overdue: 0, pending: 0, cost: 0 };
      entry.total += 1;
      if (t.status === TaskStatus.OVERDUE) entry.overdue += 1;
      if (t.status === TaskStatus.PENDING || t.status === TaskStatus.UPCOMING) entry.pending += 1;
      map.set(sector, entry);
    }

    for (const log of logs) {
      if (!log.task.sector) continue;
      const entry = map.get(log.task.sector as PropertySector);
      if (entry) entry.cost += Number(log.cost);
    }

    return [...map.entries()]
      .map(([sector, data]) => ({ sector, ...data }))
      .sort((a, b) => b.total - a.total);
  }
}
