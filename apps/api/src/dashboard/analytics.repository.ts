import {
  BUDGET_STATUS_LABELS,
  BudgetStatus,
  CONDITION_FOUND_LABELS,
  CONDITION_SCORE,
  type ConditionFound,
  TaskStatus,
} from '@epde/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { format, startOfMonth, subMonths } from 'date-fns';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Analytics repository — completion trends, condition distribution,
 * category breakdown, expenses, SLA metrics.
 *
 * **Intentionally multi-model.** This repository does NOT extend `BaseRepository`
 * because it aggregates data across Task, TaskLog, Category, BudgetRequest,
 * BudgetResponse, ServiceRequest, and ISVSnapshot models. A single-model
 * repository cannot express these cross-cutting analytics queries.
 *
 * Uses `this.prisma.softDelete.{model}` for filtered reads and `$queryRaw`
 * for heavy aggregations (GROUP BY, window functions). If the soft-delete
 * mechanism changes, update this file alongside BaseRepository.
 *
 * Split consideration: if this file exceeds ~600 LOC, split into
 * `AdminAnalyticsRepository` (admin-scoped: global trends, SLA, pipeline)
 * and `ClientAnalyticsRepository` (client-scoped: planIds-filtered methods).
 */
@Injectable()
export class AnalyticsRepository {
  /** Alias for CONDITION_SCORE from shared — used in chart averaging methods. */
  private static readonly CONDITION_SCORES = CONDITION_SCORE;

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

  constructor(private readonly prisma: PrismaService) {}

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

  // ─── Client Analytics Methods ──────────────────────────

  /**
   * Groups by month AND category with average condition scores.
   * Kept as in-memory aggregation (not $queryRaw) because the category name
   * requires a JOIN through Task -> Category, and the dataset is bounded to
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
      // Capped at 1000 — covers ~3 years of bi-weekly inspections per property.
      // If a client exceeds this, charts show partial data (recent months only).
      // Acceptable trade-off: analytics accuracy vs. query cost.
      take: 1_000,
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
          .push(AnalyticsRepository.CONDITION_SCORES[log.conditionFound as ConditionFound] ?? 3);
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

  /**
   * Category breakdown for client dashboard.
   *
   * **Performance note (P2 fix):** Previously used nested `taskLogs: { take: 1 }`
   * which caused Prisma to execute 1 subquery per task (N+1). Now uses 2 flat
   * queries: (1) tasks with categories, (2) latest log per task via $queryRaw
   * with ROW_NUMBER() window function. Reduces 201 queries -> 2 queries.
   */
  async getClientCategoryBreakdown(planIds: string[]) {
    if (planIds.length === 0) return [];
    const now = new Date();

    // Query 1: All tasks with their category (1 query, no nested subqueries)
    const tasks = await this.prisma.softDelete.task.findMany({
      where: { maintenancePlanId: { in: planIds } },
      take: 100,
      select: {
        id: true,
        status: true,
        nextDueDate: true,
        category: { select: { name: true } },
      },
    });

    if (tasks.length === 0) return [];

    // Query 2: Latest log per task using window function (1 query for ALL tasks)
    const taskIds = tasks.map((t) => t.id);
    const latestLogs: Array<{ taskId: string; conditionFound: string }> = await this.prisma
      .$queryRaw`
      SELECT "taskId", "conditionFound"
      FROM (
        SELECT "taskId", "conditionFound",
               ROW_NUMBER() OVER (PARTITION BY "taskId" ORDER BY "completedAt" DESC) AS rn
        FROM "TaskLog"
        WHERE "taskId" = ANY(${taskIds})
      ) sub
      WHERE rn = 1
    `;

    // Build a map taskId -> conditionFound for fast lookup
    const logMap = new Map<string, string>();
    for (const log of latestLogs) {
      logMap.set(log.taskId, log.conditionFound);
    }

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

      const hasLog = logMap.has(task.id);
      if (hasLog) entry.completedTasks++;
      if (task.nextDueDate && task.nextDueDate < now && task.status !== TaskStatus.COMPLETED) {
        entry.overdueTasks++;
      }
      const condition = logMap.get(task.id);
      if (condition) {
        entry.conditionScores.push(
          AnalyticsRepository.CONDITION_SCORES[condition as ConditionFound] ?? 3,
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
}
