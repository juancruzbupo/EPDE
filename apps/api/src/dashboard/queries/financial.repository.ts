import { UserRole } from '@epde/shared';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * ADR-011 category: **cross-model** — read-model de métricas financieras
 * del dashboard admin. NO es un repository de dominio (no accede a entidades
 * propias); es una agregación sobre MaintenancePlan, TechnicalInspection,
 * User, ProfessionalPayment. No extiende BaseRepository.
 *
 * Pattern establecido por PR-B.3 (abril 2026): cada "dominio de lectura"
 * del dashboard tiene su propio read-model con nombre semántico. Anterior
 * God Object `DashboardStatsRepository` se dividió en:
 *   - financial (esta clase): revenue, collections, plan launch
 *   - operational: technical inspections, professionals, inactive clients
 *   - portfolio: ISV del stock de propiedades, certificados
 *
 * Vive en `dashboard/queries/` (no en cada dominio) para evitar ciclos
 * de módulos: DashboardModule → (TechnicalInspectionsModule +
 * ProfessionalsModule + ...) → PropertiesModule → DashboardModule.
 */
@Injectable()
export class FinancialQueriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueConsolidated() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [planThisMonth, planLastMonth, planYtd, inspThisMonth, inspLastMonth, inspYtd] =
      await Promise.all([
        this.prisma.maintenancePlan.findMany({
          where: { priceAmount: { not: null }, createdAt: { gte: startOfMonth } },
          select: { priceAmount: true },
        }),
        this.prisma.maintenancePlan.findMany({
          where: {
            priceAmount: { not: null },
            createdAt: { gte: startOfLastMonth, lt: startOfMonth },
          },
          select: { priceAmount: true },
        }),
        this.prisma.maintenancePlan.findMany({
          where: { priceAmount: { not: null }, createdAt: { gte: startOfYear } },
          select: { priceAmount: true },
        }),
        this.prisma.softDelete.technicalInspection.findMany({
          where: { feeStatus: 'PAID', paidAt: { gte: startOfMonth } },
          select: { feeAmount: true },
        }),
        this.prisma.softDelete.technicalInspection.findMany({
          where: { feeStatus: 'PAID', paidAt: { gte: startOfLastMonth, lt: startOfMonth } },
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
    const subscriptionSum = 0;
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
}
