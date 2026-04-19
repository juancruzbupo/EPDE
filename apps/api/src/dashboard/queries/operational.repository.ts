import { TaskStatus, UserRole } from '@epde/shared';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * ADR-011 category: **cross-model** — read-model que agrega datos de
 * TechnicalInspection, Professional, ProfessionalAttachment,
 * ProfessionalPayment, User, y Task en una sola lectura. No tiene
 * modelo propio; no extiende BaseRepository. Ver
 * `FinancialQueriesRepository` header para la justificación completa
 * del pattern (PR-B.3).
 */
@Injectable()
export class OperationalQueriesRepository {
  constructor(private readonly prisma: PrismaService) {}

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
      if (i.scheduledFor) requestedToScheduled.push(diffDays(i.scheduledFor, i.createdAt));
      if (i.scheduledFor && i.completedAt)
        scheduledToReportReady.push(diffDays(i.completedAt, i.scheduledFor));
      if (i.completedAt && i.paidAt) reportReadyToPaid.push(diffDays(i.paidAt, i.completedAt));
      if (i.paidAt) total.push(diffDays(i.paidAt, i.createdAt));
    }

    return {
      avgDaysRequestedToScheduled: avg(requestedToScheduled),
      avgDaysScheduledToReportReady: avg(scheduledToReportReady),
      avgDaysReportReadyToPaid: avg(reportReadyToPaid),
      avgDaysTotal: avg(total),
      sampleSize: paid.length,
    };
  }

  async getProfessionalsSummary() {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const [totalActive, blocked, expiringMatriculas, pendingPayments, topPerformersRaw] =
      await Promise.all([
        this.prisma.softDelete.professional.count({ where: { tier: { not: 'BLOCKED' } } }),
        this.prisma.softDelete.professional.count({ where: { tier: 'BLOCKED' } }),
        this.prisma.professionalAttachment.count({
          where: { type: 'MATRICULA', expiresAt: { lte: in30Days } },
        }),
        this.prisma.professionalPayment.findMany({
          where: { status: 'PENDING' },
          select: { amount: true },
        }),
        this.prisma.softDelete.professional.findMany({
          where: { tier: { not: 'BLOCKED' } },
          select: {
            id: true,
            name: true,
            ratings: { select: { score: true } },
            assignments: {
              where: { assignedAt: { gte: threeMonthsAgo } },
              select: { id: true },
            },
          },
        }),
      ]);

    const pendingPaymentsAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const topPerformers = topPerformersRaw
      .map((p) => {
        const avgRating =
          p.ratings.length > 0
            ? p.ratings.reduce((sum, r) => sum + r.score, 0) / p.ratings.length
            : 0;
        return {
          id: p.id,
          name: p.name,
          assignmentsCount: p.assignments.length,
          rating: Number(avgRating.toFixed(1)),
        };
      })
      .filter((p) => p.assignmentsCount > 0)
      .sort((a, b) => b.assignmentsCount - a.assignmentsCount)
      .slice(0, 3);

    return {
      totalActive,
      blocked,
      matriculasExpiringSoon: expiringMatriculas,
      pendingPaymentsCount: pendingPayments.length,
      pendingPaymentsAmount,
      topPerformers,
    };
  }

  async getInactiveClientsSummary() {
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [inactiveClients, plansWithTasks] = await Promise.all([
      this.prisma.softDelete.user.findMany({
        where: {
          role: UserRole.CLIENT,
          properties: {
            some: {
              maintenancePlan: {
                tasks: {
                  none: { taskLogs: { some: { completedAt: { gte: sixtyDaysAgo } } } },
                },
              },
            },
          },
        },
        select: { id: true },
      }),
      this.prisma.softDelete.user.findMany({
        where: { role: UserRole.CLIENT },
        select: {
          id: true,
          name: true,
          properties: {
            select: {
              maintenancePlan: {
                select: {
                  tasks: { select: { status: true, nextDueDate: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    type HighRisk = {
      id: string;
      name: string;
      overdueTasks: number;
      totalTasks: number;
      overdueRatio: number;
    };
    const highOverdueRatio: HighRisk[] = [];

    for (const user of plansWithTasks) {
      let overdue = 0;
      let total = 0;
      for (const prop of user.properties) {
        const tasks = prop.maintenancePlan?.tasks ?? [];
        for (const t of tasks) {
          total++;
          if (t.status !== TaskStatus.COMPLETED && t.nextDueDate && t.nextDueDate < now) {
            overdue++;
          }
        }
      }
      if (total >= 5 && overdue / total > 0.4) {
        highOverdueRatio.push({
          id: user.id,
          name: user.name,
          overdueTasks: overdue,
          totalTasks: total,
          overdueRatio: overdue / total,
        });
      }
    }

    highOverdueRatio.sort((a, b) => b.overdueRatio - a.overdueRatio);

    return {
      noActivityLast60Days: inactiveClients.length,
      highOverdueRatio: highOverdueRatio.slice(0, 5),
    };
  }
}
