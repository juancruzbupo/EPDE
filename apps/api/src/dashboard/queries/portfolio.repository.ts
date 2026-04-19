import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * ADR-011 category: **cross-model** — read-model que agrega datos de
 * ISVSnapshot, Property, MaintenancePlan, y CertificateEmission en
 * una sola lectura. No tiene modelo propio; no extiende BaseRepository.
 * Ver `FinancialQueriesRepository` header para la justificación completa
 * del pattern (PR-B.3).
 */
@Injectable()
export class PortfolioQueriesRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async getCertificatesSummary() {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalIssued, issuedThisMonth, latestPerProperty, emittedPropertyIds] = await Promise.all(
      [
        this.prisma.certificateEmission.count(),
        this.prisma.certificateEmission.count({
          where: { issuedAt: { gte: startOfMonth } },
        }),
        this.prisma.$queryRaw<{ propertyId: string; score: number }[]>`
          SELECT DISTINCT ON ("propertyId") "propertyId", score
          FROM "ISVSnapshot"
          ORDER BY "propertyId", "snapshotDate" DESC
        `,
        this.prisma.certificateEmission.findMany({
          select: { propertyId: true },
          distinct: ['propertyId'],
        }),
      ],
    );

    const emittedSet = new Set(emittedPropertyIds.map((e) => e.propertyId));
    const eligiblePropertyIds = latestPerProperty
      .filter((r) => r.score >= 60 && !emittedSet.has(r.propertyId))
      .map((r) => r.propertyId);

    const eligibleNotIssued = eligiblePropertyIds.length
      ? await this.prisma.maintenancePlan.count({
          where: {
            propertyId: { in: eligiblePropertyIds },
            createdAt: { lte: oneYearAgo },
          },
        })
      : 0;

    return {
      totalIssued,
      issuedThisMonth,
      eligibleNotIssued,
    };
  }
}
