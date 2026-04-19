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

  /**
   * Agregado operativo de inspecciones técnicas para el dashboard admin.
   * Vive acá (y no en TechnicalInspectionsRepository) para evitar la dependencia
   * circular DashboardModule → TechnicalInspectionsModule → PropertiesModule →
   * DashboardModule. Lógicamente es una query "dashboard", no de dominio.
   */
  async getTechnicalInspectionsSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      awaitingSchedule,
      scheduledCount,
      inProgressCount,
      awaitingPayment,
      oldestReportReady,
      paidThisMonth,
      mixByType,
    ] = await Promise.all([
      this.prisma.softDelete.technicalInspection.count({ where: { status: 'REQUESTED' } }),
      this.prisma.softDelete.technicalInspection.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.softDelete.technicalInspection.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.softDelete.technicalInspection.count({ where: { status: 'REPORT_READY' } }),
      this.prisma.softDelete.technicalInspection.findFirst({
        where: { status: 'REPORT_READY' },
        orderBy: { completedAt: 'asc' },
        select: { completedAt: true },
      }),
      this.prisma.softDelete.technicalInspection.findMany({
        where: { feeStatus: 'PAID', paidAt: { gte: startOfMonth } },
        select: { feeAmount: true },
      }),
      this.prisma.softDelete.technicalInspection.groupBy({
        by: ['type'],
        _count: { _all: true },
        where: { status: { not: 'CANCELED' } },
      }),
    ]);

    const revenueThisMonth = paidThisMonth.reduce((sum, r) => sum + Number(r.feeAmount), 0);
    const oldestAwaitingPaymentDays =
      oldestReportReady?.completedAt != null
        ? Math.floor(
            (now.getTime() - oldestReportReady.completedAt.getTime()) / (1000 * 60 * 60 * 24),
          )
        : null;

    const mix = { BASIC: 0, STRUCTURAL: 0, SALE: 0 };
    for (const row of mixByType) {
      mix[row.type as 'BASIC' | 'STRUCTURAL' | 'SALE'] = row._count._all;
    }

    const inProgress = scheduledCount + inProgressCount;
    const totalActive = awaitingSchedule + inProgress + awaitingPayment;

    return {
      totalActive,
      awaitingSchedule,
      inProgress,
      awaitingPayment,
      oldestAwaitingPaymentDays,
      revenueThisMonth,
      mixByType: mix,
    };
  }

  /**
   * Launch tracking del plan EPDE: cuenta clientes con priceTier asignado
   * (post-tiering abril 2026), breakdown por tier, revenue del mes, y
   * warning al acercarse al target (20 clientes).
   */
  async getPlanLaunchSummary() {
    const LAUNCH_TARGET = 20;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [tieredPlans, monthlyPlans] = await Promise.all([
      this.prisma.maintenancePlan.findMany({
        where: { priceTier: { not: null } },
        select: { priceTier: true, priceAmount: true },
      }),
      this.prisma.maintenancePlan.findMany({
        where: { priceTier: { not: null }, createdAt: { gte: startOfMonth } },
        select: { priceAmount: true },
      }),
    ]);

    const mix = { SMALL: 0, MEDIUM: 0, LARGE: 0 };
    let totalAmount = 0;
    for (const plan of tieredPlans) {
      if (plan.priceTier) {
        mix[plan.priceTier as 'SMALL' | 'MEDIUM' | 'LARGE']++;
      }
      if (plan.priceAmount) totalAmount += Number(plan.priceAmount);
    }

    const revenueThisMonth = monthlyPlans.reduce(
      (sum, p) => sum + (p.priceAmount ? Number(p.priceAmount) : 0),
      0,
    );

    const clientsOnboarded = tieredPlans.length;
    const avgEffectivePrice = clientsOnboarded > 0 ? totalAmount / clientsOnboarded : 0;

    return {
      clientsOnboarded,
      launchTarget: LAUNCH_TARGET,
      progressPct: Math.min(clientsOnboarded / LAUNCH_TARGET, 1),
      tierMix: mix,
      revenueThisMonth,
      avgEffectivePrice,
      priceIncreaseWarning:
        clientsOnboarded >= LAUNCH_TARGET - 2 && clientsOnboarded < LAUNCH_TARGET,
      targetReached: clientsOnboarded >= LAUNCH_TARGET,
    };
  }

  /**
   * Revenue consolidado mensual: suma plan + inspecciones técnicas + suscripción
   * (placeholder = 0 hasta que exista modelo formal). Compara mes actual vs mes
   * anterior y expone YTD para contexto anual.
   */
  async getRevenueConsolidated() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfThisMonth = startOfMonth;
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [planThisMonth, planLastMonth, planYtd, inspThisMonth, inspLastMonth, inspYtd] =
      await Promise.all([
        this.prisma.maintenancePlan.findMany({
          where: { priceAmount: { not: null }, createdAt: { gte: startOfThisMonth } },
          select: { priceAmount: true },
        }),
        this.prisma.maintenancePlan.findMany({
          where: {
            priceAmount: { not: null },
            createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
          },
          select: { priceAmount: true },
        }),
        this.prisma.maintenancePlan.findMany({
          where: { priceAmount: { not: null }, createdAt: { gte: startOfYear } },
          select: { priceAmount: true },
        }),
        this.prisma.softDelete.technicalInspection.findMany({
          where: { feeStatus: 'PAID', paidAt: { gte: startOfThisMonth } },
          select: { feeAmount: true },
        }),
        this.prisma.softDelete.technicalInspection.findMany({
          where: { feeStatus: 'PAID', paidAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
          select: { feeAmount: true },
        }),
        this.prisma.softDelete.technicalInspection.findMany({
          where: { feeStatus: 'PAID', paidAt: { gte: startOfYear } },
          select: { feeAmount: true },
        }),
      ]);

    const sum = (
      rows: { priceAmount?: unknown; feeAmount?: unknown }[],
      key: 'priceAmount' | 'feeAmount',
    ) => rows.reduce((acc, r) => acc + (r[key] ? Number(r[key]) : 0), 0);

    const planSum = sum(planThisMonth, 'priceAmount');
    const inspSum = sum(inspThisMonth, 'feeAmount');
    const subscriptionSum = 0; // futuro — reservado para modelo suscripción mensual
    const thisMonth = planSum + inspSum + subscriptionSum;

    const lastMonth = sum(planLastMonth, 'priceAmount') + sum(inspLastMonth, 'feeAmount');
    const ytd = sum(planYtd, 'priceAmount') + sum(inspYtd, 'feeAmount');

    const deltaAbsolute = thisMonth - lastMonth;
    const deltaPct = lastMonth > 0 ? (deltaAbsolute / lastMonth) * 100 : 0;

    return {
      thisMonth,
      lastMonth,
      deltaAbsolute,
      deltaPct,
      ytd,
      bySource: {
        plan: planSum,
        technicalInspections: inspSum,
        subscription: subscriptionSum,
      },
    };
  }

  /**
   * Cobranza pendiente: agrega inspecciones REPORT_READY no pagadas +
   * suscripciones vencidas / por vencer. Devuelve los 5 items más viejos
   * para acción inmediata del admin.
   */
  async getCollectionsPending() {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [pendingInspections, expired, expiringSoon] = await Promise.all([
      this.prisma.softDelete.technicalInspection.findMany({
        where: { status: 'REPORT_READY' },
        include: {
          requester: { select: { name: true } },
          property: { select: { address: true } },
        },
        orderBy: { completedAt: 'asc' },
      }),
      this.prisma.softDelete.user.count({
        where: { role: UserRole.CLIENT, subscriptionExpiresAt: { lt: now } },
      }),
      this.prisma.softDelete.user.count({
        where: {
          role: UserRole.CLIENT,
          subscriptionExpiresAt: { gte: now, lte: in7Days },
        },
      }),
    ]);

    const totalPendingAmount = pendingInspections.reduce((sum, i) => sum + Number(i.feeAmount), 0);
    const itemsCount = pendingInspections.length;

    const topOldest = pendingInspections.slice(0, 5).map((i) => {
      const completedAt = i.completedAt ?? i.createdAt;
      return {
        id: i.id,
        kind: 'technical-inspection' as const,
        clientName: i.requester?.name ?? 'Cliente',
        propertyAddress: i.property?.address ?? null,
        amount: Number(i.feeAmount),
        daysOld: Math.floor((now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24)),
      };
    });

    const oldestItemDays = topOldest.length > 0 ? (topOldest[0]?.daysOld ?? null) : null;

    return {
      totalPendingAmount,
      itemsCount,
      oldestItemDays,
      topOldest,
      subscriptionsAlreadyExpired: expired,
      subscriptionsExpiringIn7d: expiringSoon,
    };
  }

  /**
   * Ciclo operativo de inspecciones técnicas: días promedio por tramo del
   * state machine. Solo considera inspecciones PAID (ciclo completo) para
   * evitar sesgos. Si no hay datos suficientes, devuelve null por métrica.
   */
  async getTechnicalInspectionCycleMetrics() {
    const paid = await this.prisma.softDelete.technicalInspection.findMany({
      where: { feeStatus: 'PAID', paidAt: { not: null } },
      select: {
        createdAt: true,
        scheduledFor: true,
        completedAt: true,
        paidAt: true,
      },
    });

    if (paid.length === 0) {
      return {
        avgDaysRequestedToScheduled: null,
        avgDaysScheduledToReportReady: null,
        avgDaysReportReadyToPaid: null,
        avgDaysTotal: null,
        sampleSize: 0,
      };
    }

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const diffDays = (a: Date, b: Date) => (a.getTime() - b.getTime()) / MS_PER_DAY;

    const avg = (vals: number[]) =>
      vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;

    const requestedToScheduled: number[] = [];
    const scheduledToReportReady: number[] = [];
    const reportReadyToPaid: number[] = [];
    const total: number[] = [];

    for (const i of paid) {
      if (i.scheduledFor) {
        requestedToScheduled.push(diffDays(i.scheduledFor, i.createdAt));
      }
      if (i.scheduledFor && i.completedAt) {
        scheduledToReportReady.push(diffDays(i.completedAt, i.scheduledFor));
      }
      if (i.completedAt && i.paidAt) {
        reportReadyToPaid.push(diffDays(i.paidAt, i.completedAt));
      }
      if (i.paidAt) {
        total.push(diffDays(i.paidAt, i.createdAt));
      }
    }

    return {
      avgDaysRequestedToScheduled: avg(requestedToScheduled),
      avgDaysScheduledToReportReady: avg(scheduledToReportReady),
      avgDaysReportReadyToPaid: avg(reportReadyToPaid),
      avgDaysTotal: avg(total),
      sampleSize: paid.length,
    };
  }

  /**
   * ISV del portfolio: último snapshot por propiedad + distribución en
   * buckets + trend últimos 6 meses. Usa ventana de 12 meses para el
   * promedio (suficiente para capturar estacionalidad).
   *
   * Query compleja: (a) último snapshot por propiedad via DISTINCT ON,
   * (b) agregado mensual de promedio con DATE_TRUNC.
   */
  async getPortfolioIsvSummary() {
    const now = new Date();
    const startTrendWindow = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    type LatestRow = { propertyId: string; score: number };
    const latestRaw = await this.prisma.$queryRaw<LatestRow[]>`
      SELECT DISTINCT ON ("propertyId") "propertyId", score
      FROM "ISVSnapshot"
      ORDER BY "propertyId", "snapshotDate" DESC
    `;

    const propertiesWithIsv = latestRaw.length;
    const avgScore =
      propertiesWithIsv > 0 ? latestRaw.reduce((s, r) => s + r.score, 0) / propertiesWithIsv : 0;

    const distribution = { critical: 0, warning: 0, fair: 0, good: 0 };
    for (const row of latestRaw) {
      if (row.score < 40) distribution.critical++;
      else if (row.score < 60) distribution.warning++;
      else if (row.score < 80) distribution.fair++;
      else distribution.good++;
    }

    // Certificados elegibles: ISV ≥ 60 + plan ≥ 1 año (createdAt)
    const eligiblePropertyIds = latestRaw.filter((r) => r.score >= 60).map((r) => r.propertyId);

    const certificateEligible = eligiblePropertyIds.length
      ? await this.prisma.maintenancePlan.count({
          where: {
            propertyId: { in: eligiblePropertyIds },
            createdAt: { lte: oneYearAgo },
          },
        })
      : 0;

    type TrendRow = { month: Date; avg_score: number };
    const trendRaw = await this.prisma.$queryRaw<TrendRow[]>`
      SELECT
        DATE_TRUNC('month', "snapshotDate") AS month,
        AVG(score)::float AS avg_score
      FROM "ISVSnapshot"
      WHERE "snapshotDate" >= ${startTrendWindow}
      GROUP BY month
      ORDER BY month ASC
    `;

    const monthLabels = [
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
    const trend = trendRaw.map((r) => {
      const d = new Date(r.month);
      return {
        month: d.toISOString().slice(0, 7),
        label: monthLabels[d.getMonth()] ?? '',
        avgScore: Math.round(r.avg_score),
      };
    });

    return {
      propertiesWithIsv,
      avgScore: Math.round(avgScore),
      distribution,
      certificateEligible,
      trend,
    };
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

  /** Count all task-log entries for the given maintenance-plan IDs. */
  async countTaskLogsByPlanIds(planIds: string[]): Promise<number> {
    if (planIds.length === 0) return 0;
    return this.prisma.taskLog.count({
      where: { task: { maintenancePlanId: { in: planIds } } },
    });
  }
}
