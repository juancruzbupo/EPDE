import { type PropertySector, TaskStatus } from '@epde/shared';
import { Injectable } from '@nestjs/common';
import { addDays, startOfMonth, subMonths } from 'date-fns';

import { PrismaService } from '../prisma/prisma.service';
import { computeHealthIndex } from './health-index.calculator';

/**
 * Health index (ISV) repository — scoring, batch health, sector scores, streak.
 *
 * Uses `this.prisma.softDelete.{model}` directly (not BaseRepository) for
 * cross-model aggregations. If the soft-delete mechanism changes, this file
 * must be updated alongside BaseRepository.
 */
@Injectable()
export class HealthIndexRepository {
  /**
   * Safety bounds for health index queries. Prevents unbounded result sets
   * for properties with extensive inspection history.
   * - TASKS: 500 — single property rarely exceeds 200 active tasks
   * - RECENT_LOGS: 2000 — 12 months x 500 tasks x ~4 completions/year
   * - OLDER_LOGS: 1000 — 3-month window, fewer expected entries
   */
  private static readonly HEALTH_INDEX_LIMITS = {
    TASKS: 500,
    RECENT_LOGS: 2_000,
    OLDER_LOGS: 1_000,
  } as const;

  constructor(private readonly prisma: PrismaService) {}

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
        take: HealthIndexRepository.HEALTH_INDEX_LIMITS.TASKS,
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
        take: HealthIndexRepository.HEALTH_INDEX_LIMITS.RECENT_LOGS,
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
        take: HealthIndexRepository.HEALTH_INDEX_LIMITS.OLDER_LOGS,
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    return computeHealthIndex(
      tasks,
      recentLogs.map((l) => ({
        conditionFound: l.conditionFound,
        actionTaken: l.actionTaken,
        completedAt: l.completedAt,
        taskSector: l.task.sector,
      })),
      olderLogs.map((l) => ({
        conditionFound: l.conditionFound,
        actionTaken: l.actionTaken,
      })),
      threeMonthsAgo,
    );
  }

  /**
   * Batch ISV calculation — fetches data once for ALL planIds, then computes per-plan.
   * Returns a Map<planId, HealthIndex>. Used by properties list to avoid N+1 queries.
   */
  async getPropertyHealthIndexBatch(planIds: string[]): Promise<
    Map<
      string,
      {
        score: number;
        label: string;
        dimensions: {
          compliance: number;
          condition: number;
          coverage: number;
          investment: number;
          trend: number;
        };
        sectorScores: { sector: string; score: number; overdue: number }[];
      }
    >
  > {
    type HealthResult = {
      score: number;
      label: string;
      dimensions: {
        compliance: number;
        condition: number;
        coverage: number;
        investment: number;
        trend: number;
      };
      sectorScores: { sector: string; score: number; overdue: number }[];
    };
    const result = new Map<string, HealthResult>();
    if (planIds.length === 0) return result;

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // 3 queries total (not 3 x N)
    const [allTasks, allRecentLogs] = await Promise.all([
      this.prisma.task.findMany({
        where: { maintenancePlanId: { in: planIds }, deletedAt: null },
        select: {
          maintenancePlanId: true,
          status: true,
          priority: true,
          sector: true,
        },
      }),
      this.prisma.taskLog.findMany({
        where: {
          task: { maintenancePlanId: { in: planIds } },
          completedAt: { gte: twelveMonthsAgo },
        },
        select: {
          conditionFound: true,
          actionTaken: true,
          task: { select: { maintenancePlanId: true, sector: true } },
        },
      }),
    ]);

    // Group by planId
    const tasksByPlan = new Map<string, typeof allTasks>();
    for (const t of allTasks) {
      const arr = tasksByPlan.get(t.maintenancePlanId) ?? [];
      arr.push(t);
      tasksByPlan.set(t.maintenancePlanId, arr);
    }
    const logsByPlan = new Map<string, typeof allRecentLogs>();
    for (const l of allRecentLogs) {
      const pid = l.task.maintenancePlanId;
      const arr = logsByPlan.get(pid) ?? [];
      arr.push(l);
      logsByPlan.set(pid, arr);
    }

    for (const planId of planIds) {
      const tasks = tasksByPlan.get(planId) ?? [];
      const logs = logsByPlan.get(planId) ?? [];

      const healthIndex = computeHealthIndex(
        tasks,
        logs.map((l) => ({
          conditionFound: l.conditionFound,
          actionTaken: l.actionTaken,
          taskSector: l.task.sector,
        })),
      );

      result.set(planId, healthIndex);
    }

    return result;
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

  // ─── Dopamine features ──────────────────────────────────

  /** Get ISV score delta between current and previous monthly snapshot.
   * Returns null if fewer than 2 snapshots exist. */
  async getIsvDelta(propertyIds: string[]): Promise<number | null> {
    if (propertyIds.length === 0) return null;

    // Get the 2 most recent snapshots across all user properties
    const snapshots = await this.prisma.iSVSnapshot.findMany({
      where: { propertyId: { in: propertyIds } },
      orderBy: { snapshotDate: 'desc' },
      take: 2,
      select: { score: true },
    });

    if (snapshots.length < 2 || !snapshots[0] || !snapshots[1]) return null;
    return snapshots[0].score - snapshots[1].score;
  }

  /** Count consecutive months (from now backwards) where the user had
   * zero OVERDUE tasks that the owner can do (OWNER_CAN_DO).
   * Professional-only tasks are excluded — the owner can't control those. */
  async getMaintenanceStreak(planIds: string[]): Promise<number> {
    if (planIds.length === 0) return 0;

    const now = new Date();
    let streak = 0;

    // Check up to 24 months back
    for (let i = 0; i < 24; i++) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = startOfMonth(subMonths(now, i - 1));

      // Count tasks that were overdue during this month AND are OWNER_CAN_DO
      const overdueCount = await this.prisma.softDelete.task.count({
        where: {
          maintenancePlanId: { in: planIds },
          professionalRequirement: 'OWNER_CAN_DO',
          status: TaskStatus.OVERDUE,
          nextDueDate: { gte: monthStart, lt: monthEnd },
        },
      });

      // Also check if any OWNER_CAN_DO tasks had a log entry this month (completed late = still counts)
      const completedLateCount =
        i === 0
          ? 0
          : await this.prisma.taskLog.count({
              where: {
                task: {
                  maintenancePlanId: { in: planIds },
                  professionalRequirement: 'OWNER_CAN_DO',
                },
                completedAt: { gte: monthStart, lt: monthEnd },
              },
            });

      // Net overdue = overdue that month minus those completed late
      const netOverdue = Math.max(0, overdueCount - completedLateCount);

      if (netOverdue > 0) break;
      streak++;
    }

    return streak;
  }

  /** Annual progress summary for a client's properties. */
  async getAnnualSummary(planIds: string[]) {
    if (planIds.length === 0)
      return {
        tasksCompleted: 0,
        problemsDetected: 0,
        estimatedSavings: 0,
        isvStart: null,
        isvEnd: null,
      };

    const yearAgo = subMonths(new Date(), 12);

    const [tasksCompleted, problemsDetected, snapshots] = await Promise.all([
      this.prisma.taskLog.count({
        where: {
          task: { maintenancePlanId: { in: planIds } },
          completedAt: { gte: yearAgo },
        },
      }),
      this.prisma.taskLog.count({
        where: {
          task: { maintenancePlanId: { in: planIds } },
          completedAt: { gte: yearAgo },
          conditionFound: { in: ['POOR', 'CRITICAL'] },
        },
      }),
      this.prisma.iSVSnapshot.findMany({
        where: {
          property: { maintenancePlan: { id: { in: planIds } } },
          snapshotDate: { gte: yearAgo },
        },
        orderBy: { snapshotDate: 'asc' },
        select: { score: true },
      }),
    ]);

    const isvStart = snapshots.length > 0 ? snapshots[0]!.score : null;
    const isvEnd = snapshots.length > 1 ? snapshots[snapshots.length - 1]!.score : null;

    return {
      tasksCompleted,
      problemsDetected,
      estimatedSavings: problemsDetected * 250_000, // avg $250K saved per early detection
      isvStart,
      isvEnd,
    };
  }

  /** Check if all tasks due this week have been completed (perfect week). */
  async getPerfectWeek(planIds: string[]): Promise<boolean> {
    if (planIds.length === 0) return false;

    const now = new Date();
    const weekEnd = addDays(now, 7);

    // Count tasks due this week that are NOT completed
    const pendingThisWeek = await this.prisma.softDelete.task.count({
      where: {
        maintenancePlanId: { in: planIds },
        nextDueDate: { gte: now, lt: weekEnd },
        status: { in: [TaskStatus.PENDING, TaskStatus.UPCOMING, TaskStatus.OVERDUE] },
      },
    });

    // A perfect week means zero pending/overdue tasks due this week
    // AND at least one task was completed this week
    if (pendingThisWeek > 0) return false;

    const startOfWeek = addDays(now, -now.getDay());
    const completedThisWeek = await this.prisma.taskLog.count({
      where: {
        task: { maintenancePlanId: { in: planIds } },
        completedAt: { gte: startOfWeek },
      },
    });

    return completedThisWeek > 0;
  }
}
